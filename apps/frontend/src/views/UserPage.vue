<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2">
          Список Игр
        </h1>
      </div>

      <!-- Список комнат, где пользователь является участником -->
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-white mb-4">
          Комнаты, где я участник
        </h2>
        <div v-if="participantGames.length === 0" class="text-gray-400">
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
                <div class="text-white font-medium">{{ getGameName(game.typeGame) }}</div>
                <div class="text-gray-400 text-sm">ID: {{ game._id }}</div>
              </div>
            </div>
            <button
              @click="goToGame(game.createdBy, game.typeGame)"
              class="px-4 py-2 bg-telegram-button text-white rounded-lg hover:opacity-90"
            >
              Перейти
            </button>
          </div>
        </div>
      </div>

      <!-- Перейти в комнату по приглашению -->
      <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-semibold text-white mb-4">
          Перейти в комнату по приглашению
        </h2>
        <div class="flex gap-2">
          <input
            v-model="inviteCode"
            type="text"
            placeholder="Введите invite-код (например: 695b3797a5e39fae62b5fb8a/game/association-text)"
            class="flex-1 px-4 py-2 bg-telegram-bg text-white rounded-lg border border-telegram-button focus:outline-none focus:ring-2 focus:ring-telegram-button"
          />
          <button
            @click="handleInvite"
            class="px-6 py-2 bg-telegram-button text-white rounded-lg hover:opacity-90"
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
        <h2 class="text-xl font-semibold text-white mb-4">
          Доступные игры
        </h2>
        <div v-for="defaultGame in defaultGames" :key="defaultGame.typeGame" class="mb-4">
          <div class="flex items-center justify-between p-3 bg-telegram-bg rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-telegram-button"></div>
              <div class="text-white font-medium">{{ defaultGame.name }}</div>
            </div>
            <button
              v-if="hasGame(defaultGame.typeGame)"
              @click="goToGame(userId, defaultGame.typeGame)"
              class="px-4 py-2 bg-telegram-button text-white rounded-lg hover:opacity-90"
            >
              Перейти
            </button>
            <button
              v-else
              @click="createGame(defaultGame.typeGame)"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90"
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
import { useRoute, useRouter } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';
import { useUser } from '../composables/useUser';

const games = ref<Game[]>([]);
const participantGames = ref<Game[]>([]);
const inviteCode = ref('');
const inviteError = ref('');
const route = useRoute();
const router = useRouter();
const userId = route.params.userId as string;
const { checkUserOnMount } = useUser();

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

const goToGame = (gameUserId: string, typeGame: string) => {
  router.push(`/${gameUserId}/game/${typeGame}`);
};

const createGame = async (typeGame: string) => {
  try {
    if (!userId) return;
    await gamesApi.findOrCreateGameByUserAndType(userId, typeGame);
    goToGame(userId, typeGame);
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

  // Парсим invite-код формата: userId/game/typeGame
  const parts = inviteCode.value.trim().split('/');
  if (parts.length !== 3 || parts[1] !== 'game') {
    inviteError.value = 'Неверный формат invite-кода. Используйте: userId/game/typeGame';
    return;
  }

  const [inviteUserId, , typeGame] = parts;

  if (!inviteUserId || !typeGame) {
    inviteError.value = 'Неверный формат invite-кода. Используйте: userId/game/typeGame';
    return;
  }

  try {
    await gamesApi.getGameByInvite(inviteUserId, typeGame);
    // Если игра найдена, редиректим
    router.push(`/${inviteUserId}/game/${typeGame}`);
  } catch {
    inviteError.value = 'К сожалению комната не найдена';
  }
};

onMounted(async () => {
  // Проверяем пользователя при монтировании
  await checkUserOnMount((id) => `/${id}`);
  
  // Загружаем игры, созданные пользователем
  const gamesData = await gamesApi.getActiveGameByUser(userId);
  games.value = gamesData;

  // Загружаем игры, где пользователь является участником
  const participantGamesData = await gamesApi.getActiveGamesByParticipant(userId);
  participantGames.value = participantGamesData;
});

</script>

<style scoped></style>
