<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Комната #{{ room?.roomNumber }}</h1>
            <p class="text-gray-600 mt-1">Исходное слово: <span class="font-semibold">{{ room?.sourceWord }}</span></p>
          </div>
          <button
            @click="$emit('back-to-list')"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            ← Назад к списку
          </button>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Загрузка комнаты...</p>
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ error }}
        </div>

        <!-- Контент комнаты -->
        <div v-else-if="room" class="space-y-6">
          <!-- Статистика -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <p class="text-sm text-gray-600">Игр сыграно</p>
              <p class="text-2xl font-bold text-blue-600">{{ room.gamesCount }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <p class="text-sm text-gray-600">Слов добавлено</p>
              <p class="text-2xl font-bold text-green-600">{{ getLinkingWordsCount(room) }}</p>
            </div>
            <div class="bg-purple-50 rounded-lg p-4 text-center">
              <p class="text-sm text-gray-600">Статус</p>
              <p class="text-lg font-semibold text-purple-600">{{ getStatusText(room.status) }}</p>
            </div>
          </div>

          <!-- Связанные слова -->
          <div>
            <h2 class="text-xl font-bold text-gray-800 mb-4">Связанные слова</h2>
            <div v-if="getLinkingWordsCount(room) === 0" class="text-center py-8 text-gray-500">
              Пока нет связанных слов
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(wordData, word) in room.linkingWords"
                :key="word"
                class="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div class="flex justify-between items-center">
                  <div>
                    <span class="font-semibold text-lg">{{ word }}</span>
                    <span class="ml-4 text-sm text-gray-600">
                      Сходство: {{ (wordData.similarity * 100).toFixed(2) }}%
                    </span>
                  </div>
                  <span class="text-xs text-gray-500">{{ wordData.user?.name || 'Неизвестный' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Черный список -->
          <div v-if="room.blackListWord && room.blackListWord.length > 0">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Черный список слов</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="word in room.blackListWord"
                :key="word"
                class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
              >
                {{ word }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { roomApi } from '../api/roomApi'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back-to-list'])

const room = ref(null)
const loading = ref(true)
const error = ref(null)

const fetchRoom = async () => {
  loading.value = true
  error.value = null
  try {
    room.value = await roomApi.getRoomById(props.roomId)
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке комнаты'
    console.error('Error fetching room:', err)
  } finally {
    loading.value = false
  }
}

const getLinkingWordsCount = (room) => {
  if (!room.linkingWords || typeof room.linkingWords !== 'object') {
    return 0
  }
  return Object.keys(room.linkingWords).length
}

const getStatusText = (status) => {
  const statusMap = {
    waiting: 'Ожидание',
    active: 'Активна',
    finished: 'Завершена'
  }
  return statusMap[status] || status
}

watch(() => props.roomId, () => {
  if (props.roomId) {
    fetchRoom()
  }
})

onMounted(() => {
  if (props.roomId) {
    fetchRoom()
  }
})
</script>

