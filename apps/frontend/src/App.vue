<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { isTelegramWebApp, getTelegramWebApp } from './utils/telegramTheme'
import { useUserStore } from './stores/user'
import { useNotivue, Notivue, Notification, NotivueSwipe, lightTheme, darkTheme } from 'notivue'

const { update: updateNotivue } = useNotivue()

// Определяем текущую тему для notivue
const currentTheme = computed(() => {
  const webApp = getTelegramWebApp()
  if (webApp && webApp.colorScheme) {
    return webApp.colorScheme === 'dark' ? darkTheme : lightTheme
  }
  // Fallback: проверяем системную тему
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return darkTheme
  }
  return lightTheme
})

// Автоматическая авторизация при загрузке приложения, если пользователь заходит через Telegram Mini App
onMounted(() => {
  if (isTelegramWebApp()) {
    const userStore = useUserStore()
    // Вызываем авторизацию асинхронно
    userStore.checkAndCreateUser().catch((error) => {
      console.error('Error during auto-authentication:', error)
    })
  }

  // Обновляем позицию при изменении темы Telegram (для пересчета темы)
  const webApp = getTelegramWebApp()
  let updateThemeHandler: (() => void) | null = null
  
  if (webApp) {
    updateThemeHandler = () => {
      // Тема обновляется через computed свойство
      // Здесь можно добавить дополнительную логику при необходимости
    }
    
    webApp.onEvent('themeChanged', updateThemeHandler)
  }

  // Определяем позицию в зависимости от размера экрана
  const updatePosition = () => {
    const isMobile = window.innerWidth < 768
    updateNotivue({
      position: isMobile ? 'top-center' : 'top-right',
    })
  }

  updatePosition()
  window.addEventListener('resize', updatePosition)

  // Cleanup при размонтировании
  onUnmounted(() => {
    window.removeEventListener('resize', updatePosition)
    if (webApp && updateThemeHandler) {
      webApp.offEvent('themeChanged', updateThemeHandler)
    }
  })
})
</script>

<template>
  <router-view />
  <Notivue v-slot="item">
    <NotivueSwipe :item="item">
      <Notification :item="item" :theme="currentTheme" />
    </NotivueSwipe>
  </Notivue>
</template>

<style scoped></style>
