import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient.js'
import { useRouter } from 'vue-router'

const user = ref(null)          // The Auth User (email, uid)
const profile = ref(null)       // The Database Profile (name, role) 
const loading = ref(false)
const error = ref(null)

export function useAuth() {
  const router = useRouter()

  // 1. LOGIN ACTION
  const login = async (email, password) => {

    loading.value = true
    error.value = null
    
    try {
      // A. Authenticate with Supabase Auth
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (err) throw err

      // B. If success, fetch the profile details (Name, Role) from your table
      if (data.user) {
        user.value = data.user
        await fetchProfile(data.user.id)
        
        // C. Redirect to Dashboard
        router.push('/') 
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 2. SIGNUP ACTION
  const signup = async (email, password, fullName) => {
    loading.value = true
    error.value = null
    
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This data is passed to the SQL Trigger to create the Profile automatically!
          data: { full_name: fullName } 
        }
      })
      if (err) throw err
      
      // If email confirmation is disabled, log them in immediately
      if (data.user) {
        user.value = data.user
        await fetchProfile(data.user.id)
        router.push('/')
      }
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  // 3. LOGOUT ACTION
  const logout = async () => {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
    router.push('/login')
  }

  // 4. HELPER: Fetch Profile from DB
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (error) throw error
      profile.value = data
    } catch (err) {
      console.error('Error fetching profile:', err.message)
    }
  }

  // 5. INITIALIZE (Run this when App starts)
  const checkSession = async () => {
    // Check if user is already logged in (e.g. page refresh)
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      user.value = data.session.user
      await fetchProfile(data.session.user.id)
    }

    // Listen for auth changes (e.g. token expired)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user || null
      if (session?.user) {
        if (!profile.value) await fetchProfile(session.user.id)
      } else {
        profile.value = null
        router.push('/login')
      }
    })
  }

  return {
    user,
    profile,
    loading,
    error,
    login,
    signup,
    logout,
    checkSession
  }
}