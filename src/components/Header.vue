<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOpen = ref(false)
const dropdownRef = ref(null)
const isDark = ref(false)

// --- THEME TOGGLE LOGIC ---
const toggleDarkMode = () => {
  isDark.value = !isDark.value
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Check local storage or system preference on load
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// --- MOCK DATA ---
const currentBusiness = ref({
  id: 1,
  name: 'MicroOps Enterprises',
  role: 'Owner',
  initial: 'M'
})

const otherBusinesses = ref([
  { id: 2, name: 'Java Coffee Co.', role: 'Staff', initial: 'J' },
  { id: 3, name: 'TechFlow Solutions', role: 'Consultant', initial: 'T' }
])

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const switchBusiness = (biz) => {
  console.log('Switching to', biz.name)
  isOpen.value = false
}

const navigateTo = (path) => {
  isOpen.value = false
  router.push(path)
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}
</script>

<template>
  <div ref="dropdownRef" class="fixed top-6 right-6 z-50">

    <div class="flex gap-4 items-center">
      
      <button @click="toggleDarkMode"
        class="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg border border-teal-50 dark:border-gray-700 hover:border-[#4DB6AC] dark:hover:border-teal-500 hover:shadow-xl transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-[#004D40] dark:hover:text-teal-400">
        <svg v-if="!isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <button @click.stop="toggleDropdown"
        class="group flex items-center gap-3 bg-white dark:bg-gray-800 pl-2 pr-4 py-2 rounded-full shadow-lg border border-teal-50 dark:border-gray-700 hover:border-[#4DB6AC] dark:hover:border-teal-500 hover:shadow-xl transition-all duration-300">
        
        <div class="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 text-[#004D40] dark:text-teal-400 flex items-center justify-center font-bold text-sm">
          {{ currentBusiness.initial }}
        </div>

        <div class="flex flex-col items-start text-sm">
          <span class="font-bold text-gray-800 dark:text-white group-hover:text-[#004D40] dark:group-hover:text-teal-400 transition-colors">
            {{ currentBusiness.name }}
          </span>
          <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
            {{ currentBusiness.role }}
          </span>
        </div>

        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#004D40] dark:group-hover:text-teal-400 transition-transform duration-300"
          :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>

    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
      
      <div v-if="isOpen"
        class="absolute right-4 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Switch Business</p>
        </div>

        <ul class="py-1">
          <li v-for="biz in otherBusinesses" :key="biz.id">
            <button @click="switchBusiness(biz)"
              class="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors">
              <div
                class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-xs">
                {{ biz.initial }}
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white">{{ biz.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ biz.role }}</p>
              </div>
            </button>
          </li>
        </ul>

        <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>

        <div class="p-1">
          <button @click="navigateTo('/business')"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#004D40] dark:hover:text-teal-400 rounded-lg flex items-center gap-2 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Business Settings
          </button>

          <button @click="navigateTo('/your-business')"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#004D40] dark:hover:text-teal-400 rounded-lg flex items-center gap-2 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            View All Businesses
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>