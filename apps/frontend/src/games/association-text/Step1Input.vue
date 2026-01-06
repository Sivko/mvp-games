<template>
  <div class="bg-telegram-section rounded-lg shadow p-6 mb-4">
    <div class="mb-4">
      <h2 class="text-2xl font-bold text-telegram-text mb-4">
        {{ question }}
      </h2>
      <div class="text-telegram-text-secondary mb-4">
        <span v-if="timerEndsAt">Время: {{ timeLeft }} сек</span>
        <span v-else>
          Готовы: {{ readyCount }} / {{ onlineUsersCount }}
        </span>
      </div>
    </div>

    <div class="flex gap-2">
      <input v-model="answerText" type="text" placeholder="Введите ваш вариант ответа"
        class="w-full px-4 py-2 border border-telegram-section-separator rounded-lg bg-telegram-bg text-telegram-text focus:outline-none focus:ring-2 focus:ring-telegram-button"
        :disabled="answerSubmitted" @keyup.enter="handleSubmit" />


      <button @click="handleSubmit" :disabled="!answerText.trim() || answerSubmitted"
        class="px-4 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
        <!-- {{ answerSubmitted ? 'Ответ отправлен' : 'Отправить ответ' }} -->
        <BsSend />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { BsSend } from 'vue-icons-plus/bs';

const props = defineProps<{
  question: string;
  timerEndsAt: number | null;
  readyCount: number;
  onlineUsersCount: number;
  answerSubmitted: boolean;
  currentTime: number;
}>();

const emit = defineEmits<{
  (e: 'submit', text: string): void;
}>();

const answerText = ref('');

const timeLeft = computed(() => {
  if (!props.timerEndsAt) return 0;
  const left = Math.max(0, Math.ceil((props.timerEndsAt - props.currentTime) / 1000));
  return left;
});

const handleSubmit = () => {
  if (!answerText.value.trim() || props.answerSubmitted) {
    return;
  }
  emit('submit', answerText.value.trim());
};

// Сбрасываем поле ввода при сбросе состояния
watch(() => props.answerSubmitted, (newVal) => {
  if (!newVal) {
    answerText.value = '';
  }
});
</script>

<style scoped></style>
