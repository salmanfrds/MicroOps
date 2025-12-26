<script setup>
import { ref } from 'vue'

// Enhanced Mock Data
// UPDATED: Added dark mode classes for avatar background/text colors
const customers = ref([
  { 
    id: 1, 
    name: 'Alice Johnson', 
    email: 'alice.j@example.com', 
    phone: '+60 12-222 0101', 
    totalSpent: 1250.00,
    ordersCount: 12,
    lastOrder: '2025-06-25',
    status: 'Active',
    initials: 'AJ',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  },
  { 
    id: 2, 
    name: 'Bob Williams', 
    email: 'bob.w@example.com', 
    phone: '+60 17-555 0199', 
    totalSpent: 850.75, 
    ordersCount: 5,
    lastOrder: '2025-06-24',
    status: 'Inactive',
    initials: 'BW',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  },
  { 
    id: 3, 
    name: 'Charlie Brown', 
    email: 'charlie.b@example.com', 
    phone: '+60 19-888 7744',
    totalSpent: 320.50, 
    ordersCount: 2,
    lastOrder: '2025-06-23',
    status: 'New',
    initials: 'CB',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  },
])

// --- MODAL STATE ---
const isModalOpen = ref(false)
const newCustomer = ref({ name: '', email: '', phone: '' })

const openModal = () => {
  isModalOpen.value = true
  newCustomer.value = { name: '', email: '', phone: '' }
}

const closeModal = () => {
  isModalOpen.value = false
}

// Logic to generate initials
const getInitials = (name) => name.split(' ').map((n) => n[0]).join('').substring(0,2).toUpperCase()

const addCustomer = () => {
  if (!newCustomer.value.name || !newCustomer.value.email) return
  
  customers.value.unshift({
    id: customers.value.length + 1,
    name: newCustomer.value.name,
    email: newCustomer.value.email,
    phone: newCustomer.value.phone || 'N/A',
    totalSpent: 0.00,
    ordersCount: 0,
    lastOrder: 'Just Now',
    status: 'New',
    initials: getInitials(newCustomer.value.name),
    // Default color for new customers (Teal)
    color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' 
  })
  
  closeModal()
}

// Helper to format currency
const formatMoney = (val) => 'RM ' + val.toFixed(2)
</script>

<template>
  <section>
    <header class="mb-6">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Customer Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Maintain your customer database and interaction history.</p>
      </div>
      
      <div>
        <button
          @click="openModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Customer
        </button>
      </div>
    </header>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customer Profile</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contact</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Lifetime Value</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          <tr v-for="customer in customers" :key="customer.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
            
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div :class="[customer.color, 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm']">
                  {{ customer.initials }}
                </div>
                <div>
                  <div class="font-bold text-gray-800 dark:text-white text-sm">{{ customer.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ customer.email }}</div>
                </div>
              </div>
            </td>

            <td class="p-4">
               <span 
                 :class="{
                   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': customer.status === 'Active',
                   'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400': customer.status === 'Inactive',
                   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': customer.status === 'New'
                 }"
                 class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent"
               >
                 {{ customer.status }}
               </span>
            </td>

            <td class="p-4">
              <div class="flex flex-col">
                <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ customer.phone }}</span>
                <span class="text-xs text-gray-400 dark:text-gray-500">Last: {{ customer.lastOrder }}</span>
              </div>
            </td>

            <td class="p-4 text-right">
                <div class="font-bold text-gray-800 dark:text-white">{{ formatMoney(customer.totalSpent) }}</div>
                <div class="text-xs text-gray-400 dark:text-gray-500">{{ customer.ordersCount }} Orders</div>
            </td>

            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button class="p-2 text-gray-400 hover:text-[#4DB6AC] dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors" title="Send Email">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                    <button class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Customer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <div>
                   <h3 class="text-xl font-bold text-gray-800 dark:text-white">Add Customer</h3>
                   <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Create a new profile for tracking.</p>
                </div>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <input v-model="newCustomer.name" type="text" placeholder="e.g. Sarah Connor" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <input v-model="newCustomer.email" type="email" placeholder="sarah@example.com" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input v-model="newCustomer.phone" type="tel" placeholder="+60 12-345 6789" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button 
                        @click="closeModal" 
                        class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="addCustomer" 
                        class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] hover:shadow-xl transform active:scale-95 transition-all"
                    >
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>