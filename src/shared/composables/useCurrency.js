import { storeToRefs } from 'pinia'
import { useCurrencyStore } from '../stores/currency'

export function useCurrency() {
  const store = useCurrencyStore()
  const { symbol, effectiveCurrency: currency } = storeToRefs(store)
  const { fmt } = store
  return { symbol, fmt, currency }
}
