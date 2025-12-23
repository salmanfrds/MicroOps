<script setup>
import { ref } from 'vue'

const business = ref({
  name: 'MicroOps Enterprises',
  taxId: 'MX-9982-112',
  phone: '+60 11-2345 6789',
  website: 'www.microops.com',
  address: 'Level 12, Menara Tech, Jalan Tun Razak',
  city: 'Kuala Lumpur',
  zip: '50400',
  bankName: '',
  accountNumber: '',
  duitnowId: ''
})

const staff = ref([
  { id: 1, name: 'Salman Firdaus', email: 'salman@microops.com', role: 'Owner', status: 'Active' },
  { id: 2, name: 'Ahmad Zaki', email: 'zaki@microops.com', role: 'Cashier', status: 'Active' },
  { id: 3, name: 'Siti Aminah', email: 'siti@microops.com', role: 'Inventory Manager', status: 'Inactive' },
])

const roles = ['Owner', 'Manager', 'Cashier', 'Inventory Manager']

const handleFileUpload = (event) => {
  // Logic for handling DuitNow QR upload
  console.log('QR Uploaded:', event.target.files[0])
}
</script>

<template>
  <section class="max-w-6xl mx-auto pb-20">
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">Business Settings</h2>
        <p class="mt-2 text-gray-600">Manage your business identity, payments, and team.</p>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Company Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
               <label class="block text-xs font-bold text-gray-500 uppercase">Company Name</label>
               <input v-model="business.name" type="text" class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none font-semibold text-lg text-[#004D40]">
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 uppercase">Tax ID</label>
               <input v-model="business.taxId" type="text" class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none">
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 uppercase">Phone</label>
               <input v-model="business.phone" type="text" class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none">
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 text-[#4DB6AC]">Payment Details (DuitNow)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label class="block text-xs font-bold text-gray-500 uppercase">Bank Name</label>
               <select v-model="business.bankName" class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none bg-transparent">
                  <option value="">Select Bank</option>
                  <option value="Maybank">Maybank</option>
                  <option value="CIMB">CIMB Bank</option>
                  <option value="Bank Islam">Bank Islam</option>
               </select>
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 uppercase">Account Number</label>
               <input v-model="business.accountNumber" type="text" placeholder="e.g. 1642..." class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none">
            </div>
            <div class="md:col-span-2">
               <label class="block text-xs font-bold text-gray-500 uppercase">DuitNow ID (Mobile/NRIC/BRN)</label>
               <input v-model="business.duitnowId" type="text" class="w-full p-2 border-b border-gray-300 focus:border-[#4DB6AC] outline-none">
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <h4 class="font-bold text-gray-700 mb-4">DuitNow QR Code</h4>
        <div class="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center relative group cursor-pointer hover:border-[#4DB6AC] transition-all">
          <input type="file" @change="handleFileUpload" class="absolute inset-0 opacity-0 cursor-pointer">
          <svg class="w-12 h-12 text-gray-300 group-hover:text-[#4DB6AC]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/></svg>
          <p class="text-xs text-gray-400 mt-2">Upload QR Image</p>
        </div>
        <p class="text-[10px] text-gray-400 mt-4 leading-relaxed px-4">This QR will be displayed on your digital invoices for customers to scan and pay.</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800">Staff Management</h3>
        <button class="text-sm bg-[#4DB6AC] text-white px-4 py-2 rounded-lg hover:bg-[#26A69A] transition-colors">+ Add New Staff</button>
      </div>
      <table class="w-full text-left">
        <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
          <tr>
            <th class="px-6 py-4">Name & Email</th>
            <th class="px-6 py-4">Role</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="user in staff" :key="user.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="font-semibold text-gray-800">{{ user.name }}</div>
              <div class="text-xs text-gray-500">{{ user.email }}</div>
            </td>
            <td class="px-6 py-4">
              <select v-model="user.role" class="text-sm border-none bg-transparent focus:ring-0 text-gray-700 font-medium">
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </td>
            <td class="px-6 py-4">
              <span :class="user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                {{ user.status }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button class="text-gray-400 hover:text-red-500 mr-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-8 flex justify-end">
      <button class="bg-[#004D40] text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
        Save All Changes
      </button>
    </div>
  </section>
</template>