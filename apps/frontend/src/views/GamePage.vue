<template>
  <div class="">
    <AssociationTextMain
      v-if="game && game.typeGame === 'association-text' && currentUser"
      :game-id="game._id"
      :user-id="game.createdBy"
      :question="game.question"
      @new-game-id="handleNewGameId"
    />
    <div v-else-if="!currentUser" class="min-h-screen bg-telegram-bg flex items-center justify-center p-8">
      <div class="max-w-md mx-auto text-center">
        <div class="bg-telegram-section rounded-lg shadow p-8 mb-4">
          <h1 class="text-3xl font-bold text-telegram-text mb-6">
            Добро пожаловать
          </h1>
        </div>
        <AddNameModal
          ref="nameModalRef"
          :show="true"
          @close="handleCloseNameModal"
          @submit="handleSubmitName"
        />
      </div>
    </div>
    <div v-else class="min-h-screen bg-telegram-bg">
      <div class="max-w-4xl mx-auto">
        <div class="bg-telegram-header p-4 rounded-lg mb-4">
          <h1 class="text-3xl font-bold text-telegram-button-text mb-2">
            Игра в слова
          </h1>
        </div>
        <div class="bg-telegram-section rounded-lg shadow p-2 mb-4">
          {{ JSON.stringify(game) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';
import { onMounted, ref, computed } from 'vue';
import { useUserStore } from '../stores/user';
import AssociationTextMain from '../games/association-text/main.vue';
import AddNameModal from '../components/AddNameModal.vue';

const route = useRoute();
// Получаем gameId из параметров маршрута
const gameId = ref<string>(route.params.gameId as string);
const game = ref<Game | null>(null);
const userStore = useUserStore();
const currentUser = computed(() => userStore.currentUser);
const nameModalRef = ref<InstanceType<typeof AddNameModal> | null>(null);

const handleSubmitName = async (name: string) => {
  if (nameModalRef.value) {
    nameModalRef.value.setLoading(true);
  }
  try {
    await userStore.createUserWithName(name);
    // После создания пользователя загружаем игру
    await loadGame();
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
};

const loadGame = async () => {
  if (!gameId.value) {
    console.error('GameId is not available');
    return;
  }
  try {
    // Загружаем игру по ID
    game.value = await gamesApi.getGameById(gameId.value);
    console.log(game);
  } catch (error) {
    console.error('Error loading game:', error);
  }
};

const handleNewGameId = async (newGameId: string) => {
  console.log('[GamePage] Получен новый gameId, загрузка новой игры:', newGameId);
  try {
    // Загружаем новую игру по ID
    game.value = await gamesApi.getGameById(newGameId);
    console.log('[GamePage] Новая игра загружена:', game.value);
  } catch (error) {
    console.error('[GamePage] Ошибка загрузки новой игры:', error);
  }
};

onMounted(async () => {
  // Проверяем, есть ли уже авторизованный пользователь
  await userStore.checkAndCreateUser();

  // Если пользователь авторизован, загружаем игру
  if (currentUser.value && gameId.value) {
    await loadGame();
  }
  // Если пользователь не авторизован, модалка покажется автоматически через условие в template
});
</script>
<style scoped></style>