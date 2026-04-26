import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import { db } from '../../../shared/lib/firebaseClient'
import { useAuthStore } from '../../auth/stores/auth'
import { useInventoryStore } from '../../inventory/stores/inventory'

export const useSalesStore = defineStore('sales', () => {
    const authStore = useAuthStore()
    const inventoryStore = useInventoryStore()

    const ordersRef = computed(() => {
        const bizId = authStore.user?.businessId
        return bizId ? collection(db, `businesses/${bizId}/orders`) : null
    })
    const orders = useCollection(ordersRef)

    const getBizId = () => {
        const bizId = authStore.user?.businessId
        if (!bizId) throw new Error('No active business session')
        return bizId
    }

    const createOrder = async ({ customerName, customerId, items, paymentMethod }) => {
        const bizId = getBizId()
        const total = items.reduce((acc, i) => acc + (i.subtotal || i.price * i.qty), 0)
        const orderNumber = `#${Date.now().toString().slice(-5)}`

        await addDoc(collection(db, `businesses/${bizId}/orders`), {
            orderNumber,
            customerName: customerName || 'Walk-in Customer',
            customerId: customerId || null,
            items,
            total,
            status: 'Processing',
            paymentMethod: paymentMethod || 'Cash',
            paymentStatus: 'Paid',
            createdAt: serverTimestamp()
        })

        for (const item of items) {
            if (item.inventoryId) {
                await inventoryStore.adjustStock(
                    item.inventoryId,
                    'OUT',
                    item.qty,
                    0,
                    `Sale ${orderNumber}`
                )
            }
        }
    }

    const updateOrderStatus = async (orderId, status) => {
        const bizId = getBizId()
        const orderDoc = doc(db, `businesses/${bizId}/orders`, orderId)
        await updateDoc(orderDoc, { status, updatedAt: serverTimestamp() })
    }

    return { orders, createOrder, updateOrderStatus }
})
