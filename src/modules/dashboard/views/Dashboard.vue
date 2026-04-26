<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useDashboardAnalytics } from '../composables/useDashboardAnalytics'

const {
  totalRevenue,
  totalOrders,
  openOrders,
  newCustomersThisMonth,
  salesByMonthData,
  salesByProductData,
  weeklyOrdersData
} = useDashboardAnalytics()

const salesChartCanvas = ref(null)
const productChartCanvas = ref(null)
const ordersChartCanvas = ref(null)

let salesChart = null
let productChart = null
let ordersChart = null
let observer = null

const getChartColors = () => {
  const isDark = document.documentElement.classList.contains('dark')
  return {
    textColor: isDark ? '#e5e7eb' : '#6b7280',
    gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }
}

const initCharts = () => {
  const { textColor, gridColor } = getChartColors()

  if (salesChart) salesChart.destroy()
  if (productChart) productChart.destroy()
  if (ordersChart) ordersChart.destroy()

  if (salesChartCanvas.value) {
    salesChart = new Chart(salesChartCanvas.value, {
      type: 'line',
      data: {
        labels: salesByMonthData.value.labels,
        datasets: [{
          label: 'Revenue (RM)',
          data: salesByMonthData.value.sales,
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
          x: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    })
  }

  if (productChartCanvas.value) {
    productChart = new Chart(productChartCanvas.value, {
      type: 'doughnut',
      data: {
        labels: salesByProductData.value.labels,
        datasets: [{
          label: 'Revenue by Product',
          data: salesByProductData.value.data,
          backgroundColor: ['#059669', '#34D399', '#6EE7B7', '#0D9488', '#9CA3AF'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
      }
    })
  }

  if (ordersChartCanvas.value) {
    ordersChart = new Chart(ordersChartCanvas.value, {
      type: 'bar',
      data: {
        labels: weeklyOrdersData.value.labels,
        datasets: [{
          label: 'Orders',
          data: weeklyOrdersData.value.data,
          backgroundColor: '#0D9488',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: textColor } } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    })
  }
}

// Update chart data without full re-init (smooth updates)
const updateChartsData = () => {
  if (salesChart) {
    salesChart.data.labels = salesByMonthData.value.labels
    salesChart.data.datasets[0].data = salesByMonthData.value.sales
    salesChart.update()
  }
  if (productChart) {
    productChart.data.labels = salesByProductData.value.labels
    productChart.data.datasets[0].data = salesByProductData.value.data
    productChart.update()
  }
  if (ordersChart) {
    ordersChart.data.datasets[0].data = weeklyOrdersData.value.data
    ordersChart.update()
  }
}

onMounted(() => {
  initCharts()

  // Watch data changes and update charts smoothly
  watch([salesByMonthData, salesByProductData, weeklyOrdersData], updateChartsData, { deep: true })

  // Reinit on theme change
  observer = new MutationObserver(initCharts)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  observer?.disconnect()
  salesChart?.destroy()
  productChart?.destroy()
  ordersChart?.destroy()
})
</script>

<template>
  <section class="pb-10">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Welcome back! Here's a summary of your business performance.</p>
    </header>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">RM {{ totalRevenue.toFixed(2) }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">From paid orders</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ totalOrders }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">All time</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Open Orders</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ openOrders }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Awaiting processing</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-transparent dark:border-gray-700 transition-colors">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</h3>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ newCustomersThisMonth }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">This month</p>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Monthly Revenue (Last 6 Months)</h3>
        <div class="relative h-72">
          <canvas ref="salesChartCanvas"></canvas>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Revenue by Product</h3>
        <div class="relative h-64">
          <canvas ref="productChartCanvas"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="mt-8">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Weekly Order Volume</h3>
        <div class="relative h-64">
          <canvas ref="ordersChartCanvas"></canvas>
        </div>
      </div>
    </div>
  </section>
</template>
