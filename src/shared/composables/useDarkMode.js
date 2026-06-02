import { ref } from 'vue'

// Module-level singleton — shared across all components
const isDark = ref(false)

const apply = (dark) => {
  isDark.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

export function useDarkMode() {
  const init = () => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    apply(saved === 'dark' || (!saved && prefersDark))
  }

  const toggleDarkMode = () => apply(!isDark.value)

  return { isDark, toggleDarkMode, init }
}
