<script setup>
import { ref } from 'vue'

const customers = ref([
  { 
    id: 1, 
    name: 'Alice Johnson', 
    email: 'alice.j@example.com', 
    totalSpent: '$1,250.00', 
    lastOrder: '2025-06-25' 
  },
  { 
    id: 2, 
    name: 'Bob Williams', 
    email: 'bob.w@example.com', 
    totalSpent: '$850.75', 
    lastOrder: '2025-06-24' 
  },
  { 
    id: 3, 
    name: 'Charlie Brown', 
    email: 'charlie.b@example.com', 
    totalSpent: '$320.50', 
    lastOrder: '2025-06-23' 
  },
])
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Customer Management</h2>
        <p class="mt-2 text-gray-600">Maintain your customer database and interaction history.</p>
      </div>
      
      <div class="mt-5">
        <button class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2">
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
            <th class="p-4">Total Spent</th>
            <th class="p-4">Last Order</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="customer in customers" :key="customer.id" class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium">{{ customer.name }}</td>
            <td class="p-4">{{ customer.email }}</td>
            <td class="p-4">{{ customer.totalSpent }}</td>
            <td class="p-4">{{ customer.lastOrder }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>