<script setup lang="ts">
import { GrHome } from 'vue-icons-plus/gr'
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <GrHome class="text-blue-500" />
        You did it!
      </h1>
      <p class="text-gray-600 mb-4">
        Visit <a href="https://vuejs.org/" target="_blank" rel="noopener" class="text-blue-600 hover:underline">vuejs.org</a> to read the
        documentation
      </p>
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-sm text-gray-500">
          Tailwind CSS and vue-icons-plus are now configured and ready to use!
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
