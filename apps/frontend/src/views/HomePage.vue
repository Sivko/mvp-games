<template>
  <div class="min-h-screen bg-telegram-bg flex items-center justify-center p-8">
    <div class="max-w-md mx-auto text-center">
      <div class="bg-telegram-section rounded-lg shadow p-8 mb-4">
        <h1 class="text-3xl font-bold text-telegram-text mb-6">
          Добро пожаловать
        </h1>
        <div class="text-telegram-text-secondary mb-4">
          Цель участников игры «Сто к одному» состоит в том, чтобы угадать наиболее распространённые ответы людей на предложенные вопросы, на которые невозможно дать однозначный объективный ответ, например, «Какую еду
          больше всего любят французы?». Ответы бывают порой совершенно непредсказуемы и очень забавны. К примеру, на
          вопрос «Кто поддерживает порядок в стране?» десять из ста случайных людей могут дать ответ «дворники».
        </div>
        <img :src="getReactionImageUrl('🤔')" class="w-1/2 mx-auto mb-4" />
        <button @click="handleStart" :disabled="loading"
          class="px-8 py-3 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg">
          {{ loading ? 'Загрузка...' : 'Начать' }}
        </button>
      </div>

      <AddNameModal ref="nameModalRef" :show="shouldShowModal" @close="handleCloseNameModal"
        @submit="handleSubmitName" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import AddNameModal from '../components/AddNameModal.vue';
import { getReactionImageUrl } from '../utils/reactions';

const router = useRouter();
const userStore = useUserStore();
const currentUser = computed(() => userStore.currentUser);
const loading = ref(false);

const showNameModal = ref(false);
const nameModalRef = ref<InstanceType<typeof AddNameModal> | null>(null);

const shouldShowModal = computed(() => {
  return showNameModal.value && !currentUser.value;
});

const handleSubmitName = async (name: string) => {
  if (nameModalRef.value) {
    nameModalRef.value.setLoading(true);
  }
  try {
    await userStore.createUserWithName(name);
    showNameModal.value = false;
    // После создания пользователя делаем редирект
    router.push('/my');
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
    const userId = await userStore.checkAndCreateUser();

    if (userId) {
      // Если пользователь авторизован, делаем редирект
      router.push('/my');
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
</script>

<style scoped></style>
