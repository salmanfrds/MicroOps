import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'

export const useProductsStore = defineStore('products', () => {
    const authStore = useAuthStore()

    // VueFire synced collection mapped to active business
    const productsRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/products`) : null
    })
    const items = useCollection(productsRef)

    // Helper to get active business id for writes
    const getBizId = () => {
        const bizId = authStore.user?.businessId
        if (!bizId) throw new Error('No active business session')
        return bizId
    }

    // Add new sellable product
    const addProduct = async (productData) => {
        try {
            const bizId = getBizId()
            const collRef = collection(db, `businesses/${bizId}/products`)
            await addDoc(collRef, {
                ...productData,
                price: Number(productData.price) || 0,
                stock: Number(productData.stock) || 0,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error adding product:', error)
            throw error
        }
    }

    // Update existing product
    const updateProduct = async (productId, updates) => {
        try {
            const bizId = getBizId()
            const productDoc = doc(db, `businesses/${bizId}/products`, productId)
            await updateDoc(productDoc, {
                ...updates,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error updating product:', error)
            throw error
        }
    }

    // Delete a product entirely
    const deleteProduct = async (productId) => {
        try {
            const bizId = getBizId()
            const productDoc = doc(db, `businesses/${bizId}/products`, productId)
            await deleteDoc(productDoc)
        } catch (error) {
            console.error('Error deleting product:', error)
            throw error
        }
    }

    return {
        items,
        addProduct,
        updateProduct,
        deleteProduct
    }
})
