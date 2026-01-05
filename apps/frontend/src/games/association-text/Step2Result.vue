<template>
  <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4">
        Результаты
      </h2>
      <div class="text-telegram-text-secondary mb-4">
        <span v-if="timerEndsAt">Время: {{ timeLeft }} сек</span>
        <span v-else>
          Готовы: {{ readyCount }} / {{ onlineUsersCount }}
          <!-- (нужно {{ Math.ceil(onlineUsersCount / 2) + 1 }}) -->
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="answer in answers" :key="answer.id" class="pt-4 px-2 bg-telegram-bg-secondary rounded-lg"
        :class="{ 'opacity-50': answer.userId === currentUserId }">
        <div class="flex items-center justify-between mb-2">
          <div class="text-telegram-text font-semibold">
            {{ answer.text }}
          </div>
          <div v-if="answer.userId === currentUserId" class="text-telegram-text-secondary text-sm">
            Ваш ответ
          </div>
        </div>

        <!-- Реакции (только для чужих ответов) -->
        <!-- <div v-if="answer.userId !== currentUserId" class="flex gap-2 mt-2"> -->
        <div class="flex mt-2">
          <button v-for="reactionType in reactionTypes" :key="reactionType._id"
            @click="handleToggleReaction(answer.id, reactionType._id)" :class="[
              'rounded-lg text-sm transition-opacity',
              isReactionActive(answer.id, reactionType._id)
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-bg-secondary text-telegram-text hover:opacity-90',
            ]">
            <img :src="getReactionImageUrl(reactionType.name)" :alt="reactionType.name" class="h-8">
            <span v-if="getReactionCount(answer.id, reactionType._id) > 0"
              class="bg-telegram-button text-telegram-button-text rounded-full px-2 text-xs">
              {{ getReactionCount(answer.id, reactionType._id) }}
            </span>
          </button>
        </div>
      </div>
      <div v-if="!readyForNextRound" class="mb-4">
        <button @click="handleMarkReady"
          class="px-6 py-2 w-full rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity font-semibold">
          Далее
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { getReactionImageUrl } from '../../utils/reactions';

const props = defineProps<{
  timerEndsAt: number | null;
  readyCount: number;
  onlineUsersCount: number;
  readyForNextRound: boolean;
  answers: Array<{ id: string; userId: string; text: string }>;
  currentUserId: string | null;
  reactionTypes: Array<{ _id: string; name: string }>;
  reactions: Record<string, Array<{ userId: string; reactionId: string }>>;
  currentTime: number;
}>();

// Отладка для проверки reactionTypes
onMounted(() => {
  console.log('Step2Result mounted, reactionTypes:', props.reactionTypes);
  console.log('Step2Result reactions:', props.reactions);
});

const emit = defineEmits<{
  (e: 'toggle-reaction', answerId: string, reactionId: string): void;
  (e: 'mark-ready'): void;
}>();

const timeLeft = computed(() => {
  if (!props.timerEndsAt) return 0;
  const left = Math.max(0, Math.ceil((props.timerEndsAt - props.currentTime) / 1000));
  return left;
});

const handleToggleReaction = (answerId: string, reactionId: string) => {
  emit('toggle-reaction', answerId, reactionId);
};

const handleMarkReady = () => {
  if (!props.readyForNextRound) {
    emit('mark-ready');
  }
};

const isReactionActive = (answerId: string, reactionId: string): boolean => {
  if (!props.currentUserId) return false;
  const answerReactions = props.reactions[answerId] || [];
  return answerReactions.some(
    (r) => r.userId === props.currentUserId && r.reactionId === reactionId,
  );
};

const getReactionCount = (answerId: string, reactionId: string): number => {
  const answerReactions = props.reactions[answerId] || [];
  const count = answerReactions.filter((r) => r.reactionId === reactionId).length;
  return count;
};
</script>

<style scoped></style>
