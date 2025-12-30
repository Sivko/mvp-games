<template>
  <div class="flex flex-col h-screen max-w-4xl mx-auto p-4">
    <div class="bg-white rounded-lg shadow-lg flex flex-col h-full">
      <!-- Заголовок чата -->
      <div class="bg-blue-600 text-white p-4 rounded-t-lg">
        <h2 class="text-xl font-bold">WebSocket Chat</h2>
        <div class="text-sm mt-1">
          <span :class="isConnected ? 'text-green-200' : 'text-red-200'">
            {{ isConnected ? '● Подключено' : '○ Отключено' }}
          </span>
        </div>
      </div>

      <!-- Область сообщений -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2"
      >
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="[
            'p-3 rounded-lg max-w-[80%]',
            message.type === 'sent'
              ? 'ml-auto bg-blue-500 text-white'
              : message.type === 'broadcast'
              ? 'bg-purple-100 text-purple-900 border-l-4 border-purple-500'
              : 'bg-white text-gray-800 border border-gray-200'
          ]"
        >
          <div v-if="message.type === 'broadcast'" class="text-xs font-semibold mb-1">
            Broadcast от {{ message.from }}
          </div>
          <div class="text-sm">{{ message.text }}</div>
          <div class="text-xs opacity-70 mt-1">
            {{ message.timestamp }}
          </div>
        </div>
        <div v-if="messages.length === 0" class="text-center text-gray-400 py-8">
          Нет сообщений. Начните общение!
        </div>
      </div>

      <!-- Поле ввода -->
      <div class="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div class="flex gap-2">
          <input
            v-model="inputMessage"
            @keypress.enter="sendMessage"
            type="text"
            placeholder="Введите сообщение..."
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="!isConnected"
          />
          <button
            @click="sendMessage"
            :disabled="!isConnected || !inputMessage.trim()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { io } from 'socket.io-client'

const socket = ref(null)
const isConnected = ref(false)
const messages = ref([])
const inputMessage = ref('')
const messagesContainer = ref(null)

const addMessage = (text, type = 'received', from = null) => {
  const now = new Date()
  const timestamp = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  messages.value.push({
    text,
    type,
    timestamp,
    from: from || 'Server'
  })

  // Автопрокрутка к последнему сообщению
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const connect = () => {
  socket.value = io('http://localhost:3000', {
    transports: ['websocket']
  })

  socket.value.on('connect', () => {
    isConnected.value = true
    addMessage('Подключено к серверу', 'system')
  })

  socket.value.on('disconnect', () => {
    isConnected.value = false
    addMessage('Отключено от сервера', 'system')
  })

  socket.value.on('message', (data) => {
    if (data.type === 'connection') {
      addMessage(`Подключение установлено. ID: ${data.clientId}`, 'system')
    } else if (data.type === 'response') {
      addMessage(data.message, 'received')
    }
  })

  socket.value.on('broadcast', (data) => {
    addMessage(data.message, 'broadcast', data.from)
  })

  socket.value.on('pong', (data) => {
    addMessage(`Pong: ${data.message}`, 'system')
  })

  socket.value.on('connect_error', (error) => {
    addMessage(`Ошибка подключения: ${error.message}`, 'system')
    isConnected.value = false
  })
}

const sendMessage = () => {
  if (!isConnected.value || !inputMessage.value.trim()) {
    return
  }

  const messageText = inputMessage.value.trim()
  addMessage(messageText, 'sent')
  
  socket.value.emit('message', { message: messageText })
  inputMessage.value = ''
}

const disconnect = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

onMounted(() => {
  connect()
})

onUnmounted(() => {
  disconnect()
})
</script>

