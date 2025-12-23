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

const routes = [
    { 
        path: '/', 
        name: 'Dashboard',
        component: Dashboard 
    },
    {   
        path: '/sales', 
        name: 'Sales',
        component: Sales 
    },
    { 
        path: '/finance', 
        name: 'Finance',
        component: Finance 
    },
    {   
        path: '/inventory', 
        name: 'Inventory',
        component: Inventory 
    },
    {   
        path: '/customer', 
        name: 'Customer',
        component: Customer 
    },
    {   
        path: '/profile', 
        name: 'Profile',
        component: Profile 
    },
    {   
        path: '/business', 
        name: 'Business',
        component: BusinessProfile
    },
    {   
        path: '/your-business', 
        name: 'UserBusiness',
        component: UserBusiness 
    },
    {   
        path: '/login', 
        name: 'Login',
        component: Login 
    },
    {   
        path: '/locked', 
        name: 'Locked',
        component: FeatureLocked 
    },
    {   
        path: '/access-denied', 
        name: 'AccessDenied',
        component: AccessDenied 
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})