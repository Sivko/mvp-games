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
      <div v-if="phase === 'input'" class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-telegram-text mb-4">
            {{ currentQuestion }}
          </h2>
          <div class="text-telegram-text-secondary mb-4">
            <span v-if="timerEndsAt">Время: {{ timeLeft }} сек</span>
            <span v-else>
              Отправлено ответов: {{ readyCount }} / {{ onlineUsersCount }}
              (нужно {{ Math.ceil(onlineUsersCount / 2) + 1 }})
            </span>
          </div>
        </div>

        <div class="mb-4">
          <input v-model="answerText" type="text" placeholder="Введите ваш вариант ответа"
            class="w-full px-4 py-2 border border-telegram-section-separator rounded-lg bg-telegram-bg text-telegram-text focus:outline-none focus:ring-2 focus:ring-telegram-button"
            :disabled="answerSubmitted" @keyup.enter="submitAnswer" />
        </div>

        <button @click="submitAnswer" :disabled="!answerText.trim() || answerSubmitted"
          class="px-6 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
          {{ answerSubmitted ? 'Ответ отправлен' : 'Отправить ответ' }}
        </button>
      </div>

      <!-- Фрейм 2: Результаты -->
      <div v-if="phase === 'results'" class="bg-telegram-section rounded-lg shadow p-6 mb-4">
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

        <div v-if="!readyForNextRound" class="mb-4">
          <button @click="markReady"
            class="px-6 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity font-semibold">
            Готово
          </button>
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
                @click="toggleReaction(answer.id, reactionType._id)" :class="[
                  'px-3 py-1 rounded-lg text-sm transition-opacity',
                  isReactionActive(answer.id, reactionType._id)
                    ? 'bg-telegram-button text-telegram-button-text'
                    : 'bg-telegram-bg-secondary text-telegram-text hover:opacity-90'
                ]">
                {{ reactionType.name }}
                <span v-if="getReactionCount(answer.id, reactionType._id) > 0">
                  ({{ getReactionCount(answer.id, reactionType._id) }})
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
// @ts-expect-error - socket.io-client types may not be available
import { io, Socket } from 'socket.io-client';
import { reactionTypesApi } from '../../api/reactionTypesApi';
import { useUser } from '../../composables/useUser';

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
const answerText = ref('');
const answerSubmitted = ref(false);
const answers = ref<Array<{ id: string; userId: string; text: string }>>([]);
const reactions = ref<Map<string, Array<{ userId: string; reactionId: string }>>>(new Map());
const reactionTypes = ref<Array<{ _id: string; name: string }>>([]);
const timerEndsAt = ref<number | null>(null);
const currentTime = ref(Date.now());
const readyCount = ref(0);
const readyForNextRound = ref(false);

const timeLeft = computed(() => {
  if (!timerEndsAt.value) return 0;
  const left = Math.max(0, Math.ceil((timerEndsAt.value - currentTime.value) / 1000));
  return left;
});

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
      answerText.value = '';
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

const submitAnswer = () => {
  if (!answerText.value.trim() || answerSubmitted.value || !socket.value || !currentUserId.value) {
    return;
  }

  socket.value.emit('submit-answer', {
    gameId: props.gameId,
    userId: currentUserId.value,
    text: answerText.value.trim(),
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

const isReactionActive = (answerId: string, reactionId: string): boolean => {
  if (!currentUserId.value) return false;
  const answerReactions = reactions.value.get(answerId) || [];
  return answerReactions.some(
    (r) => r.userId === currentUserId.value && r.reactionId === reactionId,
  );
};

const getReactionCount = (answerId: string, reactionId: string): number => {
  const answerReactions = reactions.value.get(answerId) || [];
  return answerReactions.filter((r) => r.reactionId === reactionId).length;
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
