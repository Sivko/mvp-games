<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2">
          Сто к одному
        </h1>
      </div>

      <div v-if="loading" class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <p class="text-telegram-text text-center">Загрузка...</p>
      </div>

      <div v-else class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <p class="text-telegram-text text-center text-xl">
          Сто к одному
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { gamesApi } from '../api/gamesApi';

const route = useRoute();
const loading = ref(true);
const gameId = ref<string>('');

onMounted(async () => {
  gameId.value = route.params.gameId as string;
  
  try {
    // Загружаем данные игры
    await gamesApi.getGameById(gameId.value);
  } catch (error) {
    console.error('Error loading game:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped></style>

