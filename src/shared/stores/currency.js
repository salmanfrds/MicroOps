import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '../../modules/auth/stores/auth'

const RATES = {
  MYR_IDR: 3600,
  IDR_MYR: 1 / 3600,
}

export const CURRENCY_CONFIG = {
  MYR: { symbol: 'RM',  name: 'Malaysian Ringgit', code: 'MYR', decimals: 2 },
  IDR: { symbol: 'Rp',  name: 'Indonesian Rupiah',  code: 'IDR', decimals: 0 },
}

export const useCurrencyStore = defineStore('currency', () => {
  const authStore = useAuthStore()

  // What the business actually stores prices in (from Firebase)
  const baseCurrency = computed(() => authStore.user?.currency || 'MYR')

  // What the user wants to view amounts in (localStorage preference)
  const _stored = localStorage.getItem('mops_display_currency')
  const displayCurrency = ref(_stored || null)

  // Effective currency used for formatting
  const effectiveCurrency = computed(() => displayCurrency.value || baseCurrency.value)

  const isConverting = computed(
    () => !!displayCurrency.value && displayCurrency.value !== baseCurrency.value
  )

  const convert = (amount) => {
    const v = Number(amount) || 0
    if (!isConverting.value) return v
    const key = `${baseCurrency.value}_${displayCurrency.value}`
    return v * (RATES[key] || 1)
  }

  const fmt = (value) => {
    const converted = convert(value)
    const cfg = CURRENCY_CONFIG[effectiveCurrency.value] || CURRENCY_CONFIG.MYR
    if (cfg.decimals === 0) {
      return `${cfg.symbol} ${Math.round(converted).toLocaleString('id-ID')}`
    }
    return `${cfg.symbol} ${converted.toFixed(cfg.decimals)}`
  }

  const symbol = computed(() => CURRENCY_CONFIG[effectiveCurrency.value]?.symbol || 'RM')

  // --- Warning dialog ---
  const showWarningDialog = ref(false)
  const pendingCurrency = ref(null)

  const requestSwitch = (newCurrency) => {
    if (!newCurrency || newCurrency === baseCurrency.value) {
      // Reverting to base — no warning needed
      displayCurrency.value = null
      localStorage.removeItem('mops_display_currency')
      return
    }
    pendingCurrency.value = newCurrency
    showWarningDialog.value = true
  }

  const confirmSwitch = () => {
    displayCurrency.value = pendingCurrency.value
    localStorage.setItem('mops_display_currency', pendingCurrency.value)
    showWarningDialog.value = false
    pendingCurrency.value = null
  }

  const cancelSwitch = () => {
    showWarningDialog.value = false
    pendingCurrency.value = null
  }

  return {
    baseCurrency, displayCurrency, effectiveCurrency, isConverting,
    fmt, symbol,
    showWarningDialog, pendingCurrency,
    requestSwitch, confirmSwitch, cancelSwitch,
  }
})
