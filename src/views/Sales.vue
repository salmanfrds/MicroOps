<script setup>
import { ref, computed } from 'vue'

// --- DATA & STATE ---
const isModalOpen = ref(false)
const isViewMode = ref(false)
const currentStep = ref(1) 
const selectedOrder = ref(null)

// Enhanced Mock Data with visual attributes
// UPDATED: Added dark mode classes to statusColor and color strings
const orders = ref([
  { 
    id: '#1024', 
    customer: 'Alice Johnson', 
    email: 'alice.j@example.com',
    date: '2025-06-25', 
    status: 'Completed', 
    total: 250.00, 
    // Green text on light, Lighter Green text on dark background
    statusColor: 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    initials: 'AJ',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    items: [{ name: 'Handmade Mug', qty: 10, price: 25.00 }] 
  },
  { 
    id: '#1023', 
    customer: 'Bob Williams', 
    email: 'bob.w@example.com',
    date: '2025-06-24', 
    status: 'Shipped', 
    total: 150.75, 
    statusColor: 'text-blue-800 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    initials: 'BW',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    items: [{ name: 'Organic Tea Blend', qty: 5, price: 15.50 }, { name: 'Artisan Soap', qty: 6, price: 12.00 }] 
  },
  { 
    id: '#1022', 
    customer: 'Charlie Brown', 
    email: 'charlie.b@example.com',
    date: '2025-06-23', 
    status: 'Processing', 
    total: 80.50, 
    statusColor: 'text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    initials: 'CB',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    items: [{ name: 'Artisan Soap Bar', qty: 7, price: 11.50 }] 
  },
])

// UPDATED: Added dark mode classes to statusClass
const inventoryItems = ref([
  { id: 1, name: 'Handmade Mug', sku: 'HM-001', qty: 0, price: 25.00, stock: 42, status: 'In Stock', statusClass: 'text-green-800 dark:text-green-400 bg-green-200 dark:bg-green-900/40' },
  { id: 2, name: 'Organic Tea Blend', sku: 'OTB-012', qty: 0, price: 15.50, stock: 8, status: 'Low Stock', statusClass: 'text-yellow-800 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-900/40' },
  { id: 3, name: 'Artisan Soap Bar', sku: 'ASB-005', qty: 0, price: 12.00, stock: 0, status: 'Out of Stock', statusClass: 'text-red-800 dark:text-red-400 bg-red-200 dark:bg-red-900/40' },
])

// --- ACTIONS (Unchanged) ---
const openNewOrderModal = () => {
  isViewMode.value = false
  selectedOrder.value = null
  currentStep.value = 1
  isModalOpen.value = true
  inventoryItems.value.forEach(i => i.qty = 0) 
}

const viewReceipt = (order) => {
  isViewMode.value = true
  selectedOrder.value = order
  currentStep.value = 3
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const nextStep = () => {
  currentStep.value++
}

// --- COMPUTED HELPERS (Unchanged) ---
const cartTotal = computed(() => {
  return inventoryItems.value.reduce((acc, item) => acc + (item.qty * item.price), 0)
})

const cartItems = computed(() => {
  return inventoryItems.value.filter(item => item.qty > 0)
})

const receiptData = computed(() => {
  if (isViewMode.value && selectedOrder.value) {
    return {
      id: selectedOrder.value.id,
      date: selectedOrder.value.date,
      total: selectedOrder.value.total,
      items: selectedOrder.value.items,
      status: 'PAID'
    }
  } else {
    return {
      id: '#NEW',
      date: new Date().toLocaleDateString(),
      total: cartTotal.value,
      items: cartItems.value,
      status: 'PENDING'
    }
  }
})

// Helper to count total items in an order
const countItems = (items) => items.reduce((acc, i) => acc + i.qty, 0)
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
            <path fill-rule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clip-rule="evenodd" />
          </svg>
          New Order
        </button>
      </div>
    </header>

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
          <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
            
            <td class="p-4">
               <div>
                  <div class="font-bold text-gray-800 dark:text-gray-200 font-mono">{{ order.id }}</div>
                  <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ order.date }}</div>
               </div>
            </td>

            <td class="p-4">
              <div class="flex items-center gap-3">
                <div :class="[order.color, 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm']">
                  {{ order.initials }}
                </div>
                <div>
                  <div class="font-bold text-gray-800 dark:text-gray-200 text-sm">{{ order.customer }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ countItems(order.items) }} Items Purchased</div>
                </div>
              </div>
            </td>

            <td class="p-4">
              <span :class="['px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border border-transparent', order.statusColor]">
                {{ order.status }}
              </span>
            </td>

            <td class="p-4 text-right">
                <div class="font-bold text-gray-800 dark:text-gray-200">RM {{ order.total.toFixed(2) }}</div>
            </td>

            <td class="p-4 text-center">
              <button 
                @click="viewReceipt(order)"
                class="text-gray-400 dark:text-gray-500 hover:text-[#4DB6AC] dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 p-2 rounded-lg transition-colors"
                title="View Receipt"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">

          <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                {{ isViewMode ? 'Order Details' : 'New Transaction' }}
              </h3>
              <p v-if="!isViewMode" class="text-xs text-gray-500 dark:text-gray-400">Step {{ currentStep }} of 3</p>
              <p v-else class="text-xs text-gray-500 dark:text-gray-400">View Only</p>
            </div>
            <button @click="closeModal"
              class="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">&times;</button>
          </div>

          <div v-if="currentStep === 1" class="p-6">
            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-4 text-sm uppercase tracking-wide">Select Inventory</h4>
            <div class="space-y-3 max-h-75 overflow-y-auto">
              <div v-for="item in inventoryItems" :key="item.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[#4DB6AC] hover:bg-teal-50 dark:hover:bg-teal-900/20 cursor-pointer transition-all group">

                <div class="flex items-center gap-3 flex-1">
                  <div :class="item.qty > 0 ? 'bg-[#4DB6AC] border-[#4DB6AC]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'" 
                       class="w-4 h-4 border rounded flex items-center justify-center transition-colors">
                       <svg v-if="item.qty > 0" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{{ item.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">SKU: {{ item.sku }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                  <div class="flex items-center border rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 h-8 shadow-sm">
                    <button @click.stop="item.qty > 0 ? item.qty-- : null"
                      :disabled="item.qty === 0"
                      class="w-7 h-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors text-gray-500 dark:text-gray-400 border-r dark:border-gray-600 disabled:opacity-50">
                      <span class="font-bold text-sm">−</span>
                    </button>
                    <div class="px-2 min-w-[30px] text-center text-sm font-bold text-gray-700 dark:text-gray-200 select-none">
                      {{ item.qty }}
                    </div>
                    <button @click.stop="item.qty < item.stock ? item.qty++ : null"
                      :disabled="item.qty >= item.stock"
                      class="w-7 h-full flex items-center justify-center hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-[#4DB6AC] transition-colors text-gray-500 dark:text-gray-400 border-l dark:border-gray-600 disabled:opacity-50">
                      <span class="font-bold text-sm">+</span>
                    </button>
                  </div>

                  <div class="text-right min-w-[70px]">
                    <span :class="item.statusClass"
                      class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-1">
                      {{ item.status }}
                    </span>
                    <div class="text-sm font-bold text-[#004D40] dark:text-teal-400">RM {{ item.price.toFixed(2) }}</div>
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

          <div v-if="currentStep === 2" class="p-8 text-center">
            <h4 class="font-bold text-gray-800 dark:text-white mb-2">Scan to Pay</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-6">Total Due: <span class="font-bold text-gray-800 dark:text-white">RM {{ cartTotal.toFixed(2) }}</span></p>

            <div class="w-48 h-48 mx-auto bg-pink-50 dark:bg-pink-900/20 border-4 border-pink-200 dark:border-pink-800 rounded-lg flex items-center justify-center mb-6 relative">
              <svg class="w-24 h-24 text-pink-400 dark:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
              </svg>
              <span class="absolute bottom-2 text-[10px] font-bold text-pink-400 dark:text-pink-500">DUITNOW QR</span>
            </div>

            <button @click="nextStep"
              class="w-full bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-[#00695C] dark:hover:bg-teal-600 transition-all">
              Verify Payment Received
            </button>
          </div>

          <div v-if="currentStep === 3" class="p-8 bg-gray-50 dark:bg-gray-900/50">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-sm relative">
              
              <div
                class="absolute -top-3 -right-3 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow"
                :class="isViewMode ? 'bg-gray-500' : 'bg-green-500'">
                {{ receiptData.status }}
              </div>

              <div class="text-center mb-6">
                <h2 class="text-xl font-black text-gray-800 dark:text-white tracking-tight">MicroOps</h2>
                <p class="text-[10px] text-gray-400">Order {{ receiptData.id }} • {{ receiptData.date }}</p>
              </div>

              <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div v-for="(item, index) in receiptData.items" :key="index" class="flex justify-between">
                  <span>{{ item.name }} (x{{ item.qty }})</span>
                  <span>RM {{ (item.price * item.qty).toFixed(2) }}</span>
                </div>
                <div v-if="receiptData.items && receiptData.items.length === 0" class="text-center italic text-gray-400">
                  No items found
                </div>
              </div>

              <div class="flex justify-between font-bold text-lg text-gray-800 dark:text-white">
                <span>Total</span>
                <span>RM {{ receiptData.total.toFixed(2) }}</span>
              </div>
            </div>

            <button @click="closeModal"
              class="mt-6 w-full bg-gray-800 dark:bg-gray-700 text-white font-bold py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600">
              {{ isViewMode ? 'Close' : 'Close & Print Receipt' }}
            </button>
          </div>

        </div>
      </div>
    </Teleport>
  </section>
</template>