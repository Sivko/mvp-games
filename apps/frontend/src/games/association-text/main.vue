<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Заголовок с количеством онлайн пользователей -->
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-white mb-2">
            Игра в слова
          </h1>
          <div class="text-white text-sm">
            Онлайн: {{ onlineUsersCount }}
          </div>
        </div>
      </div>

      <!-- Фрейм 1: Ввод ответа -->
      <Step1Input
        v-if="phase === 'input'"
        :question="currentQuestion"
        :timer-ends-at="timerEndsAt"
        :ready-count="readyCount"
        :online-users-count="onlineUsersCount"
        :answer-submitted="answerSubmitted"
        :current-time="currentTime"
        @submit="handleSubmitAnswer"
      />

      <!-- Фрейм 2: Результаты -->
      <Step2Result
        v-if="phase === 'results'"
        :timer-ends-at="timerEndsAt"
        :ready-count="readyCount"
        :online-users-count="onlineUsersCount"
        :ready-for-next-round="readyForNextRound"
        :answers="answers"
        :current-user-id="currentUserId"
        :reaction-types="reactionTypes"
        :reactions="reactions"
        :current-time="currentTime"
        @toggle-reaction="toggleReaction"
        @mark-ready="markReady"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// @ts-expect-error - socket.io-client types may not be available
import { io, Socket } from 'socket.io-client';
import { reactionTypesApi } from '../../api/reactionTypesApi';
import { useUser } from '../../composables/useUser';
import Step1Input from './Step1Input.vue';
import Step2Result from './Step2Result.vue';

const props = defineProps<{
  gameId: string;
  userId: string; // ID владельца игры (для обратной совместимости, но не используется)
  question: string;
}>();

const emit = defineEmits<{
  (e: 'question-updated', question: string): void;
}>();

const currentQuestion = ref(props.question);

// Используем userId из localStorage вместо props
const { getCurrentUserId } = useUser();
const currentUserId = ref<string | null>(null);

const socket = ref<Socket | null>(null);
const phase = ref<'input' | 'results'>('input');
const onlineUsersCount = ref(0);
const answerSubmitted = ref(false);
const answers = ref<Array<{ id: string; userId: string; text: string }>>([]);
const reactions = ref<Map<string, Array<{ userId: string; reactionId: string }>>>(new Map());
const reactionTypes = ref<Array<{ _id: string; name: string }>>([]);
const timerEndsAt = ref<number | null>(null);
const currentTime = ref(Date.now());
const readyCount = ref(0);
const readyForNextRound = ref(false);

let timerInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  // Получаем текущего пользователя из localStorage
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not found in localStorage');
    return;
  }
  currentUserId.value = userId;

  // Загружаем типы реакций
  try {
    reactionTypes.value = await reactionTypesApi.getAll();
  } catch (error) {
    console.error('Failed to load reaction types:', error);
  }

  // Подключаемся к WebSocket
  const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
  socket.value = io(`${socketUrl}/association-text`, {
    transports: ['websocket'],
  });

  // Присоединяемся к игре с текущим пользователем из localStorage
  socket.value.emit('join-game', {
    gameId: props.gameId,
    userId: userId,
  });

  // Слушаем события
  socket.value.on('game-state', (data: {
    phase: 'input' | 'results';
    onlineUsersCount: number;
    timerEndsAt?: number;
    question?: string;
    answers?: Array<{ id: string; userId: string; text: string }>;
    readyCount?: number;
  }) => {
    phase.value = data.phase;
    onlineUsersCount.value = data.onlineUsersCount;
    if (data.timerEndsAt !== undefined) {
      timerEndsAt.value = data.timerEndsAt;
    } else {
      timerEndsAt.value = null;
    }
    if (data.readyCount !== undefined) {
      readyCount.value = data.readyCount;
    }
    if (data.question) {
      currentQuestion.value = data.question;
      emit('question-updated', data.question);
    }
    if (data.phase === 'input') {
      // Сброс состояния при переходе к новой фазе ввода
      answerSubmitted.value = false;
      readyForNextRound.value = false;
    }
    if (data.phase === 'results') {
      readyForNextRound.value = false;
    }
    if (data.answers) {
      answers.value = data.answers;
      // Реакции загружаются через WebSocket события reactions-updated
    }
  });

  socket.value.on('timer-update', (data: { endsAt: number }) => {
    timerEndsAt.value = data.endsAt;
  });

  socket.value.on('online-users-update', (data: { count: number }) => {
    onlineUsersCount.value = data.count;
  });

  socket.value.on('answer-submitted', () => {
    answerSubmitted.value = true;
  });

  socket.value.on('reactions-updated', (data: {
    answerId: string;
    reactions: Array<{ userId: string; reactionId: string }>;
  }) => {
    reactions.value.set(data.answerId, data.reactions);
  });

  socket.value.on('ready-update', (data: {
    readyCount: number;
    totalUsers: number;
  }) => {
    readyCount.value = data.readyCount;
  });

  // Обновляем таймер каждую секунду
  const startTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
      currentTime.value = Date.now();
      if (timerEndsAt.value && currentTime.value >= timerEndsAt.value) {
        timerEndsAt.value = null;
      }
    }, 1000);
  };

  startTimer();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  if (socket.value) {
    socket.value.disconnect();
  }
});

const handleSubmitAnswer = (text: string) => {
  if (!text.trim() || answerSubmitted.value || !socket.value || !currentUserId.value) {
    return;
  }

  socket.value.emit('submit-answer', {
    gameId: props.gameId,
    userId: currentUserId.value,
    text: text.trim(),
  });
};

const toggleReaction = (answerId: string, reactionId: string) => {
  if (!socket.value || !currentUserId.value) return;

  socket.value.emit('submit-reaction', {
    gameId: props.gameId,
    userId: currentUserId.value,
    answerId,
    reactionId,
  });
};

const markReady = () => {
  if (!socket.value || readyForNextRound.value || !currentUserId.value) return;

  if (phase.value === 'results') {
    socket.value.emit('ready-for-next-round', {
      gameId: props.gameId,
      userId: currentUserId.value,
    });
    readyForNextRound.value = true;
  }
};
</script>

<style scoped></style>
