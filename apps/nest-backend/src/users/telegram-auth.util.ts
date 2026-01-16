import * as crypto from 'crypto';

/**
 * Валидирует Telegram WebApp initData
 * Документация: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
): { isValid: boolean; userData?: any } {
  try {
    // Парсим initData, сохраняя оригинальные URL-encoded значения
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return { isValid: false };
    }

    // Извлекаем все параметры кроме hash, сохраняя оригинальные значения
    // Разбираем initData вручную, чтобы сохранить оригинальные encoded значения
    const pairs: Array<[string, string]> = [];
    const parts = initData.split('&');

    for (const part of parts) {
      const [key, ...valueParts] = part.split('=');
      if (key === 'hash') continue;
      const value = valueParts.join('='); // Восстанавливаем значение, если в нем был '='
      pairs.push([key, value]);
    }

    // Сортируем параметры по ключу
    pairs.sort(([a], [b]) => a.localeCompare(b));

    // Создаем data_check_string из оригинальных значений
    const dataCheckString = pairs
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Вычисляем secret_key: HMAC-SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисляем hash: HMAC-SHA256(secret_key, data_check_string)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем hash (используем timing-safe сравнение для безопасности)
    if (
      !crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'hex'),
        Buffer.from(hash, 'hex'),
      )
    ) {
      return { isValid: false };
    }

    // Парсим user данные, если они есть
    const userParam = params.get('user');
    let userData = null;
    if (userParam) {
      try {
        userData = JSON.parse(decodeURIComponent(userParam));
      } catch (_e) {
        // Если не удалось распарсить, это не критично
      }
    }

    return { isValid: true, userData };
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return { isValid: false };
  }
}
