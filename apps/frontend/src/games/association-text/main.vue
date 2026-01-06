<template>
  <div class="min-h-screen bg-telegram-bg">
    <div class="max-w-4xl mx-auto h-screen overflow-hidden pt-4 flex flex-col">
      <!-- Заголовок с количеством онлайн пользователей -->
      <div class="bg-telegram-header rounded-lg mb-4">
        <div class="flex items-center justify-between">
          <h1 class="text-3xl font-bold text-white flex items-center">
            <router-link to="/" class="px-4  h-full py-4">
              <AiOutlineArrowLeft />
            </router-link>
            Игра в слова
          </h1>
          <div class="text-white text-sm pr-4 flex items-center gap-2">
            <span class="bg-green-500 rounded-full px-2 py-1 text-xs"> {{ onlineUsersCount }} </span>
            <button>
              <AiOutlineUserAdd />
            </button>
            <button>
              <Io5SettingsOutline />
            </button>
          </div>
        </div>
      </div>

      <!-- Последние события -->
      <!-- <div v-if="recentActions.length > 0" class="bg-telegram-section rounded-lg shadow p-4 mb-4">
        <h3 class="text-lg font-semibold text-telegram-text mb-2">
          Последние события
        </h3>
        <div class="space-y-1 max-h-32 overflow-y-auto">
          <template v-for="(action, index) in recentActions" :key="index">
            <span class="text-sm text-telegram-text-secondary" v-html="action"></span><span
              v-if="index < recentActions.length - 1">, </span>
          </template>
        </div>
      </div> -->

      <!-- Игроки в игре -->
      <div v-if="uniquePlayers.length > 0" class="bg-telegram-section rounded-lg shadow p-4 mb-4">
        <h3 class="text-sm font-semibold text-telegram-text-secondary mb-2">
          Игроки ({{ uniquePlayers.length }})
        </h3>
        <div class="flex flex-wrap gap-2">
          <PlayerAvatar
            v-for="player in uniquePlayers"
            :key="player.userId"
            :user-name="player.userName"
            :initial="player.initial"
            :is-ready="player.isReady"
          />
        </div>
      </div>

      <!-- Фрейм 1: Ввод ответа -->
      <Step1Input v-if="phase === 'input'" :question="currentQuestion" :timer-ends-at="timerEndsAt"
        :online-users-count="onlineUsersCount" :answer-submitted="answerSubmitted"
        :current-time="currentTime" :bank-association-text-id="bankAssociationTextId" @submit="handleSubmitAnswer" />

      <!-- Фрейм 2: Результаты -->
      <Step2Result v-if="phase === 'results'" :timer-ends-at="timerEndsAt"
        :online-users-count="onlineUsersCount" :ready-for-next-round="readyForNextRound" :answers="answers"
        :current-user-id="currentUserId" :reaction-types="reactionTypes" :reactions="reactionsObject"
        :current-time="currentTime" :game-id="props.gameId" :question="currentQuestion"
        @toggle-reaction="toggleReaction" @mark-ready="markReady" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
// @ts-expect-error - socket.io-client types may not be available
import { io, Socket } from 'socket.io-client';
import { reactionTypesApi } from '../../api/reactionTypesApi';
import { useUser } from '../../composables/useUser';
import Step1Input from './Step1Input.vue';
import Step2Result from './Step2Result.vue';
import PlayerAvatar from './PlayerAvatar.vue';
import { AiOutlineArrowLeft } from 'vue-icons-plus/ai';
import { Io5SettingsOutline } from 'vue-icons-plus/io5';
import { AiOutlineUserAdd } from 'vue-icons-plus/ai';

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
const answers = ref<Array<{ id: string; userId: string; text: string; userName?: string }>>([]);
const reactions = ref<Map<string, Array<{ userId: string; reactionId: string }>>>(new Map());
// Преобразуем Map в объект для лучшей реактивности при передаче в дочерний компонент
const reactionsObject = computed(() => {
  const obj: Record<string, Array<{ userId: string; reactionId: string }>> = {};
  reactions.value.forEach((reactionsArray, answerId) => {
    obj[answerId] = reactionsArray;
  });
  return obj;
});

// Уникальные игроки из ответов
const uniquePlayers = computed(() => {
  const playersMap = new Map<string, { userId: string; userName: string; initial: string; isReady: boolean }>();
  
  // В фазе input: игрок готов, если у него есть ответ
  // В фазе results: игрок готов, если он в readyUsers Set
  const isInputPhase = phase.value === 'input';
  
  answers.value.forEach((answer) => {
    if (!playersMap.has(answer.userId)) {
      const userName = answer.userName || 'Неизвестный';
      const initial = userName.charAt(0).toUpperCase();
      const isReady = isInputPhase 
        ? true // В фазе input все игроки с ответами считаются готовыми
        : readyUsers.value.has(answer.userId); // В фазе results проверяем Set
      playersMap.set(answer.userId, {
        userId: answer.userId,
        userName,
        initial,
        isReady,
      });
    }
  });
  
  return Array.from(playersMap.values());
});

const reactionTypes = ref<Array<{ _id: string; name: string }>>([]);
const timerEndsAt = ref<number | null>(null);
const currentTime = ref(Date.now());
const readyForNextRound = ref(false);
const readyUsers = ref<Set<string>>(new Set()); // Set готовых пользователей в фазе results
const recentActions = ref<string[]>([]);
const MAX_ACTIONS = 10; // Максимальное количество отображаемых событий
const bankAssociationTextId = ref<string | undefined>(undefined);

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

  // Загружаем игру для получения bankAssociationTextId
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const gameResponse = await fetch(`${API_BASE_URL}/games/${props.gameId}`);
    if (gameResponse.ok) {
      const game = await gameResponse.json();
      // Получаем последний использованный вопрос (последний элемент массива usedQuestions)
      if (game.usedQuestions && game.usedQuestions.length > 0) {
        bankAssociationTextId.value = game.usedQuestions[game.usedQuestions.length - 1];
      }
    }
  } catch (error) {
    console.error('Failed to load game:', error);
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
    answers?: Array<{ id: string; userId: string; text: string; userName?: string }>;
    readyUsers?: string[];
  }) => {
    phase.value = data.phase;
    onlineUsersCount.value = data.onlineUsersCount;
    if (data.timerEndsAt !== undefined) {
      timerEndsAt.value = data.timerEndsAt;
    } else {
      timerEndsAt.value = null;
    }
    if (data.question) {
      currentQuestion.value = data.question;
      emit('question-updated', data.question);
    }
    if (data.phase === 'input') {
      // Сброс состояния при переходе к новой фазе ввода
      answerSubmitted.value = false;
      readyForNextRound.value = false;
      // Обновляем готовых пользователей из данных WebSocket
      if (data.readyUsers) {
        readyUsers.value = new Set(data.readyUsers);
      } else {
        readyUsers.value.clear();
      }
    }
    if (data.phase === 'results') {
      readyForNextRound.value = false;
      // Обновляем готовых пользователей из данных WebSocket
      if (data.readyUsers) {
        readyUsers.value = new Set(data.readyUsers);
      } else {
        readyUsers.value.clear();
      }
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
    // Отладка (можно убрать позже)
    console.log('reactions-updated received:', data);
    // Создаем новую Map для обеспечения реактивности Vue 3
    const newReactions = new Map(reactions.value);
    newReactions.set(data.answerId, data.reactions);
    reactions.value = newReactions;
    console.log('Updated reactions Map:', Array.from(newReactions.entries()));
  });

  socket.value.on('ready-update', (data: {
    readyCount: number;
    totalUsers: number;
    readyUsers: string[];
  }) => {
    // Обновляем Set готовых пользователей из данных WebSocket
    readyUsers.value = new Set(data.readyUsers || []);
  });

  socket.value.on('new-action', (data: { message: string }) => {
    // Добавляем новое событие в начало списка
    recentActions.value.unshift(data.message);
    // Ограничиваем количество событий
    if (recentActions.value.length > MAX_ACTIONS) {
      recentActions.value = recentActions.value.slice(0, MAX_ACTIONS);
    }
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
    // Добавляем текущего пользователя в готовые
    readyUsers.value.add(currentUserId.value);
  }
};
</script>

<style scoped></style>
