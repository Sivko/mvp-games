<template>
  <div class="flex flex-col h-full overflow-hidden justify-between">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-800">Комната #{{ room?.roomNumber }}</h1>
        <!-- <p class="text-gray-600 mt-1">Исходное слово: <span class="font-semibold">{{ room?.sourceWord }}</span></p> -->
      </div>
      <button @click="$emit('back-to-room')"
        class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
        ← Назад к комнате
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

    <!-- Контент игры -->
    <div v-else-if="room" class="flex-1 overflow-hidden">
      <div class="grid grid-cols-3 gap-4 h-full">
        <div class="col-span-2 overflow-y-auto">
          <div v-if="getLinkingWordsCount(room) === 0" class="py-8 text-gray-500 text-center">
            Пока нет отгаданных слов
          </div>
          <div v-else class="space-y-2 overflow-y-auto">
            <div v-for="item in sortedLinkingWords" :key="item.word"
              :class="similarityRanges.find(range => item.similarity <= range.range)?.class">
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
    </div>

    <!-- Input и кнопка добавления слова -->
    <div class="flex gap-2 items-center pt-4">
      <input type="text" v-model="newWord" @keypress.enter="addWord" placeholder="Введите новое слово"
        :disabled="!isConnected"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" />
      <button @click="addWord" :disabled="!isConnected || !newWord.trim()" aria-label="Добавить слово"
        class="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold">
        <GrSend />
      </button>
    </div>
  </div>
</template>

<script setup>
import { GrSend } from "vue-icons-plus/gr";
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { roomApi } from '../../api/roomApi'
import Chat from '../../components/Chat.vue'
import { io } from 'socket.io-client'
import { useToast } from 'primevue/usetoast'
import { createSimilarityRanges } from '../../constants'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back-to-room'])

const room = ref(null)
const loading = ref(true)
const error = ref(null)
const newWord = ref('')
const socket = ref(null)
const isConnected = ref(false)
const toast = useToast()
const similarityRanges = createSimilarityRanges(toast)

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
  const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000'
  socket.value = io(websocketUrl, {
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

  socket.value.on('word-added', (data) => {
    // Обновляем список связанных слов только если это не кастомное сообщение
    if (room.value && data.word && data.similarity !== undefined && !data.isCustomMessage && data.similarity > 0) {
      if (!room.value.linkingWords) {
        room.value.linkingWords = {}
      }
      room.value.linkingWords[data.word] = {
        similarity: data.similarity,
        user: data.user || { name: 'Неизвестный' }
      }
    }
  })

  // Слушаем событие показа нотификации от backend
  socket.value.on('show-notification', (data) => {
    console.log('[Frontend] Received show-notification event:', data)
    console.log('[Frontend] Event data type:', data?.type)
    console.log('[Frontend] similarityRanges:', similarityRanges)

    if (data && data.type === 'medium-similarity') {
      // Находим range для среднего сходства (0.7) и вызываем его notification
      const mediumRange = similarityRanges.find(range => range.range === 0.7)
      console.log('[Frontend] Medium range found:', mediumRange)
      console.log('[Frontend] Medium range notification function:', mediumRange?.notification)

      if (mediumRange && mediumRange.notification) {
        console.log('[Frontend] Calling notification function with:', { userName: data.userName, similarity: data.similarity })
        try {
          mediumRange.notification(data.userName, data.similarity)
          console.log('[Frontend] Notification function called successfully')
        } catch (error) {
          console.error('[Frontend] Error calling notification function:', error)
        }
      } else {
        console.log('[Frontend] Medium range or notification not found')
        console.log('[Frontend] mediumRange:', mediumRange)
        console.log('[Frontend] mediumRange.notification:', mediumRange?.notification)
      }
    } else {
      console.log('[Frontend] Event type is not medium-similarity or data is invalid')
    }
  })

  console.log('[Frontend] show-notification event listener registered')

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

