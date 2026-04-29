<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { firebaseApp } from '../../../shared/lib/firebaseClient'
import { useAuth } from '../composables/useAuth'
import { useToastStore } from '../../../shared/stores/toast'

const authStore = useAuthStore()
const { checkSession } = useAuth()
const toastStore = useToastStore()

const loading = ref(false)

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
  const tid = toastStore.loading('Saving profile...')
  let success = false
  try {
    const db = getFirestore(firebaseApp)
    const docRef = doc(db, `businesses/${authStore.user.businessId}/profiles`, authStore.user.profileId)
    await updateDoc(docRef, {
      full_name: profileForm.value.full_name,
      role: profileForm.value.role,
    })
    authStore.setUser({ ...authStore.user, ...profileForm.value })
    success = true
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
    if (success) {
      toastStore.replace(tid, 'success', 'Profile updated successfully')
    } else {
      toastStore.replace(tid, 'error', 'Failed to update profile. Please try again.')
    }
  }
}

const changePin = async () => {
  if (!pinForm.value.current || !pinForm.value.new || !pinForm.value.confirm) {
    toastStore.error('Please fill out all PIN fields.')
    return
  }
  if (pinForm.value.new !== pinForm.value.confirm) {
    toastStore.error('New PINs do not match.')
    return
  }
  if (pinForm.value.new.length !== 4) {
    toastStore.error('New PIN must be exactly 4 digits.')
    return
  }

  pinLoading.value = true
  const tid = toastStore.loading('Updating PIN...')
  let resultType = null
  let resultMessage = ''
  try {
    const db = getFirestore(firebaseApp)
    const docRef = doc(db, `businesses/${authStore.user.businessId}/profiles`, authStore.user.profileId)
    const { getDoc } = await import('firebase/firestore')
    const snap = await getDoc(docRef)

    if (snap.exists()) {
      if (snap.data().pin !== pinForm.value.current) {
        resultType = 'error'
        resultMessage = 'Current PIN is incorrect.'
      } else {
        await updateDoc(docRef, { pin: pinForm.value.new })
        pinForm.value = { current: '', new: '', confirm: '' }
        resultType = 'success'
        resultMessage = 'PIN updated successfully'
      }
    } else {
      resultType = 'error'
      resultMessage = 'Failed to locate profile.'
    }
  } catch (error) {
    console.error(error)
    resultType = 'error'
    resultMessage = 'Failed to update PIN. Please try again.'
  } finally {
    pinLoading.value = false
    toastStore.replace(tid, resultType || 'error', resultMessage || 'Unknown error')
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

          <div class="mt-6 flex justify-end">
            <button @click="updateProfile" :disabled="loading" class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors disabled:opacity-50">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Change Profile PIN</h3>
          
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