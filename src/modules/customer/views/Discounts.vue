<script setup>
import { ref, computed } from 'vue'
import { useDiscountsStore } from '../stores/discounts'
import { useProductsStore } from '../../products/stores/products'
import { useCustomersStore } from '../stores/customers'
import { useToastStore } from '../../../shared/stores/toast'
import { useCurrency } from '../../../shared/composables/useCurrency'

const discountsStore = useDiscountsStore()
const productsStore = useProductsStore()
const customersStore = useCustomersStore()
const toastStore = useToastStore()
const { fmt: fmtMoney, symbol: currencySymbol } = useCurrency()

const isModalOpen = ref(false)
const editingId = ref(null)
const form = ref({ name: '', type: 'percentage', value: '', expiresAt: '', productId: '', customerId: '' })
const submitting = ref(false)

const selectedProduct = computed(() =>
  form.value.productId ? productsStore.items.find(p => p.id === form.value.productId) || null : null
)
const selectedCustomer = computed(() =>
  form.value.customerId ? customersStore.items.find(c => c.id === form.value.customerId) || null : null
)

const openAdd = () => {
  editingId.value = null
  form.value = { name: '', type: 'percentage', value: '', expiresAt: '', productId: '', customerId: '' }
  isModalOpen.value = true
}

const openEdit = (d) => {
  editingId.value = d.id
  form.value = {
    name: d.name || '', type: d.type || 'percentage', value: d.value ?? '',
    expiresAt: d.expiresAt || '', productId: d.productId || '', customerId: d.customerId || ''
  }
  isModalOpen.value = true
}

const save = async () => {
  if (!form.value.name.trim() || form.value.value === '') return
  submitting.value = true
  const tid = toastStore.loading(editingId.value ? 'Updating discount...' : 'Creating discount...')
  try {
    const linkedProduct = form.value.productId ? productsStore.items.find(p => p.id === form.value.productId) : null
    const linkedCustomer = form.value.customerId ? customersStore.items.find(c => c.id === form.value.customerId) : null
    const data = {
      name: form.value.name.trim(),
      type: form.value.type,
      value: parseFloat(form.value.value),
      expiresAt: form.value.expiresAt || null,
      productId: form.value.productId || null,
      productName: linkedProduct?.name || null,
      customerId: form.value.customerId || null,
      customerName: linkedCustomer?.full_name || linkedCustomer?.name || null,
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

const onProductSelected = () => { if (form.value.productId) form.value.customerId = '' }
const onCustomerSelected = () => { if (form.value.customerId) form.value.productId = '' }

const isExpired = (d) => d.expiresAt && new Date(d.expiresAt).getTime() < Date.now()

const fmtValue = (d) => d.type === 'percentage' ? `${d.value}%` : `${currencySymbol.value}${parseFloat(d.value).toFixed(2)}`

const fmtExpiry = (expiresAt) => {
  if (!expiresAt) return 'No expiry'
  return new Date(expiresAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <section class="space-y-12">
    <div>
      <header class="mb-6">
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white">Discounts</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 mb-4">
          Create order-wide discounts (for registered customers) or product-specific discounts that auto-apply at checkout.
        </p>
        <button @click="openAdd"
          class="bg-[#004D40] dark:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg shadow hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Discount
        </button>
      </header>

      <div class="mb-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ discountsStore.discounts.length }} discount{{ discountsStore.discounts.length === 1 ? '' : 's' }} total.</p>
      </div>

      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm overflow-x-auto border border-gray-100 dark:border-gray-700 transition-colors">
        <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Applies To</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Type</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Value</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Expiry</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
            <th class="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
          <tr v-if="discountsStore.discounts.length === 0">
            <td colspan="7" class="p-12 text-center text-gray-400 dark:text-gray-500">
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
              <div class="flex flex-col gap-1">
                <span v-if="d.productId"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 w-fit">
                  <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>
                  {{ d.productName || 'Product' }}
                </span>
                <span v-if="d.customerId"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 w-fit">
                  <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {{ d.customerName || 'Customer' }}
                </span>
                <span v-if="!d.productId && !d.customerId" class="text-xs text-gray-400 dark:text-gray-500 italic">All customers</span>
              </div>
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
              <button @click.stop="openEdit(d)"
                class="text-[#004D40] dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <!-- ADD / EDIT MODAL -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div @click="isModalOpen = false" class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50 dark:bg-teal-900/20 flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold text-[#004D40] dark:text-teal-300">{{ editingId ? 'Edit Discount' : 'New Discount' }}</h3>
              <p class="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Product discounts apply automatically. Order discounts require a registered customer.</p>
            </div>
            <button @click="isModalOpen = false" class="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">&times;</button>
          </div>

          <!-- Body: two-column row -->
          <div class="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">

            <!-- Left column: name, type, value, expiry -->
            <div class="flex-1 p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Discount Name</label>
                <input v-model="form.name" type="text" placeholder="e.g. Member 10%, Loyalty Deal"
                  class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white text-sm" />
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Discount Type</label>
                <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button @click="form.type = 'percentage'"
                    :class="form.type === 'percentage' ? 'bg-[#004D40] dark:bg-teal-700 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
                    class="flex-1 py-2.5 text-sm font-bold transition-colors">% Percentage</button>
                  <button @click="form.type = 'fixed'"
                    :class="form.type === 'fixed' ? 'bg-[#004D40] dark:bg-teal-700 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'"
                    class="flex-1 py-2.5 text-sm font-bold transition-colors border-l border-gray-200 dark:border-gray-600">{{ currencySymbol }} Fixed</button>
                </div>
              </div>

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

              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Expiry Date (Optional)</label>
                <input v-model="form.expiresAt" type="date"
                  class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white text-sm" />
                <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Leave empty for no expiry.</p>
              </div>

              <div class="flex gap-3 pt-1">
                <button v-if="editingId" @click="handleDelete(editingId); isModalOpen = false"
                  class="py-2.5 px-4 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm">Delete</button>
                <button @click="isModalOpen = false" class="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">Cancel</button>
                <button @click="save" :disabled="submitting"
                  class="flex-1 py-2.5 rounded-lg bg-[#004D40] dark:bg-teal-700 text-white font-bold hover:bg-[#00695C] dark:hover:bg-teal-600 transition-colors text-sm disabled:opacity-50">
                  {{ submitting ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
                </button>
              </div>
            </div>

            <!-- Right column: scope (product or customer) -->
            <div class="sm:w-64 shrink-0 p-6 space-y-4 bg-gray-50 dark:bg-gray-800/50">
              <p class="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Scope — pick one (optional)</p>

              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Auto-apply for product</label>
                <select v-model="form.productId" @change="onProductSelected"
                  class="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-gray-800 dark:text-white text-xs appearance-none">
                  <option value="">— Any product —</option>
                  <option v-for="p in productsStore.items" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <p v-if="form.productId" class="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">
                  Auto-applies when <strong>{{ selectedProduct?.name }}</strong> is in the cart.
                </p>
              </div>

              <div class="flex items-center gap-2 text-[10px] text-gray-400">
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>OR<div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Exclusive to customer</label>
                <select v-model="form.customerId" @change="onCustomerSelected"
                  class="w-full p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white text-xs appearance-none">
                  <option value="">— Any customer —</option>
                  <option v-for="c in customersStore.items" :key="c.id" :value="c.id">{{ c.full_name || c.name }}</option>
                </select>
                <p v-if="form.customerId" class="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                  Only shown at checkout for <strong>{{ selectedCustomer?.full_name || selectedCustomer?.name }}</strong>.
                </p>
              </div>

              <div v-if="!form.productId && !form.customerId" class="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
                No scope set — this discount will appear for all registered customers at checkout.
              </div>
            </div>

          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
