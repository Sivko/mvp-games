import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Определяем путь к корню проекта (../../ от apps/admin)
  const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../')
  
  // Загружаем переменные окружения из корня проекта
  const envFile = mode === 'production' ? '.env.production' : '.env'
  const envPath = resolve(rootDir, envFile)
  
  let nestUrl = 'http://localhost:3000'
  
  try {
    const envContent = readFileSync(envPath, 'utf-8')
    const envLines = envContent.split('\n')
    
    for (const line of envLines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('NEST_URL=')) {
        nestUrl = trimmedLine.split('=')[1].trim()
        break
      }
    }
  } catch {
    // Если файл не найден, используем значение по умолчанию
    console.warn(`Файл ${envPath} не найден, используется значение по умолчанию`)
  }
  
  return {
    base: mode === 'production' ? '/admin' : '/',
    plugins: [
      vue(),
      vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(nestUrl),
    },
  }
})
