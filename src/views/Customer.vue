<script setup>
import { ref } from 'vue'

const customers = ref([
  { 
    id: 1, 
    name: 'Alice Johnson', 
    email: 'alice.j@example.com', 
    phone: '+1 555-0101',
    totalSpent: '$1,250.00', 
    lastOrder: '2025-06-25' 
  },
  { 
    id: 2, 
    name: 'Bob Williams', 
    email: 'bob.w@example.com', 
    phone: '+1 555-0102',
    totalSpent: '$850.75', 
    lastOrder: '2025-06-24' 
  },
  { 
    id: 3, 
    name: 'Charlie Brown', 
    email: 'charlie.b@example.com', 
    phone: '+1 555-0103',
    totalSpent: '$320.50', 
    lastOrder: '2025-06-23' 
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

// Mock Add Function
const addCustomer = () => {
  if (!newCustomer.value.name || !newCustomer.value.email) return
  
  customers.value.unshift({
    id: customers.value.length + 1,
    name: newCustomer.value.name,
    email: newCustomer.value.email,
    phone: newCustomer.value.phone || 'N/A',
    totalSpent: '$0.00',
    lastOrder: 'New'
  })
  
  closeModal()
}
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Customer Management</h2>
        <p class="mt-2 text-gray-600">Maintain your customer database and interaction history.</p>
      </div>
      
      <div class="mt-5">
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

    <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="p-4">Name</th>
            <th class="p-4">Email</th>
            <th class="p-4">Phone</th>
            <th class="p-4">Total Spent</th>
            <th class="p-4">Last Order</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id" class="border-b hover:bg-gray-50 transition-colors">
            <td class="p-4 font-medium text-gray-800">{{ customer.name }}</td>
            <td class="p-4 text-gray-600">{{ customer.email }}</td>
            <td class="p-4 text-gray-500 text-sm">{{ customer.phone }}</td>
            <td class="p-4 font-bold text-[#004D40]">{{ customer.totalSpent }}</td>
            <td class="p-4">
                <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{{ customer.lastOrder }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            
            <div class="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">Add New Customer</h3>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                    <input 
                        v-model="newCustomer.name" 
                        type="text" 
                        placeholder="e.g. Sarah Connor" 
                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none"
                    >
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                    <input 
                        v-model="newCustomer.email" 
                        type="email" 
                        placeholder="sarah@example.com" 
                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none"
                    >
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                    <input 
                        v-model="newCustomer.phone" 
                        type="tel" 
                        placeholder="+60 12-345 6789" 
                        class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none"
                    >
                </div>

                <div class="pt-4 flex gap-3">
                    <button 
                        @click="closeModal" 
                        class="flex-1 py-3 px-4 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="addCustomer" 
                        class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors"
                    >
                        Save Customer
                    </button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>