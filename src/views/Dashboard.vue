<script setup>
import { onMounted, ref } from 'vue'
import Chart from 'chart.js/auto'

const salesChartCanvas = ref(null)
const productChartCanvas = ref(null)

onMounted(() => {
  // Sales vs Expenses Chart
  new Chart(salesChartCanvas.value, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales',
        data: [12000, 19000, 15000, 24000, 22000, 28000],
        borderColor: '#4DB6AC',
        backgroundColor: 'rgba(77, 182, 172, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Expenses',
        data: [8000, 9000, 7000, 8500, 11000, 13000],
        borderColor: '#E57373',
        backgroundColor: 'rgba(229, 115, 115, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  })

  // Product Chart
  new Chart(productChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Handmade Mugs', 'Organic Tea', 'Artisan Soaps', 'Other'],
      datasets: [{
        label: 'Sales by Product',
        data: [45, 25, 15, 15],
        backgroundColor: ['#4DB6AC', '#81C784', '#A5D6A7', '#BCAAA4'],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    }
  })
})
</script>

<template>
  <section>
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>
      <p class="mt-2 text-gray-600">Welcome back! Here's a summary of your business performance.</p>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">$45,231.89</p>
        <p class="mt-1 text-sm text-green-600">+20.1% from last month</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500">Net Profit</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">$12,890.10</p>
        <p class="mt-1 text-sm text-green-600">+15.7% from last month</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500">Open Orders</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">12</p>
        <p class="mt-1 text-sm text-gray-500">Awaiting processing</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-sm font-medium text-gray-500">New Customers</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900">32</p>
        <p class="mt-1 text-sm text-green-600">+5 this month</p>
      </div>
    </div>

    <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
         <h3 class="text-lg font-semibold text-gray-800 mb-4">Sales vs Expenses</h3>
         <div class="relative h-72">
            <canvas ref="salesChartCanvas"></canvas>
         </div>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Sales by Product</h3>
        <div class="relative h-64">
            <canvas ref="productChartCanvas"></canvas>
        </div>
      </div>
    </div>
  </section>
</template>