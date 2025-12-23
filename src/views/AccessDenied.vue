<script setup>
// No logic needed for this mockup page
</script>

<template>
  <div class="w-full min-h-[90vh] bg-white/95 backdrop-blur-xl border-2 border-dashed border-red-100 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-sm">
    <div class="mb-6 p-4 bg-red-50 rounded-full">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>

    <h3 class="text-2xl font-bold text-gray-800 mb-3">Access Denied</h3>
    <p class="text-gray-600 max-w-md text-lg leading-relaxed">
      You don't have access to this module. <br> Please ask for owner permission.
    </p>
    
    <div class="mt-8 text-xs text-gray-400">
        Error Code: 403_FORBIDDEN
    </div>
  </div>
</template>