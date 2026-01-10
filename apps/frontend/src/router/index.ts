import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import UserPage from '../views/UserPage.vue'
import GamePage from '../views/GamePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/my',
      name: 'user',
      component: UserPage,
    },
    {
      path: '/my/game/:gameId',
      name: 'game',
      component: GamePage,
    },
  ],
})

export default router
