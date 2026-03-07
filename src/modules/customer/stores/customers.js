import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'

export const useCustomersStore = defineStore('customers', () => {
    const authStore = useAuthStore()

    // VueFire synced collection mapped to active business
    const customersRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/customers`) : null
    })
    const items = useCollection(customersRef)

    // Helper to get active business id for writes
    const getBizId = () => {
        const bizId = authStore.user?.businessId
        if (!bizId) throw new Error('No active business session')
        return bizId
    }

    // Add new customer
    const addCustomer = async (customerData) => {
        try {
            const bizId = getBizId()
            const collRef = collection(db, `businesses/${bizId}/customers`)
            await addDoc(collRef, {
                ...customerData,
                createdAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error adding customer:', error)
            throw error
        }
    }

    // Update existing customer
    const updateCustomer = async (customerId, updates) => {
        try {
            const bizId = getBizId()
            const customerDoc = doc(db, `businesses/${bizId}/customers`, customerId)
            await updateDoc(customerDoc, {
                ...updates,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('Error updating customer:', error)
            throw error
        }
    }

    // Delete a customer
    const deleteCustomer = async (customerId) => {
        try {
            const bizId = getBizId()
            const customerDoc = doc(db, `businesses/${bizId}/customers`, customerId)
            await deleteDoc(customerDoc)
        } catch (error) {
            console.error('Error deleting customer:', error)
            throw error
        }
    }

    return {
        items,
        addCustomer,
        updateCustomer,
        deleteCustomer
    }
})
