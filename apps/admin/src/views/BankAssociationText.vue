<template>
  <div class="bank-association-text-page">
    <div class="header">
      <h1>Bank Association Text</h1>
      <div class="header-actions">
        <button @click="handleImport" class="btn btn-success" :disabled="importing">
          {{ importing ? 'Импорт...' : 'Сделать импорт' }}
        </button>
        <button @click="showCreateModal = true" class="btn btn-primary">Create New</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item._id">
            <td>{{ item.question }}</td>
            <td>
              <span :class="['status', item.status ? 'active' : 'inactive']">
                {{ item.status ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="actions">
              <button @click="editItem(item)" class="btn btn-sm btn-secondary">Edit</button>
              <button @click="manageAnswers(item)" class="btn btn-sm btn-info">Редактирование ответов</button>
              <button @click="deleteItem(item._id!)" class="btn btn-sm btn-danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingItem" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div>
            <h2>{{ editingItem ? 'Edit' : 'Create' }} Bank Association Text</h2>
            <div v-if="editingItem?._id" class="item-id">
              ID: {{ editingItem._id }}
            </div>
          </div>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Question</label>
            <input v-model="formData.question" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label>
              <input v-model="formData.status" type="checkbox" />
              Active
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveItem" class="btn btn-primary">Save</button>
        </div>
      </div>
    </div>

    <!-- Answers Modal -->
    <div v-if="showAnswersModal && currentItem" class="modal-overlay" @click="closeAnswersModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h2>Редактирование ответов - {{ currentItem.question }}</h2>
          <button @click="closeAnswersModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="answersLoading" class="loading">Загрузка ответов...</div>
          <div v-if="answersError" class="error">{{ answersError }}</div>
          
          <div v-if="!answersLoading && !answersError" class="answers-container">
            <div class="answers-header">
              <p>Всего ответов: {{ answersTotal }}</p>
            </div>

            <!-- Add New Answer Form -->
            <div class="add-answer">
              <h3>Добавить новый ответ</h3>
              <div class="form-row">
                <input 
                  v-model="newAnswer.text" 
                  placeholder="Текст ответа" 
                  class="form-control" 
                  @keyup.enter="createAnswer"
                />
                <input 
                  v-model.number="newAnswer.score" 
                  type="number" 
                  placeholder="Оценка" 
                  class="form-control form-control-small" 
                />
                <button @click="createAnswer" class="btn btn-primary">Добавить</button>
              </div>
            </div>
            
            <div class="answers-list">
              <div v-for="answer in answers" :key="answer._id" class="answer-item">
                <div class="answer-info">
                  <div class="answer-text">
                    <input 
                      v-model="answer.text" 
                      @blur="updateAnswer(answer)" 
                      class="form-control" 
                    />
                  </div>
                  <div class="answer-meta">
                    <span class="answer-user">
                      Пользователь: {{ getUserName(answer) }}
                    </span>
                    <span class="answer-score">
                      Оценка: 
                      <input 
                        v-model.number="answer.score" 
                        @blur="updateAnswer(answer)" 
                        type="number" 
                        class="form-control form-control-small" 
                      />
                    </span>
                    <span v-if="answer.createdAt" class="answer-date">
                      {{ formatDate(answer.createdAt) }}
                    </span>
                  </div>
                </div>
                <button @click="deleteAnswer(answer._id)" class="btn btn-sm btn-danger">Удалить</button>
              </div>
            </div>

            <div v-if="answers.length === 0 && !answersLoading" class="no-answers">
              Ответы не найдены
            </div>

            <div v-if="answersTotal > answers.length" class="pagination">
              <button 
                @click="loadAnswers(currentAnswersPage - 1)" 
                :disabled="currentAnswersPage === 1"
                class="btn btn-sm btn-secondary"
              >
                Предыдущая
              </button>
              <span>Страница {{ currentAnswersPage }} из {{ Math.ceil(answersTotal / answersLimit) }}</span>
              <button 
                @click="loadAnswers(currentAnswersPage + 1)" 
                :disabled="currentAnswersPage >= Math.ceil(answersTotal / answersLimit)"
                class="btn btn-sm btn-secondary"
              >
                Следующая
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAnswersModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { bankAssociationTextApi, type BankAssociationText } from '@/api/bankAssociationTextApi';
import { answersApi, type Answer } from '@/api/answersApi';

const items = ref<BankAssociationText[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const importing = ref(false);
const showCreateModal = ref(false);
const editingItem = ref<BankAssociationText | null>(null);
const currentItem = ref<BankAssociationText | null>(null);
const showAnswersModal = ref(false);
const answers = ref<Answer[]>([]);
const answersLoading = ref(false);
const answersError = ref<string | null>(null);
const answersTotal = ref(0);
const currentAnswersPage = ref(1);
const answersLimit = 50;

const formData = ref<Partial<BankAssociationText>>({
  question: '',
  status: true,
});

const newAnswer = ref<{ text: string; score: number }>({
  text: '',
  score: 0,
});

const loadItems = async () => {
  loading.value = true;
  error.value = null;
  try {
    items.value = await bankAssociationTextApi.getAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load items';
  } finally {
    loading.value = false;
  }
};

const editItem = (item: BankAssociationText) => {
  editingItem.value = { ...item };
  formData.value = {
    question: item.question,
    status: item.status,
  };
  showCreateModal.value = true;
};

const saveItem = async () => {
  try {
    if (editingItem.value?._id) {
      await bankAssociationTextApi.update(editingItem.value._id, formData.value);
    } else {
      await bankAssociationTextApi.create(formData.value);
    }
    closeModal();
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save item';
  }
};

const deleteItem = async (id: string) => {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }
  try {
    await bankAssociationTextApi.delete(id);
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete item';
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingItem.value = null;
  formData.value = { question: '', status: true };
};

const manageAnswers = (item: BankAssociationText) => {
  currentItem.value = item;
  showAnswersModal.value = true;
  currentAnswersPage.value = 1;
  loadAnswers(1);
};

const loadAnswers = async (page: number) => {
  if (!currentItem.value?._id) return;
  
  answersLoading.value = true;
  answersError.value = null;
  try {
    // Используем поиск по bankAssociationTextId вместо поиска по вопросу
    const response = await answersApi.getByBankAssociationTextId(
      currentItem.value._id,
      page,
      answersLimit
    );
    answers.value = response.answers;
    answersTotal.value = response.total;
    currentAnswersPage.value = page;
  } catch (err) {
    answersError.value = err instanceof Error ? err.message : 'Failed to load answers';
  } finally {
    answersLoading.value = false;
  }
};

const updateAnswer = async (answer: Answer) => {
  try {
    await answersApi.update(answer._id, {
      text: answer.text,
      score: answer.score,
    });
    // Обновляем локальный список
    const index = answers.value.findIndex(a => a._id === answer._id);
    if (index !== -1) {
      answers.value[index] = answer;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update answer';
  }
};

const deleteAnswer = async (answerId: string) => {
  if (!confirm('Are you sure you want to delete this answer?')) {
    return;
  }
  try {
    await answersApi.delete(answerId);
    answers.value = answers.value.filter(a => a._id !== answerId);
    answersTotal.value--;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete answer';
  }
};

const createAnswer = async () => {
  if (!newAnswer.value.text || !currentItem.value?.question) return;
  
  try {
    const created = await answersApi.createByQuestion({
      question: currentItem.value.question,
      text: newAnswer.value.text,
      bankAssociationTextId: currentItem.value._id,
      score: newAnswer.value.score || 0,
    });
    
    // Добавляем новый ответ в начало списка
    answers.value.unshift(created);
    answersTotal.value++;
    
    // Очищаем форму
    newAnswer.value = { text: '', score: 0 };
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create answer';
  }
};

const getUserName = (answer: Answer): string => {
  if (!answer.user) {
    return 'Неизвестный';
  }
  if (typeof answer.user === 'string') {
    return 'Неизвестный';
  }
  if (answer.user.telegramFirstName) {
    return answer.user.telegramFirstName;
  }
  if (answer.user.name) {
    return answer.user.name;
  }
  return 'Неизвестный';
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ru-RU');
};

const closeAnswersModal = () => {
  showAnswersModal.value = false;
  currentItem.value = null;
  answers.value = [];
  answersTotal.value = 0;
  currentAnswersPage.value = 1;
  answersError.value = null;
  newAnswer.value = { text: '', score: 0 };
};

const handleImport = async () => {
  if (!confirm('Вы уверены? Все существующие записи будут удалены перед импортом новых данных.')) {
    return;
  }

  importing.value = true;
  error.value = null;
  
  try {
    const result = await bankAssociationTextApi.import();
    
    if (result.success) {
      alert(`Импорт успешно завершен!\nИмпортировано вопросов: ${result.imported}\nУдалено записей: ${result.deleted.bankAssociationTexts} вопросов, ${result.deleted.answers} ответов`);
      await loadItems();
    } else {
      const errorMessage = result.errors.length > 0 
        ? `Ошибки при импорте:\n${result.errors.join('\n')}`
        : 'Импорт завершен с ошибками';
      alert(errorMessage);
      if (result.imported > 0) {
        await loadItems();
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import data';
    alert(`Ошибка импорта: ${error.value}`);
  } finally {
    importing.value = false;
  }
};

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.bank-association-text-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header h1 {
  margin: 0;
}

.loading,
.error {
  padding: 20px;
  text-align: center;
}

.error {
  color: red;
}

.table-container {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.status.active {
  background-color: #4caf50;
  color: white;
}

.status.inactive {
  background-color: #f44336;
  color: white;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-secondary {
  background-color: #757575;
  color: white;
}

.btn-secondary:hover {
  background-color: #616161;
}

.btn-info {
  background-color: #00bcd4;
  color: white;
}

.btn-info:hover {
  background-color: #0097a7;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.btn-success {
  background-color: #4caf50;
  color: white;
}

.btn-success:hover {
  background-color: #45a049;
}

.btn-success:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-large {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.modal-header h2 {
  margin: 0;
}

.modal-header .item-id {
  margin-top: 4px;
  font-size: 12px;
  color: #757575;
  font-family: monospace;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #757575;
}

.close-btn:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #2196f3;
}

.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-row .form-control {
  flex: 1;
}

.answers-container {
  max-height: 60vh;
  overflow-y: auto;
}

.answers-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ddd;
}

.answers-header p {
  margin: 0;
  font-weight: 500;
}

.add-answer {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.add-answer h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
}

.answers-list {
  margin-bottom: 20px;
}

.answer-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  align-items: flex-start;
}

.answer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-text {
  width: 100%;
}

.answer-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #666;
  align-items: center;
}

.answer-user,
.answer-score,
.answer-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-control-small {
  width: 80px;
  padding: 4px 8px;
  font-size: 12px;
}

.no-answers {
  text-align: center;
  padding: 40px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #ddd;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>


