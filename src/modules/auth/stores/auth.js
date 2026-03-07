import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State: This is like the 'data' or variables
  const user = ref(null)

  // Actions: These are functions to change the state
  function setUser(userData) {
    user.value = userData
    console.log(user.value)
  }

  function logout() {
    user.value = null
    console.log("Pinia: User logged out successfully")
  }

  // Return everything you want components to be able to use
  return { user, setUser, logout }
})