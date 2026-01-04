<template>
  <div class="">
    <div class="">
      <div class="">
        <div class="flex justify-between items-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800">Комнаты игры</h1>
          <button
            @click="showCreateModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            + Создать комнату
          </button>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Загрузка комнат...</p>
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ error }}
        </div>

        <!-- Список комнат -->
        <div v-else-if="rooms.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="room in rooms"
            :key="room._id"
            @click="enterRoom(room._id)"
            class="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-bold text-gray-800">Комната #{{ room.roomNumber }}</h3>
              <span
                :class="{
                  'bg-green-100 text-green-800': room.status === 'active',
                  'bg-yellow-100 text-yellow-800': room.status === 'waiting',
                  'bg-gray-100 text-gray-800': room.status === 'finished',
                }"
                class="px-3 py-1 rounded-full text-xs font-semibold"
              >
                {{ getStatusText(room.status) }}
              </span>
            </div>
            
            <div class="space-y-2 text-sm text-gray-600">
              <p><span class="font-semibold">Исходное слово:</span> {{ room.sourceWord }}</p>
              <p><span class="font-semibold">Игр сыграно:</span> {{ room.gamesCount }}</p>
              <p><span class="font-semibold">Слов добавлено:</span> {{ getLinkingWordsCount(room) }}</p>
            </div>

            <div class="mt-4 pt-4 border-t border-gray-200">
              <p class="text-xs text-gray-500">
                Создано: {{ formatDate(room.createdAt) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Пустой список -->
        <div v-else class="text-center py-12">
          <p class="text-gray-600 text-lg mb-4">Нет доступных комнат</p>
          <button
            @click="showCreateModal = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Создать первую комнату
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания комнаты -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showCreateModal = false"
    >
      <div class="">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Создать новую комнату</h2>
        
        <form @submit.prevent="handleCreateRoom" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Номер комнаты
            </label>
            <input
              v-model="newRoom.roomNumber"
              type="number"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите номер комнаты"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Исходное слово
            </label>
            <input
              v-model="newRoom.sourceWord"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите исходное слово"
            />
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ creating ? 'Создание...' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { roomApi } from '../api/roomApi'

const emit = defineEmits(['enter-room'])

const rooms = ref([])
const loading = ref(true)
const error = ref(null)
const showCreateModal = ref(false)
const creating = ref(false)

const newRoom = ref({
  roomNumber: null,
  sourceWord: '',
  created: {
    user: { id: 'user-1', name: 'User' } // Временное значение, можно заменить на реального пользователя
  }
})

const fetchRooms = async () => {
  loading.value = true
  error.value = null
  try {
    rooms.value = await roomApi.getAllRooms()
  } catch (err) {
    error.value = err.message || 'Ошибка при загрузке комнат'
    console.error('Error fetching rooms:', err)
  } finally {
    loading.value = false
  }
}

const handleCreateRoom = async () => {
  creating.value = true
  try {
    const createdRoom = await roomApi.createRoom(newRoom.value)
    await fetchRooms() // Обновляем список
    showCreateModal.value = false
    // Переходим в созданную комнату
    enterRoom(createdRoom._id)
  } catch (err) {
    error.value = err.message || 'Ошибка при создании комнаты'
    console.error('Error creating room:', err)
  } finally {
    creating.value = false
  }
}

const enterRoom = (roomId) => {
  emit('enter-room', roomId)
}

const getStatusText = (status) => {
  const statusMap = {
    waiting: 'Ожидание',
    active: 'Активна',
    finished: 'Завершена'
  }
  return statusMap[status] || status
}

const getLinkingWordsCount = (room) => {
  if (!room.linkingWords || typeof room.linkingWords !== 'object') {
    return 0
  }
  return Object.keys(room.linkingWords).length
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchRooms()
})
</script>

