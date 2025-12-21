<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const dropdownRef = ref(null)

// Mock Data: The business currently being managed
const currentBusiness = ref({
  id: 1,
  name: 'MicroOps Enterprises',
  role: 'Owner',
  initial: 'M'
})

// Mock Data: Other businesses available to switch to
const otherBusinesses = ref([
  { id: 2, name: 'Java Coffee Co.', role: 'Staff', initial: 'J' },
  { id: 3, name: 'TechFlow Solutions', role: 'Consultant', initial: 'T' }
])

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const switchBusiness = (biz) => {
  // Logic to swap current business would go here
  console.log('Switching to', biz.name)
  isOpen.value = false
  // Optional: router.push('/') to refresh dashboard
}

const navigateTo = (path) => {
  isOpen.value = false
  router.push(path)
}

// Close dropdown if clicking outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="fixed top-6 right-6 z-50">
    
    <button 
      @click.stop="toggleDropdown"
      class="group flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-full shadow-lg border border-teal-50 hover:border-[#4DB6AC] hover:shadow-xl transition-all duration-300"
    >
      <div class="w-8 h-8 rounded-full bg-teal-100 text-[#004D40] flex items-center justify-center font-bold text-sm">
        {{ currentBusiness.initial }}
      </div>
      
      <div class="flex flex-col items-start text-sm">
        <span class="font-bold text-gray-800 group-hover:text-[#004D40] transition-colors">
          {{ currentBusiness.name }}
        </span>
        <span class="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
          {{ currentBusiness.role }}
        </span>
      </div>

      <svg 
        class="w-4 h-4 text-gray-400 group-hover:text-[#004D40] transition-transform duration-300"
        :class="{ 'rotate-180': isOpen }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </button>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen"
        class="absolute right-4 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase">Switch Business</p>
        </div>

        <ul class="py-1">
          <li v-for="biz in otherBusinesses" :key="biz.id">
            <button 
              @click="switchBusiness(biz)"
              class="w-full text-left px-4 py-3 hover:bg-teal-50 flex items-center gap-3 transition-colors"
            >
              <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                {{ biz.initial }}
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800">{{ biz.name }}</p>
                <p class="text-xs text-gray-500">{{ biz.role }}</p>
              </div>
            </button>
          </li>
        </ul>

        <div class="border-t border-gray-100 my-1"></div>

        <div class="p-1">
          <button 
            @click="navigateTo('/business')" 
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#004D40] rounded-lg flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Business Settings
          </button>
          
          <button 
            @click="navigateTo('/your-business')" 
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#004D40] rounded-lg flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            View All Businesses
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>