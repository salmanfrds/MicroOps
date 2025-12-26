<script setup>
import { ref } from 'vue'

// --- 1. CURRENT STOCK DATA ---
const inventoryItems = ref([
  { 
    id: 1, 
    name: 'Handmade Mug', 
    sku: 'HM-001', 
    stock: 42, 
    status: 'In Stock', 
    // UPDATED: Added dark mode classes for status
    statusClass: 'text-green-800 dark:text-green-400 bg-green-100 dark:bg-green-900/30', 
    initials: 'HM',
    // UPDATED: Added dark mode classes for avatar
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
  },
  { 
    id: 2, 
    name: 'Organic Tea Blend', 
    sku: 'OTB-012', 
    stock: 8, 
    status: 'Low Stock', 
    statusClass: 'text-yellow-800 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    initials: 'OT',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  },
  { 
    id: 3, 
    name: 'Artisan Soap Bar', 
    sku: 'ASB-005', 
    stock: 0, 
    status: 'Out of Stock', 
    statusClass: 'text-red-800 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    initials: 'AS',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
  },
])

// --- 2. PROCUREMENT LOG MOCK DATA ---
const procurementLog = ref([
  { 
    id: 'EXP-204', 
    date: '2025-06-20', 
    item: 'Raw Soy Wax', 
    vendor: 'Supplier A', 
    qty: 50, 
    unit: 'kg',
    totalCost: 750.00, 
    status: 'Paid',
    category: 'Raw Materials'
  },
  { 
    id: 'EXP-202', 
    date: '2025-06-18', 
    item: 'Packaging Boxes', 
    vendor: 'PackIt Inc.', 
    qty: 200, 
    unit: 'units',
    totalCost: 120.50, 
    status: 'Pending',
    category: 'Supplies'
  },
])

// --- ACTIONS & MODALS STATE ---
const selectedItemOut = ref(null)
const selectedItemIn = ref(null)
const isAddModalOpen = ref(false)

// Forms
const addForm = ref({ name: '', sku: '', stock: '', price: '' })
const stockForm = ref({ amount: '', remark: '' })

// Actions
const openAddModal = () => isAddModalOpen.value = true
const closeAddModal = () => isAddModalOpen.value = false

const openStockIn = (item) => {
  selectedItemIn.value = item
  stockForm.value = { amount: '', remark: '' }
}
const closeStockIn = () => selectedItemIn.value = null

const openStockOut = (item) => {
  selectedItemOut.value = item
  stockForm.value = { amount: '', remark: '' }
}
const closeStockOut = () => selectedItemOut.value = null
</script>

<template>
  <section class="space-y-12">

    <div>
      <header class="mb-6">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Inventory Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Real-time stock levels and adjustments.</p>
        
        <button 
          @click="openAddModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Product
        </button>
      </header>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Product Details</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Stock Level</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
            <tr v-for="item in inventoryItems" :key="item.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
              
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div :class="[item.color, 'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm']">
                    {{ item.initials }}
                  </div>
                  <div>
                    <div class="font-bold text-gray-800 dark:text-white text-sm">{{ item.name }}</div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wide">SKU: {{ item.sku }}</div>
                  </div>
                </div>
              </td>
              
              <td class="p-4">
                 <div class="flex items-center gap-2">
                   <span class="font-bold text-gray-800 dark:text-white text-base">{{ item.stock }}</span>
                   <span class="text-xs text-gray-400 dark:text-gray-500">units</span>
                 </div>
              </td>
              
              <td class="p-4">
                <span :class="item.statusClass" class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent">
                  {{ item.status }}
                </span>
              </td>
              
              <td class="p-4 text-right">
                  <div class="flex justify-end gap-2">
                      <button 
                        @click="openStockIn(item)"
                        class="text-[#004D40] dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-teal-100 dark:border-teal-800 hover:border-[#4DB6AC] font-bold text-xs py-1.5 px-3 rounded-lg transition-colors"
                      >
                        In
                      </button>
                      <button 
                        @click="openStockOut(item)"
                        :disabled="item.stock === 0"
                        class="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 hover:border-red-400 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Out
                      </button>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="border-t border-dashed border-gray-200 dark:border-gray-700 pt-8">
      <div class="mb-6 flex justify-between items-end">
        <div>
           <h3 class="text-xl font-bold text-gray-800 dark:text-white">Procurement History</h3>
           <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Log of stock added via Expenses.</p>
        </div>
        <span class="text-xs font-bold text-[#4DB6AC] dark:text-teal-400 cursor-pointer hover:underline">View All History</span>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700">
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date & Ref</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Item Details</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quantity In</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Payment</th>
              <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
            <tr v-for="log in procurementLog" :key="log.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors">
              <td class="p-4 align-top">
                <div class="flex flex-col">
                   <span class="font-bold text-gray-800 dark:text-white text-sm tabular-nums">{{ log.date }}</span>
                   <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono mt-1 uppercase tracking-wide">#{{ log.id }}</span>
                </div>
              </td>
              <td class="p-4 align-top">
                <div>
                  <div class="font-bold text-gray-800 dark:text-white text-sm">{{ log.item }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <span class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-medium">{{ log.category }}</span>
                    <span class="text-gray-300 dark:text-gray-600">•</span>
                    <span>{{ log.vendor }}</span>
                  </div>
                </div>
              </td>
              <td class="p-4 align-top">
                <div class="flex items-center gap-1.5">
                    <span class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-2 py-1 rounded-md text-xs font-bold font-mono">
                        +{{ log.qty }}
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ log.unit }}</span>
                </div>
              </td>
              <td class="p-4 align-top">
                <span 
                  :class="log.status === 'Paid' ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800' : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800'"
                  class="px-2 py-0.5 text-[10px] font-bold uppercase rounded border inline-flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="log.status === 'Paid' ? 'bg-green-500' : 'bg-amber-500'"></span>
                  {{ log.status }}
                </span>
              </td>
              <td class="p-4 align-top text-right">
                <div class="font-bold text-gray-800 dark:text-white text-sm font-mono tabular-nums">RM {{ log.totalCost.toFixed(2) }}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeAddModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-center">
                <h3 class="text-xl font-bold text-[#004D40] dark:text-teal-400">Add New Product</h3>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                    <input v-model="addForm.name" type="text" placeholder="e.g. Vanilla Candle" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                        <input v-model="addForm.sku" type="text" placeholder="VC-001" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none uppercase text-gray-700 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Price (RM)</label>
                        <input v-model="addForm.price" type="number" placeholder="0.00" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Initial Stock Quantity</label>
                    <input v-model="addForm.stock" type="number" placeholder="0" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none text-gray-700 dark:text-white">
                </div>
                <div class="pt-4 flex gap-3">
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors">Save Product</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedItemIn" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeStockIn" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-start">
                <div>
                   <h3 class="text-xl font-bold text-[#004D40] dark:text-teal-400">Record Stock In</h3>
                   <p class="text-sm text-[#00695C] dark:text-teal-500 mt-1">Restocking: <span class="font-bold">{{ selectedItemIn.name }}</span></p>
                </div>
                <button @click="closeStockIn" class="text-gray-400 hover:text-[#004D40] dark:hover:text-teal-400 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-5">
                <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Current Available Stock</span>
                    <span class="text-lg font-bold text-gray-800 dark:text-white">{{ selectedItemIn.stock }} Units</span>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Quantity to Add</label>
                    <input v-model="stockForm.amount" type="number" min="1" placeholder="0" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none font-mono text-lg text-[#004D40] dark:text-teal-400">
                </div>
                <div class="pt-2 flex gap-3">
                    <button @click="closeStockIn" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="closeStockIn" class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors">Confirm Restock</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedItemOut" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeStockOut" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20 flex justify-between items-start">
                <div>
                   <h3 class="text-xl font-bold text-red-900 dark:text-red-400">Record Stock Out</h3>
                   <p class="text-sm text-red-700 dark:text-red-300 mt-1">Adjusting: <span class="font-bold">{{ selectedItemOut.name }}</span></p>
                </div>
                <button @click="closeStockOut" class="text-red-300 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-6 space-y-5">
                <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">Current Available Stock</span>
                    <span class="text-lg font-bold text-gray-800 dark:text-white">{{ selectedItemOut.stock }} Units</span>
                </div>
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Quantity to Remove</label>
                    <input v-model="stockForm.amount" type="number" min="1" :max="selectedItemOut.stock" placeholder="0" class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none font-mono text-lg text-gray-800 dark:text-white">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Remark / Reason</label>
                    <textarea 
                      v-model="stockForm.remark" 
                      rows="2" 
                      placeholder="e.g. Damaged, Expired, Internal Use" 
                      class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none resize-none text-sm text-gray-700 dark:text-white"
                    ></textarea>
                </div>

                <div class="pt-2 flex gap-3">
                    <button @click="closeStockOut" class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button @click="closeStockOut" class="flex-1 py-3 px-4 rounded-lg bg-red-400 text-white font-bold shadow-lg hover:bg-red-500 transition-colors">Confirm Update</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>

  </section>
</template>