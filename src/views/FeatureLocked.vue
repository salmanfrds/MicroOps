<script setup>
import { useRouter } from 'vue-router'

// Initialize router
const router = useRouter()

// Simple function to handle the redirect mock
const navigateToUnlock = () => {
  // In a real app, this might lead to a subscription page instead of customer
  console.log('Redirecting to unlock page...')
  router.push('/customer')
}
</script>

<template>
  <div 
    @click="navigateToUnlock"
    class="w-full min-h-[90vh] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-sm cursor-pointer group transition-all hover:bg-white hover:shadow-md"
  >
    <div class="mb-6 p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>

    <h3 class="text-2xl font-bold text-gray-800 mb-3">Feature Locked</h3>
    <p class="text-gray-600 max-w-md">
      Do you want to Start using this feature?
    </p>
    <span class="mt-6 text-[#4DB6AC] font-semibold text-sm uppercase tracking-wider group-hover:underline">
      Click to Unlock
    </span>
  </div>
</template>