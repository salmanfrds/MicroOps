<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseApp } from '../../../shared/lib/firebaseClient'
import { storage } from '../../../shared/lib/firebaseClient'
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

// ── Avatar state ────────────────────────────────────────
const avatarInput  = ref(null)
const avatarPreview = ref('')    // local blob URL for instant preview
const avatarFile   = ref(null)   // compressed File to upload

/** Compress image to JPEG ≤ 300 KB, max 400×400 */
const compressAvatar = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const max = 400
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width  = img.width  * scale
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })),
          'image/jpeg', 0.82
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

const onAvatarPick = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const compressed = await compressAvatar(file)
  avatarFile.value   = compressed
  avatarPreview.value = URL.createObjectURL(compressed)
}

// 4. THE FIX: Force a session check when this page loads
onMounted(async () => {
  if (!authStore.user) {
    console.log("Profile: User is missing, fetching session...")
    await checkSession()
  }
})

// Sync Pinia to Form
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profileForm.value = {
      full_name: newUser.full_name || '',
      role: newUser.role || 'User'
    }
    // Show existing avatar if present
    if (newUser.avatarUrl && !avatarPreview.value) {
      avatarPreview.value = newUser.avatarUrl
    }
  }
}, { immediate: true, deep: true })

const updateProfile = async () => {
  loading.value = true
  const tid = toastStore.loading('Saving profile...')
  let success = false
  try {
    const db    = getFirestore(firebaseApp)
    const bizId = authStore.user.businessId
    const profId = authStore.user.profileId
    const docRef = doc(db, `businesses/${bizId}/profiles`, profId)

    const updates = {
      full_name: profileForm.value.full_name,
      role:      profileForm.value.role,
    }

    // Upload avatar if a new file was chosen
    if (avatarFile.value) {
      const path    = `business/${bizId}/users/${profId}/avatar.jpg`
      const imgRef  = storageRef(storage, path)
      await uploadBytes(imgRef, avatarFile.value, { contentType: 'image/jpeg' })
      updates.avatarUrl = await getDownloadURL(imgRef)
      avatarFile.value  = null   // clear pending file
    }

    await updateDoc(docRef, updates)
    authStore.setUser({ ...authStore.user, ...profileForm.value, ...updates })
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
  <section v-if="authStore.user">
    <header class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800 dark:text-white">User Profile</h2>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your personal information and security settings.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- ── Avatar Card ─────────────────────────────────────── -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm h-fit border border-gray-100 dark:border-gray-700 transition-colors">
        <div class="flex flex-col items-center">

          <!-- Avatar circle -->
          <div class="relative group w-32 h-32 mb-4">
            <!-- Photo or initials -->
            <template v-if="avatarPreview">
              <img
                :src="avatarPreview"
                alt="Avatar"
                class="w-32 h-32 rounded-full object-cover ring-4 ring-teal-100 dark:ring-teal-900/40 shadow"
              />
            </template>
            <template v-else>
              <div class="w-32 h-32 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center text-[#004D40] dark:text-teal-400 text-4xl font-bold ring-4 ring-teal-100 dark:ring-teal-900/40">
                {{ profileForm.full_name ? profileForm.full_name.charAt(0).toUpperCase() : 'U' }}
              </div>
            </template>

            <!-- Hover overlay to trigger pick -->
            <button
              @click="avatarInput.click()"
              class="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              title="Change avatar"
            >
              <svg class="w-7 h-7 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
          </div>

          <!-- Pending badge -->
          <span
            v-if="avatarFile"
            class="mb-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
          >
            New photo — save to apply
          </span>

          <h3 class="text-xl font-bold text-gray-800 dark:text-white">
            {{ profileForm.full_name || 'Loading...' }}
          </h3>

          <span class="px-3 py-1 mt-2 text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/40 rounded-full">
            {{ profileForm.role }}
          </span>

          <!-- Hidden file input -->
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onAvatarPick"
          />

          <button
            @click="avatarInput.click()"
            class="mt-6 w-full text-[#004D40] dark:text-teal-400 border border-[#004D40] dark:border-teal-400 font-bold py-2 px-4 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Change Avatar
          </button>
        </div>
      </div>

      <!-- ── Right Panel ──────────────────────────────────────── -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Personal Details -->
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
            <button
              @click="updateProfile"
              :disabled="loading"
              class="bg-[#004D40] dark:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- Change PIN -->
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
            <button
              @click="changePin"
              :disabled="pinLoading"
              class="bg-gray-800 dark:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
            >
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