<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Комната #{{ room?.roomNumber }}</h1>
      </div>
      <button @click="$emit('back-to-list')"
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
        ← Назад к списку
      </button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-12 flex-1">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Загрузка комнаты...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <!-- Список игр -->
    <div v-else-if="room" class="flex-1 overflow-y-auto">
      <div class="space-y-4">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Доступные игры</h2>
        
        <!-- Игра Search Word -->
        <div 
          @click="enterGame('search-word')"
          class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
        >
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Search Word</h3>
              <p class="text-gray-600 text-sm">
                Найдите слова, связанные с исходным словом по смыслу
              </p>
            </div>
            <div class="text-blue-600 font-semibold">
              →
            </div>
          </div>
        </div>

        <!-- Здесь можно добавить другие игры -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { roomApi } from '../api/roomApi'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back-to-list', 'enter-game'])

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

const enterGame = (gameName) => {
  emit('enter-game', { roomId: props.roomId, gameName })
}

onMounted(() => {
  if (props.roomId) {
    fetchRoom()
  }
})
</script>
