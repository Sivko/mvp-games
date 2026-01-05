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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUser } from '../composables/useUser';
import AddNameModal from '../components/AddNameModal.vue';

const router = useRouter();
const { currentUser, checkAndCreateUser, createUserWithName } = useUser();
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
    const userId = await createUserWithName(name);
    showNameModal.value = false;
    // После создания пользователя делаем редирект
    router.push(`/${userId}`);
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
</script>

<style scoped></style>

