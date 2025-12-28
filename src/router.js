import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient.js'

import Dashboard from './views/Dashboard.vue'
import Sales from './views/Sales.vue'
import Finance from './views/Finance.vue'
import Inventory from './views/Inventory.vue'
import Customer from './views/Customer.vue'
import Profile from './views/Profile.vue'
import UserBusiness  from './views/UserBusiness.vue'
import Login from './views/Login.vue'
import BusinessProfile from './views/BusinessProfile.vue'
import FeatureLocked from './views/FeatureLocked.vue'
import AccessDenied from './views/AccessDenied.vue'
import Signup from './views/Signup.vue'

const routes = [
    { 
        path: '/', 
        name: 'Dashboard',
        component: Dashboard,
        meta: { requireAuth: true }
    },
    {   
        path: '/sales', 
        name: 'Sales',
        component: Sales,
        meta: { requireAuth: true } 
    },
    { 
        path: '/finance', 
        name: 'Finance',
        component: Finance,
        meta: { requireAuth: true }
    },
    {   
        path: '/inventory', 
        name: 'Inventory',
        component: Inventory,
        meta: { requireAuth: true }
    },
    {   
        path: '/customer', 
        name: 'Customer',
        component: Customer,
        meta: { requireAuth: true }
    },
    {   
        path: '/profile', 
        name: 'Profile',
        component: Profile,
        meta: { requireAuth: true }
    },
    {   
        path: '/business', 
        name: 'Business',
        component: BusinessProfile,
        meta: { requireAuth: true }
    },
    {   
        path: '/your-business', 
        name: 'UserBusiness',
        component: UserBusiness,
        meta: { requireAuth: true }
    },
    {   
        path: '/login', 
        name: 'Login',
        component: Login,
        meta: { requireAuth: false }
    },
    {   
        path: '/locked', 
        name: 'Locked',
        component: FeatureLocked,
        meta: { requireAuth: true }
    },
    {   
        path: '/access-denied', 
        name: 'AccessDenied',
        component: AccessDenied,
        meta: { requireAuth: true }
    },
    {   
        path: '/signup', 
        name: 'Signup',
        component: Signup,
        meta: { requireAuth: false }
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requireAuth)
  const { data: { session } } = await supabase.auth.getSession()

  if (requiresAuth && !session) {
    next('/login')
  } 

  else if ((to.path === '/login' || to.path === '/signup') && session) {
    next('/')
  }

  else {
    next()
  }
})