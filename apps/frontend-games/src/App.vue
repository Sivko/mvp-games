<script setup>
import { ref, onMounted, computed } from 'vue'
import RoomList from './components/RoomList.vue'
import RoomView from './components/RoomView.vue'
import SearchWordGame from './games/search-word/SearchWordGame.vue'
import Toast from './components/toast/Toast.vue'

const currentRoomId = ref(null)
const currentGame = ref(null)

// Функция для получения параметров из URL
const getParamsFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const idParam = params.get('id')
  
  // Формат: ?id=${id}/search-word или ?id=${id}
  let id = null
  let gameName = null
  
  if (idParam) {
    const parts = idParam.split('/')
    id = parts[0]
    if (parts.length > 1) {
      gameName = parts.slice(1).join('/')
    }
  }
  
  return { id, gameName }
}

// Функция для обновления URL
const updateUrl = (roomId, gameName = null) => {
  const url = new URL(window.location.href)
  
  if (roomId) {
    const idValue = gameName ? `${roomId}/${gameName}` : roomId
    url.searchParams.set('id', idValue)
  } else {
    url.searchParams.delete('id')
  }
  
  window.history.pushState({}, '', url)
}

// Инициализация при монтировании
onMounted(() => {
  const { id, gameName } = getParamsFromUrl()
  if (id) {
    currentRoomId.value = id
    if (gameName) {
      currentGame.value = gameName
    }
  }
})

// Слушаем изменения URL (для кнопки "Назад" в браузере)
window.addEventListener('popstate', () => {
  const { id, gameName } = getParamsFromUrl()
  currentRoomId.value = id || null
  currentGame.value = gameName || null
})

const handleEnterRoom = (roomId) => {
  currentRoomId.value = roomId
  currentGame.value = null
  updateUrl(roomId)
}

const handleBackToList = () => {
  currentRoomId.value = null
  currentGame.value = null
  updateUrl(null)
}

const handleEnterGame = ({ roomId, gameName }) => {
  currentRoomId.value = roomId
  currentGame.value = gameName
  updateUrl(roomId, gameName)
}

const handleBackToRoom = () => {
  currentGame.value = null
  updateUrl(currentRoomId.value)
}

// Определяем какой компонент показывать
const currentView = computed(() => {
  if (!currentRoomId.value) {
    return 'room-list'
  }
  if (currentGame.value) {
    return 'game'
  }
  return 'room-view'
})
</script>

<template>
  <div id="app" class="container mx-auto">
    <div class="p-4 bg-white rounded-lg shadow-xl h-screen">
      <Toast ref="toastRef" />
      <RoomList v-if="currentView === 'room-list'" @enter-room="handleEnterRoom" />
      <RoomView 
        v-else-if="currentView === 'room-view'" 
        :room-id="currentRoomId" 
        @back-to-list="handleBackToList"
        @enter-game="handleEnterGame"
      />
      <SearchWordGame 
        v-else-if="currentView === 'game' && currentGame === 'search-word'"
        :room-id="currentRoomId"
        @back-to-room="handleBackToRoom"
      />
    </div>
  </div>
</template>