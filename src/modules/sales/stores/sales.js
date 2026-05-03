import { defineStore } from 'pinia'
import { computed } from 'vue'
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
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
        const hasRentals = items.some(i => i.isRental)
        const nowMs = Date.now()

        const processedItems = items.map(item => {
            if (item.isRental) {
                const durationMs = item.rateUnit === 'day'
                    ? item.duration * 86400000
                    : item.duration * 3600000
                return {
                    ...item,
                    rentalStartAt: Timestamp.fromMillis(nowMs),
                    rentalEndAt: Timestamp.fromMillis(nowMs + durationMs)
                }
            }
            return item
        })

        await addDoc(collection(db, `businesses/${bizId}/orders`), {
            orderNumber,
            customerName: customerName || 'Walk-in Customer',
            customerId: customerId || null,
            items: processedItems,
            total,
            status: hasRentals ? 'Active' : 'Completed',
            hasRentals,
            paymentMethod: paymentMethod || 'Cash',
            paymentStatus: 'Paid',
            createdAt: serverTimestamp()
        })

        for (const item of items) {
            if (item.isRental && item.inventoryId) {
                await inventoryStore.setRentalStatus(item.inventoryId, 'Rented')
            } else if (item.inventoryId) {
                await inventoryStore.adjustStock(item.inventoryId, 'OUT', item.qty, 0, `Sale ${orderNumber}`)
            }
        }
    }

    const completeRentalOrder = async (orderId, items) => {
        const bizId = getBizId()
        await updateDoc(doc(db, `businesses/${bizId}/orders`, orderId), {
            status: 'Completed',
            completedAt: serverTimestamp()
        })
        for (const item of items) {
            if (item.isRental && item.inventoryId) {
                await inventoryStore.setRentalStatus(item.inventoryId, 'Available')
            }
        }
    }

    const updateOrderStatus = async (orderId, status) => {
        const bizId = getBizId()
        const orderDoc = doc(db, `businesses/${bizId}/orders`, orderId)
        await updateDoc(orderDoc, { status, updatedAt: serverTimestamp() })
    }

    return { orders, createOrder, completeRentalOrder, updateOrderStatus }
})
