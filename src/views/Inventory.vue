<script setup>
import { ref } from 'vue'

const inventoryItems = ref([
  { 
    id: 1, 
    name: 'Handmade Mug', 
    sku: 'HM-001', 
    stock: 42, 
    status: 'In Stock', 
    statusClass: 'text-green-800 bg-green-200' 
  },
  { 
    id: 2, 
    name: 'Organic Tea Blend', 
    sku: 'OTB-012', 
    stock: 8, 
    status: 'Low Stock', 
    statusClass: 'text-yellow-800 bg-yellow-200' 
  },
  { 
    id: 3, 
    name: 'Artisan Soap Bar', 
    sku: 'ASB-005', 
    stock: 0, 
    status: 'Out of Stock', 
    statusClass: 'text-red-800 bg-red-200' 
  },
])

// --- DEDUCT MODAL STATE ---
const selectedItem = ref(null)
const deductForm = ref({ amount: '', remark: '' })

const openDeductModal = (item) => {
  selectedItem.value = item
  deductForm.value = { amount: '', remark: '' }
}

const closeDeductModal = () => {
  selectedItem.value = null
}

// --- ADD PRODUCT MODAL STATE ---
const isAddModalOpen = ref(false)
const addForm = ref({ name: '', sku: '', stock: '', price: '' })

const openAddModal = () => {
  isAddModalOpen.value = true
  addForm.value = { name: '', sku: '', stock: '', price: '' }
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Inventory Management</h2>
        <p class="mt-2 text-gray-600">Keep track of your product and material stock levels.</p>
      </div>
      
      <div class="mt-5">
        <button 
          @click="openAddModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Add Product
        </button>
      </div>
    </header>

    <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="p-4">Product</th>
            <th class="p-4">SKU</th>
            <th class="p-4">Stock Level</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryItems" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium">{{ item.name }}</td>
            <td class="p-4 text-gray-500">{{ item.sku }}</td>
            <td class="p-4 font-bold text-gray-700">{{ item.stock }} units</td>
            <td class="p-4">
              <span :class="['px-2 py-1 text-xs font-semibold rounded-full', item.statusClass]">
                {{ item.status }}
              </span>
            </td>
            <td class="p-4 text-right">
                <button 
                  @click="openDeductModal(item)"
                  :disabled="item.stock === 0"
                  class="text-red-500 hover:bg-red-50 border border-red-200 hover:border-red-400 font-bold text-xs py-1 px-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ml-auto"
                >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                    Deduct
                </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeAddModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            
            <div class="p-6 border-b bg-teal-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-[#004D40]">Add New Product</h3>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                    <input v-model="addForm.name" type="text" placeholder="e.g. Vanilla Candle" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">SKU</label>
                        <input v-model="addForm.sku" type="text" placeholder="VC-001" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none uppercase">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Price (RM)</label>
                        <input v-model="addForm.price" type="number" placeholder="0.00" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Initial Stock Quantity</label>
                    <input v-model="addForm.stock" type="number" placeholder="0" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none">
                </div>

                <div class="pt-4 flex gap-3">
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors">Cancel</button>
                    <button @click="closeAddModal" class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors">Save Product</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedItem" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeDeductModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            
            <div class="p-6 border-b bg-red-50 flex justify-between items-start">
                <div>
                   <h3 class="text-xl font-bold text-red-900">Deduct Stock</h3>
                   <p class="text-sm text-red-700 mt-1">Adjusting: <span class="font-bold">{{ selectedItem.name }}</span></p>
                </div>
                <button @click="closeDeductModal" class="text-red-300 hover:text-red-500 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-5">
                <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span class="text-sm font-semibold text-gray-500">Current Available Stock</span>
                    <span class="text-lg font-bold text-gray-800">{{ selectedItem.stock }} Units</span>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Deduct Quantity</label>
                    <input v-model="deductForm.amount" type="number" min="1" :max="selectedItem.stock" placeholder="0" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none font-mono text-lg">
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Reason / Remark</label>
                    <textarea v-model="deductForm.remark" rows="3" placeholder="e.g. Damaged goods, Internal usage" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none resize-none"></textarea>
                </div>

                <div class="pt-2 flex gap-3">
                    <button @click="closeDeductModal" class="flex-1 py-3 px-4 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors">Cancel</button>
                    <button @click="closeDeductModal" class="flex-1 py-3 px-4 rounded-lg bg-red-600 text-white font-bold shadow-lg hover:bg-red-700 transition-colors">Confirm Deduction</button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>