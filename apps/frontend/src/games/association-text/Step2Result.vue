<template>
  <div class="bg-telegram-section rounded-lg shadow p-4 mb-4 overflow-scroll h-full">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4 cursor-pointer hover:opacity-80 transition-opacity"
        @click="showComplainModal = true">
        {{ question }}
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

        <!-- Популярные слова -->
        <div class="mt-4">
          <div class="text-center mb-2 text-telegram-text-secondary text-sm">
            Популярные слова
            <span class="text-xs">({{ uniqueWords.length }} items, bankId: {{ bankAssociationTextId }})</span>
          </div>
          <!-- Загрузка -->
          <div v-if="loadingUniqueWords" class="text-center text-telegram-text-secondary py-4">
            Загрузка...
          </div>
          <!-- Список слов -->
          <div v-else-if="uniqueWords.length > 0" class="space-y-2">
            <div v-for="(word, index) in uniqueWords"
              :key="`${bankAssociationTextId}-${question}-${word.text}-${index}`"
              class="px-2 pt-2 bg-telegram-bg-secondary rounded-lg flex justify-between">
              <div class="text-telegram-text font-semibold">
                {{ word.text }}
              </div>
              <div class="text-telegram-text-secondary">
                {{ word.count }}
              </div>
            </div>
          </div>
          <!-- Нет данных -->
          <div v-else class="text-center text-telegram-text-secondary py-4">
            Нет данных
          </div>
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

  <!-- Модальное окно для жалобы -->
  <ComplainModal v-model:visible="showComplainModal" :question="question" :user-id="userId || ''"
    :bank-association-text-id="bankAssociationTextId" @complained="handleComplained" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getReactionImageUrl } from '../../utils/reactions';
import { elasticsearchApi, type WordCount } from '../../api/elasticsearchApi';
import ComplainModal from './ComplainModal.vue';
import { useUser } from '../../composables/useUser';

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

// Состояние для уникальных слов
const uniqueWords = ref<WordCount[]>([]);
const loadingUniqueWords = ref(false);

// Храним последний загруженный bankAssociationTextId и question для предотвращения повторной загрузки
const lastLoadedBankAssociationTextId = ref<string | undefined>(undefined);
const lastLoadedQuestion = ref<string | undefined>(undefined);

// Состояние для модального окна жалобы
const { getCurrentUserId } = useUser();
const userId = ref<string | null>(getCurrentUserId());
const showComplainModal = ref(false);

// Отладка для проверки reactionTypes
onMounted(() => {
  console.log('Step2Result mounted, reactionTypes:', props.reactionTypes);
  console.log('Step2Result reactions:', props.reactions);
  console.log('Step2Result mounted - bankAssociationTextId:', props.bankAssociationTextId);
  console.log('Step2Result mounted - question:', props.question);
  console.log('Step2Result mounted - lastLoadedBankAssociationTextId:', lastLoadedBankAssociationTextId.value);
  console.log('Step2Result mounted - lastLoadedQuestion:', lastLoadedQuestion.value);

  // Загружаем популярные слова при монтировании если изменился bankAssociationTextId или question
  const bankAssociationTextIdChanged = props.bankAssociationTextId !== lastLoadedBankAssociationTextId.value;
  const questionChanged = props.question !== lastLoadedQuestion.value;

  if (props.bankAssociationTextId && (bankAssociationTextIdChanged || questionChanged)) {
    console.log('Step2Result mounted - loading unique words (changed bankAssociationTextId or question)');
    console.log('bankAssociationTextIdChanged:', bankAssociationTextIdChanged, 'questionChanged:', questionChanged);
    lastLoadedBankAssociationTextId.value = props.bankAssociationTextId;
    lastLoadedQuestion.value = props.question;
    loadUniqueWords();
  } else if (props.bankAssociationTextId && !bankAssociationTextIdChanged && !questionChanged) {
    console.log('Step2Result mounted - skipping load (same bankAssociationTextId and question)');
  } else {
    console.log('Step2Result mounted - no bankAssociationTextId');
  }
});

// Загружаем популярные слова при изменении bankAssociationTextId
watch(
  () => props.bankAssociationTextId,
  (newVal, oldVal) => {
    console.log('Step2Result watch bankAssociationTextId - old:', oldVal, 'new:', newVal);
    console.log('Current uniqueWords before clear:', uniqueWords.value.length, 'items');
    console.log('lastLoadedBankAssociationTextId:', lastLoadedBankAssociationTextId.value);

    if (newVal && newVal !== oldVal && newVal !== lastLoadedBankAssociationTextId.value) {
      console.log('Step2Result watch - bankAssociationTextId changed, clearing and loading');
      uniqueWords.value = [];
      lastLoadedBankAssociationTextId.value = newVal;
      loadUniqueWords();
    } else {
      console.log('Step2Result watch - bankAssociationTextId unchanged or already loaded');
    }
  },
  { immediate: false }
);

// Отслеживаем изменения question для отладки
watch(
  () => props.question,
  (newVal, oldVal) => {
    console.log('Step2Result watch question - old:', oldVal, 'new:', newVal);
    console.log('Current bankAssociationTextId:', props.bankAssociationTextId);
    console.log('lastLoadedBankAssociationTextId:', lastLoadedBankAssociationTextId.value);
    console.log('lastLoadedQuestion:', lastLoadedQuestion.value);

    // Если вопрос изменился, перезагружаем данные
    if (newVal !== oldVal && props.bankAssociationTextId) {
      console.log('Step2Result watch - question changed, reloading');
      lastLoadedQuestion.value = newVal;
      uniqueWords.value = [];
      loadUniqueWords();
    }
  },
  { immediate: false }
);

const loadUniqueWords = async () => {
  console.log('loadUniqueWords called');
  console.log('Current bankAssociationTextId:', props.bankAssociationTextId);
  console.log('Current question:', props.question);
  console.log('Current uniqueWords before load:', uniqueWords.value.length, 'items');
  console.log('lastLoadedBankAssociationTextId before load:', lastLoadedBankAssociationTextId.value);

  if (!props.bankAssociationTextId) {
    console.log('loadUniqueWords - no bankAssociationTextId, skipping');
    return;
  }

  loadingUniqueWords.value = true;
  try {
    console.log('Calling elasticsearchApi.getUniqueWords with:', {
      size: 100,
      bankAssociationTextId: props.bankAssociationTextId,
    });

    const words = await elasticsearchApi.getUniqueWords(
      100, // Максимум 100 слов
      props.bankAssociationTextId,
    );

    console.log('Received words from API:', words.length, 'items');
    console.log('First 5 words:', words.slice(0, 5));
    console.log('All words:', words.map(w => `${w.text} (${w.count})`));
    console.log('Current question when loading:', props.question);

    // Принудительно очищаем перед обновлением для гарантии обновления UI
    uniqueWords.value = [];
    console.log('Cleared uniqueWords.value, length:', uniqueWords.value.length);

    // Используем nextTick для гарантии обновления DOM
    await new Promise(resolve => setTimeout(resolve, 0));

    uniqueWords.value = words;
    lastLoadedBankAssociationTextId.value = props.bankAssociationTextId;
    lastLoadedQuestion.value = props.question;
    console.log('uniqueWords.value updated:', uniqueWords.value.length, 'items');
    console.log('uniqueWords.value contents:', uniqueWords.value.map(w => `${w.text} (${w.count})`));
    console.log('lastLoadedBankAssociationTextId updated to:', lastLoadedBankAssociationTextId.value);
    console.log('lastLoadedQuestion updated to:', lastLoadedQuestion.value);
  } catch (error) {
    console.error('Failed to load unique words:', error);
    uniqueWords.value = [];
  } finally {
    loadingUniqueWords.value = false;
    console.log('loadUniqueWords completed');
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

const handleComplained = () => {
  // Можно добавить уведомление об успешной отправке жалобы
  console.log('Жалоба отправлена');
};
</script>

<style scoped></style>
