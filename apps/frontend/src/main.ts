import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './assets/main.css'
import { initTelegramTheme, getTelegramWebApp } from './utils/telegramTheme'
import { createBottomSheet } from 'bottom-sheet-vue3'
import 'bottom-sheet-vue3/style.css'
import { createNotivue } from 'notivue'
import 'notivue/notification.css'
import 'notivue/animations.css'

// Инициализируем тему Telegram перед монтированием приложения
initTelegramTheme()

// Определяем тему для notivue
const getTheme = (): 'light' | 'dark' => {
  const webApp = getTelegramWebApp()
  if (webApp && webApp.colorScheme) {
    return webApp.colorScheme
  }
  // Fallback: проверяем системную тему
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// Создаем notivue с настройками
const notivue = createNotivue({
  position: 'top-right',
  limit: 5,
  enqueue: true,
  avoidDuplicates: true,
  notifications: {
    global: {
      duration: 3000,
    },
  },
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createBottomSheet())
app.use(notivue)

app.mount('#app')
