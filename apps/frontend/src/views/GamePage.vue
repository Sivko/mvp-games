<template>
  <div>
    <AssociationTextMain
      v-if="game && game.typeGame === 'association-text' && currentUser"
      :game-id="game._id"
      :user-id="gameOwnerId"
      :question="game.question"
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
    <div v-else class="min-h-screen bg-telegram-bg p-8">
      <div class="max-w-4xl mx-auto">
        <div class="bg-telegram-header p-4 rounded-lg mb-4">
          <h1 class="text-3xl font-bold text-white mb-2">
            Игра в слова
          </h1>
        </div>
        <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
          {{ JSON.stringify(game) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { gamesApi, type Game } from '../api/gamesApi';
import { onMounted, ref } from 'vue';
import { useUser } from '../composables/useUser';
import AssociationTextMain from '../games/association-text/main.vue';
import AddNameModal from '../components/AddNameModal.vue';

const route = useRoute();
const gameOwnerId = route.params.userId as string; // ID владельца игры (из URL)
const gameType = route.params.gameType as string;
const game = ref<Game | null>(null);
const { currentUser, checkAndCreateUser, createUserWithName } = useUser();
const nameModalRef = ref<InstanceType<typeof AddNameModal> | null>(null);

const handleSubmitName = async (name: string) => {
  if (nameModalRef.value) {
    nameModalRef.value.setLoading(true);
  }
  try {
    await createUserWithName(name);
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
  try {
    // Получаем или создаем игру для владельца игры (из URL)
    // Это позволяет любому пользователю подключиться к игре владельца
    game.value = await gamesApi.findOrCreateGameByUserAndType(gameOwnerId, gameType);
    console.log(game);
  } catch (error) {
    console.error('Error loading game:', error);
  }
};

onMounted(async () => {
  // Проверяем, есть ли уже авторизованный пользователь
  await checkAndCreateUser();

  // Если пользователь авторизован, загружаем игру
  if (currentUser.value) {
    await loadGame();
  }
  // Если пользователь не авторизован, модалка покажется автоматически через условие в template
});
</script>
<style scoped></style>