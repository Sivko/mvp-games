<template>
  <div class="reaction-types-page">
    <div class="header">
      <h1>Reaction Types</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">Create New</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Image</th>
            <th>Weight</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item._id">
            <td>{{ item.name }}</td>
            <td>
              <span v-if="item.image" class="image-url">{{ item.image }}</span>
              <span v-else class="no-image">No image</span>
            </td>
            <td>{{ item.weight }}</td>
            <td class="actions">
              <button @click="editItem(item)" class="btn btn-sm btn-secondary">Edit</button>
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
          <h2>{{ editingItem ? 'Edit' : 'Create' }} Reaction Type</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="formData.name" type="text" class="form-control" placeholder="Enter reaction name" />
          </div>
          <div class="form-group">
            <label>Image URL</label>
            <input v-model="formData.image" type="text" class="form-control" placeholder="Enter image URL (optional)" />
          </div>
          <div class="form-group">
            <label>Weight *</label>
            <input v-model.number="formData.weight" type="number" class="form-control" placeholder="Enter weight (for sorting)" />
            <small class="form-hint">Lower weight = appears first</small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveItem" class="btn btn-primary" :disabled="!isFormValid">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { reactionTypesApi, type ReactionType } from '@/api/reactionTypesApi';

const items = ref<ReactionType[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showCreateModal = ref(false);
const editingItem = ref<ReactionType | null>(null);

const formData = ref<Partial<ReactionType>>({
  name: '',
  image: null,
  weight: 0,
});

const isFormValid = computed(() => {
  return formData.value.name && formData.value.name.trim() !== '' && 
         formData.value.weight !== undefined && formData.value.weight !== null;
});

const loadItems = async () => {
  loading.value = true;
  error.value = null;
  try {
    items.value = await reactionTypesApi.getAll();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load items';
  } finally {
    loading.value = false;
  }
};

const editItem = (item: ReactionType) => {
  editingItem.value = { ...item };
  formData.value = {
    name: item.name,
    image: item.image,
    weight: item.weight,
  };
  showCreateModal.value = true;
};

const saveItem = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields';
    return;
  }

  try {
    const dataToSave = {
      name: formData.value.name!,
      image: formData.value.image || null,
      weight: formData.value.weight!,
    };

    if (editingItem.value?._id) {
      await reactionTypesApi.update(editingItem.value._id, dataToSave);
    } else {
      await reactionTypesApi.create(dataToSave);
    }
    closeModal();
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save item';
  }
};

const deleteItem = async (id: string) => {
  if (!confirm('Are you sure you want to delete this reaction type?')) {
    return;
  }
  try {
    await reactionTypesApi.delete(id);
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete item';
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingItem.value = null;
  formData.value = {
    name: '',
    image: null,
    weight: 0,
  };
  error.value = null;
};

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.reaction-types-page {
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

.image-url {
  color: #2196f3;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.no-image {
  color: #999;
  font-style: italic;
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

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
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
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #2196f3;
}

.form-hint {
  display: block;
  margin-top: 4px;
  color: #666;
  font-size: 12px;
}
</style>



