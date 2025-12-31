<template>
  <div class="">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-xl p-8">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Комната #{{ room?.roomNumber }}</h1>
            <p class="text-gray-600 mt-1">Исходное слово: <span class="font-semibold">{{ room?.sourceWord }}</span></p>
          </div>
          <button @click="$emit('back-to-list')"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
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
        <div v-else-if="room" class="space-y-6 flex flex-col">
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

          <div class="grid grid-cols-3 gap-4">
            <!-- Связанные слова -->
            <div class="col-span-2">
              <h2 class="text-xl font-bold text-gray-800 mb-4">Связанные слова</h2>
              <div v-if="getLinkingWordsCount(room) === 0" class="py-8 text-gray-500 text-center">
                Пока нет связанных слов
              </div>
              <div v-else class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="item in sortedLinkingWords" :key="item.word"
                  :class="selectedSimilarityClass(item.similarity)">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-semibold text-lg">{{ item.word }}</span>
                      <span class="ml-4 text-sm text-gray-600">
                        Сходство: {{ (item.similarity * 100).toFixed(2) }}%
                      </span>
                    </div>
                    <span class="text-xs text-gray-500">{{ item.user?.name || 'Неизвестный' }}</span>
                  </div>
                </div>
              </div>
            </div>
            <Chat :socket="socket" />
          </div>

          <!-- Добавление слова -->
          <div class="flex gap-2 items-center">
            <input type="text" v-model="newWord" @keypress.enter="addWord" placeholder="Введите новое слово"
              :disabled="!isConnected"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
            <button @click="addWord" :disabled="!isConnected || !newWord.trim()" aria-label="Добавить слово"
              class="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold">
              <GrSend />
            </button>
          </div>

          <!-- Статус подключения -->
          <div class="text-sm text-center">
            <span :class="isConnected ? 'text-green-600' : 'text-red-600'" class="font-semibold">
              {{ isConnected ? '● Подключено к серверу' : '○ Отключено от сервера' }}
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { GrSend } from "vue-icons-plus/gr";
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { roomApi } from '../api/roomApi'
import Chat from './Chat.vue'
import { io } from 'socket.io-client'

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
const newWord = ref('')
const socket = ref(null)
const isConnected = ref(false)

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

const connectWebSocket = () => {
  socket.value = io('http://localhost:3000', {
    transports: ['websocket']
  })

  socket.value.on('connect', () => {
    isConnected.value = true
    console.log('WebSocket connected:', socket.value.id)

    // Присоединяемся к комнате
    if (props.roomId) {
      socket.value.emit('join-room', { roomId: props.roomId })
    }
  })

  socket.value.on('disconnect', () => {
    isConnected.value = false
    console.log('WebSocket disconnected')
  })

  // socket.value.on('room-updated', (data) => {
  //   // Обновляем данные комнаты при получении обновлений
  //   if (data.room) {
  //     room.value = data.room
  //   }
  // })

  socket.value.on('word-added', (data) => {
    // Обновляем список связанных слов
    if (room.value && data.word && data.similarity !== undefined) {
      if (!room.value.linkingWords) {
        room.value.linkingWords = {}
      }
      room.value.linkingWords[data.word] = {
        similarity: data.similarity,
        user: data.user || { name: 'Неизвестный' }
      }
    }
  })

  socket.value.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err)
    isConnected.value = false
  })
}

const disconnectWebSocket = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
    isConnected.value = false
  }
}

const addWord = async () => {
  if (!newWord.value.trim() || !isConnected.value) {
    return
  }

  const word = newWord.value.trim()

  try {
    // Отправляем слово через WebSocket
    socket.value.emit('add-word', {
      roomId: props.roomId,
      word: word,
      user: { id: 'user-1', name: 'User' } // Временное значение, можно заменить на реального пользователя
    })

    newWord.value = ''
  } catch (err) {
    console.error('Error adding word:', err)
    error.value = 'Ошибка при добавлении слова'
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

const selectedSimilarityClass = (similarity) => {
  if (similarity < 0.5) {
    return 'bg-red-100 border border-red-300 rounded-lg p-3'
  } else if (similarity < 0.8) {
    return 'bg-yellow-100 border border-yellow-300 rounded-lg p-3'
  } else {
    return 'bg-green-100 border border-green-300 rounded-lg p-3'
  }
}

const sortedLinkingWords = computed(() => {
  if (!room.value || !room.value.linkingWords || typeof room.value.linkingWords !== 'object') {
    return []
  }

  // Преобразуем объект в массив и сортируем по similarity (от большего к меньшему)
  return Object.entries(room.value.linkingWords)
    .map(([word, wordData]) => ({
      word,
      ...wordData
    }))
    .sort((a, b) => b.similarity - a.similarity)
})

watch(() => props.roomId, () => {
  if (props.roomId) {
    fetchRoom()
    // Переподключаемся к новой комнате
    if (socket.value && isConnected.value) {
      socket.value.emit('join-room', { roomId: props.roomId })
    }
  }
})

onMounted(() => {
  if (props.roomId) {
    fetchRoom()
    connectWebSocket()
  }
})

onUnmounted(() => {
  disconnectWebSocket()
})
</script>
