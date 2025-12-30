<script setup>
import { ref, onMounted } from 'vue'
import RoomList from './components/RoomList.vue'
import RoomView from './components/RoomView.vue'

const currentRoomId = ref(null)

// Функция для получения ID из URL
const getRoomIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('id')
}

// Функция для обновления URL
const updateUrl = (roomId) => {
  const url = new URL(window.location.href)
  if (roomId) {
    url.searchParams.set('id', roomId)
  } else {
    url.searchParams.delete('id')
  }
  window.history.pushState({}, '', url)
}

// Инициализация при монтировании
onMounted(() => {
  const roomId = getRoomIdFromUrl()
  if (roomId) {
    currentRoomId.value = roomId
  }
})

// Слушаем изменения URL (для кнопки "Назад" в браузере)
window.addEventListener('popstate', () => {
  const roomId = getRoomIdFromUrl()
  currentRoomId.value = roomId || null
})

const handleEnterRoom = (roomId) => {
  currentRoomId.value = roomId
  updateUrl(roomId)
}

const handleBackToList = () => {
  currentRoomId.value = null
  updateUrl(null)
}
</script>

<template>
  <div id="app" class="mx-auto">
    <RoomList v-if="!currentRoomId" @enter-room="handleEnterRoom" />
    <RoomView v-else :room-id="currentRoomId" @back-to-list="handleBackToList" />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
