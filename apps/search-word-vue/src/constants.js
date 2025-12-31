// Функция для создания similarityRanges с коллбэками нотификаций
export const createSimilarityRanges = (toast) => {
  return [
    {
      range: 0.4,
      class: 'bg-red-100 border border-red-300 rounded-lg p-3',
      notification: null, // Низкое сходство - без нотификации
      statusClass: 'bg-red-100 rounded-full'
    },
    {
      range: 0.7,
      class: 'bg-yellow-100 border border-yellow-300 rounded-lg p-3',
      statusClass: 'bg-yellow-100 rounded-full',
      notification: (userName, similarity) => {
        // Среднее сходство - кастомная нотификация с headless Toast
        toast.add({
          severity: 'info',
          summary: 'Первое сходство!',
          group: 'headless',
          detail: `Пользователь ${userName} уже что-то нащупал...`,
          life: 4000 // Автоматическое закрытие через 3 секунды
        })
      }
    },
    {
      range: 1,
      class: 'bg-green-100 border border-green-300 rounded-lg p-3',
      notification: null,
      statusClass: 'bg-green-100 rounded-full'
    }
  ]
}

