<script setup lang="ts">
import { onMounted } from 'vue'
import { isTelegramWebApp } from './utils/telegramTheme'
import { useUserStore } from './stores/user'

// Автоматическая авторизация при загрузке приложения, если пользователь заходит через Telegram Mini App
onMounted(() => {
  if (isTelegramWebApp()) {
    const userStore = useUserStore()
    // Вызываем авторизацию асинхронно
    userStore.checkAndCreateUser().catch((error) => {
      console.error('Error during auto-authentication:', error)
    })
  }
})
</script>

<template>
  <router-view />
</template>

<style scoped></style>
