import { computed } from 'vue'
import { useAuthStore } from '../../modules/auth/stores/auth'

export function useCurrency() {
  const authStore = useAuthStore()
  const currency = computed(() => authStore.user?.currency || 'RM')

  const symbol = computed(() => currency.value === 'IDR' ? 'Rp' : 'RM')

  const fmt = (value) => {
    const v = Number(value) || 0
    if (currency.value === 'IDR') {
      return `Rp ${Math.round(v).toLocaleString('id-ID')}`
    }
    return `RM ${v.toFixed(2)}`
  }

  return { symbol, fmt, currency }
}
