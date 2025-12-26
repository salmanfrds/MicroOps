<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = () => {
  // Add auth logic here
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F7F4] dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
    
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 border border-transparent dark:border-gray-700">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-[#004D40] dark:text-teal-400 mb-2">MicroOps</h1>
        <p class="text-gray-500 dark:text-gray-400">Sign in to manage your MicroOps</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="admin@bizflow.com"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
          >
          <div class="flex justify-end mt-1">
             <a href="#" class="text-sm text-[#004D40] dark:text-teal-400 hover:text-[#26A69A] dark:hover:text-teal-300 font-medium transition-colors">Forgot Password?</a>
          </div>
        </div>

        <button 
          type="submit" 
          class="w-full bg-[#004D40] dark:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-[#003d33] dark:hover:bg-teal-500 transition-all transform hover:scale-[1.01]"
        >
          Sign In
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Don't have an account? 
        <router-link to="/signup" class="font-bold text-[#4DB6AC] dark:text-teal-400 hover:text-[#26A69A] dark:hover:text-teal-300 transition-colors">Create one</router-link>
      </p>
    </div>
  </div>
</template>