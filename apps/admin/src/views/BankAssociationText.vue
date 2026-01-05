<template>
  <div class="bank-association-text-page">
    <div class="header">
      <h1>Bank Association Text</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">Create New</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && !error" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Status</th>
            <th>Variants Count</th>
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
            <td>{{ item.variants?.length || 0 }}</td>
            <td class="actions">
              <button @click="editItem(item)" class="btn btn-sm btn-secondary">Edit</button>
              <button @click="manageVariants(item)" class="btn btn-sm btn-info">Variants</button>
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
          <h2>{{ editingItem ? 'Edit' : 'Create' }} Bank Association Text</h2>
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

    <!-- Variants Modal -->
    <div v-if="showVariantsModal && currentItem" class="modal-overlay" @click="closeVariantsModal">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h2>Manage Variants - {{ currentItem.question }}</h2>
          <button @click="closeVariantsModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="variants-list">
            <div v-for="(variant, index) in currentItem.variants" :key="variant._id || index" class="variant-item">
              <input v-model="variant.variant" @blur="updateVariant(variant)" class="form-control" />
              <input v-model.number="variant.score" @blur="updateVariant(variant)" type="number" class="form-control" />
              <button @click="removeVariant(variant._id!)" class="btn btn-sm btn-danger">Remove</button>
            </div>
          </div>
          <div class="add-variant">
            <h3>Add New Variant</h3>
            <div class="form-row">
              <input v-model="newVariant.variant" placeholder="Variant text" class="form-control" />
              <input v-model.number="newVariant.score" type="number" placeholder="Score" class="form-control" />
              <button @click="addVariant" class="btn btn-primary">Add</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeVariantsModal" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { bankAssociationTextApi, type BankAssociationText, type Variant } from '@/api/bankAssociationTextApi';

const items = ref<BankAssociationText[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showCreateModal = ref(false);
const editingItem = ref<BankAssociationText | null>(null);
const showVariantsModal = ref(false);
const currentItem = ref<BankAssociationText | null>(null);

const formData = ref<Partial<BankAssociationText>>({
  question: '',
  status: true,
});

const newVariant = ref<{ variant: string; score: number }>({
  variant: '',
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

const manageVariants = (item: BankAssociationText) => {
  currentItem.value = { ...item };
  showVariantsModal.value = true;
};

const addVariant = async () => {
  if (!newVariant.value.variant || !currentItem.value?._id) return;
  try {
    const updated = await bankAssociationTextApi.addVariant(currentItem.value._id, newVariant.value);
    currentItem.value = updated;
    newVariant.value = { variant: '', score: 0 };
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to add variant';
  }
};

const removeVariant = async (variantId: string) => {
  if (!currentItem.value?._id) return;
  try {
    const updated = await bankAssociationTextApi.removeVariant(currentItem.value._id, variantId);
    currentItem.value = updated;
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to remove variant';
  }
};

const updateVariant = async (variant: Variant) => {
  if (!currentItem.value?._id || !variant._id) return;
  try {
    const updated = await bankAssociationTextApi.updateVariant(
      currentItem.value._id,
      variant._id,
      { variant: variant.variant, score: variant.score }
    );
    currentItem.value = updated;
    await loadItems();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update variant';
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingItem.value = null;
  formData.value = { question: '', status: true };
};

const closeVariantsModal = () => {
  showVariantsModal.value = false;
  currentItem.value = null;
  newVariant.value = { variant: '', score: 0 };
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

.variants-list {
  margin-bottom: 20px;
}

.variant-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.variant-item .form-control {
  flex: 1;
}

.add-variant {
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.add-variant h3 {
  margin-top: 0;
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-row .form-control {
  flex: 1;
}
</style>

