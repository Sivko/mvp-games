<template>
  <div class="flex flex-col h-full p-4 border border-gray-200 rounded-lg">
    <h2 class="text-xl font-bold text-gray-800 mb-4 flex justify-between">
      <span>Чат</span>
      <span class="flex items-center gap-2 text-sm font-normal">
        <span class="block w-2 h-2 bg-green-500 rounded-full"></span>
        {{ onlineUsersCount }}
      </span>
    </h2>
    <div 
      ref="messagesContainer" 
      class="flex-1 overflow-y-auto space-y-2 max-h-96"
      @scroll="handleScroll"
    >
      <div v-if="sortedMessages.length === 0" class="text-gray-500 text-center py-8">
        Добро пожаловать!
      </div>
      <div v-for="message in sortedMessages" :key="message.id" class="p-2 bg-gray-50 rounded-lg">
        <div class="text-sm font-semibold text-gray-700">{{ message.userName }}</div>
        <div class="text-gray-800">{{ message.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  socket: {
    type: Object,
    default: null
  }
})

const messages = ref([])
const onlineUsersCount = ref(0)
const messagesContainer = ref(null)
const isScrolledToBottom = ref(true)

const isAtBottom = (element) => {
  const threshold = 100 // Порог в пикселях от низа
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleScroll = () => {
  if (messagesContainer.value) {
    isScrolledToBottom.value = isAtBottom(messagesContainer.value)
  }
}

const handleWordAdded = async (data) => {
  if (data.word && data.user) {
    messages.value.push({
      id: Date.now() + Math.random(), // Уникальный ID для сообщения
      userName: data.user.name || 'Неизвестный',
      text: data.word,
      timestamp: Date.now()
    })
    // Сортируем по времени для гарантии хронологического порядка
    messages.value.sort((a, b) => a.timestamp - b.timestamp)
    
    // Прокручиваем вниз, если пользователь был внизу
    await nextTick()
    if (isScrolledToBottom.value) {
      scrollToBottom()
    }
  }
}

const handleUsersCountUpdated = (data) => {
  if (data.count !== undefined) {
    onlineUsersCount.value = data.count
  }
}

const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => a.timestamp - b.timestamp)
})

watch(() => props.socket, (newSocket) => {
  if (newSocket) {
    newSocket.on('word-added', handleWordAdded)
    newSocket.on('users-count-updated', handleUsersCountUpdated)
  }
}, { immediate: true })

watch(sortedMessages, async () => {
  await nextTick()
  if (isScrolledToBottom.value) {
    scrollToBottom()
  }
})

onMounted(() => {
  nextTick(() => {
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (props.socket) {
    props.socket.off('word-added', handleWordAdded)
    props.socket.off('users-count-updated', handleUsersCountUpdated)
  }
})
</script>

