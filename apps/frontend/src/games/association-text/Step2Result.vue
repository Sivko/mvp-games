<template>
  <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4">
        Результаты
      </h2>
      <div class="text-telegram-text-secondary mb-4">
        <span v-if="timerEndsAt">Время: {{ timeLeft }} сек</span>
        <span v-else>
          Готово: {{ readyCount }} / {{ onlineUsersCount }}
          (нужно {{ Math.ceil(onlineUsersCount / 2) + 1 }})
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="answer in answers" :key="answer.id" class="p-4 bg-telegram-bg rounded-lg"
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
        <div v-if="answer.userId !== currentUserId" class="flex gap-2 mt-2">
          <button v-for="reactionType in reactionTypes" :key="reactionType._id"
            @click="handleToggleReaction(answer.id, reactionType._id)" :class="[
              'px-3 py-1 rounded-lg text-sm transition-opacity',
              isReactionActive(answer.id, reactionType._id)
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-bg-secondary text-telegram-text hover:opacity-90',
            ]">
            {{ reactionType.name }}
            <span v-if="getReactionCount(answer.id, reactionType._id) > 0">
              ({{ getReactionCount(answer.id, reactionType._id) }})
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
import { computed } from 'vue';

const props = defineProps<{
  timerEndsAt: number | null;
  readyCount: number;
  onlineUsersCount: number;
  readyForNextRound: boolean;
  answers: Array<{ id: string; userId: string; text: string }>;
  currentUserId: string | null;
  reactionTypes: Array<{ _id: string; name: string }>;
  reactions: Map<string, Array<{ userId: string; reactionId: string }>>;
  currentTime: number;
}>();

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
  const answerReactions = props.reactions.get(answerId) || [];
  return answerReactions.some(
    (r) => r.userId === props.currentUserId && r.reactionId === reactionId,
  );
};

const getReactionCount = (answerId: string, reactionId: string): number => {
  const answerReactions = props.reactions.get(answerId) || [];
  return answerReactions.filter((r) => r.reactionId === reactionId).length;
};
</script>

<style scoped></style>
