import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/main.css'
import { initTelegramTheme } from './utils/telegramTheme'
import { createBottomSheet } from 'bottom-sheet-vue3'
import 'bottom-sheet-vue3/style.css'

// Инициализируем тему Telegram перед монтированием приложения
initTelegramTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createBottomSheet())

app.mount('#app')
