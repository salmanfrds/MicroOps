import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './app/router'
import { createPinia } from 'pinia'
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './shared/lib/firebaseClient'

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)

app.use(VueFire, {
    // imported above but could also just be created here
    firebaseApp,
    modules: [
        // we will be using VueFireAuth based on Firebase Auth
        VueFireAuth(),
    ],
})

app.mount('#app')
