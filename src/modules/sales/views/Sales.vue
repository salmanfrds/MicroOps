<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSalesStore } from '../stores/sales'
import { useProductsStore } from '../../products/stores/products'
import { useInventoryStore } from '../../inventory/stores/inventory'
import { useCustomersStore } from '../../customer/stores/customers'
import { useAuthStore } from '../../auth/stores/auth'
import { useToastStore } from '../../../shared/stores/toast'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../shared/lib/firebaseClient'

const salesStore = useSalesStore()
const productsStore = useProductsStore()
const inventoryStore = useInventoryStore()
const customersStore = useCustomersStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const duitnowQrUrl = ref('')

onMounted(async () => {
  const bizId = authStore.user?.businessId
  if (!bizId) return
  const snap = await getDoc(doc(db, 'businesses', bizId))
  if (snap.exists()) duitnowQrUrl.value = snap.data().duitnowQrUrl || ''
})

// --- UI STATE ---
const isModalOpen = ref(false)
const isViewMode = ref(false)
const currentStep = ref(1)
const selectedOrder = ref(null)
const selectedPaymentMethod = ref('Cash')
const selectedCustomerId = ref('')
const isSubmitting = ref(false)
const isViewAllModalOpen = ref(false)
const activeTypeTab = ref('All')

const sortedOrders = computed(() => {
  return [...salesStore.orders].sort((a, b) => {
    const getMs = (ts) => ts ? (ts.toMillis ? ts.toMillis() : new Date(ts).getTime()) : 0;
    const timeA = getMs(a.updatedAt) || getMs(a.createdAt);
    const timeB = getMs(b.updatedAt) || getMs(b.createdAt);
    return timeB - timeA;
  })
})

const searchQuery = ref('')

const tableOrders = computed(() => sortedOrders.value.slice(0, 15))

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedOrders.value
  return sortedOrders.value.filter(o =>
    (o.orderNumber || '').toLowerCase().includes(q) ||
    (o.customerName || '').toLowerCase().includes(q)
  )
})

// Cart: products with qty added
// Note: VueFire sets 'id' as non-enumerable, so it must be copied explicitly after spread
const cart = computed(() =>
  productsStore.items.map(p => {
    const invItem = p.inventoryId ? inventoryStore.items.find(i => i.id === p.inventoryId) : null
    return {
      ...p,
      id: p.id,
      qty: cartQty.value[p.id] || 0,
      stock: getProductStock(p),
      rentalStatus: p.type === 'Rental' ? (invItem?.rentalStatus || 'Available') : null
    }
  })
)

const productTypes = ['All', 'Stocked', 'Prepared', 'Service', 'Rental']
const filteredCart = computed(() =>
  activeTypeTab.value === 'All' ? cart.value : cart.value.filter(p => p.type === activeTypeTab.value)
)

const cartQty = ref({})
const cartDuration = ref({})
const now = ref(Date.now())
const completingOrders = ref(new Set())

let clockInterval = null
onMounted(() => { clockInterval = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(clockInterval))

const getProductStock = (product) => {
  if (product.inventoryId) {
    return inventoryStore.items.find(i => i.id === product.inventoryId)?.stock ?? 0
  }
  // No inventory linked — no stock cap
  return 9999
}

const increment = (productId) => {
  const product = productsStore.items.find(p => p.id === productId)
  if (!product) return
  const stock = getProductStock(product)
  const current = cartQty.value[productId] || 0
  if (current < stock) cartQty.value[productId] = current + 1
}

const decrement = (productId) => {
  const current = cartQty.value[productId] || 0
  if (current > 0) cartQty.value[productId] = current - 1
}

const toggleRental = (productId) => {
  const current = cartQty.value[productId] || 0
  cartQty.value[productId] = current > 0 ? 0 : 1
  if (!cartDuration.value[productId]) cartDuration.value[productId] = 1
}

const cartItems = computed(() =>
  cart.value.filter(p => (cartQty.value[p.id] || 0) > 0).map(p => {
    if (p.type === 'Rental') {
      const duration = cartDuration.value[p.id] || 1
      return {
        productId: p.id,
        inventoryId: p.inventoryId || null,
        name: p.name,
        sku: p.sku,
        qty: 1,
        price: p.price,
        rateUnit: p.rateUnit || 'hour',
        duration,
        subtotal: p.price * duration,
        isRental: true
      }
    }
    return {
      productId: p.id,
      inventoryId: p.inventoryId || null,
      name: p.name,
      sku: p.sku,
      qty: p.qty,
      price: p.price,
      subtotal: p.qty * p.price,
      isRental: false
    }
  })
)

const cartTotal = computed(() => cartItems.value.reduce((acc, i) => acc + i.subtotal, 0))

// --- ORDER HELPERS ---
const formatDate = (ts) => {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getInitials = (name = '') => {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('')
}

const avatarColors = [
  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
]

const getAvatarColor = (name = '') => {
  const code = name.charCodeAt(0) || 0
  return avatarColors[code % avatarColors.length]
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':  return 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    case 'Processing': return 'text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
    case 'Active':     return 'text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    case 'Cancelled':  return 'text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
    default:           return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
  }
}

const getRentalCountdown = (order) => {
  const rentalItems = (order.items || []).filter(i => i.isRental && i.rentalEndAt)
  if (!rentalItems.length) return null
  const endAt = rentalItems[0].rentalEndAt
  const endMs = endAt?.toDate ? endAt.toDate().getTime() : Number(endAt)
  const remaining = endMs - now.value
  if (remaining <= 0) return { expired: true, label: 'Time Up' }
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return { expired: false, label: h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s` }
}

watch(now, async () => {
  for (const order of salesStore.orders) {
    if (order.status !== 'Active' || completingOrders.value.has(order.id)) continue
    const countdown = getRentalCountdown(order)
    if (countdown?.expired) {
      completingOrders.value.add(order.id)
      try {
        await salesStore.completeRentalOrder(order.id, order.items || [])
      } finally {
        completingOrders.value.delete(order.id)
      }
    }
  }
})

const getStockStatusClass = (stock) => {
  if (stock <= 0)  return 'text-red-800 dark:text-red-400 bg-red-200 dark:bg-red-900/40'
  if (stock <= 5)  return 'text-yellow-800 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-900/40'
  return 'text-green-800 dark:text-green-400 bg-green-200 dark:bg-green-900/40'
}

const getStockLabel = (stock) => {
  if (stock <= 0) return 'Out of Stock'
  if (stock <= 5) return 'Low Stock'
  return 'In Stock'
}

const countItems = (items) => (items || []).reduce((acc, i) => acc + (i.qty || 0), 0)

const selectedCustomer = computed(() =>
  customersStore.items.find(c => c.id === selectedCustomerId.value) || null
)

// --- MODAL ACTIONS ---
const openNewOrderModal = () => {
  isViewMode.value = false
  selectedOrder.value = null
  currentStep.value = 1
  selectedCustomerId.value = ''
  selectedPaymentMethod.value = 'Cash'
  cartQty.value = {}
  cartDuration.value = {}
  isModalOpen.value = true
}

const viewReceipt = (order) => {
  isViewMode.value = true
  selectedOrder.value = order
  currentStep.value = 3
  isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false }
const nextStep = () => { currentStep.value++ }

const handleProceedToPayment = () => {
  if (selectedPaymentMethod.value === 'Cash') {
    confirmPayment()
  } else {
    currentStep.value = 2
  }
}

const printReceipt = () => {
  window.print()
}

const shareReceipt = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Receipt from MicroOps',
        text: `Order ${receiptData.value.id} - Total RM ${receiptData.value.total.toFixed(2)}`,
      })
    } catch (err) {
      console.log('Error sharing:', err)
    }
  } else {
    alert('Sharing is not supported on this device/browser.')
  }
}

const confirmPayment = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  const tid = toastStore.loading('Processing order...')
  let success = false
  try {
    await salesStore.createOrder({
      customerName: selectedCustomer.value?.full_name || selectedCustomer.value?.name || 'Walk-in Customer',
      customerId: selectedCustomerId.value || null,
      items: cartItems.value,
      paymentMethod: selectedPaymentMethod.value
    })
    success = true
  } catch (err) {
    console.error('Failed to create order:', err)
  } finally {
    isSubmitting.value = false
    if (success) {
      toastStore.replace(tid, 'success', 'Order created successfully')
      currentStep.value = 3
    } else {
      toastStore.replace(tid, 'error', 'Failed to process order. Please try again.')
    }
  }
}

// Receipt data for step 3
const receiptData = computed(() => {
  if (isViewMode.value && selectedOrder.value) {
    return {
      id: selectedOrder.value.orderNumber,
      date: formatDate(selectedOrder.value.createdAt),
      total: selectedOrder.value.total,
      items: selectedOrder.value.items || [],
      status: 'PAID'
    }
  }
  return {
    id: '—',
    date: new Date().toLocaleDateString('en-MY'),
    total: cartTotal.value,
    items: cartItems.value,
    status: 'PAID'
  }
})
</script>

<template>
  <section class="space-y-12">
    <header class="mb-6">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Sales & Order Management</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Track customer orders from quotation to final invoice.</p>
      
      <button @click="openNewOrderModal"
        class="bg-[#004D40] dark:bg-teal-700 hover:bg-[#00695C] dark:hover:bg-teal-600 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        New Order
      </button>
    </header>

    <!-- Orders Table -->
    <div class="mb-4 flex justify-between items-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">Showing latest 15 orders.</p>
      <span @click="isViewAllModalOpen = true" class="text-xs font-bold text-[#4DB6AC] dark:text-teal-400 cursor-pointer hover:underline">View All Orders</span>
    </div>

    
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Order Details</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Total</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center">Receipt</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          <tr v-if="tableOrders.length === 0">
            <td colspan="5" class="p-8 text-center text-gray-400 dark:text-gray-500">No orders yet. Create your first order!</td>
          </tr>
          <tr v-for="order in tableOrders" :key="order.id"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
            <td class="p-4">
              <div class="font-bold text-gray-800 dark:text-gray-200 font-mono">{{ order.orderNumber }}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ formatDate(order.createdAt) }}</div>
            </td>
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div :class="[getAvatarColor(order.customerName), 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm']">
                  {{ getInitials(order.customerName) || '?' }}
                </div>
                <div>
                  <div class="font-bold text-gray-800 dark:text-gray-200 text-sm">{{ order.customerName || 'Walk-in Customer' }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ countItems(order.items) }} item(s)</div>
                </div>
              </div>
            </td>
            <td class="p-4">
              <div class="flex flex-col items-start gap-1">
                <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full', getStatusColor(order.status)]">
                  {{ order.status }}
                </span>
                <span v-if="order.status === 'Active' && getRentalCountdown(order)"
                  :class="getRentalCountdown(order).expired ? 'text-red-500 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'"
                  class="text-xs font-mono font-bold tabular-nums">
                  ⏱ {{ getRentalCountdown(order).label }}
                </span>
              </div>
            </td>
            <td class="p-4 text-right">
              <div class="font-bold text-gray-800 dark:text-gray-200">RM {{ (order.total || 0).toFixed(2) }}</div>
            </td>
            <td class="p-4 text-center">
              <button @click="viewReceipt(order)"
                class="text-gray-400 dark:text-gray-500 hover:text-[#4DB6AC] dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 p-2 rounded-lg transition-colors"
                title="View Receipt">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden transition-colors flex flex-col" style="height:90vh;max-height:680px">

          <!-- Modal Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-teal-50 dark:bg-teal-900/20">
            <div>
              <h3 class="text-lg font-bold text-[#004D40] dark:text-teal-300">
                {{ isViewMode ? 'Order Details' : 'New Transaction' }}
              </h3>
              <p v-if="!isViewMode" class="text-xs text-teal-700 dark:text-teal-400">Select items &amp; confirm payment</p>
              <p v-else class="text-xs text-teal-700 dark:text-teal-400">View Only</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">&times;</button>
          </div>

        <!-- POS Layout: product catalog left + order summary right -->
          <div v-if="currentStep === 1" class="flex flex-1 overflow-hidden" style="min-height:0">

            <!-- LEFT: product catalog -->
            <div class="flex flex-col flex-1 min-w-0 overflow-hidden border-r border-gray-100 dark:border-gray-700">

              <!-- Customer row + type tabs -->
              <div class="px-4 pt-3 pb-2 shrink-0 space-y-2 border-b border-gray-100 dark:border-gray-700">
                <select v-model="selectedCustomerId"
                  class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DB6AC]">
                  <option value="">Walk-in Customer</option>
                  <option v-for="c in customersStore.items" :key="c.id" :value="c.id">{{ c.full_name || c.name }}</option>
                </select>
                <div class="flex gap-1.5 overflow-x-auto pb-0.5">
                  <button v-for="tab in productTypes" :key="tab"
                    @click="activeTypeTab = tab"
                    :class="activeTypeTab === tab
                      ? 'bg-[#004D40] text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20'"
                    class="shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-colors">
                    {{ tab }}
                  </button>
                </div>
              </div>

              <!-- Product grid -->
              <div class="overflow-y-auto flex-1 p-3">
                <div v-if="filteredCart.length === 0" class="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No products.</div>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="product in filteredCart" :key="product.id"
                    class="relative bg-white dark:bg-gray-700 border rounded-xl overflow-hidden transition-all"
                    :class="(cartQty[product.id] || 0) > 0 ? 'border-[#4DB6AC] ring-1 ring-[#4DB6AC]/30' : 'border-gray-200 dark:border-gray-600'">

                    <!-- Product image -->
                    <div class="w-full h-24 bg-gray-100 dark:bg-gray-600 relative overflow-hidden">
                      <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
                      <div v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300 dark:text-gray-500">
                        {{ product.name?.charAt(0)?.toUpperCase() || '?' }}
                      </div>
                      <!-- Type badge -->
                      <span class="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                        :class="{
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400': product.type === 'Stocked',
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400': product.type === 'Prepared',
                          'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400': product.type === 'Service',
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400': product.type === 'Rental',
                        }">{{ product.type }}</span>
                      <!-- Out of stock overlay -->
                      <div v-if="product.type !== 'Rental' && product.type !== 'Service' && product.type !== 'Prepared' && product.stock === 0"
                        class="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span class="text-white text-[10px] font-bold uppercase">Out of Stock</span>
                      </div>
                    </div>

                    <!-- Info + controls -->
                    <div class="p-2">
                      <div class="font-bold text-gray-800 dark:text-gray-100 text-xs truncate">{{ product.name }}</div>
                      <div class="text-[#004D40] dark:text-teal-400 font-bold text-sm mt-0.5">
                        RM {{ (product.price || 0).toFixed(2) }}<span v-if="product.type === 'Rental'" class="text-[10px] font-normal text-gray-400">/{{ product.rateUnit }}</span>
                      </div>

                      <!-- Rental controls -->
                      <div v-if="product.type === 'Rental'" class="mt-2">
                        <div v-if="product.rentalStatus === 'Rented'" class="text-[10px] font-bold text-amber-600 dark:text-amber-400 text-center py-1">Currently Rented</div>
                        <template v-else>
                          <button @click="toggleRental(product.id)"
                            :class="(cartQty[product.id] || 0) > 0 ? 'bg-[#004D40] text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'"
                            class="w-full py-1 rounded-lg text-[11px] font-bold transition-colors">
                            {{ (cartQty[product.id] || 0) > 0 ? '✓ Reserved' : 'Reserve' }}
                          </button>
                          <div v-if="(cartQty[product.id] || 0) > 0" class="flex items-center gap-1 mt-1">
                            <input v-model.number="cartDuration[product.id]" type="number" min="1" :max="product.maxDuration || 999"
                              class="w-full text-center p-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs font-bold" />
                            <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ product.rateUnit }}s</span>
                          </div>
                        </template>
                      </div>

                      <!-- Regular +/- controls -->
                      <div v-else class="flex items-center justify-between mt-2">
                        <div class="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-600">
                          <button @click="decrement(product.id)" :disabled="(cartQty[product.id] || 0) === 0"
                            class="w-7 h-7 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 disabled:opacity-40 text-sm font-bold">−</button>
                          <span class="w-7 text-center text-xs font-bold text-gray-700 dark:text-gray-200">{{ cartQty[product.id] || 0 }}</span>
                          <button @click="increment(product.id)" :disabled="(cartQty[product.id] || 0) >= product.stock"
                            class="w-7 h-7 flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/30 text-gray-500 disabled:opacity-40 text-sm font-bold">+</button>
                        </div>
                        <span v-if="product.inventoryId" :class="getStockStatusClass(product.stock)" class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full">{{ getStockLabel(product.stock) }}</span>
                        <span v-else class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RIGHT: order summary + payment -->
            <div class="w-64 shrink-0 flex flex-col bg-gray-50 dark:bg-gray-900/40">
              <div class="px-4 pt-4 pb-2 shrink-0">
                <h4 class="font-bold text-gray-800 dark:text-white text-sm">Order Summary</h4>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ cartItems.length }} item(s)</p>
              </div>

              <!-- Cart items -->
              <div class="flex-1 overflow-y-auto px-4 space-y-2 min-h-0">
                <div v-if="cartItems.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-xs">No items added yet.</div>
                <div v-for="item in cartItems" :key="item.productId"
                  class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-2 py-2 border border-gray-100 dark:border-gray-700">
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{{ item.name }}</div>
                    <div class="text-[10px] text-gray-400">
                      <span v-if="item.isRental">{{ item.duration }} {{ item.rateUnit }}(s)</span>
                      <span v-else>x{{ item.qty }}</span>
                    </div>
                  </div>
                  <div class="text-xs font-bold text-[#004D40] dark:text-teal-400 shrink-0">RM {{ item.subtotal.toFixed(2) }}</div>
                </div>
              </div>

              <!-- Payment summary -->
              <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0 space-y-3">
                <div class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Method</div>
                <div class="grid grid-cols-3 gap-1">
                  <button v-for="method in ['Cash', 'DuitNow', 'Card']" :key="method"
                    @click="selectedPaymentMethod = method"
                    :class="selectedPaymentMethod === method ? 'bg-[#004D40] text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'"
                    class="py-1.5 rounded-lg text-[10px] font-bold transition-all">{{ method }}</button>
                </div>



                <div class="space-y-1 text-sm">
                  <div class="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Subtotal</span><span>RM {{ cartTotal.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-gray-800 dark:text-white text-base border-t border-gray-100 dark:border-gray-700 pt-1">
                    <span>Total</span><span>RM {{ cartTotal.toFixed(2) }}</span>
                  </div>
                </div>

                <button @click="handleProceedToPayment" :disabled="cartTotal === 0 || isSubmitting"
                  class="w-full bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#00695C] dark:hover:bg-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {{ selectedPaymentMethod === 'Cash' ? (isSubmitting ? 'Processing...' : 'Confirm Cash Payment') : 'Proceed to Payment' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Step 2: Payment Waiting State (DuitNow / Card) -->
          <div v-if="currentStep === 2" class="p-12 flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
            <h4 class="text-2xl font-black text-gray-800 dark:text-white tracking-tight mb-2">Awaiting Payment</h4>
            <p class="text-gray-500 dark:text-gray-400 mb-8 font-medium">Total Due: <span class="text-gray-900 dark:text-white font-bold text-xl">RM {{ cartTotal.toFixed(2) }}</span></p>
            
            <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center max-w-sm w-full">
              <!-- DuitNow State -->
              <template v-if="selectedPaymentMethod === 'DuitNow'">
                <div class="w-full aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl mb-6 p-4 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <img v-if="duitnowQrUrl" :src="duitnowQrUrl" class="w-full h-full object-contain" alt="DuitNow QR" />
                  <div v-else class="text-center text-gray-400 text-sm font-bold">No QR Code uploaded</div>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-6 text-center">Please ask the customer to scan the DuitNow QR above.</p>
              </template>
              
              <!-- Card State -->
              <template v-if="selectedPaymentMethod === 'Card'">
                <div class="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <svg class="w-16 h-16 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-6 text-center">Please tap or insert the card into the payment terminal.</p>
              </template>
              
              <button @click="confirmPayment" :disabled="isSubmitting"
                class="w-full bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:bg-[#00695C] dark:hover:bg-teal-600 transition-all disabled:opacity-60 text-lg">
                {{ isSubmitting ? 'Processing...' : 'Payment Received' }}
              </button>
              
              <button @click="currentStep = 1" :disabled="isSubmitting"
                class="mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Cancel / Change Method
              </button>
            </div>
          </div>

          <!-- Step 3: Receipt -->
          <div v-if="currentStep === 3" class="p-8 bg-gray-50 dark:bg-gray-900/50">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-sm relative">
              <div class="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
                {{ receiptData.status }}
              </div>
              <div class="text-center mb-6">
                <h2 class="text-xl font-black text-gray-800 dark:text-white tracking-tight">MicroOps</h2>
                <p class="text-[10px] text-gray-400">Order {{ receiptData.id }} • {{ receiptData.date }}</p>
              </div>
              <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div v-for="(item, idx) in receiptData.items" :key="idx" class="flex justify-between">
                  <span>{{ item.name }} (x{{ item.qty }})</span>
                  <span>RM {{ ((item.price || 0) * (item.qty || 0)).toFixed(2) }}</span>
                </div>
                <div v-if="!receiptData.items?.length" class="text-center italic text-gray-400">No items</div>
              </div>
              <div class="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                <span>Total</span>
                <span>RM {{ (receiptData.total || 0).toFixed(2) }}</span>
              </div>
            </div>
            
            <!-- Receipt Actions -->
            <div class="mt-6 flex flex-col gap-3 max-w-sm mx-auto w-full">
              <div class="flex gap-3">
                <button @click="printReceipt"
                  class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
                <button @click="shareReceipt"
                  class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share
                </button>
              </div>
              
              <button @click="closeModal"
                class="w-full bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors mt-2 text-lg">
                Done
              </button>
            </div>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- VIEW ALL MODAL -->
    <Teleport to="body">
      <div v-if="isViewAllModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="isViewAllModalOpen = false" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-gray-50 dark:bg-gray-900 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden border border-gray-200 dark:border-gray-700">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center shrink-0">
            <div>
              <h3 class="text-xl font-bold text-gray-800 dark:text-white">All Sales Orders</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing all historical orders</p>
            </div>
            <button @click="isViewAllModalOpen = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl font-bold leading-none">&times;</button>
          </div>
          <div class="px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input v-model="searchQuery" type="text" placeholder="Search by order # or customer…" class="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4DB6AC] transition-colors" />
            </div>
          </div>
          
          <div class="flex-1 overflow-auto p-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th class="p-4 font-medium tracking-wider">Date & Time</th>
                    <th class="p-4 font-medium tracking-wider">Customer / Ref</th>
                    <th class="p-4 font-medium tracking-wider">Items</th>
                    <th class="p-4 font-medium tracking-wider">Total (RM)</th>
                    <th class="p-4 font-medium tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 dark:divide-gray-700/50">
                  <tr v-for="order in filteredOrders" :key="order.id" @click="viewReceipt(order)"
                    class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                    <td class="p-4">
                      <div class="font-medium text-gray-800 dark:text-gray-200">{{ formatDate(order.createdAt) }}</div>
                    </td>
                    <td class="p-4">
                      <div class="flex items-center gap-3">
                        <div :class="[getAvatarColor(order.customerName || 'Walk-in'), 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs']">
                          {{ getInitials(order.customerName || 'W I') }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-800 dark:text-gray-200">{{ order.customerName || 'Walk-in Customer' }}</div>
                          <div class="text-xs text-gray-400 font-mono mt-0.5">#{{ order.id.substring(0, 8) }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="p-4 text-gray-600 dark:text-gray-400">
                      {{ countItems(order.items) }} item(s)
                    </td>
                    <td class="p-4">
                      <div class="font-bold text-gray-800 dark:text-gray-200">RM {{ (order.total || 0).toFixed(2) }}</div>
                    </td>
                    <td class="p-4">
                      <div class="flex flex-col gap-1 items-start">
                        <span :class="getStatusColor(order.status)" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                          {{ order.status }}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="filteredOrders.length === 0">
                    <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">No orders found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>
