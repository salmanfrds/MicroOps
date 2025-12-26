import { createWebHistory, createRouter } from 'vue-router'

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
        meta: { hideLayout: false }
    },
    {   
        path: '/sales', 
        name: 'Sales',
        component: Sales,
        meta: { hideLayout: false } 
    },
    { 
        path: '/finance', 
        name: 'Finance',
        component: Finance,
        meta: { hideLayout: false }
    },
    {   
        path: '/inventory', 
        name: 'Inventory',
        component: Inventory,
        meta: { hideLayout: false }
    },
    {   
        path: '/customer', 
        name: 'Customer',
        component: Customer,
        meta: { hideLayout: false }
    },
    {   
        path: '/profile', 
        name: 'Profile',
        component: Profile,
        meta: { hideLayout: false }
    },
    {   
        path: '/business', 
        name: 'Business',
        component: BusinessProfile,
        meta: { hideLayout: false }
    },
    {   
        path: '/your-business', 
        name: 'UserBusiness',
        component: UserBusiness,
        meta: { hideLayout: false }
    },
    {   
        path: '/login', 
        name: 'Login',
        component: Login,
        meta: { hideLayout: true }
    },
    {   
        path: '/locked', 
        name: 'Locked',
        component: FeatureLocked,
        meta: { hideLayout: false }
    },
    {   
        path: '/access-denied', 
        name: 'AccessDenied',
        component: AccessDenied,
        meta: { hideLayout: false }
    },
    {   
        path: '/signup', 
        name: 'Signup',
        component: Signup,
        meta: { hideLayout: true }
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})