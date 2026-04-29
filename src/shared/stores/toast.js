import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let counter = 0

  const add = (type, message, duration = 3500) => {
    const id = ++counter
    toasts.value.push({ id, type, message })
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  const dismiss = (id) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (message) => add('success', message)
  const error = (message) => add('error', message, 5000)
  const loading = (message) => add('loading', message, 0)

  const replace = (id, type, message) => {
    dismiss(id)
    const duration = type === 'error' ? 5000 : 3500
    return add(type, message, duration)
  }

  const resolveLoading = (id) => {
    dismiss(id)
  }

  return { toasts, success, error, loading, dismiss, replace, resolveLoading }
})
