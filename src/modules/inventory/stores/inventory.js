import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, addDoc, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'

export const useInventoryStore = defineStore('inventory', () => {
    const authStore = useAuthStore()

    // Use computed so VueFire reacts if the user logs in/out
    const inventoryRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/inventory`) : null
    })
    const items = useCollection(inventoryRef)

    const transactionsRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/transactions`) : null
    })
    const transactions = useCollection(transactionsRef)

    // Helper to get active business id for writes
    const getBizId = () => {
        const bizId = authStore.user?.businessId
        if (!bizId) throw new Error('No active business session')
        return bizId
    }

    // Add new raw inventory item
    const addInventoryItem = async (itemData) => {
        try {
            const bizId = getBizId()
            const collRef = collection(db, `businesses/${bizId}/inventory`)
            await addDoc(collRef, {
                ...itemData,
                stock: Number(itemData.stock) || 0,
                cost: Number(itemData.cost) || 0,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error adding inventory item:', error)
            throw error
        }
    }

    // Update Inventory Item Details
    const updateInventoryItem = async (itemId, updatedData) => {
        try {
            const bizId = getBizId()
            const itemDoc = doc(db, `businesses/${bizId}/inventory`, itemId)
            await updateDoc(itemDoc, {
                ...updatedData,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error updating inventory item:', error)
            throw error
        }
    }

    // Delete Inventory Item
    const deleteInventoryItem = async (itemId) => {
        try {
            const bizId = getBizId()
            const { deleteDoc } = await import('firebase/firestore')
            const itemDoc = doc(db, `businesses/${bizId}/inventory`, itemId)
            await deleteDoc(itemDoc)
        } catch (error) {
            console.error('Error deleting inventory item:', error)
            throw error
        }
    }

    // Adjust Stock (IN or OUT) and log Transaction
    const adjustStock = async (itemId, type, amount, costPerUnit, remark = '') => {
        try {
            const bizId = getBizId()
            const itemDoc = doc(db, `businesses/${bizId}/inventory`, itemId)

            // Calculate total cost
            const total = Number(amount) * Number(costPerUnit)

            // Update stock level (add for IN, subtract for OUT)
            const stockDelta = type === 'IN' ? Number(amount) : -Number(amount)

            await updateDoc(itemDoc, {
                stock: increment(stockDelta),
                updatedAt: serverTimestamp()
            })

            // Log Transaction
            const txCollRef = collection(db, `businesses/${bizId}/transactions`)
            await addDoc(txCollRef, {
                itemId,
                type,               // 'IN' or 'OUT'
                amount: Number(amount),
                costPerUnit: Number(costPerUnit),
                total,              // Computed total
                remark,
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error recording stock adjustment:', error)
            throw error
        }
    }

    return {
        items,
        transactions,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStock
    }
})
