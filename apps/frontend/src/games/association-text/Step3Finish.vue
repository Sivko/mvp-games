<template>
  <div class="bg-telegram-section rounded-lg shadow p-4 mb-4 overflow-scroll h-full">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4 text-center">
        <span v-if="isGameFinished">🏆 Итоги игры</span>
        <span v-else>Итоги раунда {{ currentRound }}</span>
      </h2>
    </div>

    <!-- Победитель -->
    <div v-if="winner" class="mb-6 p-4 bg-yellow-500/20 rounded-lg border-2 border-yellow-500">
      <div class="text-center">
        <div class="text-yellow-500 text-sm mb-2">
          <span v-if="isGameFinished">🏆 Победитель игры</span>
          <span v-else>🏆 Победитель раунда</span>
        </div>
        <div class="text-2xl font-bold text-telegram-text">{{ winner.userName }}</div>
        <div class="text-telegram-text-secondary mt-1">Очки: {{ winner.score }}</div>
      </div>
    </div>

    <!-- Таблица результатов -->
    <div class="space-y-2 mb-4">
      <div
        v-for="(player, index) in sortedPlayers"
        :key="player.userId"
        class="px-4 py-3 bg-telegram-bg-secondary rounded-lg flex items-center justify-between"
        :class="{
          'bg-yellow-500/20 border-2 border-yellow-500': index === 0 && player.score > 0,
        }"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-telegram-header flex items-center justify-center text-white font-semibold text-sm"
          >
            {{ player.initial }}
          </div>
          <div>
            <div class="text-telegram-text font-semibold">
              {{ player.userName }}
              <span v-if="index === 0 && player.score > 0" class="text-yellow-500 ml-2">👑</span>
            </div>
            <div class="text-telegram-text-secondary text-xs">
              {{ index === 0 && player.score > 0 ? 'Победитель' : `Место ${index + 1}` }}
            </div>
          </div>
        </div>
        <div class="text-telegram-text font-bold text-lg">{{ player.score }}</div>
      </div>
    </div>

    <!-- Статистика готовности -->
    <div v-if="!readyForNextRound" class="mb-4 text-center text-telegram-text-secondary text-sm">
      <span v-if="isGameFinished">Готовы к новой игре: {{ readyCount }} / {{ onlineUsersCount }}</span>
      <span v-else>Готовы к новому раунду: {{ readyCount }} / {{ onlineUsersCount }}</span>
    </div>
  </div>

  <div v-if="!readyForNextRound" class="mb-4">
    <button
      @click="handleReadyForNextRound"
      class="px-6 py-3 w-full rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity font-semibold text-lg"
    >
      <span v-if="isGameFinished">Новая игра</span>
      <span v-else>Новый раунд</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  userScores: Record<string, number>;
  players: Array<{ userId: string; userName: string; initial: string }>;
  currentRound: number;
  onlineUsersCount: number;
  readyCount: number;
  readyForNextRound: boolean;
  currentUserId: string | null;
  isGameFinished?: boolean;
}>();

const emit = defineEmits<{
  (e: 'ready-for-next-round'): void;
}>();

// Сортируем игроков по очкам (от большего к меньшему)
const sortedPlayers = computed(() => {
  return props.players
    .map((player) => ({
      ...player,
      score: props.userScores[player.userId] || 0,
    }))
    .sort((a, b) => b.score - a.score);
});

// Определяем победителя (игрок с максимальными очками)
const winner = computed(() => {
  const sorted = sortedPlayers.value;
  if (sorted.length > 0 && sorted[0].score > 0) {
    return sorted[0];
  }
  return null;
});

const handleReadyForNextRound = () => {
  console.log('[Step3Finish] handleReadyForNextRound вызван', {
    readyForNextRound: props.readyForNextRound,
    currentUserId: props.currentUserId,
    readyCount: props.readyCount,
    onlineUsersCount: props.onlineUsersCount,
  });
  
  if (!props.readyForNextRound) {
    console.log('[Step3Finish] Эмит события ready-for-next-round');
    emit('ready-for-next-round');
  } else {
    console.log('[Step3Finish] Уже готов к следующему раунду, пропускаем');
  }
};
</script>

<style scoped></style>

