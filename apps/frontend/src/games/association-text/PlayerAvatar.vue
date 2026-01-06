<template>
  <div
    ref="referenceRef"
    class="w-10 h-10 rounded-full bg-telegram-header flex items-center justify-center text-white font-semibold text-sm cursor-pointer"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    {{ initial }}
  </div>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="floatingRef"
      :style="floatingStyles"
      class="bg-telegram-header text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 pointer-events-none transition-opacity duration-150"
      :class="{ 'opacity-0': !isVisible }"
    >
      {{ userName }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useFloating, autoUpdate } from '@floating-ui/vue';
import { offset, shift, flip } from '@floating-ui/core';

const props = defineProps<{
  userName: string;
  initial: string;
}>();

const referenceRef = ref<HTMLElement | null>(null);
const floatingRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const isVisible = ref(false);

const { floatingStyles, update } = useFloating(referenceRef, floatingRef, {
  placement: 'top',
  middleware: [offset(8), shift(), flip()],
});

// Автоматическое обновление позиции при изменении элементов
let cleanupAutoUpdate: (() => void) | null = null;

watch([referenceRef, floatingRef, isOpen], ([ref, floating, open]) => {
  if (ref && floating && open) {
    cleanupAutoUpdate = autoUpdate(ref, floating, update);
  } else if (cleanupAutoUpdate) {
    cleanupAutoUpdate();
    cleanupAutoUpdate = null;
  }
});

onUnmounted(() => {
  if (cleanupAutoUpdate) {
    cleanupAutoUpdate();
  }
});

let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

const handleMouseEnter = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
  hoverTimeout = setTimeout(() => {
    isOpen.value = true;
    // Небольшая задержка для плавного появления
    setTimeout(() => {
      isVisible.value = true;
    }, 10);
  }, 200);
};

const handleMouseLeave = () => {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  isVisible.value = false;
  setTimeout(() => {
    isOpen.value = false;
  }, 150);
};
</script>

