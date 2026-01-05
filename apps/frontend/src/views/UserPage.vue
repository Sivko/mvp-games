<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2">
          Список Игр
        </h1>
      </div>
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        {{ JSON.stringify(games) }}
        <div v-for="game in defaultGames" :key="game.typeGame">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-telegram-button"></div>
              <a :href="`/${userId}/game/${game.typeGame}`">
                {{ game.name }}
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';

const games = ref<Game[]>([]);
const userId = useRoute().params.userId as string;

onMounted(async () => {
  const gamesData = await gamesApi.getActiveGameByUser(userId);
  games.value = gamesData;
});

const defaultGames = [
  {
    typeGame: 'association-text',
    url: '/association-text',
    name: 'Сто к одному',
  }
];

</script>

<style scoped></style>
