import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/opendyslexic/latin-400.css'
import '@fontsource/opendyslexic/latin-700.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAccesibilidadStore } from './stores/accesibilidad'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useAccesibilidadStore(pinia)
app.use(router)

app.mount('#app')
