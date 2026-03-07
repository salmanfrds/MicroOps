<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Logo from '../../assets/microopslogo.png'
import { useAuth } from '../../modules/auth/composables/useAuth'
import { useAuthStore } from '../../modules/auth/stores/auth'

const props = defineProps({
  isExpanded: Boolean
})

const emit = defineEmits(['toggle'])
const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const authStore = useAuthStore()

// 1. Main Navigation Data
const allNavItems = [
  { name: 'Dashboard', path: '/', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', roles: ['Owner'] },
  { name: 'Sales & Orders', path: '/sales', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', roles: ['Owner', 'Cashier'] },
  { name: 'Finance', path: '/finance', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5h.01', roles: ['Owner'] },
  { name: 'Inventory', path: '/inventory', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4', roles: ['Owner', 'Inventory Manager'] },
  { name: 'Products', path: '/products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', roles: ['Owner', 'Inventory Manager'] },
  { name: 'Customers', path: '/customer', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.975', roles: ['Owner', 'Cashier'] },
]

const navItems = computed(() => {
  const userRole = authStore.user?.role
  if (!userRole) return []
  return allNavItems.filter(item => !item.roles || item.roles.includes(userRole))
})

const isActive = (path) => route.path === path

// 2. Logout Handler
const handleLogout = async () => {
  try {
    await logout()
  } catch (e) {
    console.error("Logout failed:", e)
  }
}
</script>

<template>
  <aside class="bg-white dark:bg-gray-800 shadow-md shrink-0 transition-all duration-300 ease-in-out flex flex-col h-screen"
    :class="[isExpanded ? 'w-64' : 'w-20']">
    
    <div class="flex p-4 mb-2 transition-all duration-300 ease-in-out"
      :class="isExpanded ? 'flex-row items-center justify-between' : 'flex-col items-center gap-4'">

      <div class="flex items-center gap-3 overflow-hidden">
        <img :src="Logo" class="w-10 h-10 rounded-full object-cover shrink-0" alt="MicroOps Logo">
        <h1 v-show="isExpanded" class="text-xl md:text-2xl font-bold text-[#004D40] dark:text-teal-400 whitespace-nowrap">
          MicroOps
        </h1>
      </div>

      <button @click="emit('toggle')"
        class="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    </div>

    <nav class="flex flex-col gap-1">
      <router-link v-for="item in navItems" :key="item.name" :to="item.path"
        class="flex items-center p-4 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors whitespace-nowrap overflow-hidden"
        :class="{ 'bg-teal-50 dark:bg-teal-900/30 border-r-4 border-[#004D40] dark:border-teal-400': isActive(item.path) }">
        <svg class="w-6 h-6 ml-2 stroke-current shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
        </svg>
        <span v-show="isExpanded" class="ml-4 font-medium">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="border-t border-gray-300 dark:border-gray-700 mt-auto">
      
      <router-link to="/profile"
        class="flex items-center p-4 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors whitespace-nowrap overflow-hidden"
        :class="{ 'bg-teal-50 dark:bg-teal-900/30 border-r-4 border-[#004D40]': isActive('/profile') }">
        <svg class="w-6 h-6 ml-2 stroke-current shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <span v-show="isExpanded" class="ml-4 font-medium">User Profile</span>
      </router-link>

      <button @click="handleLogout"
        class="w-full flex items-center p-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap overflow-hidden group">
        <svg class="w-6 h-6 ml-2 stroke-current shrink-0 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <span v-show="isExpanded" class="ml-4 font-medium">Logout</span>
      </button>
      
    </div>
  </aside>
</template>