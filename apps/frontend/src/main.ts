import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initTelegramTheme } from './utils/telegramTheme'

// Инициализируем тему Telegram перед монтированием приложения
initTelegramTheme()

const app = createApp(App)

app.use(router)

app.mount('#app')
