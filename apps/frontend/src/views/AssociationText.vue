<template>
  <div class="min-h-screen bg-telegram-bg p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-telegram-header p-4 rounded-lg mb-4">
        <h1 class="text-3xl font-bold text-white mb-2">
          Игра в слова
        </h1>
      </div>

      <div v-if="loading" class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <p class="text-telegram-text text-center">Загрузка...</p>
      </div>

      <!-- Сетка игр -->
      <div v-else-if="!gameType" class="space-y-4">
        <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
          <h2 class="text-xl font-semibold text-telegram-section-header mb-4">
            Игры
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="game in availableGames"
              :key="game.typeGame"
              class="p-4 bg-telegram-bg-secondary rounded-lg border border-telegram-section-separator hover:border-telegram-button transition-colors cursor-pointer"
              @click="handleGameClick(game.typeGame)"
            >
              <h3 class="text-telegram-text font-semibold mb-2">
                {{ game.name }}
              </h3>
              <p class="text-telegram-subtitle text-sm">
                Онлайн: {{ game.onlineUsersCount }} пользователей
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Страница конкретной игры -->
      <div v-else class="bg-telegram-section rounded-lg shadow p-6 mb-4">
        <p class="text-telegram-text text-center text-xl">
          Сто к одному
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { gamesApi, type GameStats } from '../api/gamesApi';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const userId = ref<string>('');
const gameType = ref<string>('');
const gameStats = ref<Record<string, GameStats>>({});

interface AvailableGame {
  typeGame: string;
  name: string;
  onlineUsersCount: number;
}

const availableGames = computed<AvailableGame[]>(() => {
  return [
    {
      typeGame: 'association-text',
      name: 'Сто к одному',
      onlineUsersCount: gameStats.value['association-text']?.onlineUsersCount || 0,
    },
  ];
});

const handleGameClick = async (typeGame: string) => {
  loading.value = true;
  try {
    // Проверяем, есть ли у пользователя уже открытая игра
    const existingGame = await gamesApi.getActiveGameByUserAndType(
      userId.value,
      typeGame,
    );

    if (existingGame) {
      // Если есть активная игра, открываем её
      router.push({
        path: `/${userId.value}`,
        query: { type: typeGame },
      });
    } else {
      // Если нет активной игры, создаем новую
      await gamesApi.createGame({
        typeGame,
        createdBy: userId.value,
      });
      
      // Переходим на страницу игры
      router.push({
        path: `/${userId.value}`,
        query: { type: typeGame },
      });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    alert('Ошибка при создании игры');
  } finally {
    loading.value = false;
  }
};

const fetchGameStats = async () => {
  if (!userId.value) {
    return;
  }
  try {
    const stats = await gamesApi.getGameStats(userId.value);
    // Преобразуем массив статистики в объект по typeGame
    stats.forEach((stat) => {
      gameStats.value[stat.typeGame] = stat;
    });
  } catch (error) {
    console.error('Error fetching game stats:', error);
  }
};

const loadGameData = async () => {
  userId.value = route.params.userId as string;
  gameType.value = (route.query.type as string) || '';
  
  try {
    // Загружаем статистику игр
    await fetchGameStats();
    
    // Если есть тип игры, загружаем данные игры
    if (gameType.value) {
      const game = await gamesApi.getActiveGameByUserAndType(userId.value, gameType.value);
      if (!game) {
        console.warn('No active game found');
      }
    }
  } catch (error) {
    console.error('Error loading game:', error);
  } finally {
    loading.value = false;
  }
};

// Отслеживаем изменения роута
watch(() => route.query.type, () => {
  gameType.value = (route.query.type as string) || '';
});

watch(() => route.params.userId, () => {
  loading.value = true;
  loadGameData();
});

onMounted(async () => {
  await loadGameData();
});
</script>

<style scoped></style>

