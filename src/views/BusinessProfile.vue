<script setup>
import { ref } from 'vue'

const business = ref({
  name: 'MicroOps Enterprises',
  taxId: 'MX-9982-112',
  phone: '+60 11-2345 6789',
  website: 'www.microops.com',
  address: 'Level 12, Menara Tech, Jalan Tun Razak',
  city: 'Kuala Lumpur',
  zip: '50400'
})
</script>

<template>
  <section>
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Business Profile</h2>
        <p class="mt-2 text-gray-600">Company settings and invoicing details.</p>
      </div>
    </header>

    <div class="bg-white p-8 rounded-lg shadow-sm mb-6">
      <div class="flex items-start gap-6">
        <div class="shrink-0">
            <div class="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
                <svg class="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span class="text-xs">Upload Logo</span>
            </div>
        </div>
        
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
               <input v-model="business.name" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none font-bold text-lg text-[#004D40]">
            </div>
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-1">Tax / Registration ID</label>
               <input v-model="business.taxId" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
        </div>
      </div>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Location & Contact</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input v-model="business.address" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input v-model="business.city" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                <input v-model="business.zip" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
             <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input v-model="business.phone" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
             <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input v-model="business.website" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] outline-none">
            </div>
        </div>
        <div class="mt-6 flex justify-end">
            <button class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors">
              Update Business Profile
            </button>
        </div>
    </div>
  </section>
</template>