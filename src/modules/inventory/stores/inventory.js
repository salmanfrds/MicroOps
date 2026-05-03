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

    const addInventoryItem = async (itemData, logTransaction = true, loggedBy = null) => {
        try {
            const bizId = getBizId()
            const collRef = collection(db, `businesses/${bizId}/inventory`)

            const initialStock = Number(itemData.stock) || 0
            const unitCost    = Number(itemData.cost)  || 0

            const itemRef = await addDoc(collRef, {
                ...itemData,
                stock: initialStock,
                cost: unitCost,
                createdAt: serverTimestamp()
            })

            let txRef = null
            if (logTransaction && initialStock > 0) {
                const txCollRef = collection(db, `businesses/${bizId}/transactions`)
                txRef = await addDoc(txCollRef, {
                    itemId:        itemRef.id,
                    type:          'IN',
                    amount:        initialStock,
                    costPerUnit:   unitCost,
                    total:         initialStock * unitCost,
                    remark:        'Initial stock entry',
                    loggedByName:  loggedBy?.name || null,
                    loggedById:    loggedBy?.id || null,
                    date:          new Date().toISOString().split('T')[0],
                    createdAt:     serverTimestamp()
                })
            }

            return { itemRef, txRef }
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
    const adjustStock = async (itemId, type, amount, costPerUnit, remark = '', loggedBy = null) => {
        try {
            const bizId = getBizId()
            const itemDoc = doc(db, `businesses/${bizId}/inventory`, itemId)
            const total = Number(amount) * Number(costPerUnit)
            const stockDelta = type === 'IN' ? Number(amount) : -Number(amount)

            await updateDoc(itemDoc, {
                stock: increment(stockDelta),
                updatedAt: serverTimestamp()
            })

            const txCollRef = collection(db, `businesses/${bizId}/transactions`)
            const txRef = await addDoc(txCollRef, {
                itemId,
                type,
                amount: Number(amount),
                costPerUnit: Number(costPerUnit),
                total,
                remark,
                loggedByName: loggedBy?.name || null,
                loggedById: loggedBy?.id || null,
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            })
            return txRef
        } catch (error) {
            console.error('Error recording stock adjustment:', error)
            throw error
        }
    }

    const updateTransactionReceipt = async (txId, receiptUrl) => {
        try {
            const bizId = getBizId()
            await updateDoc(doc(db, `businesses/${bizId}/transactions`, txId), { receiptUrl })
        } catch (error) {
            console.error('Error updating transaction receipt:', error)
            throw error
        }
    }

    const setRentalStatus = async (itemId, rentalStatus) => {
        try {
            const bizId = getBizId()
            const itemDoc = doc(db, `businesses/${bizId}/inventory`, itemId)
            await updateDoc(itemDoc, { rentalStatus, updatedAt: serverTimestamp() })
        } catch (error) {
            console.error('Error updating rental status:', error)
            throw error
        }
    }

    return {
        items,
        transactions,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustStock,
        updateTransactionReceipt,
        setRentalStatus
    }
})
