<template>
  <Sheet v-model:visible="isVisible">
    <template #header>
      <div class="p-4 border-b border-telegram-section-separator">
        <h3 class="text-lg font-semibold text-telegram-text">
          Обратная связь по вопросу '{{ question }}'
        </h3>
      </div>
    </template>

    <div class="p-4">
      <button
        @click="handleComplain"
        :disabled="loading"
        class="w-full px-4 py-3 rounded-lg bg-red-500 text-telegram-text hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {{ loading ? 'Отправка...' : 'Пожаловаться' }}
      </button>
    </div>
    <img :src="getReactionImageUrl('😦')" />
  </Sheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet } from 'bottom-sheet-vue3'
import { complainAssociationTextApi } from '../../api/complainAssociationTextApi'
import { getReactionImageUrl } from '../../utils/reactions'

const props = defineProps<{
  visible: boolean
  question: string
  userId: string
  bankAssociationTextId?: string
  answerId?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'complained'): void
}>()

const isVisible = ref(props.visible)
const loading = ref(false)

watch(() => props.visible, (newVal) => {
  isVisible.value = newVal
})

watch(isVisible, (newVal) => {
  emit('update:visible', newVal)
})

const handleComplain = async () => {
  if (loading.value) return

  loading.value = true
  try {
    await complainAssociationTextApi.createComplain({
      bankAssociationTextId: props.bankAssociationTextId,
      answerId: props.answerId,
      userId: props.userId,
    })
    emit('complained')
    isVisible.value = false
  } catch (error) {
    console.error('Failed to submit complain:', error)
    alert('Не удалось отправить жалобу. Попробуйте позже.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>

