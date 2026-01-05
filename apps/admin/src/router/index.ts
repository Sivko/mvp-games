import { createRouter, createWebHistory } from 'vue-router'
import BankAssociationText from '@/views/BankAssociationText.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/bank-association-text',
    },
    {
      path: '/bank-association-text',
      name: 'BankAssociationText',
      component: BankAssociationText,
    },
  ],
})

export default router
