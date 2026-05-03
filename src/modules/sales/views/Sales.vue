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
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Sales & Order Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Track customer orders from quotation to final invoice.</p>
      </div>
      <div class="mt-5">
        <button @click="openNewOrderModal"
          class="bg-[#4DB6AC] hover:bg-[#26A69A] text-white font-bold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Order
        </button>
      </div>
    </header>

    <!-- Orders Table -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto transition-colors">
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
          <tr v-if="salesStore.orders.length === 0">
            <td colspan="5" class="p-8 text-center text-gray-400 dark:text-gray-500">No orders yet. Create your first order!</td>
          </tr>
          <tr v-for="order in salesStore.orders" :key="order.id"
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
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden transition-colors">

          <!-- Modal Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                {{ isViewMode ? 'Order Details' : 'New Transaction' }}
              </h3>
              <p v-if="!isViewMode" class="text-xs text-gray-500 dark:text-gray-400">Step {{ currentStep }} of 3</p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400">View Only</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">&times;</button>
          </div>

          <!-- Step 1: Select Products -->
          <div v-if="currentStep === 1" class="p-6">
            <!-- Customer selector -->
            <div class="mb-4">
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Customer (optional)</label>
              <select v-model="selectedCustomerId"
                class="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4DB6AC]">
                <option value="">Walk-in Customer</option>
                <option v-for="c in customersStore.items" :key="c.id" :value="c.id">
                  {{ c.full_name || c.name }}
                </option>
              </select>
            </div>

            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">Select Products</h4>

            <div v-if="productsStore.items.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
              No products found. Add products first.
            </div>

            <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
              <div v-for="product in cart" :key="product.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#4DB6AC] hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all">

                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div :class="product.qty > 0 ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'"
                    class="w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0">
                    <svg v-if="product.qty > 0" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div class="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                    <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
                    <div v-else class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-500">
                      {{ product.name?.charAt(0)?.toUpperCase() || '?' }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{{ product.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">SKU: {{ product.sku }}</div>
                  </div>
                </div>

                <!-- Rental product controls -->
                <div v-if="product.type === 'Rental'" class="flex items-center gap-2 shrink-0">
                  <!-- Already rented out -->
                  <div v-if="product.rentalStatus === 'Rented'" class="flex items-center gap-2">
                    <span class="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      Currently Rented
                    </span>
                  </div>

                  <!-- Available to reserve -->
                  <template v-else>
                    <button @click.stop="toggleRental(product.id)"
                      :class="product.qty > 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-indigo-400'"
                      class="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0">
                      {{ product.qty > 0 ? '✓ Reserved' : 'Reserve' }}
                    </button>
                    <div v-if="product.qty > 0" class="flex items-center gap-1">
                      <input v-model.number="cartDuration[product.id]" type="number" min="1" :max="product.maxDuration || 999"
                        class="w-14 text-center p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-indigo-400 outline-none" />
                      <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ product.rateUnit }}s</span>
                    </div>
                  </template>

                  <div class="text-right min-w-20">
                    <span :class="product.rentalStatus === 'Rented' ? 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' : 'text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30'"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-1">
                      {{ product.rentalStatus === 'Rented' ? 'Rented' : 'Rental' }}
                    </span>
                    <div class="text-sm font-bold text-[#004D40] dark:text-teal-400">RM {{ (product.price || 0).toFixed(2) }}/{{ product.rateUnit }}</div>
                  </div>
                </div>

                <!-- Regular product controls -->
                <div v-else class="flex items-center gap-3 shrink-0">
                  <div class="flex items-center border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-8 shadow-sm">
                    <button @click.stop="decrement(product.id)" :disabled="product.qty === 0"
                      class="w-7 h-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors text-gray-500 dark:text-gray-400 border-r dark:border-gray-600 disabled:opacity-50">
                      <span class="font-bold text-sm">−</span>
                    </button>
                    <div class="px-2 min-w-8 text-center text-sm font-bold text-gray-700 dark:text-gray-200 select-none">{{ product.qty }}</div>
                    <button @click.stop="increment(product.id)" :disabled="product.qty >= product.stock"
                      class="w-7 h-full flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-[#4DB6AC] transition-colors text-gray-500 dark:text-gray-400 border-l dark:border-gray-600 disabled:opacity-50">
                      <span class="font-bold text-sm">+</span>
                    </button>
                  </div>
                  <div class="text-right min-w-20">
                    <span v-if="product.inventoryId"
                      :class="getStockStatusClass(product.stock)"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-1">
                      {{ getStockLabel(product.stock) }}
                    </span>
                    <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-1 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30">
                      Available
                    </span>
                    <div class="text-sm font-bold text-[#004D40] dark:text-teal-400">RM {{ (product.price || 0).toFixed(2) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-between items-center">
              <div class="text-sm font-bold text-gray-600 dark:text-gray-300">Total: RM {{ cartTotal.toFixed(2) }}</div>
              <button @click="nextStep" :disabled="cartTotal === 0"
                class="bg-[#4DB6AC] text-white font-bold py-2 px-8 rounded-lg shadow hover:bg-[#26A69A] disabled:opacity-50 disabled:cursor-not-allowed">
                Next: Payment
              </button>
            </div>
          </div>

          <!-- Step 2: Payment -->
          <div v-if="currentStep === 2" class="p-8 text-center">
            <h4 class="font-bold text-gray-800 dark:text-white mb-1">Select Payment Method</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">Total Due: <span class="font-bold text-gray-800 dark:text-white">RM {{ cartTotal.toFixed(2) }}</span></p>

            <div class="flex gap-3 justify-center mb-6">
              <button v-for="method in ['Cash', 'DuitNow', 'Card']" :key="method"
                @click="selectedPaymentMethod = method"
                :class="selectedPaymentMethod === method
                  ? 'bg-[#004D40] text-white border-[#004D40]'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:border-[#4DB6AC]'"
                class="px-5 py-2 rounded-lg border font-bold text-sm transition-all">
                {{ method }}
              </button>
            </div>

            <div v-if="selectedPaymentMethod === 'DuitNow'" class="mb-6">
              <img v-if="duitnowQrUrl" :src="duitnowQrUrl"
                class="w-48 h-48 mx-auto object-contain rounded-xl border border-gray-200 dark:border-gray-600 bg-white p-2"
                alt="DuitNow QR" />
              <div v-else
                class="w-40 h-40 mx-auto bg-pink-50 dark:bg-pink-900/20 border-4 border-dashed border-pink-200 dark:border-pink-800 rounded-xl flex flex-col items-center justify-center gap-2">
                <svg class="w-10 h-10 text-pink-300 dark:text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                </svg>
                <span class="text-[10px] font-bold text-pink-400 dark:text-pink-500 uppercase tracking-wide">No QR uploaded</span>
                <span class="text-[9px] text-pink-300 dark:text-pink-700">Add one in Business Settings</span>
              </div>
            </div>

            <button @click="confirmPayment" :disabled="isSubmitting"
              class="w-full bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-[#00695C] dark:hover:bg-teal-600 transition-all disabled:opacity-60">
              {{ isSubmitting ? 'Saving...' : 'Confirm Payment Received' }}
            </button>
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
            <button @click="closeModal"
              class="mt-6 w-full bg-gray-800 dark:bg-gray-700 text-white font-bold py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600">
              {{ isViewMode ? 'Close' : 'Done' }}
            </button>
          </div>

        </div>
      </div>
    </Teleport>
  </section>
</template>
