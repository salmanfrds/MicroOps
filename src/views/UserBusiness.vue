<script setup>
import { ref, reactive } from 'vue'

// Mock Data matching your ERD structure (Business + Role)
const businesses = ref([
  { 
    id: 1, 
    name: 'MicroOps Enterprises', 
    role: 'Owner', 
    category: 'Retail',
    address: 'Level 12, Menara Tech, KL',
    status: 'Active',
    logoBg: 'bg-teal-100',
    logoColor: 'text-teal-800'
  },
  { 
    id: 2, 
    name: 'Java Coffee Co.', 
    role: 'Staff', 
    category: 'Food & Beverage',
    address: '88 Jalan Kopi, Bandung',
    status: 'Active',
    logoBg: 'bg-orange-100',
    logoColor: 'text-orange-800'
  },
  { 
    id: 3, 
    name: 'TechFlow Solutions', 
    role: 'Consultant', 
    category: 'IT Services',
    address: 'Remote',
    status: 'Pending',
    logoBg: 'bg-blue-100',
    logoColor: 'text-blue-800'
  }
])

const getRoleBadgeColor = (role) => {
  if (role === 'Owner') return 'bg-[#004D40] text-white'
  return 'bg-gray-100 text-gray-600'
}

// --- MODAL LOGIC ---
const isModalOpen = ref(false)
const newBusinessForm = reactive({
  name: '',
  category: '',
  address: ''
})

// Mock Categories for dropdown
const categories = ['Retail', 'Food & Beverage', 'IT Services', 'Consulting', 'Manufacturing', 'Other']

const openModal = () => {
  // Reset form on open
  Object.assign(newBusinessForm, { name: '', category: '', address: '' })
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

// Mock Submit Function
const registerBusiness = () => {
  // Basic validation mockup
  if (!newBusinessForm.name || !newBusinessForm.category) {
    alert("Please fill in required fields")
    return
  }

  // Add mock data to list
  businesses.value.push({
    id: businesses.value.length + 1,
    name: newBusinessForm.name,
    role: 'Owner', // Creator is usually owner
    category: newBusinessForm.category,
    address: newBusinessForm.address || 'N/A',
    status: 'Active',
    logoBg: 'bg-purple-100', // Random mock color
    logoColor: 'text-purple-800'
  })

  closeModal()
}
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800">My Businesses</h2>
        <p class="mt-2 text-gray-600">Select a business profile to manage or view its dashboard.</p>
      </div>
      
      <div class="mt-5">
        <button 
          @click="openModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Register New Business
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <div 
        v-for="biz in businesses" 
        :key="biz.id" 
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group cursor-pointer relative overflow-hidden"
      >
        <div class="flex justify-between items-start mb-4">
          <div :class="['w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold', biz.logoBg, biz.logoColor]">
            {{ biz.name.charAt(0) }}
          </div>
          <span 
            :class="['text-xs font-semibold px-2 py-1 rounded-full', biz.status === 'Active' ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50']"
          >
            {{ biz.status }}
          </span>
        </div>

        <div>
          <h3 class="text-xl font-bold text-gray-800 group-hover:text-[#004D40] transition-colors mb-1">
            {{ biz.name }}
          </h3>
          <p class="text-sm text-gray-500 mb-4">{{ biz.category }}</p>
          
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-6">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span class="truncate">{{ biz.address }}</span>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
          <span :class="['text-xs px-3 py-1 rounded-full font-medium', getRoleBadgeColor(biz.role)]">
            {{ biz.role }}
          </span>
          <button class="text-[#004D40] font-semibold text-sm hover:underline flex items-center gap-1">
            Manage
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <button 
        @click="openModal"
        class="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-[#4DB6AC] hover:text-[#4DB6AC] hover:bg-teal-50 transition-all duration-300 min-h-60"
      >
        <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-white">
           <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        </div>
        <span class="font-semibold">Join or Register Business</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>

        <div class="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all">
            
            <div class="p-6 border-b bg-gray-50 flex justify-between items-center">
                <h3 class="text-xl font-bold text-gray-800">Register New Business</h3>
                <button @click="closeModal" class="text-gray-400 hover:text-gray-600 font-bold text-2xl">&times;</button>
            </div>

            <div class="p-6 space-y-5">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Business Name <span class="text-red-500">*</span></label>
                    <input 
                        v-model="newBusinessForm.name" 
                        type="text" 
                        placeholder="e.g. Stellar Cafe" 
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none"
                    >
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Business Category <span class="text-red-500">*</span></label>
                    <select 
                      v-model="newBusinessForm.category"
                      class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none bg-white"
                    >
                        <option value="" disabled selected>Select Category</option>
                        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Location / Address</label>
                    <textarea 
                        v-model="newBusinessForm.address" 
                        rows="3" 
                        placeholder="Enter main operating address" 
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] outline-none resize-none"
                    ></textarea>
                </div>

                <div class="pt-4 flex gap-3">
                    <button 
                        @click="closeModal" 
                        class="flex-1 py-3 px-4 rounded-lg text-gray-500 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="registerBusiness" 
                        class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] transition-colors"
                    >
                        Create Business
                    </button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>