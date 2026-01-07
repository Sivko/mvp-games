<template>
  <div v-if="winners.length > 0" class="mb-4">
    <h3 class="text-lg font-semibold text-telegram-text mb-3">Итоги по реакциям</h3>
    <div class="space-y-4">
      <div
        v-for="winner in winners"
        :key="winner.reactionTypeId"
        class="px-4 py-4 bg-telegram-bg-secondary rounded-lg"
      >
        <div class="text-telegram-text font-semibold text-lg mb-3">
          {{ winner.title }}
        </div>
        <div v-if="winner.question" class="text-telegram-text-secondary mb-2">
          {{ winner.question }}
        </div>
        <div v-if="winner.author" class="flex items-center gap-2">
          <PlayerAvatar 
            :user-name="winner.author" 
            :initial="winner.author.charAt(0).toUpperCase()"
            :is-show-score="false"
          />
          <div class="flex flex-col text-telegram-text font-medium">
            <span class="font-bold">{{ winner.author }}</span>
            <span>{{ winner.answerText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PlayerAvatar from './PlayerAvatar.vue';

interface ReactionWithPopulate {
  _id: string;
  reactionId: string | { _id: string; name: string; image: string | null; textFromFinalRound: string | null };
  answerId: string | { 
    _id: string; 
    text: string; 
    bankAssociationTextId?: string | { _id: string; question: string };
    user?: { name?: string; telegramUsername?: string; telegramFirstName?: string } 
  };
  userId: string | { _id: string; name?: string; telegramUsername?: string; telegramFirstName?: string };
}

const props = defineProps<{
  reactions: ReactionWithPopulate[];
}>();

const winners = computed(() => {
  // Группируем реакции по типу реакции и ответу
  const reactionGroups = new Map<string, Map<string, {
    reactionTypeId: string;
    title: string;
    question: string | null;
    answerText: string;
    answerId: string;
    author: string | null;
    count: number;
  }>>();

  props.reactions.forEach((reaction) => {
    // Проверяем, что reactionId - объект и имеет textFromFinalRound
    if (typeof reaction.reactionId !== 'object' || !reaction.reactionId) {
      return;
    }

    const textFromFinalRound = reaction.reactionId.textFromFinalRound;
    if (!textFromFinalRound) {
      return;
    }

    // Проверяем, что answerId - объект
    if (typeof reaction.answerId !== 'object' || !reaction.answerId) {
      return;
    }

    const reactionTypeId = reaction.reactionId._id || String(reaction.reactionId);
    const answerText = reaction.answerId.text || '';
    const answerId = reaction.answerId._id || String(reaction.answerId);

    // Получаем вопрос из bankAssociationTextId
    let question: string | null = null;
    if (reaction.answerId.bankAssociationTextId) {
      if (typeof reaction.answerId.bankAssociationTextId === 'object') {
        question = reaction.answerId.bankAssociationTextId.question || null;
      }
    }

    // Получаем имя автора из user
    let author: string | null = null;
    if (reaction.answerId.user) {
      if (typeof reaction.answerId.user === 'object') {
        author = reaction.answerId.user.telegramFirstName || 
                 reaction.answerId.user.name || 
                 reaction.answerId.user.telegramUsername || 
                 null;
      }
    }

    // Группируем по типу реакции
    if (!reactionGroups.has(reactionTypeId)) {
      reactionGroups.set(reactionTypeId, new Map());
    }

    const answerMap = reactionGroups.get(reactionTypeId)!;
    
    // Если для этого ответа еще нет записи, создаем
    if (!answerMap.has(answerId)) {
      answerMap.set(answerId, {
        reactionTypeId,
        title: textFromFinalRound,
        question,
        answerText,
        answerId,
        author,
        count: 0,
      });
    }

    // Увеличиваем счетчик реакций для этого ответа
    const answerData = answerMap.get(answerId)!;
    answerData.count++;
  });

  // Для каждого типа реакции выбираем ответ с максимальным количеством реакций
  const winnersList: Array<{
    reactionTypeId: string;
    title: string;
    question: string | null;
    answerText: string;
    answerId: string;
    author: string | null;
  }> = [];

  reactionGroups.forEach((answerMap) => {
    let maxCount = 0;
    let winner: {
      reactionTypeId: string;
      title: string;
      question: string | null;
      answerText: string;
      answerId: string;
      author: string | null;
    } | null = null;

    answerMap.forEach((answerData) => {
      if (answerData.count > maxCount) {
        maxCount = answerData.count;
        winner = {
          reactionTypeId: answerData.reactionTypeId,
          title: answerData.title,
          question: answerData.question,
          answerText: answerData.answerText,
          answerId: answerData.answerId,
          author: answerData.author,
        };
      }
    });

    if (winner) {
      winnersList.push(winner);
    }
  });

  return winnersList;
});
</script>

<style scoped></style>

