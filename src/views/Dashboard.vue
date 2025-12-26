<script setup>
import { onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'

const salesChartCanvas = ref(null)
const productChartCanvas = ref(null)
const ordersChartCanvas = ref(null)
const trafficChartCanvas = ref(null)

// Store chart instances to update them later
let salesChart = null
let productChart = null
let ordersChart = null
let trafficChart = null

// Helper to get colors based on theme
const getChartColors = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    textColor: isDark ? '#e5e7eb' : '#6b7280', // gray-200 vs gray-500
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }
}

const initCharts = () => {
  const { textColor, gridColor } = getChartColors()
  
  // Destroy existing charts if re-initializing
  if (salesChart) salesChart.destroy()
  if (productChart) productChart.destroy()
  if (ordersChart) ordersChart.destroy()
  if (trafficChart) trafficChart.destroy()

  // 1. Sales vs Expenses Chart (Line)
  salesChart = new Chart(salesChartCanvas.value, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales',
        data: [12000, 19000, 15000, 24000, 22000, 28000],
        borderColor: '#059669', // Emerald-600
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Expenses',
        data: [8000, 9000, 7000, 8500, 11000, 13000],
        borderColor: '#EF4444', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  })

  // 2. Product Chart (Doughnut)
  productChart = new Chart(productChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Handmade Mugs', 'Organic Tea', 'Artisan Soaps', 'Other'],
      datasets: [{
        label: 'Sales by Product',
        data: [45, 25, 15, 15],
        backgroundColor: ['#059669', '#34D399', '#6EE7B7', '#9CA3AF'],
        borderWidth: 0, 
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'bottom',
          labels: { color: textColor }
        } 
      }
    }
  })

  // 3. Weekly Order Volume (Bar Chart)
  ordersChart = new Chart(ordersChartCanvas.value, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Orders Processed',
        data: [12, 19, 15, 17, 28, 24, 10],
        backgroundColor: '#0D9488', // Teal-600
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor } }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        x: {
          grid: { display: false }, // Cleaner look
          ticks: { color: textColor }
        }
      }
    }
  })

  // 4. Traffic Sources (Polar Area)
  trafficChart = new Chart(trafficChartCanvas.value, {
    type: 'polarArea',
    data: {
      labels: ['Instagram', 'TikTok', 'Walk-in', 'Website', 'Referral'],
      datasets: [{
        label: 'Traffic Source',
        data: [150, 120, 90, 60, 40],
        backgroundColor: [
          'rgba(13, 148, 136, 0.7)', // Teal
          'rgba(245, 158, 11, 0.7)', // Amber
          'rgba(239, 68, 68, 0.7)',  // Red
          'rgba(59, 130, 246, 0.7)', // Blue
          'rgba(168, 85, 247, 0.7)'  // Purple
        ],
        borderWidth: 0 // Cleaner look without borders in dark mode
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'right',
          labels: { color: textColor }
        } 
      },
      scales: { 
        r: { 
          ticks: { display: false },
          grid: { color: gridColor },
          backdropColor: 'transparent' // Crucial for dark mode
        } 
      }
    }
  })
}

onMounted(() => {
  initCharts()
  
  // Watch for theme changes (Optional: if you want live switching without refresh)
  // You can trigger this using an event bus or a simple MutationObserver
  const observer = new MutationObserver(() => {
    initCharts()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
</script>

<template>
  <section class="pb-10">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Welcome back! Here's a summary of your business performance.</p>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">RM5,231</p>
        <p class="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">+20.1% from last month</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">RM2,890</p>
        <p class="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">+15.7% from last month</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Open Orders</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">12</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Awaiting processing</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">32</p>
        <p class="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">+5 this month</p>
      </div>
    </div>

    <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
         <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales vs Expenses</h3>
         <div class="relative h-72">
            <canvas ref="salesChartCanvas"></canvas>
         </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sales by Product</h3>
        <div class="relative h-64">
            <canvas ref="productChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
         <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Order Volume</h3>
         <div class="relative h-64">
            <canvas ref="ordersChartCanvas"></canvas>
         </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Customer Traffic Sources</h3>
        <div class="relative h-64">
            <canvas ref="trafficChartCanvas"></canvas>
        </div>
      </div>
    </div>

  </section>
</template>