<script setup>
import { ref } from 'vue'

const incomeData = ref([
  { id: 1, date: '2025-06-25', source: 'Order #1024', amount: '+$250.00' },
  { id: 2, date: '2025-06-24', source: 'Order #1023', amount: '+$150.75' },
])

const expenseData = ref([
  { id: 1, date: '2025-06-20', category: 'Raw Materials', amount: '-$75.20' },
  { id: 2, date: '2025-06-18', category: 'Marketing', amount: '-$50.00' },
])
</script>

<template>
  <section>
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">Income & Expense Tracking</h2>
      <p class="mt-2 text-gray-600">Monitor all financial inflows and outflows for your business.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Income</h3>
          <button class="bg-[#4DB6AC] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#26A69A] transition-colors">
            Add Income
          </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b">
                <th class="p-4">Date</th>
                <th class="p-4">Source</th>
                <th class="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in incomeData" :key="item.id" class="border-b hover:bg-gray-50">
                <td class="p-4">{{ item.date }}</td>
                <td class="p-4">{{ item.source }}</td>
                <td class="p-4 text-right text-green-600 font-medium">{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Expenses</h3>
          <button class="bg-[#E57373] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#EF5350] transition-colors">
            Add Expense
          </button>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b">
                <th class="p-4">Date</th>
                <th class="p-4">Category</th>
                <th class="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in expenseData" :key="item.id" class="border-b hover:bg-gray-50">
                <td class="p-4">{{ item.date }}</td>
                <td class="p-4">{{ item.category }}</td>
                <td class="p-4 text-right text-red-600 font-medium">{{ item.amount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </section>
</template>