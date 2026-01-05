import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usersApi } from '../api/usersApi';
import { storage, type StoredUser } from '../utils/storage';
import { getTelegramWebApp } from '../utils/telegramTheme';

export function useUser() {
  const router = useRouter();
  const currentUser = ref<StoredUser | null>(storage.getUser());
  const loading = ref(false);

  /**
   * Проверяет и создает пользователя из сохраненных данных или Telegram
   * @returns ID пользователя или null, если пользователь не найден и нет Telegram данных
   */
  const checkAndCreateUser = async (): Promise<string | null> => {
    const storedUser = storage.getUser();
    if (storedUser) {
      // Пользователь уже есть
      currentUser.value = storedUser;
      return storedUser.id;
    }

    // Проверяем Telegram данные
    const webApp = getTelegramWebApp();
    const telegramData = webApp?.initDataUnsafe?.user;

    if (telegramData) {
      // Если есть Telegram данные, создаем пользователя автоматически
      try {
        const userData = {
          telegramId: telegramData.id,
          telegramUsername: telegramData.username,
          telegramFirstName: telegramData.first_name,
          telegramLastName: telegramData.last_name,
          telegramPhotoUrl: telegramData.photo_url,
          telegramLanguageCode: telegramData.language_code,
        };

        const user = await usersApi.findOrCreateUser(userData);
        const savedUser: StoredUser = {
          id: user.id,
          name: user.name || user.telegramFirstName || user.telegramUsername || 'Пользователь',
        };
        storage.setUser(savedUser);
        currentUser.value = savedUser;
        return savedUser.id;
      } catch (error) {
        console.error('Error creating user from Telegram:', error);
        return null;
      }
    }

    // Если нет Telegram данных, возвращаем null
    return null;
  };

  /**
   * Создает пользователя с указанным именем
   * @param name - имя пользователя
   * @returns ID созданного пользователя
   */
  const createUserWithName = async (name: string): Promise<string> => {
    loading.value = true;
    try {
      const user = await usersApi.findOrCreateUser({ name });
      const savedUser: StoredUser = {
        id: user.id,
        name: user.name,
      };
      storage.setUser(savedUser);
      currentUser.value = savedUser;
      return savedUser.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Проверяет пользователя из localStorage при монтировании компонента
   * Если пользователь найден, делает редирект на его страницу
   * @param redirectTo - путь для редиректа (по умолчанию `/${userId}`)
   */
  const checkUserOnMount = async (redirectTo?: (userId: string) => string) => {
    const storedUser = storage.getUser();

    if (storedUser && storedUser.id) {
      try {
        // Проверяем, существует ли пользователь
        const user = await usersApi.findOrCreateUser({ name: storedUser.name || '' });

        if (user && user.id) {
          // Если пользователь найден, делаем редирект
          const redirectPath = redirectTo ? redirectTo(storedUser.id) : `/${storedUser.id}`;
          router.push(redirectPath);
        } else {
          console.error('User not found in database');
        }
      } catch (error) {
        console.error('Error checking user from localStorage:', error);
      }
    }
  };

  /**
   * Получает текущего пользователя или проверяет и создает его
   * @param autoRedirect - автоматически редиректить на страницу пользователя, если найден
   * @returns ID пользователя или null
   */
  const ensureUser = async (autoRedirect = false): Promise<string | null> => {
    const userId = await checkAndCreateUser();
    if (userId && autoRedirect) {
      router.push(`/${userId}`);
    }
    return userId;
  };

  /**
   * Получает ID текущего пользователя из localStorage
   * @returns ID пользователя или null, если пользователь не найден
   */
  const getCurrentUserId = (): string | null => {
    const storedUser = storage.getUser();
    return storedUser?.id || null;
  };

  return {
    currentUser: computed(() => currentUser.value),
    loading: computed(() => loading.value),
    checkAndCreateUser,
    createUserWithName,
    checkUserOnMount,
    ensureUser,
    getCurrentUserId,
  };
}

