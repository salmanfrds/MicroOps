<script setup>
import { ref, computed, reactive } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useToastStore } from '../../../shared/stores/toast'

const financeStore = useFinanceStore()
const toastStore = useToastStore()

// --- CATEGORY LISTS ---
const incomeCategories = ['Service Income', 'Investment Returns', 'Rental Income', 'Refunds Received', 'Other Income']
const expenseCategories = ['Bills & Utilities', 'Rent / Mortgage', 'Salaries', 'Marketing', 'Equipment', 'Maintenance', 'Transport', 'Insurance', 'Other Expenses']

// --- MODAL STATE ---
const activeModal = ref(null)
const isSubmitting = ref(false)
const fileInput = ref(null)

const form = reactive({
  date: new Date().toISOString().split('T')[0],
  selectedCategory: '',
  customCategory: '',
  remarks: '',
  amount: '',
  receipt: null,
  receiptPreview: null
})

const openModal = (type) => {
  activeModal.value = type
  form.date = new Date().toISOString().split('T')[0]
  form.selectedCategory = ''
  form.customCategory = ''
  form.remarks = ''
  form.amount = ''
  form.receipt = null
  form.receiptPreview = null
}

const closeModal = () => { activeModal.value = null }

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.receipt = file
    form.receiptPreview = URL.createObjectURL(file)
  }
}

const saveRecord = async () => {
  const finalCategory = form.selectedCategory === 'NEW' ? form.customCategory.trim() : form.selectedCategory
  if (!finalCategory || !form.amount || isSubmitting.value) return
  isSubmitting.value = true
  const tid = toastStore.loading('Saving record...')
  let success = false
  try {
    await financeStore.addLedgerEntry({
      type: activeModal.value,
      category: finalCategory,
      remarks: form.remarks,
      amount: parseFloat(form.amount),
      date: form.date
    })
    success = true
  } catch (err) {
    console.error('Failed to save record:', err)
  } finally {
    isSubmitting.value = false
    if (success) {
      toastStore.replace(tid, 'success', 'Record saved successfully')
      closeModal()
    } else {
      toastStore.replace(tid, 'error', 'Failed to save record. Please try again.')
    }
  }
}

const deleteEntry = async (entry) => {
  if (entry.readonly) return
  const tid = toastStore.loading('Deleting entry...')
  let success = false
  try {
    await financeStore.deleteLedgerEntry(entry.id)
    success = true
  } catch (err) {
    console.error('Delete entry error:', err)
  } finally {
    if (success) {
      toastStore.replace(tid, 'success', 'Entry deleted')
    } else {
      toastStore.replace(tid, 'error', 'Failed to delete entry. Please try again.')
    }
  }
}

// --- HELPERS ---
const modalConfig = computed(() => {
  const isIncome = activeModal.value === 'income'
  return {
    title: isIncome ? 'Record Income' : 'Record Expense',
    label: isIncome ? 'Income Source' : 'Expense Category',
    themeColor: isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600',
    categories: isIncome ? incomeCategories : expenseCategories
  }
})

const formatMoney = (val) => 'RM ' + (val || 0).toFixed(2)

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

const originLabel = (origin) => {
  if (origin === 'sale') return 'Sale'
  if (origin === 'stock_in') return 'Stock IN'
  return null
}
</script>

<template>
  <section>
    <header class="mb-8">
      <div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Financial Overview</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Track your business cash flow — sales, stock, and manual entries.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors">
          <span class="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Net Balance</span>
          <span :class="financeStore.totalBalance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-600 dark:text-red-400'"
            class="text-3xl font-bold mt-2">
            {{ formatMoney(financeStore.totalBalance) }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">Income minus Expenses</span>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors">
          <span class="text-emerald-600 dark:text-emerald-400 text-sm font-medium uppercase tracking-wider">Total Income</span>
          <span class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">+{{ formatMoney(financeStore.totalIncome) }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ financeStore.allIncome.length }} entries</span>
        </div>

        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors">
          <span class="text-red-500 dark:text-red-400 text-sm font-medium uppercase tracking-wider">Total Expenses</span>
          <span class="text-3xl font-bold text-red-500 dark:text-red-400 mt-2">-{{ formatMoney(financeStore.totalExpenses) }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ financeStore.allExpenses.length }} entries</span>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

      <!-- INCOME TABLE -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-500"></div> Income
          </h3>
          <button @click="openModal('income')"
            class="text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-lg transition-colors">
            + Add New
          </button>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th class="p-4 font-medium">Date</th>
                <th class="p-4 font-medium">Category / Details</th>
                <th class="p-4 font-medium text-right">Amount</th>
                <th class="p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="financeStore.allIncome.length === 0">
                <td colspan="4" class="p-8 text-center text-gray-400 dark:text-gray-500">No income records yet.</td>
              </tr>
              <tr v-for="item in financeStore.allIncome" :key="item.id"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{{ formatDate(item.date) }}</td>
                <td class="p-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-gray-800 dark:text-gray-200">{{ item.category }}</span>
                    <span v-if="originLabel(item.origin)"
                      class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 tracking-wide">
                      {{ originLabel(item.origin) }}
                    </span>
                  </div>
                  <div v-if="item.remarks" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[180px]">
                    {{ item.remarks }}
                  </div>
                </td>
                <td class="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                  +{{ formatMoney(item.amount) }}
                </td>
                <td class="p-4 text-center">
                  <button v-if="!item.readonly" @click="deleteEntry(item)"
                    class="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
                    title="Delete entry">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EXPENSES TABLE -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-500"></div> Expenses
          </h3>
          <button @click="openModal('expense')"
            class="text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg transition-colors">
            + Add New
          </button>
        </div>

        <div class="overflow-x-auto flex-1">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th class="p-4 font-medium">Date</th>
                <th class="p-4 font-medium">Category / Details</th>
                <th class="p-4 font-medium text-right">Amount</th>
                <th class="p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="financeStore.allExpenses.length === 0">
                <td colspan="4" class="p-8 text-center text-gray-400 dark:text-gray-500">No expense records yet.</td>
              </tr>
              <tr v-for="item in financeStore.allExpenses" :key="item.id"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="p-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{{ formatDate(item.date) }}</td>
                <td class="p-4">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-gray-800 dark:text-gray-200">{{ item.category }}</span>
                    <span v-if="originLabel(item.origin)"
                      class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 tracking-wide">
                      {{ originLabel(item.origin) }}
                    </span>
                  </div>
                  <div v-if="item.remarks" class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[180px]">
                    {{ item.remarks }}
                  </div>
                </td>
                <td class="p-4 text-right text-red-500 dark:text-red-400 font-bold whitespace-nowrap">
                  -{{ formatMoney(item.amount) }}
                </td>
                <td class="p-4 text-center">
                  <button v-if="!item.readonly" @click="deleteEntry(item)"
                    class="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
                    title="Delete entry">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- MODAL -->
    <Teleport to="body">
      <div v-if="activeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div @click="closeModal" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"></div>

        <div class="relative bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">

          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">{{ modalConfig.title }}</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-5">
            <!-- Date -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Transaction Date</label>
              <input v-model="form.date" type="date"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 outline-none transition-all text-gray-700 dark:text-white" />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{{ modalConfig.label }}</label>
              <select v-model="form.selectedCategory"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 outline-none transition-all text-gray-700 dark:text-white">
                <option value="" disabled>Select a category</option>
                <option v-for="cat in modalConfig.categories" :key="cat" :value="cat">{{ cat }}</option>
                <option disabled>──────────</option>
                <option value="NEW">+ Add New Category</option>
              </select>

              <input v-if="form.selectedCategory === 'NEW'" v-model="form.customCategory" type="text"
                placeholder="Enter new category name..."
                class="mt-2 w-full p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none transition-all" />
            </div>

            <!-- Remarks -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Remarks / Details</label>
              <textarea v-model="form.remarks" rows="2" placeholder="e.g. March electricity bill, TNB account #12345"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 outline-none transition-all resize-none text-gray-700 dark:text-white"></textarea>
            </div>

            <!-- Amount -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Amount (RM)</label>
              <div class="relative">
                <span class="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500 font-bold">RM</span>
                <input v-model="form.amount" type="number" min="0" step="0.01" placeholder="0.00"
                  class="w-full pl-12 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 outline-none transition-all font-mono text-lg text-gray-700 dark:text-white" />
              </div>
            </div>

            <!-- Receipt upload (UI only — no storage yet) -->
            <div>
              <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Upload Receipt <span class="text-gray-300 dark:text-gray-600 normal-case font-normal">(optional)</span></label>
              <div class="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-500 transition-colors cursor-pointer group"
                @click="fileInput.click()">
                <input ref="fileInput" type="file" class="hidden" @change="handleFileUpload" accept="image/*,application/pdf" />

                <div v-if="!form.receiptPreview" class="flex flex-col items-center">
                  <svg class="w-8 h-8 text-gray-300 dark:text-gray-500 group-hover:text-gray-400 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Click to upload image or PDF</span>
                </div>

                <div v-else class="flex items-center gap-3 w-full">
                  <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    <img :src="form.receiptPreview" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-1 text-left">
                    <p class="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{{ form.receipt?.name }}</p>
                    <p class="text-[10px] text-gray-400">Preview only — storage coming soon</p>
                  </div>
                  <button @click.stop="form.receipt = null; form.receiptPreview = null" class="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="pt-2 flex gap-3">
              <button @click="closeModal"
                class="flex-1 py-3 px-4 rounded-lg text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button @click="saveRecord" :disabled="isSubmitting"
                :class="modalConfig.themeColor"
                class="flex-1 py-3 px-4 rounded-lg text-white font-bold shadow-md disabled:opacity-60 transition-all">
                {{ isSubmitting ? 'Saving...' : 'Save Record' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </Teleport>
  </section>
</template>
