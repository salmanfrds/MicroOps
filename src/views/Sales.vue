<script setup>
import { ref } from 'vue'

const orders = ref([
  { id: '#1024', customer: 'Alice Johnson', date: '2025-06-25', status: 'Completed', total: '$250.00', statusColor: 'text-green-800 bg-green-200' },
  { id: '#1023', customer: 'Bob Williams', date: '2025-06-24', status: 'Shipped', total: '$150.75', statusColor: 'text-blue-800 bg-blue-200' },
  { id: '#1022', customer: 'Charlie Brown', date: '2025-06-23', status: 'Processing', total: '$80.50', statusColor: 'text-yellow-800 bg-yellow-200' },
])
</script>

<template>
  <section>
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Sales & Order Management</h2>
        <p class="mt-2 text-gray-600">Track customer orders from quotation to final invoice.</p>
      </div>
      <button class="bg-[#4DB6AC] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#26A69A] transition-colors">New Order</button>
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
  </section>
</template>