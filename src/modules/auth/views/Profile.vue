<script setup>
import { ref, watch, onMounted } from 'vue' // 1. Import onMounted
import { useAuthStore } from '../stores/auth'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { firebaseApp } from '../../../shared/lib/firebaseClient'
import { useAuth } from '../composables/useAuth' // 2. Import your composable

const authStore = useAuthStore()
const { checkSession } = useAuth() // 3. Get the check function

const loading = ref(false)
const message = ref('')

// Local form state
const profileForm = ref({
  full_name: '',
  role: 'User'
})

const pinForm = ref({
  current: '',
  new: '',
  confirm: ''
})

const pinLoading = ref(false)
const pinMessage = ref('')
const pinError = ref('')

// 4. THE FIX: Force a session check when this page loads
onMounted(async () => {
  if (!authStore.user) {
    console.log("Profile: User is missing, fetching session...")
    await checkSession() // This refills Pinia
  }
})

// Sync Pinia to Form (This runs automatically when checkSession finishes)
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    console.log("Profile: Data loaded!", newUser) // Debug log
    profileForm.value = {
      full_name: newUser.full_name || '',
      role: newUser.role || 'User'
    }
  }
}, { immediate: true, deep: true })

const updateProfile = async () => {
  loading.value = true
  message.value = ''
  
  try {
    const db = getFirestore(firebaseApp)
    // Map to subcollection instead of global profiles
    const docRef = doc(db, `businesses/${authStore.user.businessId}/profiles`, authStore.user.profileId)
    await updateDoc(docRef, {
      full_name: profileForm.value.full_name,
      role: profileForm.value.role,
    })

    authStore.setUser({ ...authStore.user, ...profileForm.value })
    message.value = 'Profile updated successfully!'
    
  } catch (error) {
    console.error(error)
    message.value = 'Error updating profile.'
  } finally {
    loading.value = false
  }
}

const changePin = async () => {
  pinError.value = ''
  pinMessage.value = ''

  if (!pinForm.value.current || !pinForm.value.new || !pinForm.value.confirm) {
    pinError.value = 'Please fill out all PIN fields.'
    return
  }

  if (pinForm.value.new !== pinForm.value.confirm) {
    pinError.value = 'New PINs do not match.'
    return
  }

  if (pinForm.value.new.length !== 4) {
    pinError.value = 'New PIN must be exactly 4 digits.'
    return
  }

  pinLoading.value = true
  try {
    const db = getFirestore(firebaseApp)
    const docRef = doc(db, `businesses/${authStore.user.businessId}/profiles`, authStore.user.profileId)
    
    // Fetch current to validate
    const { getDoc } = await import('firebase/firestore')
    const snap = await getDoc(docRef)

    if (snap.exists()) {
      const data = snap.data()
      if (data.pin !== pinForm.value.current) {
         pinError.value = 'Current PIN is incorrect.'
         return
      }

      // Update PIN
      await updateDoc(docRef, { pin: pinForm.value.new })
      pinMessage.value = 'PIN updated successfully!'
      pinForm.value = { current: '', new: '', confirm: ''} // reset
    } else {
      pinError.value = 'Failed to locate profile.'
    }

  } catch (error) {
    console.error(error)
    pinError.value = 'Error securely updating PIN.'
  } finally {
    pinLoading.value = false
  }
}
</script>

<template>
  <section v-if="authStore.user"> <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white">User Profile</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your personal information and security settings.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit border border-gray-100 dark:border-gray-700 transition-colors">
        <div class="flex flex-col items-center">
          <div class="w-32 h-32 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-[#004D40] dark:text-teal-400 text-4xl font-bold mb-4">
            {{ profileForm.full_name ? profileForm.full_name.charAt(0).toUpperCase() : 'U' }}
          </div>
          
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">
            {{ profileForm.full_name || 'Loading...' }}
          </h3>
          
          <span class="px-3 py-1 mt-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/40 rounded-full">
            {{ profileForm.role }}
          </span>
          
          <button class="mt-6 w-full text-[#004D40] dark:text-teal-400 border border-[#004D40] dark:border-teal-400 font-bold py-2 px-4 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
            Change Avatar
          </button>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Personal Details</h3>
          
          <form @submit.prevent="updateProfile" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input v-model="profileForm.full_name" type="text" class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none text-gray-800 dark:text-white transition-colors">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role / Designation</label>
              <select 
                v-model="profileForm.role" 
                :disabled="authStore.user?.role !== 'Owner'"
                class="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none text-gray-800 dark:text-white transition-colors appearance-none disabled:bg-gray-100 disabled:dark:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                :class="{'cursor-pointer': authStore.user?.role === 'Owner'}"
              >
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Staff">Staff</option>
              </select>
            </div>
          </form>

          <div class="mt-6 flex justify-between items-center">
            <span v-if="message" class="text-sm text-green-600 font-medium">{{ message }}</span>
            <button @click="updateProfile" :disabled="loading" class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors disabled:opacity-50">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Change Profile PIN</h3>
          
          <div v-if="pinError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-200 dark:border-red-800/30">
             {{ pinError }}
          </div>
          <div v-if="pinMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded border border-green-200 dark:border-green-800/30">
             {{ pinMessage }}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current PIN</label>
              <input v-model="pinForm.current" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" class="w-full max-w-[200px] text-center tracking-[1em] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none text-gray-800 dark:text-white transition-colors font-bold text-xl">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New 4-Digit PIN</label>
              <input v-model="pinForm.new" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" class="w-full max-w-[200px] text-center tracking-[1em] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none text-gray-800 dark:text-white transition-colors font-bold text-xl">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New PIN</label>
              <input v-model="pinForm.confirm" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" class="w-full max-w-[200px] text-center tracking-[1em] p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none text-gray-800 dark:text-white transition-colors font-bold text-xl">
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button @click="changePin" :disabled="pinLoading" class="bg-gray-800 dark:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors disabled:opacity-50">
              {{ pinLoading ? 'Verifying...' : 'Update PIN' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </section>
  <div v-else class="text-center p-10 text-gray-500">
    Loading profile...
  </div>
</template>