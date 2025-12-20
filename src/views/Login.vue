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
  <div class="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-4">
    
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-[#004D40] mb-2">MicroOps</h1>
        <p class="text-gray-500">Sign in to manage your MicroOps</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input 
            v-model="email" 
            type="email" 
            placeholder="admin@bizflow.com"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all"
            required
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all"
            required
          >
          <div class="flex justify-end mt-1">
             <a href="#" class="text-sm text-[#004D40] hover:text-[#26A69A] font-medium">Forgot Password?</a>
          </div>
        </div>

        <button 
          type="submit" 
          class="w-full bg-[#004D40] text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-[#003d33] transition-all transform hover:scale-[1.01]"
        >
          Sign In
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-gray-500">
        Don't have an account? 
        <a href="#" class="font-bold text-[#4DB6AC] hover:text-[#26A69A]">Create one</a>
      </p>
    </div>
  </div>
</template>