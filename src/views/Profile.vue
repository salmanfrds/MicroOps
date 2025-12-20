<script setup>
import { ref } from 'vue'

const user = ref({
  name: 'Salman Firdaus',
  email: 'salman@example.com',
  role: 'Administrator',
  bio: 'Lead Developer managing the MicroOps system.'
})

const password = ref({
  current: '',
  new: '',
  confirm: ''
})
</script>

<template>
  <section>
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">User Profile</h2>
      <p class="mt-2 text-gray-600">Manage your personal information and security settings.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm h-fit">
        <div class="flex flex-col items-center">
          <div class="w-32 h-32 bg-teal-100 rounded-full flex items-center justify-center text-[#004D40] text-4xl font-bold mb-4">
            SF
          </div>
          <h3 class="text-xl font-bold text-gray-800">{{ user.name }}</h3>
          <span class="px-3 py-1 mt-2 text-xs font-semibold text-teal-800 bg-teal-100 rounded-full">
            {{ user.role }}
          </span>
          <p class="mt-4 text-center text-gray-600 text-sm">
            {{ user.bio }}
          </p>
          <button class="mt-6 w-full text-[#004D40] border border-[#004D40] font-bold py-2 px-4 rounded-lg hover:bg-teal-50 transition-colors">
            Change Avatar
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Details</h3>
          <form class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input v-model="user.name" type="text" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input v-model="user.email" type="email" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea v-model="user.bio" rows="3" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none"></textarea>
            </div>
          </form>
          <div class="mt-6 flex justify-end">
            <button class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors">
              Save Changes
            </button>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Security</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input v-model="password.current" type="password" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input v-model="password.new" type="password" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input v-model="password.confirm" type="password" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none">
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>