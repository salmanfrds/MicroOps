<script setup>
import { ref } from 'vue'
import { useDiscountsStore } from '../stores/discounts'
import { useToastStore } from '../../../shared/stores/toast'
import { useCurrency } from '../../../shared/composables/useCurrency'

const discountsStore = useDiscountsStore()
const toastStore = useToastStore()
const { fmt: fmtMoney, symbol: currencySymbol } = useCurrency()

const isModalOpen = ref(false)
const editingId = ref(null)
const form = ref({ name: '', type: 'percentage', value: '', expiresAt: '' })
const submitting = ref(false)

const openAdd = () => {
  editingId.value = null
  form.value = { name: '', type: 'percentage', value: '', expiresAt: '' }
  isModalOpen.value = true
}

const openEdit = (d) => {
  editingId.value = d.id
  form.value = { name: d.name || '', type: d.type || 'percentage', value: d.value ?? '', expiresAt: d.expiresAt || '' }
  isModalOpen.value = true
}

const save = async () => {
  if (!form.value.name.trim() || form.value.value === '') return
  submitting.value = true
  const tid = toastStore.loading(editingId.value ? 'Updating discount...' : 'Creating discount...')
  try {
    const data = {
      name: form.value.name.trim(),
      type: form.value.type,
      value: parseFloat(form.value.value),
      expiresAt: form.value.expiresAt || null,
    }
    if (editingId.value) {
      await discountsStore.updateDiscount(editingId.value, data)
    } else {
      await discountsStore.addDiscount(data)
    }
    toastStore.replace(tid, 'success', editingId.value ? 'Discount updated' : 'Discount created')
    isModalOpen.value = false
  } catch {
    toastStore.replace(tid, 'error', 'Failed to save discount')
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  const tid = toastStore.loading('Deleting discount...')
  try {
    await discountsStore.deleteDiscount(id)
    toastStore.replace(tid, 'success', 'Discount deleted')
  } catch {
    toastStore.replace(tid, 'error', 'Failed to delete discount')
  }
}

const isExpired = (d) => d.expiresAt && new Date(d.expiresAt).getTime() < Date.now()

const fmtValue = (d) => d.type === 'percentage' ? `${d.value}%` : `${currencySymbol.value}${parseFloat(d.value).toFixed(2)}`

const fmtExpiry = (expiresAt) => {
  if (!expiresAt) return 'No expiry'
  return new Date(expiresAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <section>
    <header class="mb-6">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Discounts</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">
          Create and manage discount offers. Discounts can be applied at checkout for registered customers.
        </p>
      </div>
      <button @click="openAdd"
        class="bg-[#004D40] dark:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        New Discount
      </button>
    </header>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto transition-colors">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Value</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Expiry</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          <tr v-if="discountsStore.discounts.length === 0">
            <td colspan="6" class="p-12 text-center text-gray-400 dark:text-gray-500">
              <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              <p class="font-medium text-sm">No discounts yet</p>
              <p class="text-xs mt-1">Create a discount to apply at checkout for registered customers.</p>
            </td>
          </tr>
          <tr v-for="d in discountsStore.discounts" :key="d.id"
            @click="openEdit(d)"
            class="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
            <td class="p-4">
              <div class="font-semibold text-gray-800 dark:text-gray-200 text-sm">{{ d.name }}</div>
            </td>
            <td class="p-4">
              <span :class="d.type === 'percentage'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                {{ d.type === 'percentage' ? 'Percentage' : 'Fixed' }}
              </span>
            </td>
            <td class="p-4 font-bold text-gray-800 dark:text-gray-200 font-mono">{{ fmtValue(d) }}</td>
            <td class="p-4 text-sm text-gray-600 dark:text-gray-400">{{ fmtExpiry(d.expiresAt) }}</td>
            <td class="p-4">
              <span :class="isExpired(d)
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                {{ isExpired(d) ? 'Expired' : 'Active' }}
              </span>
            </td>
            <td class="p-4 text-right">
              <button @click.stop="handleDelete(d.id)"
                class="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ADD / EDIT MODAL -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div @click="isModalOpen = false" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold text-[#004D40] dark:text-teal-300">{{ editingId ? 'Edit Discount' : 'New Discount' }}</h3>
              <p class="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Applied at checkout for registered customers only.</p>
            </div>
            <button @click="isModalOpen = false" class="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
          </div>
          <div class="p-6 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Discount Name</label>
              <input v-model="form.name" type="text" placeholder="e.g. Member 10%, Loyalty Deal"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white text-sm" />
            </div>
            <!-- Type toggle -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Discount Type</label>
              <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <button @click="form.type = 'percentage'"
                  :class="form.type === 'percentage' ? 'bg-[#004D40] dark:bg-teal-700 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
                  class="flex-1 py-2.5 text-sm font-bold transition-colors">% Percentage</button>
                <button @click="form.type = 'fixed'"
                  :class="form.type === 'fixed' ? 'bg-[#004D40] dark:bg-teal-700 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
                  class="flex-1 py-2.5 text-sm font-bold transition-colors border-l border-gray-200 dark:border-gray-600">{{ currencySymbol }} Fixed Amount</button>
              </div>
            </div>
            <!-- Value -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                {{ form.type === 'percentage' ? 'Percentage (%)' : `Amount (${currencySymbol})` }}
              </label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-400 font-bold text-sm">{{ form.type === 'percentage' ? '%' : currencySymbol }}</span>
                <input v-model="form.value" type="number" min="0" :max="form.type === 'percentage' ? 100 : undefined" step="0.01" placeholder="0"
                  class="w-full pl-8 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none font-mono text-gray-800 dark:text-white text-sm" />
              </div>
            </div>
            <!-- Expiry -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Expiry Date (Optional)</label>
              <input v-model="form.expiresAt" type="date"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white text-sm" />
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Leave empty for no expiry.</p>
            </div>
            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button @click="isModalOpen = false" class="flex-1 py-3 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Cancel</button>
              <button @click="save" :disabled="submitting"
                class="flex-1 py-3 rounded-lg bg-[#004D40] dark:bg-teal-700 text-white font-bold hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors text-sm disabled:opacity-50">
                {{ submitting ? 'Saving...' : (editingId ? 'Update' : 'Create Discount') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
