<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebaseClient'
import { useAuthStore } from '../../modules/auth/stores/auth'
import Logo from '../../assets/microopslogo.png'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const TOTAL_STEPS = 2

const businessInfo = reactive({ name: '', address: '', phone: '', website: '' })
const selectedCurrency = ref('RM')

const CURRENCIES = [
  { id: 'RM',  label: 'RM — Malaysian Ringgit',   symbol: 'RM',  example: 'RM 10.00' },
  { id: 'IDR', label: 'Rp — Indonesian Rupiah',    symbol: 'Rp',  example: 'Rp 150.000' },
]

const BUSINESS_TYPES = [
  {
    id: 'retail',
    label: 'Retail / Shop',
    desc: 'Sell physical products from stock',
    productTypes: ['Stocked'],
  },
  {
    id: 'food',
    label: 'Food & Beverage',
    desc: 'Prepare and sell meals, drinks or baked goods',
    productTypes: ['Prepared'],
  },
  {
    id: 'service',
    label: 'Service Provider',
    desc: 'Offer professional services (cleaning, repair, consulting)',
    productTypes: ['Service'],
  },
  {
    id: 'rental',
    label: 'Rental Business',
    desc: 'Rent out items, equipment or assets',
    productTypes: ['Rental'],
  },
]

const selectedTypes = ref([])

const toggleType = (id) => {
  const idx = selectedTypes.value.indexOf(id)
  if (idx > -1) selectedTypes.value.splice(idx, 1)
  else selectedTypes.value.push(id)
}

const canProceed = computed(() => {
  if (step.value === 1) return !!businessInfo.name.trim()
  if (step.value === 2) return selectedTypes.value.length > 0
  return false
})

const saving = ref(false)

const goNext = () => { if (step.value < TOTAL_STEPS) step.value++ }

const completeOnboarding = async () => {
  if (!canProceed.value || saving.value) return
  saving.value = true
  try {
    const bizId = authStore.user.businessId
    await setDoc(doc(db, 'businesses', bizId), {
      name: businessInfo.name,
      address: businessInfo.address || '',
      phone: businessInfo.phone || '',
      website: businessInfo.website || '',
      businessTypes: selectedTypes.value,
      currency: selectedCurrency.value,
      onboardingCompleted: true,
    }, { merge: true })
    authStore.setUser({
      ...authStore.user,
      onboardingCompleted: true,
      businessTypes: selectedTypes.value,
      currency: selectedCurrency.value,
    })
    router.push('/')
  } catch (err) {
    console.error('Onboarding save failed:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F7F4] dark:bg-gray-900 flex flex-col items-center justify-center p-6">

    <!-- Header bar -->
    <div class="w-full max-w-2xl mb-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img :src="Logo" class="w-10 h-10 rounded-xl object-cover" alt="MicroOps" />
        <span class="text-xl font-bold text-[#004D40] dark:text-teal-400">MicroOps</span>
      </div>
      <div class="flex items-center gap-2">
        <div v-for="i in TOTAL_STEPS" :key="i"
          :class="i <= step ? 'bg-[#004D40] dark:bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'"
          class="h-1.5 w-10 rounded-full transition-colors" />
        <span class="text-sm text-gray-500 dark:text-gray-400 ml-1">{{ step }}/{{ TOTAL_STEPS }}</span>
      </div>
    </div>

    <!-- Card -->
    <div class="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors">

      <!-- Step 1: Business Info -->
      <template v-if="step === 1">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">Tell us about your business</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">This info will appear on your invoices and receipts.</p>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Business Name <span class="text-red-400">*</span></label>
            <input v-model="businessInfo.name" type="text" placeholder="e.g. Bella's Cafe"
              class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white transition-shadow" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input v-model="businessInfo.address" type="text" placeholder="e.g. No.12, Jalan Bunga, Kuala Lumpur"
              class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input v-model="businessInfo.phone" type="tel" placeholder="011-1234 5678"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Website</label>
              <input v-model="businessInfo.website" type="url" placeholder="www.yourbiz.com"
                class="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-400 outline-none text-gray-800 dark:text-white" />
            </div>
          </div>

          <!-- Currency selection -->
          <div>
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Currency</label>
            <div class="grid grid-cols-2 gap-3">
              <button v-for="c in CURRENCIES" :key="c.id"
                type="button"
                @click="selectedCurrency = c.id"
                :class="selectedCurrency === c.id
                  ? 'border-[#004D40] dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20 ring-2 ring-[#004D40]/20 dark:ring-teal-400/20'
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 hover:border-teal-300 dark:hover:border-teal-700'"
                class="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all">
                <div :class="selectedCurrency === c.id
                    ? 'bg-[#004D40] dark:bg-teal-500 border-[#004D40] dark:border-teal-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'"
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors">
                  <div v-if="selectedCurrency === c.id" class="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <p class="font-bold text-gray-800 dark:text-white text-sm">{{ c.label }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">e.g. {{ c.example }}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Step 2: Business Types -->
      <template v-else-if="step === 2">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">What kind of business do you run?</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8">Select all that apply. This shapes the product types available to you.</p>

        <div class="grid grid-cols-2 gap-4">
          <button v-for="bt in BUSINESS_TYPES" :key="bt.id"
            type="button"
            @click="toggleType(bt.id)"
            :class="selectedTypes.includes(bt.id)
              ? 'border-[#004D40] dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20 ring-2 ring-[#004D40]/20 dark:ring-teal-400/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 hover:border-teal-300 dark:hover:border-teal-700'"
            class="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all">

            <div :class="selectedTypes.includes(bt.id)
                ? 'bg-[#004D40] dark:bg-teal-500 border-[#004D40] dark:border-teal-500'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'"
              class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
              <svg v-if="selectedTypes.includes(bt.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div>
              <p class="font-bold text-gray-800 dark:text-white text-sm">{{ bt.label }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{{ bt.desc }}</p>
              <div class="flex flex-wrap gap-1 mt-2">
                <span v-for="pt in bt.productTypes" :key="pt"
                  class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 tracking-wider">
                  {{ pt }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </template>

      <!-- Footer actions -->
      <div class="flex justify-between items-center mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
        <button v-if="step > 1" @click="step--"
          class="text-gray-500 dark:text-gray-400 font-bold hover:text-gray-800 dark:hover:text-white transition-colors flex items-center gap-1">
          ← Back
        </button>
        <div v-else></div>

        <button v-if="step < TOTAL_STEPS" @click="goNext" :disabled="!canProceed"
          class="bg-[#004D40] dark:bg-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-[#00695C] dark:hover:bg-teal-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Continue →
        </button>

        <button v-else @click="completeOnboarding" :disabled="!canProceed || saving"
          class="bg-[#004D40] dark:bg-teal-600 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-[#00695C] dark:hover:bg-teal-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {{ saving ? 'Setting up…' : "Let's Get Started" }}
        </button>
      </div>
    </div>

    <p class="mt-6 text-xs text-gray-400 dark:text-gray-600 text-center">
      You can update business info and currency anytime in Business Settings.
    </p>
  </div>
</template>
