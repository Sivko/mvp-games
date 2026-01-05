<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2">
          Игра в слова
        </h1>
      </div>
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        {{ JSON.stringify(game) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';
import { onMounted, ref } from 'vue';

const route = useRoute();
const userId = route.params.userId as string;
const gameType = route.params.gameType as string;
const game = ref<Game | null>(null);
onMounted(async () => {
  game.value = await gamesApi.findOrCreateGameByUserAndType(userId, gameType);
  console.log(game);
});

</script>
<style scoped></style>