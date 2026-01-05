<script setup lang="ts">
import { GrHome } from 'vue-icons-plus/gr'
import { isTelegramWebApp } from './utils/telegramTheme'

const isTelegram = isTelegramWebApp()
</script>

<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <GrHome />
          You did it!
        </h1>
        <p v-if="isTelegram" class="text-telegram-button-text text-sm">
          Running in Telegram WebApp
        </p>
      </div>
      
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-telegram-section-header mb-2">
          Telegram Theme Colors
        </h2>
        <p class="text-telegram-text mb-4">
          Visit <a href="https://vuejs.org/" target="_blank" rel="noopener" class="text-telegram-link hover:underline">vuejs.org</a> to read the documentation
        </p>
        <p class="text-telegram-hint text-sm mb-4">
          Tailwind CSS and vue-icons-plus are now configured and ready to use!
        </p>
        <p class="text-telegram-subtitle text-xs">
          Colors are automatically synced with Telegram theme
        </p>
      </div>

      <div class="bg-telegram-bg-secondary rounded-lg p-6 mb-4">
        <h3 class="text-telegram-accent-text font-semibold mb-2">Color Examples</h3>
        <div class="space-y-2">
          <div class="p-2 bg-telegram-section border border-telegram-section-separator rounded">
            <span class="text-telegram-text">Section background</span>
          </div>
          <button class="bg-telegram-button text-telegram-button-text px-4 py-2 rounded hover:opacity-90 transition-opacity">
            Telegram Button
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
