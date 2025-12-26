<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleSignup = () => {
  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match!")
    return
  }
  
  // Add registration logic here (e.g., Firebase create user)
  console.log('Registering:', fullName.value, email.value)
  
  // Redirect to dashboard or onboarding
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F7F4] dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
    
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 border border-transparent dark:border-gray-700">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-[#004D40] dark:text-teal-400 mb-2">MicroOps</h1>
        <p class="text-gray-500 dark:text-gray-400">Create your account to get started</p>
      </div>

      <form @submit.prevent="handleSignup" class="space-y-5">
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <input 
            v-model="fullName" 
            type="text" 
            placeholder="John Doe"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
          >
        </div>

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
            placeholder="Create a password"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
          <input 
            v-model="confirmPassword" 
            type="password" 
            placeholder="Confirm your password"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
          >
        </div>

        <button 
          type="submit" 
          class="w-full bg-[#004D40] dark:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-[#003d33] dark:hover:bg-teal-500 transition-all transform hover:scale-[1.01] mt-2"
        >
          Create Account
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account? 
        <router-link to="/login" class="font-bold text-[#4DB6AC] dark:text-teal-400 hover:text-[#26A69A] dark:hover:text-teal-300 transition-colors">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>