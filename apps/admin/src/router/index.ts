import { createRouter, createWebHistory } from 'vue-router'
import BankAssociationText from '@/views/BankAssociationText.vue'
import ReactionTypes from '@/views/ReactionTypes.vue'

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
    {
      path: '/reaction-types',
      name: 'ReactionTypes',
      component: ReactionTypes,
    },
  ],
})

export default router
