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

      <div v-else class="space-y-4">
        <!-- Сетка игр -->
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

      <AddNameModal
        ref="nameModalRef"
        :show="shouldShowModal"
        @close="handleCloseNameModal"
        @submit="handleSubmitName"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { roomsApi, type Room } from '../api/roomsApi';
import { usersApi } from '../api/usersApi';
import { gamesApi, type GameStats } from '../api/gamesApi';
import { storage } from '../utils/storage';
import { getTelegramWebApp } from '../utils/telegramTheme';
import AddNameModal from '../components/AddNameModal.vue';

const router = useRouter();
const rooms = ref<Room[]>([]);
const loading = ref(true);
const creating = ref(false);
const showNameModal = ref(false);
const nameModalRef = ref<InstanceType<typeof AddNameModal> | null>(null);
const currentUser = ref(storage.getUser());
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

const shouldShowModal = computed(() => {
  return showNameModal.value && !currentUser.value;
});

const getStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    waiting: 'Ожидание',
    active: 'Активна',
    finished: 'Завершена',
  };
  return statusMap[status || ''] || status || 'Неизвестно';
};

const fetchRooms = async () => {
  loading.value = true;
  try {
    rooms.value = await roomsApi.getAllRooms();
  } catch (error) {
    console.error('Error fetching rooms:', error);
  } finally {
    loading.value = false;
  }
};

const checkUser = async () => {
  const storedUser = storage.getUser();
  if (storedUser) {
    // Пользователь уже есть
    currentUser.value = storedUser;
    showNameModal.value = false;
    return;
  }

  // Проверяем Telegram данные
  const webApp = getTelegramWebApp();
  const telegramData = webApp?.initDataUnsafe?.user;

  if (telegramData) {
    // Если есть Telegram данные, создаем пользователя автоматически
    try {
      const userData = {
        telegramId: telegramData.id,
        telegramUsername: telegramData.username,
        telegramFirstName: telegramData.first_name,
        telegramLastName: telegramData.last_name,
        telegramPhotoUrl: telegramData.photo_url,
        telegramLanguageCode: telegramData.language_code,
      };

      const user = await usersApi.findOrCreateUser(userData);
      const savedUser = {
        id: user.id,
        name: user.name || user.telegramFirstName || user.telegramUsername || 'Пользователь',
      };
      storage.setUser(savedUser);
      currentUser.value = savedUser;
      showNameModal.value = false;
    } catch (error) {
      console.error('Error creating user from Telegram:', error);
      // Не открываем модалку автоматически, только при попытке создать комнату
    }
  }
  // Если нет Telegram данных, модалка не открывается автоматически
  // Она откроется только при нажатии на "Создать комнату"
};

const handleSubmitName = async (name: string) => {
  if (nameModalRef.value) {
    nameModalRef.value.setLoading(true);
  }
  try {
    const user = await usersApi.findOrCreateUser({ name });
    const savedUser = {
      id: user.id,
      name: user.name,
    };
    storage.setUser(savedUser);
    currentUser.value = savedUser;
    showNameModal.value = false;
  } catch (error) {
    console.error('Error creating user:', error);
    alert('Ошибка при создании пользователя');
  } finally {
    if (nameModalRef.value) {
      nameModalRef.value.setLoading(false);
    }
  }
};

const handleCloseNameModal = () => {
  // Не позволяем закрыть модалку без имени
  if (!currentUser.value) {
    return;
  }
  showNameModal.value = false;
};

const handleCreateRoom = async () => {
  // Если пользователь не авторизован, показываем модалку
  if (!currentUser.value) {
    showNameModal.value = true;
    return;
  }
  
  const user = currentUser.value;
  creating.value = true;
  try {
    const newRoom = await roomsApi.createRoom({
      createdBy: user.id,
    });
    await fetchRooms();
    // Можно добавить навигацию к созданной комнате
    console.log('Room created:', newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Ошибка при создании комнаты');
  } finally {
    creating.value = false;
  }
};

const handleRoomClick = (roomId: string) => {
  // Можно добавить навигацию к комнате
  console.log('Room clicked:', roomId);
};

const handleGameClick = async (typeGame: string) => {
  // Если пользователь не авторизован, показываем модалку
  if (!currentUser.value) {
    showNameModal.value = true;
    return;
  }

  creating.value = true;
  try {
    // Проверяем, есть ли у пользователя уже открытая игра
    const existingGame = await gamesApi.getActiveGameByUserAndType(
      currentUser.value.id,
      typeGame,
    );

    if (existingGame) {
      // Если есть активная игра, открываем её
      router.push({
        path: `/${existingGame._id}`,
        query: { type: typeGame },
      });
    } else {
      // Если нет активной игры, создаем новую
      const newGame = await gamesApi.createGame({
        typeGame,
        createdBy: currentUser.value.id,
      });
      
      // Переходим на страницу игры
      router.push({
        path: `/${newGame._id}`,
        query: { type: typeGame },
      });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    alert('Ошибка при создании игры');
  } finally {
    creating.value = false;
  }
};

const fetchGameStats = async () => {
  try {
    const stats = await gamesApi.getGameStats('association-text');
    gameStats.value['association-text'] = stats;
  } catch (error) {
    console.error('Error fetching game stats:', error);
  }
};

onMounted(async () => {
  await checkUser();
  await fetchRooms();
  await fetchGameStats();
});
</script>

<style scoped></style>

