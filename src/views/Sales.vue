<script setup>
import { ref, computed } from 'vue'

// --- EXISTING DATA ---
const orders = ref([
  { id: '#1024', customer: 'Alice Johnson', date: '2025-06-25', status: 'Completed', total: '$250.00', statusColor: 'text-green-800 bg-green-200' },
  { id: '#1023', customer: 'Bob Williams', date: '2025-06-24', status: 'Shipped', total: '$150.75', statusColor: 'text-blue-800 bg-blue-200' },
  { id: '#1022', customer: 'Charlie Brown', date: '2025-06-23', status: 'Processing', total: '$80.50', statusColor: 'text-yellow-800 bg-yellow-200' },
])

// --- NEW MODAL LOGIC ---
const isModalOpen = ref(false)
const currentStep = ref(1) // 1: Select, 2: Payment, 3: Receipt

const inventoryItems = ref([
  { id: 1, name: 'Handmade Mug', sku: 'HM-001', stock: 42, price: 25.00, status: 'In Stock', statusClass: 'text-green-800 bg-green-200' },
  { id: 2, name: 'Organic Tea Blend', sku: 'OTB-012', stock: 8, price: 15.50, status: 'Low Stock', statusClass: 'text-yellow-800 bg-yellow-200' },
  { id: 3, name: 'Artisan Soap Bar', sku: 'ASB-005', stock: 0, price: 12.00, status: 'Out of Stock', statusClass: 'text-red-800 bg-red-200' },
])

const openModal = () => {
  currentStep.value = 1
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const nextStep = () => {
  currentStep.value++
}
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Sales & Order Management</h2>
        <p class="mt-2 text-gray-600">Track customer orders from quotation to final invoice.</p>
      </div>
      
      <div class="mt-5">
        <button 
          @click="openModal" 
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          New Order
        </button>
      </div>
    </header>

    <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="p-4">Order ID</th>
            <th class="p-4">Customer</th>
            <th class="p-4">Date</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium">{{ order.id }}</td>
            <td class="p-4">{{ order.customer }}</td>
            <td class="p-4">{{ order.date }}</td>
            <td class="p-4">
              <span :class="['px-2 py-1 text-xs font-semibold rounded-full', order.statusColor]">
                {{ order.status }}
              </span>
            </td>
            <td class="p-4 text-right">{{ order.total }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          
          <div class="p-5 border-b flex justify-between items-center bg-gray-50">
            <div>
               <h3 class="text-lg font-bold text-gray-800">New Transaction</h3>
               <p class="text-xs text-gray-500">Step {{ currentStep }} of 3</p>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-red-500 text-2xl font-bold leading-none">&times;</button>
          </div>

          <div v-if="currentStep === 1" class="p-6">
            <h4 class="font-bold text-gray-700 mb-4 text-sm uppercase tracking-wide">Select Inventory</h4>
            <div class="space-y-3 max-h-[300px] overflow-y-auto">
              <div v-for="item in inventoryItems" :key="item.id" 
                   class="flex items-center justify-between p-3 border rounded-lg hover:border-[#4DB6AC] hover:bg-teal-50 cursor-pointer transition-all">
                <div class="flex items-center gap-3">
                  <input type="checkbox" :disabled="item.stock === 0" class="w-4 h-4 accent-[#4DB6AC]">
                  <div>
                    <div class="font-bold text-gray-800 text-sm">{{ item.name }}</div>
                    <div class="text-xs text-gray-500">SKU: {{ item.sku }}</div>
                  </div>
                </div>
                <div class="text-right">
                    <span :class="item.statusClass" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase block mb-1">
                        {{ item.status }}
                    </span>
                    <span class="text-sm font-bold text-[#004D40]">RM {{ item.price.toFixed(2) }}</span>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
                <button @click="nextStep" class="bg-[#4DB6AC] text-white font-bold py-2 px-8 rounded-lg shadow hover:bg-[#26A69A]">Next: Payment</button>
            </div>
          </div>

          <div v-if="currentStep === 2" class="p-8 text-center">
            <h4 class="font-bold text-gray-800 mb-2">Scan to Pay</h4>
            <p class="text-xs text-gray-500 mb-6">Total Due: <span class="font-bold text-gray-800">RM 40.50</span></p>
            
            <div class="w-48 h-48 mx-auto bg-pink-50 border-4 border-pink-200 rounded-xl flex items-center justify-center mb-6 relative">
                 <svg class="w-24 h-24 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" /></svg>
                 <span class="absolute bottom-2 text-[10px] font-bold text-pink-400">DUITNOW QR</span>
            </div>

            <button @click="nextStep" class="w-full bg-[#004D40] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#00695C] transition-all">
                Verify Payment Received
            </button>
          </div>

          <div v-if="currentStep === 3" class="p-8 bg-gray-50">
            <div class="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 shadow-sm relative">
                <div class="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">PAID</div>
                <div class="text-center mb-6">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">MicroOps</h2>
                    <p class="text-[10px] text-gray-400">Order #1025 • 24 Dec 2025</p>
                </div>
                
                <div class="space-y-2 text-sm text-gray-600 mb-4 border-b border-gray-100 pb-4">
                    <div class="flex justify-between"><span>Handmade Mug (x1)</span><span>RM 25.00</span></div>
                    <div class="flex justify-between"><span>Organic Tea (x1)</span><span>RM 15.50</span></div>
                </div>
                
                <div class="flex justify-between font-bold text-lg text-gray-800">
                    <span>Total</span>
                    <span>RM 40.50</span>
                </div>
            </div>
            
            <button @click="closeModal" class="mt-6 w-full bg-gray-800 text-white font-bold py-2 rounded-lg hover:bg-gray-900">
                Close & Print Receipt
            </button>
          </div>

        </div>
      </div>
    </Teleport>
  </section>
</template>