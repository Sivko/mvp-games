<template>
  <div class="elasticsearch-test-page">
    <div class="header">
      <h1>Elasticsearch Test</h1>
    </div>

    <div class="form-container">
      <div class="form-group">
        <label>Bank Association Text ID (опционально)</label>
        <input
          v-model="bankAssociationTextId"
          type="text"
          class="form-control"
          placeholder="Введите ID вопроса (необязательно)"
        />
      </div>
      <div class="form-group">
        <label>Size (максимальное количество слов)</label>
        <input
          v-model.number="size"
          type="number"
          class="form-control"
          placeholder="По умолчанию: 10000"
          min="1"
        />
      </div>
      <div class="form-actions">
        <button @click="fetchData" class="btn btn-primary" :disabled="loading || initializing">
          {{ loading ? 'Загрузка...' : 'Получить данные' }}
        </button>
        <button @click="initializeIndex" class="btn btn-warning" :disabled="loading || initializing">
          {{ initializing ? 'Инициализация...' : 'Инициализировать индекс' }}
        </button>
        <button @click="clearData" class="btn btn-secondary" :disabled="!responseData">
          Очистить
        </button>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="initMessage" class="success">{{ initMessage }}</div>

    <div v-if="responseData" class="response-container">
      <div class="response-header">
        <h2>Ответ (JSON)</h2>
        <button @click="copyToClipboard" class="btn btn-sm btn-secondary">Копировать JSON</button>
      </div>
      <pre class="json-output">{{ formattedJson }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { elasticsearchApi } from '@/api/elasticsearchApi';

const bankAssociationTextId = ref<string>('');
const size = ref<number | undefined>(undefined);
const loading = ref(false);
const initializing = ref(false);
const error = ref<string | null>(null);
const responseData = ref<any>(null);
const initMessage = ref<string | null>(null);

const formattedJson = computed(() => {
  if (!responseData.value) return '';
  return JSON.stringify(responseData.value, null, 2);
});

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  responseData.value = null;

  try {
    const data = await elasticsearchApi.getUniqueWords(
      size.value,
      bankAssociationTextId.value || undefined,
    );
    responseData.value = data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch data';
  } finally {
    loading.value = false;
  }
};

const initializeIndex = async () => {
  if (!confirm('Вы уверены, что хотите инициализировать индекс? Это удалит существующий индекс и пересоздаст его со всеми данными из MongoDB.')) {
    return;
  }

  initializing.value = true;
  error.value = null;
  initMessage.value = null;

  try {
    const result = await elasticsearchApi.initialize();
    initMessage.value = result.message || 'Индекс успешно инициализирован';
    // Очищаем предыдущие результаты после инициализации
    responseData.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to initialize Elasticsearch';
  } finally {
    initializing.value = false;
  }
};

const clearData = () => {
  responseData.value = null;
  error.value = null;
  initMessage.value = null;
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
    alert('JSON скопирован в буфер обмена');
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
};
</script>

<style scoped>
.elasticsearch-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
}

.form-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
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
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #2196f3;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.error {
  padding: 16px;
  background-color: #ffebee;
  color: #c62828;
  border-radius: 4px;
  margin-bottom: 20px;
}

.success {
  padding: 16px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  margin-bottom: 20px;
}

.response-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.response-header h2 {
  margin: 0;
  font-size: 18px;
}

.json-output {
  padding: 20px;
  margin: 0;
  background-color: #f9f9f9;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  max-height: 600px;
  overflow-y: auto;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1976d2;
}

.btn-secondary {
  background-color: #757575;
  color: white;
}

.btn-secondary:hover {
  background-color: #616161;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #f57c00;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}
</style>

