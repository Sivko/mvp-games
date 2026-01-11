<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-xl font-bold text-telegram-button-text">
          Список Игр
        </h1>
      </div>

      <!-- Список комнат, где пользователь является участником -->
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-telegram-text mb-4">
          Комнаты, где я участник
        </h2>
        <div v-if="participantGames.length === 0" class="text-telegram-text-secondary">
          Вы не участвуете ни в одной комнате
        </div>
        <div v-else>
          <div
            v-for="game in participantGames"
            :key="game._id"
            class="flex items-center justify-between mb-3 p-3 bg-telegram-bg rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-telegram-button"></div>
              <div>
                <div class="text-telegram-text font-medium">{{ getGameName(game.typeGame) }}</div>
                <div class="text-telegram-text-secondary text-sm">Количество игр: {{ game.gamesCount }}</div>
              </div>
            </div>
            <button
              @click="goToGame(game._id)"
              class="px-4 py-2 bg-telegram-button text-telegram-button-text rounded-lg hover:opacity-90 transition-opacity"
            >
              Перейти
            </button>
          </div>
        </div>
      </div>

      <!-- Перейти в комнату по приглашению -->
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-telegram-text mb-4">
          Перейти в комнату по приглашению
        </h2>
        <div class="flex gap-2">
          <input
            v-model="inviteCode"
            type="text"
            placeholder="Введите invite-код (gameId)"
            class="flex-1 px-4 py-2 bg-telegram-bg text-telegram-text rounded-lg border border-telegram-section-separator focus:outline-none focus:ring-2 focus:ring-telegram-button"
          />
          <button
            @click="handleInvite"
            class="px-6 py-2 bg-telegram-button text-telegram-button-text rounded-lg hover:opacity-90 transition-opacity"
          >
            Перейти
          </button>
        </div>
        <div v-if="inviteError" class="mt-2 text-red-400 text-sm">
          {{ inviteError }}
        </div>
      </div>

      <!-- Список игр с кнопками Перейти/Создать комнату -->
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-telegram-text mb-4">
          Доступные игры
        </h2>
        <div v-for="defaultGame in defaultGames" :key="defaultGame.typeGame" class="mb-4">
          <div class="flex items-center justify-between p-3 bg-telegram-bg rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-telegram-button"></div>
              <div class="text-telegram-text font-medium">{{ defaultGame.name }}</div>
            </div>
            <button
              v-if="hasGame(defaultGame.typeGame)"
              @click="goToGameByType(defaultGame.typeGame)"
              class="px-4 py-2 bg-telegram-button text-telegram-button-text rounded-lg hover:opacity-90 transition-opacity"
            >
              Перейти
            </button>
            <button
              v-else
              @click="createGame(defaultGame.typeGame)"
              class="px-4 py-2 bg-telegram-button text-telegram-button-text rounded-lg hover:opacity-90 transition-opacity"
            >
              Создать комнату
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';
import { useUser } from '../composables/useUser';
import { getTelegramWebApp, isTelegramWebApp } from '../utils/telegramTheme';

const games = ref<Game[]>([]);
const participantGames = ref<Game[]>([]);
const inviteCode = ref('');
const inviteError = ref('');
const router = useRouter();
const { checkUserOnMount, getCurrentUserId } = useUser();

const defaultGames = [
  {
    typeGame: 'association-text',
    url: '/association-text',
    name: 'Сто к одному',
  }
];

const hasGame = (typeGame: string): boolean => {
  return games.value.some(game => game.typeGame === typeGame);
};

const getGameName = (typeGame: string): string => {
  const game = defaultGames.find(g => g.typeGame === typeGame);
  return game ? game.name : typeGame;
};

const goToGame = (gameId: string) => {
  router.push(`/my/game/${gameId}`);
};

const goToGameByType = async (typeGame: string) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const game = await gamesApi.findOrCreateGameByUserAndType(userId, typeGame);
    goToGame(game._id);
  } catch (error) {
    console.error('Failed to load game:', error);
  }
};

const createGame = async (typeGame: string) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  try {
    const game = await gamesApi.findOrCreateGameByUserAndType(userId, typeGame);
    goToGame(game._id);
  } catch (error) {
    console.error('Failed to create game:', error);
  }
};

const handleInvite = async () => {
  inviteError.value = '';
  
  if (!inviteCode.value.trim()) {
    inviteError.value = 'Введите invite-код';
    return;
  }

  const gameId = inviteCode.value.trim();

  if (!gameId) {
    inviteError.value = 'Неверный формат invite-кода';
    return;
  }

  try {
    await gamesApi.getGameById(gameId);
    // Если игра найдена, редиректим
    router.push(`/my/game/${gameId}`);
  } catch {
    inviteError.value = 'Игра не найдена';
  }
};

// Обработка параметров startapp из Telegram
const handleStartAppParams = async (): Promise<string | null> => {
  if (!isTelegramWebApp()) {
    return null;
  }

  const webApp = getTelegramWebApp();
  if (!webApp) {
    return null;
  }

  let gameIdFromStart: string | null = null;

  // Парсим initData для получения start_param
  const initData = webApp.initData;
  if (initData) {
    const params = new URLSearchParams(initData);
    const startParam = params.get('start_param');
    
    if (startParam) {
      // Парсим start_param: startapp=open&gameId=xxx
      const startParams = new URLSearchParams(startParam);
      const startApp = startParams.get('startapp');
      gameIdFromStart = startParams.get('gameId');
      
      if (startApp === 'open' && gameIdFromStart) {
        return gameIdFromStart;
      }
    }
  }

  // Также проверяем initDataUnsafe для совместимости
  const initDataUnsafe = webApp.initDataUnsafe;
  if (initDataUnsafe?.start_param) {
    const startParams = new URLSearchParams(initDataUnsafe.start_param);
    const startApp = startParams.get('startapp');
    gameIdFromStart = startParams.get('gameId');
    
    if (startApp === 'open' && gameIdFromStart) {
      return gameIdFromStart;
    }
  }

  return null;
};

onMounted(async () => {
  // Проверяем пользователя при монтировании
  await checkUserOnMount(() => `/my`);
  
  // Обрабатываем параметры startapp из Telegram (после авторизации, чтобы initData был доступен)
  const gameIdFromStart = await handleStartAppParams();
  
  // Если есть gameId из startapp, редиректим на игру
  if (gameIdFromStart) {
    try {
      // Проверяем, что игра существует
      await gamesApi.getGameById(gameIdFromStart);
      router.push(`/my/game/${gameIdFromStart}`);
      return; // Прерываем выполнение, так как происходит редирект
    } catch (error) {
      console.error('Game from startapp not found:', error);
      // Если игра не найдена, продолжаем загрузку страницы
    }
  }
  
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Загружаем игры, созданные пользователем
  const gamesData = await gamesApi.getActiveGameByUser(userId);
  games.value = gamesData;

  // Загружаем игры, где пользователь является участником
  const participantGamesData = await gamesApi.getActiveGamesByParticipant(userId);
  participantGames.value = participantGamesData;
});

</script>

<style scoped></style>
