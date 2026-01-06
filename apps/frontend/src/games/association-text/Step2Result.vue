<template>
  <div class="bg-telegram-section rounded-lg shadow p-4 mb-4 overflow-scroll h-full">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4">
        Результаты
      </h2>
      <div class="text-telegram-text-secondary mb-4">
        <span v-if="timerEndsAt">Время: {{ timeLeft }} сек</span>
        <span v-else>
          <!-- Готовы: {{ readyCount }} / {{ onlineUsersCount }} -->
          <!-- (нужно {{ Math.ceil(onlineUsersCount / 2) + 1 }}) -->
        </span>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="answer in answers" :key="answer.id"
        class="px-2 pt-2 bg-telegram-bg-secondary rounded-lg flex justify-between"
        :class="{ 'opacity-50': answer.userId === currentUserId }">
        <div class="flex flex-col">
          <div class="text-telegram-text-secondary text-sm">
            <span v-if="answer.userId === currentUserId">Ваш ответ</span>
            <span v-else>{{ answer.userName || 'Неизвестный' }}</span>
          </div>
          <div class="text-telegram-text font-semibold">
            {{ answer.text }}
          </div>
        </div>

        <div class="flex mt-2">
          <button v-for="reactionType in reactionTypes" :key="reactionType._id"
            @click="handleToggleReaction(answer.id, reactionType._id)" :class="[
              'rounded-lg text-sm transition-opacity',
              isReactionActive(answer.id, reactionType._id)
                ? 'bg-telegram-button text-telegram-button-text'
                : 'bg-telegram-bg-secondary text-telegram-text hover:opacity-90',
            ]">
            <img :src="getReactionImageUrl(reactionType.name)" :alt="reactionType.name" class="h-10">
            <span v-if="getReactionCount(answer.id, reactionType._id) > 0"
              class="bg-telegram-button text-telegram-button-text rounded-full px-2 text-xs">
              {{ getReactionCount(answer.id, reactionType._id) }}
            </span>
          </button>
        </div>
      </div>
      <div v-if="!readyForNextRound" class="mb-4">
        <hr />
        <div class="text-center mt-4 mb-4">Ответы других пользователей</div>
        
        <!-- Загрузка -->
        <div v-if="loadingOtherAnswers" class="text-center text-telegram-text-secondary py-4">
          Загрузка...
        </div>

        <!-- Список ответов других пользователей -->
        <div v-else-if="otherAnswers.length > 0" class="space-y-4">
          <div v-for="answer in otherAnswers" :key="answer._id"
            class="px-2 pt-2 bg-telegram-bg-secondary rounded-lg flex justify-between">
            <div class="flex flex-col">
              <div class="text-telegram-text-secondary text-sm">
                {{ getUserName(answer) }}
              </div>
              <div class="text-telegram-text font-semibold">
                {{ answer.text }}
              </div>
            </div>
          </div>

          <!-- Уникальные слова с подсчетом -->
          <div v-if="uniqueWords.length > 0" class="mt-4">
            <div class="text-center mb-2 text-telegram-text-secondary text-sm">
              Популярные слова
            </div>
            <div class="space-y-2">
              <div v-for="word in uniqueWords" :key="word.text"
                class="px-2 pt-2 bg-telegram-bg-secondary rounded-lg flex justify-between">
                <div class="text-telegram-text font-semibold">
                  {{ word.text }}
                </div>
                <div class="text-telegram-text-secondary">
                  {{ word.count }}
                </div>
              </div>
            </div>
          </div>

          <!-- Пагинация -->
          <div v-if="totalOtherAnswers > limit" class="flex justify-center items-center gap-2 mt-4">
            <button
              @click="loadOtherAnswers(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              Назад
            </button>
            <span class="text-telegram-text">
              Страница {{ currentPage }} из {{ totalPages }}
            </span>
            <button
              @click="loadOtherAnswers(currentPage + 1)"
              :disabled="currentPage >= totalPages"
              class="px-4 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              Вперед
            </button>
          </div>
        </div>

        <!-- Нет ответов -->
        <div v-else class="text-center text-telegram-text-secondary py-4">
          Нет других ответов по этому вопросу
        </div>
      </div>
    </div>
  </div>
  <div v-if="!readyForNextRound" class="mb-4">
    <button @click="handleMarkReady"
      class="px-6 py-2 w-full rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity font-semibold">
      Далее
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getReactionImageUrl } from '../../utils/reactions';
import { answersApi, type Answer } from '../../api/answersApi';
import { elasticsearchApi, type WordCount } from '../../api/elasticsearchApi';

const props = defineProps<{
  timerEndsAt: number | null;
  onlineUsersCount: number;
  readyForNextRound: boolean;
  answers: Array<{ id: string; userId: string; text: string; userName?: string }>;
  currentUserId: string | null;
  reactionTypes: Array<{ _id: string; name: string }>;
  reactions: Record<string, Array<{ userId: string; reactionId: string }>>;
  currentTime: number;
  gameId: string;
  question: string;
  bankAssociationTextId?: string;
}>();

// Состояние для ответов других пользователей
const otherAnswers = ref<Answer[]>([]);
const loadingOtherAnswers = ref(false);
const currentPage = ref(1);
const totalOtherAnswers = ref(0);
const limit = 10;

// Состояние для уникальных слов
const uniqueWords = ref<WordCount[]>([]);
const loadingUniqueWords = ref(false);

const totalPages = computed(() => Math.ceil(totalOtherAnswers.value / limit));

// Отладка для проверки reactionTypes
onMounted(() => {
  console.log('Step2Result mounted, reactionTypes:', props.reactionTypes);
  console.log('Step2Result reactions:', props.reactions);
  // Загружаем ответы других пользователей при монтировании
  if (props.question && props.gameId) {
    loadOtherAnswers(1);
    loadUniqueWords();
  }
});

// Загружаем ответы при изменении вопроса или gameId
watch([() => props.question, () => props.gameId, () => props.bankAssociationTextId], () => {
  if (props.question && props.gameId) {
    currentPage.value = 1;
    loadOtherAnswers(1);
    loadUniqueWords();
  }
});

const loadOtherAnswers = async (page: number) => {
  if (!props.question || !props.gameId) return;
  
  loadingOtherAnswers.value = true;
  try {
    const response = await answersApi.getAnswersByQuestion(
      props.question,
      props.gameId,
      page,
      limit,
    );
    otherAnswers.value = response.answers;
    totalOtherAnswers.value = response.total;
    currentPage.value = page;
  } catch (error) {
    console.error('Failed to load other answers:', error);
    otherAnswers.value = [];
    totalOtherAnswers.value = 0;
  } finally {
    loadingOtherAnswers.value = false;
  }
};

const getUserName = (answer: Answer): string => {
  if (!answer.user) {
    return 'Неизвестный';
  }
  if (typeof answer.user === 'string') {
    return 'Неизвестный';
  }
  if (answer.user.telegramFirstName) {
    return answer.user.telegramFirstName;
  }
  if (answer.user.name) {
    return answer.user.name;
  }
  return 'Неизвестный';
};

const loadUniqueWords = async () => {
  loadingUniqueWords.value = true;
  try {
    const words = await elasticsearchApi.getUniqueWords(
      100, // Максимум 100 слов
      props.bankAssociationTextId,
    );
    uniqueWords.value = words;
  } catch (error) {
    console.error('Failed to load unique words:', error);
    uniqueWords.value = [];
  } finally {
    loadingUniqueWords.value = false;
  }
};

const emit = defineEmits<{
  (e: 'toggle-reaction', answerId: string, reactionId: string): void;
  (e: 'mark-ready'): void;
}>();

const timeLeft = computed(() => {
  if (!props.timerEndsAt) return 0;
  const left = Math.max(0, Math.ceil((props.timerEndsAt - props.currentTime) / 1000));
  return left;
});

const handleToggleReaction = (answerId: string, reactionId: string) => {
  emit('toggle-reaction', answerId, reactionId);
};

const handleMarkReady = () => {
  if (!props.readyForNextRound) {
    emit('mark-ready');
  }
};

const isReactionActive = (answerId: string, reactionId: string): boolean => {
  if (!props.currentUserId) return false;
  const answerReactions = props.reactions[answerId] || [];
  return answerReactions.some(
    (r) => r.userId === props.currentUserId && r.reactionId === reactionId,
  );
};

const getReactionCount = (answerId: string, reactionId: string): number => {
  const answerReactions = props.reactions[answerId] || [];
  const count = answerReactions.filter((r) => r.reactionId === reactionId).length;
  return count;
};
</script>

<style scoped></style>
