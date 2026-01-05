<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="handleClose"
  >
    <div class="bg-telegram-section rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-xl font-semibold text-telegram-section-header mb-4">
        Добавить имя
      </h2>
      <p class="text-telegram-text mb-4">
        Введите ваше имя, чтобы начать игру
      </p>
      <input
        v-model="name"
        type="text"
        placeholder="Ваше имя"
        class="w-full px-4 py-2 border border-telegram-section-separator rounded-lg bg-telegram-bg text-telegram-text focus:outline-none focus:ring-2 focus:ring-telegram-button mb-4"
        @keyup.enter="handleSubmit"
      />
      <div class="flex gap-2 justify-end">
        <button
          @click="handleClose"
          class="px-4 py-2 rounded-lg bg-telegram-bg-secondary text-telegram-text hover:opacity-90 transition-opacity"
        >
          Отмена
        </button>
        <button
          @click="handleSubmit"
          :disabled="!name.trim() || loading"
          class="px-4 py-2 rounded-lg bg-telegram-button text-telegram-button-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', name: string): void;
}>();

const name = ref('');
const loading = ref(false);

watch(() => props.show, (newVal) => {
  if (newVal) {
    name.value = '';
  }
});

const handleSubmit = () => {
  if (!name.value.trim() || loading.value) return;
  loading.value = true;
  emit('submit', name.value.trim());
  // loading будет сброшен родительским компонентом
};

const handleClose = () => {
  if (loading.value) return;
  emit('close');
};

defineExpose({
  setLoading: (value: boolean) => {
    loading.value = value;
  },
});
</script>

<style scoped></style>


