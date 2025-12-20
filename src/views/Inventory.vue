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
</script>

<template>
  <section>
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Inventory Management</h2>
        <p class="mt-2 text-gray-600">Keep track of your product and material stock levels.</p>
      </div>
      <button class="bg-[#4DB6AC] text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-[#26A69A] transition-colors">
        Add Product
      </button>
    </header>

    <div class="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="p-4">Product</th>
            <th class="p-4">SKU</th>
            <th class="p-4">Stock Level</th>
            <th class="p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventoryItems" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium">{{ item.name }}</td>
            <td class="p-4">{{ item.sku }}</td>
            <td class="p-4">{{ item.stock }}</td>
            <td class="p-4">
              <span :class="['px-2 py-1 text-xs font-semibold rounded-full', item.statusClass]">
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>