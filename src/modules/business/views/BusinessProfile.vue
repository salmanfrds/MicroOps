<script setup>
import { ref, onMounted } from 'vue'
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { firebaseApp } from '../../../shared/lib/firebaseClient'

const auth = getAuth(firebaseApp)
const db = getFirestore(firebaseApp)

const business = ref({
  name: 'MicroOps Enterprises',
  address: 'UIA Gombak',
  phone: '+60 11-2345 6789',
  website: 'www.microops.com',
  city: 'Kuala Lumpur',
  zip: '50400',
  bankName: '',
  accountNumber: '',
  duitnowId: ''
})

const staff = ref([])
const roles = ['Owner', 'Manager', 'Cashier', 'Inventory Manager']

// Modal State
const isAddStaffModalOpen = ref(false)
const newStaff = ref({
  full_name: '',
  role: 'Cashier',
  pin: ''
})

const fetchStaff = async () => {
  if (!auth.currentUser) return
  
  try {
    const profilesRef = collection(db, `businesses/${auth.currentUser.uid}/profiles`)
    const snapshot = await getDocs(profilesRef)
    staff.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (err) {
    console.error("Error fetching staff:", err)
  }
}

onMounted(() => {
  fetchStaff()
})

const openAddStaffModal = () => {
  newStaff.value = { full_name: '', role: 'Cashier', pin: '' }
  isAddStaffModalOpen.value = true
}

const handleAddStaff = async () => {
  if (!newStaff.value.full_name || newStaff.value.pin.length !== 4) {
    alert("Please provide a name and a 4-digit PIN")
    return
  }

  try {
    // Generate a random ID for the staff member
    const profileId = `staff_${Date.now()}`
    const profileRef = doc(db, `businesses/${auth.currentUser.uid}/profiles`, profileId)
    
    await setDoc(profileRef, {
      full_name: newStaff.value.full_name,
      role: newStaff.value.role,
      pin: newStaff.value.pin,
      created_at: new Date().toISOString()
    })

    // Refresh list
    await fetchStaff()
    isAddStaffModalOpen.value = false
  } catch (err) {
    console.error("Error adding staff:", err)
    alert("Failed to add staff member")
  }
}

const deleteStaff = async (profileId) => {
  if (profileId === 'owner') {
    alert("Cannot delete the Owner account.")
    return
  }

  if (confirm("Are you sure you want to remove this profile?")) {
    try {
      await deleteDoc(doc(db, `businesses/${auth.currentUser.uid}/profiles`, profileId))
      await fetchStaff()
    } catch (err) {
      console.error("Error deleting staff:", err)
    }
  }
}

const handleFileUpload = (event) => {
  console.log('QR Uploaded:', event.target.files[0])
}
</script>

<template>
  <section class="max-w-6xl mx-auto pb-20">
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Business Settings</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your business identity, payments, and team.</p>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      
      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Company Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Company Name</label>
               <input 
                 v-model="business.name" 
                 type="text" 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none font-semibold text-lg text-[#004D40] dark:text-teal-400 transition-colors"
               >
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Address</label>
               <input 
                 v-model="business.address" 
                 type="text" 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none text-gray-800 dark:text-white transition-colors"
               >
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Phone</label>
               <input 
                 v-model="business.phone" 
                 type="text" 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none text-gray-800 dark:text-white transition-colors"
               >
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Payment Details (DuitNow)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Bank Name</label>
               <select 
                 v-model="business.bankName" 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none text-gray-800 dark:text-white"
               >
                  <option value="" class="dark:bg-gray-800">Select Bank</option>
                  <option value="Maybank" class="dark:bg-gray-800">Maybank</option>
                  <option value="CIMB" class="dark:bg-gray-800">CIMB Bank</option>
                  <option value="Bank Islam" class="dark:bg-gray-800">Bank Islam</option>
               </select>
            </div>
            <div>
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Account Number</label>
               <input 
                 v-model="business.accountNumber" 
                 type="text" 
                 placeholder="e.g. 1642..." 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none text-gray-800 dark:text-white placeholder-gray-400 transition-colors"
               >
            </div>
            <div class="md:col-span-2">
               <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">DuitNow ID (Mobile/NRIC/BRN)</label>
               <input 
                 v-model="business.duitnowId" 
                 type="text" 
                 class="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-[#4DB6AC] outline-none text-gray-800 dark:text-white transition-colors"
               >
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center transition-colors">
        <h4 class="font-bold text-gray-700 dark:text-white mb-4">DuitNow QR Code</h4>
        <div class="w-48 h-48 bg-gray-50 dark:bg-gray-700/30 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center relative group cursor-pointer hover:border-[#4DB6AC] dark:hover:border-teal-400 transition-all">
          <input type="file" @change="handleFileUpload" class="absolute inset-0 opacity-0 cursor-pointer">
          <svg class="w-12 h-12 text-gray-300 dark:text-gray-500 group-hover:text-[#4DB6AC] dark:group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/></svg>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Upload QR Image</p>
        </div>
        <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-4 leading-relaxed px-4">This QR will be displayed on your digital invoices for customers to scan and pay.</p>
      </div>
    </div>

    <!-- STAFF MANAGEMENT SECTION -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Staff Management (Profiles)</h3>
        <button 
          @click="openAddStaffModal"
          class="text-sm bg-[#4DB6AC] text-white px-4 py-2 rounded-lg hover:bg-[#26A69A] transition-colors"
        >
          + Add New Staff
        </button>
      </div>
      <table class="w-full text-left">
        <thead class="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-bold">
          <tr>
            <th class="px-6 py-4">Name</th>
            <th class="px-6 py-4">Role</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr v-if="staff.length === 0">
            <td colspan="4" class="px-6 py-8 text-center text-gray-500">Loading profiles...</td>
          </tr>
          <tr v-for="user in staff" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
            <td class="px-6 py-4">
              <div class="font-semibold text-gray-800 dark:text-white flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 text-xs font-bold">
                  {{ user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U' }}
                </div>
                {{ user.full_name }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ user.role }}</span>
            </td>
            <td class="px-6 py-4">
              <span 
                class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold uppercase"
              >
                Active
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <button 
                v-if="user.id !== 'owner'"
                @click="deleteStaff(user.id)"
                class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 mr-2 transition-colors tooltip"
                title="Remove Profile"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Staff Modal -->
    <Teleport to="body">
      <div v-if="isAddStaffModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <div class="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-fade-in-up">
          <div class="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">Create Staff Profile</h3>
            <button @click="isAddStaffModalOpen = false" class="text-gray-400 hover:text-gray-800">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Name</label>
              <input v-model="newStaff.full_name" type="text" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-[#4DB6AC] outline-none" placeholder="e.g. Alice">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <select v-model="newStaff.role" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-[#4DB6AC] outline-none">
                <option v-for="role in roles" :key="role" :value="role">{{ role }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Login PIN (4 Digits)</label>
              <input v-model="newStaff.pin" type="text" inputmode="numeric" maxlength="4" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-[#4DB6AC] outline-none tracking-widest text-center text-xl font-bold" placeholder="1234">
            </div>
            <button @click="handleAddStaff" class="w-full mt-4 bg-[#4DB6AC] text-white font-bold py-2 rounded-lg hover:bg-[#26A69A]">Add Staff Profile</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="mt-8 flex justify-end">
      <button class="bg-[#004D40] dark:bg-teal-700 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-xl hover:bg-[#003d33] dark:hover:bg-teal-600 transition-all active:scale-95">
        Save Details
      </button>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.2s ease-out forwards;
}
</style>