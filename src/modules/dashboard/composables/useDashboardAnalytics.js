import { computed } from 'vue'
import { useSalesStore } from '../../sales/stores/sales'
import { useCustomersStore } from '../../customer/stores/customers'

export function useDashboardAnalytics() {
    const salesStore = useSalesStore()
    const customersStore = useCustomersStore()

    const toDate = (ts) => {
        if (!ts) return null
        return ts.toDate ? ts.toDate() : new Date(ts)
    }

    const totalRevenue = computed(() =>
        salesStore.orders
            .filter(o => o.paymentStatus === 'Paid')
            .reduce((acc, o) => acc + (o.total || 0), 0)
    )

    const totalOrders = computed(() => salesStore.orders.length)

    const openOrders = computed(() =>
        salesStore.orders.filter(o => o.status === 'Processing').length
    )

    const newCustomersThisMonth = computed(() => {
        const start = new Date()
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        return customersStore.items.filter(c => {
            const d = toDate(c.createdAt)
            return d && d >= start
        }).length
    })

    // Last 6 months revenue
    const salesByMonthData = computed(() => {
        const now = new Date()
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            return { label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }
        })

        const sales = months.map(m =>
            salesStore.orders
                .filter(o => {
                    const d = toDate(o.createdAt)
                    return d && d.getFullYear() === m.year && d.getMonth() === m.month && o.paymentStatus === 'Paid'
                })
                .reduce((acc, o) => acc + (o.total || 0), 0)
        )

        return { labels: months.map(m => m.label), sales }
    })

    // Top 5 products by revenue
    const salesByProductData = computed(() => {
        const map = {}
        salesStore.orders
            .filter(o => o.paymentStatus === 'Paid')
            .forEach(o => {
                ;(o.items || []).forEach(item => {
                    const key = item.name || 'Unknown'
                    map[key] = (map[key] || 0) + (item.subtotal || item.price * item.qty || 0)
                })
            })
        const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5)
        return {
            labels: sorted.length ? sorted.map(([n]) => n) : ['No sales yet'],
            data: sorted.length ? sorted.map(([, v]) => v) : [1]
        }
    })

    // Current week Mon-Sun order counts
    const weeklyOrdersData = computed(() => {
        const now = new Date()
        const monday = new Date(now)
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
        monday.setHours(0, 0, 0, 0)

        const counts = [0, 0, 0, 0, 0, 0, 0]
        salesStore.orders.forEach(o => {
            const d = toDate(o.createdAt)
            if (!d) return
            const idx = Math.floor((d - monday) / 86400000)
            if (idx >= 0 && idx < 7) counts[idx]++
        })

        return { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: counts }
    })

    return {
        totalRevenue,
        totalOrders,
        openOrders,
        newCustomersThisMonth,
        salesByMonthData,
        salesByProductData,
        weeklyOrdersData
    }
}
