<template>
  <div>
    <!-- Тост 1 -->
    <Toast position="top-center" group="toast1" />

    <!-- Тост 2 -->
    <Toast position="top-center" group="toast2" />

    <!-- Headless Toast для кастомной нотификации -->
    <Toast position="top-center" group="headless" @close="onClose">
      <template #container="{ message, closeCallback }">
        <section class="flex flex-col p-4 gap-4 w-full bg-black/70 rounded-xl">
          <div class="flex items-center gap-5">
            <i class="text-2xl">🔥</i>
            <span class="font-bold text-base text-white dark:text-black">{{ message.summary }}</span>
          </div>
          <div class="text-sm text-white dark:text-black">
            {{ message.detail }}
          </div>
        </section>
      </template>
    </Toast>
  </div>
</template>

<script setup>
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

// Функция для показа уведомления о первом слове со средним сходством
const showFirstMediumToast = () => {
  toast.add({
    severity: 'info',
    summary: 'Тост 1',
    detail: '',
    group: 'toast1'
  })
}

// Функция для показа Тост 2
const showToast2 = () => {
  toast.add({
    severity: 'info',
    summary: 'Тост 2',
    detail: '',
    group: 'toast2'
  })
}

// Обработчик закрытия toast
const onClose = () => {
  // Можно добавить дополнительную логику при закрытии
}

// Экспортируем функции для использования в других компонентах
defineExpose({
  showFirstMediumToast,
  showToast2
})
</script>
