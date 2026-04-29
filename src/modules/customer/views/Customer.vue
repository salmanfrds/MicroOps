<script setup>
import { ref, computed } from 'vue'
import { useCustomersStore } from '../stores/customers'
import { useToastStore } from '../../../shared/stores/toast'

const customersStore = useCustomersStore()
const toastStore = useToastStore()

// Enhanced list with colors
const customers = computed(() => {
    return customersStore.items.map(item => {
        // Status mapping (simplifed to active vs new based on data presence, or default active)
        const status = item.ordersCount > 0 ? 'Active' : 'New'
        
        // Dynamic colors based on first letter or random mapping
        const colorPool = [
            'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
        ]
        const colorIndex = item.name ? item.name.charCodeAt(0) % colorPool.length : 0
        
        // Joined date format
        let joinedDate = 'Unknown'
        if (item.createdAt?.seconds) {
            joinedDate = new Date(item.createdAt.toDate()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        }

        return {
            ...item,
            id: item.id,
            status,
            joinedDate,
            color: colorPool[colorIndex],
            initials: item.name ? item.name.split(' ').map((n) => n[0]).join('').substring(0,2).toUpperCase() : 'CU'
        }
    })
})

const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const editId = ref(null)

const addForm = ref({ name: '', email: '', phone: '' })
const editForm = ref({ name: '', email: '', phone: '' })

const openAddModal = () => {
    addForm.value = { name: '', email: '', phone: '' }
    isAddModalOpen.value = true
}

const openEditModal = (customer) => {
    editId.value = customer.id
    editForm.value = { 
        name: customer.name || '', 
        email: customer.email || '', 
        phone: customer.phone || '' 
    }
    isEditModalOpen.value = true
}

const closeAddModal = () => isAddModalOpen.value = false
const closeEditModal = () => {
    isEditModalOpen.value = false
    editId.value = null
}

const handleAddCustomer = async () => {
    if (!addForm.value.name || !addForm.value.email) return
    const tid = toastStore.loading('Adding customer...')
    let success = false
    try {
        await customersStore.addCustomer(addForm.value)
        success = true
    } catch (err) {
        console.error('Add customer error:', err)
    } finally {
        if (success) {
            toastStore.replace(tid, 'success', 'Customer added successfully')
            closeAddModal()
        } else {
            toastStore.replace(tid, 'error', 'Failed to add customer. Please try again.')
        }
    }
}

const handleUpdateCustomer = async () => {
    if (!editId.value || !editForm.value.name || !editForm.value.email) return
    const tid = toastStore.loading('Saving changes...')
    let success = false
    try {
        await customersStore.updateCustomer(editId.value, editForm.value)
        success = true
    } catch (err) {
        console.error('Update customer error:', err)
    } finally {
        if (success) {
            toastStore.replace(tid, 'success', 'Customer updated successfully')
            closeEditModal()
        } else {
            toastStore.replace(tid, 'error', 'Failed to update customer. Please try again.')
        }
    }
}

const handleDeleteCustomer = async () => {
    if (!editId.value) return
    if (confirm('Are you sure you want to delete this profile?')) {
        const tid = toastStore.loading('Deleting customer...')
        let success = false
        try {
            await customersStore.deleteCustomer(editId.value)
            success = true
        } catch (err) {
            console.error('Delete customer error:', err)
        } finally {
            if (success) {
                toastStore.replace(tid, 'success', 'Customer deleted')
                closeEditModal()
            } else {
                toastStore.replace(tid, 'error', 'Failed to delete customer. Please try again.')
            }
        }
    }
}
</script>

<template>
  <section>
    <header class="mb-6">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Customer Management</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">Maintain your customer database and interaction history.</p>
      </div>
      
      <div>
        <button
          @click="openAddModal"
          class="bg-[#4DB6AC] text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#26A69A] transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Customer
        </button>
      </div>
    </header>

    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Customer Profile</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contact</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Joined</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          <tr 
            v-for="customer in customers" 
            :key="customer.id" 
            @click="openEditModal(customer)"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
          >
            
            <td class="p-4">
              <div class="flex items-center gap-3">
                <div :class="[customer.color, 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm']">
                  {{ customer.initials }}
                </div>
                <div>
                  <div class="font-bold text-gray-800 dark:text-white text-sm">{{ customer.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ customer.email }}</div>
                </div>
              </div>
            </td>

            <td class="p-4">
               <span 
                 :class="{
                   'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': customer.status === 'Active',
                   'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': customer.status === 'New'
                 }"
                 class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent"
               >
                 {{ customer.status }}
               </span>
            </td>

            <td class="p-4">
              <div class="flex flex-col">
                <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">{{ customer.phone || 'N/A' }}</span>
              </div>
            </td>

            <td class="p-4">
                <div class="text-sm font-medium text-gray-800 dark:text-gray-300">{{ customer.joinedDate }}</div>
            </td>

            <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <a v-if="customer.email" :href="`mailto:${customer.email}`" @click.stop class="p-2 text-gray-400 hover:text-[#4DB6AC] dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors" title="Send Email">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </a>
                    <a v-if="customer.phone" :href="`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`" target="_blank" @click.stop class="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" title="Message WhatsApp">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    </a>
                    <button @click.stop="openEditModal(customer)" class="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Customer">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                </div>
            </td>

          </tr>
           <tr v-if="customers.length === 0">
                <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No customers added yet.
                </td>
            </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeAddModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <div>
                   <h3 class="text-xl font-bold text-gray-800 dark:text-white">Add Customer</h3>
                   <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Create a new profile for tracking.</p>
                </div>
                <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <input v-model="addForm.name" type="text" placeholder="e.g. Sarah Connor" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <input v-model="addForm.email" type="email" placeholder="sarah@example.com" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone Number (Optional)</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input v-model="addForm.phone" type="tel" placeholder="+60 12-345 6789" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button 
                        @click="closeAddModal" 
                        class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="handleAddCustomer" 
                        class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] hover:shadow-xl transform active:scale-95 transition-all"
                    >
                        Add Profile
                    </button>
                </div>
            </div>
        </div>
      </div>

       <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeEditModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-fade-in-up transition-colors">
            
            <div class="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <div>
                   <h3 class="text-xl font-bold text-gray-800 dark:text-white">Edit Customer</h3>
                   <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Modify tracked information.</p>
                </div>
                <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold leading-none">&times;</button>
            </div>

            <div class="p-6 space-y-4">
                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Full Name</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <input v-model="editForm.name" type="text" placeholder="e.g. Sarah Connor" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <input v-model="editForm.email" type="email" placeholder="sarah@example.com" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone Number (Optional)</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <input v-model="editForm.phone" type="tel" placeholder="+60 12-345 6789" class="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-[#4DB6AC] focus:border-transparent outline-none transition-all text-gray-800 dark:text-white">
                    </div>
                </div>

                <div class="pt-4 flex gap-3">
                    <button 
                        @click="handleDeleteCustomer" 
                        class="py-3 px-4 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                        Delete
                    </button>
                    <button 
                        @click="closeEditModal" 
                        class="flex-1 py-3 px-4 rounded-lg text-gray-500 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        @click="handleUpdateCustomer" 
                        class="flex-1 py-3 px-4 rounded-lg bg-[#4DB6AC] text-white font-bold shadow-lg hover:bg-[#26A69A] hover:shadow-xl transform active:scale-95 transition-all"
                    >
                        Save Updates
                    </button>
                </div>
            </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>