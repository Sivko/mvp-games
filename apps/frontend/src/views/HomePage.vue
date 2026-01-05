<template>
  <div class="min-h-screen bg-telegram-bg flex items-center justify-center p-8">
    <div class="max-w-md mx-auto text-center">
      <div class="bg-telegram-section rounded-lg shadow p-8 mb-4">
        <h1 class="text-3xl font-bold text-telegram-text mb-6">
          Добро пожаловать
        </h1>
        <button
          @click="handleStart"
          :disabled="loading"
          class="px-8 py-3 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
        >
          {{ loading ? 'Загрузка...' : 'Начать' }}
        </button>
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
import { usersApi } from '../api/usersApi';
import { storage } from '../utils/storage';
import { getTelegramWebApp } from '../utils/telegramTheme';
import AddNameModal from '../components/AddNameModal.vue';

const router = useRouter();
const loading = ref(false);
const showNameModal = ref(false);
const nameModalRef = ref<InstanceType<typeof AddNameModal> | null>(null);
const currentUser = ref(storage.getUser());

const shouldShowModal = computed(() => {
  return showNameModal.value && !currentUser.value;
});

const checkAndCreateUser = async (): Promise<string | null> => {
  const storedUser = storage.getUser();
  if (storedUser) {
    // Пользователь уже есть
    currentUser.value = storedUser;
    return storedUser.id;
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
      return savedUser.id;
    } catch (error) {
      console.error('Error creating user from Telegram:', error);
      return null;
    }
  }

  // Если нет Telegram данных, возвращаем null
  return null;
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
    // После создания пользователя делаем редирект
    router.push(`/${savedUser.id}`);
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

const handleStart = async () => {
  loading.value = true;
  try {
    // Проверяем, есть ли уже авторизованный пользователь
    const userId = await checkAndCreateUser();

    if (userId) {
      // Если пользователь авторизован, делаем редирект
      router.push(`/${userId}`);
    } else {
      // Если пользователь не авторизован или ошибка при авторизации, показываем модалку для создания
      showNameModal.value = true;
    }
  } catch (error) {
    console.error('Error checking user:', error);
    // При ошибке показываем модалку для создания пользователя
    showNameModal.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Проверяем, есть ли данные авторизации в localStorage
  const storedUser = storage.getUser();
  
  if (storedUser && storedUser.id) {
    try {
      // Проверяем, существует ли пользователь
      const user = await usersApi.findOrCreateUser({ name: storedUser.name || '' });
      
      if (user && user.id) {
        // Если пользователь найден, делаем редирект
        router.push(`/${storedUser.id}`);
      } else {
        // Если пользователь не найден, выводим ошибку в консоль
        console.error('User not found in database');
      }
    } catch (error) {
      // Если ошибка при проверке пользователя, выводим в консоль
      console.error('Error checking user from localStorage:', error);
    }
  }
});
</script>

<style scoped></style>

