<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

// 1. Get the auth functions and state
const { signup, loading, error } = useAuth()

// 2. Local Form Data
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// 3. Handle Form Submission
const handleSignup = async () => {
  // Clear previous errors first
  error.value = null

  // Check if passwords match locally before calling server
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match."
    return
  }

  if (password.value.length < 6) {
    error.value = "Password must be at least 6 characters."
    return
  }

  // Call the signup action from useAuth
  await signup(email.value, password.value, fullName.value)
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F7F4] dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
    
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 border border-transparent dark:border-gray-700">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-[#004D40] dark:text-teal-400 mb-2">MicroOps</h1>
        <p class="text-gray-500 dark:text-gray-400">Create your account to get started</p>
      </div>

      <div v-if="error" class="mb-5 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <span>{{ error }}</span>
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
            :disabled="loading"
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
            :disabled="loading"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="Min 6 characters"
            class="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            required
            :disabled="loading"
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
            :disabled="loading"
          >
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-[#004D40] dark:bg-teal-600 text-white font-bold py-3 px-4 rounded-lg shadow 
                 hover:bg-[#003d33] dark:hover:bg-teal-500 
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                 transition-all transform hover:scale-[1.01] mt-2 flex justify-center items-center"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </span>
          <span v-else>Create Account</span>
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