#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Word similarity application using vector embeddings."""

import os
import sys
import pickle
import io
from typing import Optional
from gensim.models import KeyedVectors
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Устанавливаем правильную кодировку для ввода/вывода
if sys.stdin.encoding != 'utf-8':
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Статическое исходное слово
sourceWord = "машинка"

# Путь к модели
# Пробуем разные варианты путей
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '..', 'data', 'model.bin')
MODEL_PATH_TXT = os.path.join(BASE_DIR, '..', 'data', 'model.txt')
# Альтернативный путь через /app/data (для docker-compose)
MODEL_PATH_DOCKER = os.path.join('/app', 'data', 'model.bin')
MODEL_PATH_TXT_DOCKER = os.path.join('/app', 'data', 'model.txt')

# Путь к кэшу модели
CACHE_DIR = os.path.join(BASE_DIR, '.cache')
CACHE_FILE = os.path.join(CACHE_DIR, 'model_cache.pkl')
CACHE_META_FILE = os.path.join(CACHE_DIR, 'model_cache_meta.txt')

# Глобальная переменная для модели (загружается один раз)
_model: Optional[KeyedVectors] = None

# FastAPI приложение
app = FastAPI(title="Word Similarity API", description="API for calculating word similarity using vector embeddings")


class SimilarityRequest(BaseModel):
    """Модель запроса для вычисления сходства."""
    sourceWord: str
    word: str


class SimilarityResponse(BaseModel):
    """Модель успешного ответа."""
    status: int
    similarity: float


class ErrorResponse(BaseModel):
    """Модель ответа с ошибкой."""
    status: int
    error: str


def get_model_source_path():
    """Определяет путь к исходному файлу модели."""
    paths_to_check = [
        MODEL_PATH_TXT,
        MODEL_PATH_TXT_DOCKER,
        MODEL_PATH,
        MODEL_PATH_DOCKER,
    ]
    
    for path in paths_to_check:
        if os.path.exists(path):
            return path
    return None


def load_model_from_source(model_path):
    """Загружает модель из исходного файла."""
    print(f"Загрузка модели из исходного файла: {model_path}")
    
    # Определяем формат файла
    if model_path.endswith('.txt'):
        # Текстовый формат Word2Vec
        model = KeyedVectors.load_word2vec_format(
            model_path, 
            binary=False, 
            unicode_errors='ignore',
            limit=None
        )
    elif model_path.endswith('.bin'):
        # Пробуем бинарный формат Word2Vec
        try:
            model = KeyedVectors.load_word2vec_format(
                model_path, 
                binary=True, 
                unicode_errors='ignore',
                limit=None
            )
        except Exception:
            # Если не получилось, пробуем как Gensim pickle
            model = KeyedVectors.load(model_path, mmap='r')
    else:
        # Пробуем как Gensim pickle
        model = KeyedVectors.load(model_path, mmap='r')
    
    print(f"✓ Модель успешно загружена из {model_path}")
    return model


def save_model_cache(model, source_path):
    """Сохраняет модель в кэш."""
    try:
        # Создаем директорию для кэша
        os.makedirs(CACHE_DIR, exist_ok=True)
        
        # Сохраняем модель
        with open(CACHE_FILE, 'wb') as f:
            pickle.dump(model, f)
        
        # Сохраняем метаданные (путь к исходному файлу и время модификации)
        source_mtime = os.path.getmtime(source_path)
        with open(CACHE_META_FILE, 'w') as f:
            f.write(f"{source_path}\n{source_mtime}\n")
        
        print(f"✓ Модель сохранена в кэш: {CACHE_FILE}")
    except Exception as e:
        print(f"⚠ Предупреждение: не удалось сохранить кэш: {e}")


def load_model_from_cache(source_path):
    """Загружает модель из кэша, если он актуален."""
    if not os.path.exists(CACHE_FILE) or not os.path.exists(CACHE_META_FILE):
        return None
    
    try:
        # Проверяем метаданные
        with open(CACHE_META_FILE, 'r') as f:
            cached_path = f.readline().strip()
            cached_mtime = float(f.readline().strip())
        
        # Проверяем, что исходный файл не изменился
        if cached_path != source_path or not os.path.exists(source_path):
            return None
        
        current_mtime = os.path.getmtime(source_path)
        if current_mtime != cached_mtime:
            return None
        
        # Загружаем из кэша
        print(f"Загрузка модели из кэша: {CACHE_FILE}")
        with open(CACHE_FILE, 'rb') as f:
            model = pickle.load(f)
        
        print(f"✓ Модель загружена из кэша")
        return model
    except Exception as e:
        print(f"⚠ Ошибка загрузки из кэша: {e}")
        return None


def load_model():
    """Загружает векторную модель с использованием кэша."""
    print("Загрузка векторной модели...")
    
    # Находим исходный файл модели
    source_path = get_model_source_path()
    if not source_path:
        raise FileNotFoundError(
            f"Модель не найдена. Проверьте наличие файлов:\n"
            f"  - {MODEL_PATH_TXT}\n"
            f"  - {MODEL_PATH}\n"
            f"  - {MODEL_PATH_TXT_DOCKER}\n"
            f"  - {MODEL_PATH_DOCKER}"
        )
    
    # Пробуем загрузить из кэша
    model = load_model_from_cache(source_path)
    
    if model is None:
        # Загружаем из исходного файла
        model = load_model_from_source(source_path)
        # Сохраняем в кэш
        save_model_cache(model, source_path)
    
    return model


def find_word_variants(model, word):
    """Ищет варианты слова в словаре с учетом PoS тегов."""
    word_lower = word.lower()
    variants = []
    
    # Список возможных тегов частей речи (Universal POS tags)
    pos_tags = ['NOUN', 'ADJ', 'VERB', 'ADV', 'PRON', 'DET', 'ADP', 'CONJ', 'NUM', 'PART', 'INTJ']
    
    # Пробуем найти слово как есть
    if word in model.key_to_index:
        variants.append(word)
    
    # Пробуем в нижнем регистре
    if word_lower in model.key_to_index and word_lower != word:
        variants.append(word_lower)
    
    # Пробуем с тегами частей речи
    for pos in pos_tags:
        variant = f"{word_lower}_{pos}"
        if variant in model.key_to_index:
            variants.append(variant)
    
    # Ищем слова, начинающиеся с нашего слова
    matching_words = [w for w in model.key_to_index.keys() if w.startswith(word_lower + '_')]
    if matching_words:
        variants.extend(matching_words[:5])  # Берем первые 5 вариантов
    
    return variants


def find_word_in_model(model, word):
    """Находит слово в модели, возвращает найденный вариант или None."""
    # Пробуем найти как есть
    if word in model.key_to_index:
        return word
    
    # Пробуем в нижнем регистре
    word_lower = word.lower()
    if word_lower in model.key_to_index:
        return word_lower
    
    # Ищем варианты с PoS тегами
    variants = find_word_variants(model, word)
    if variants:
        return variants[0]  # Возвращаем первый найденный вариант
    
    return None


def calculate_similarity(model, word1, word2):
    """Вычисляет косинусное сходство между двумя словами."""
    try:
        similarity = model.similarity(word1, word2)
        return similarity
    except KeyError as e:
        word = str(e).strip("'")
        return None, word


def get_model():
    """Получает загруженную модель, загружает если необходимо."""
    global _model
    if _model is None:
        _model = load_model()
    return _model


@app.post("/similarity")
async def calculate_word_similarity(request: SimilarityRequest):
    """
    Вычисляет сходство между двумя словами.
    
    Принимает JSON с полями:
    - sourceWord: исходное слово
    - word: слово для сравнения
    
    Возвращает JSON с полями:
    - status: код статуса (200 при успехе, 500 при ошибке)
    - similarity: значение сходства (0.0 - 1.0) при успехе
    - error: сообщение об ошибке при ошибке
    """
    try:
        model = get_model()
        
        # Ищем слова в модели
        found_source_word = find_word_in_model(model, request.sourceWord)
        if found_source_word is None:
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(status=500, error=f"Слово '{request.sourceWord}' не найдено в словаре модели").dict()
            )
        
        found_word = find_word_in_model(model, request.word)
        if found_word is None:
            return JSONResponse(
                status_code=500,
                content=ErrorResponse(status=500, error=f"Слово '{request.word}' не найдено в словаре модели").dict()
            )
        
        # Вычисляем сходство
        similarity = model.similarity(found_source_word, found_word)
        
        return SimilarityResponse(status=200, similarity=float(similarity))
        
    except Exception as e:
        # Прочие ошибки
        return JSONResponse(
            status_code=500,
            content=ErrorResponse(status=500, error=str(e)).dict()
        )


def main():
    """Основная функция приложения."""
    global sourceWord
    
    try:
        model = load_model()
        print(f"Размер словаря: {len(model.key_to_index)}")
        print(f"Размерность векторов: {model.vector_size}")
        print()
    except Exception as e:
        print(f"Ошибка: {e}")
        sys.exit(1)
    
    # Ищем исходное слово в словаре (с учетом PoS тегов)
    found_source_word = find_word_in_model(model, sourceWord)
    
    if found_source_word is None:
        print(f"Внимание: слово '{sourceWord}' не найдено в словаре модели.")
        print("\nПоиск похожих вариантов...")
        variants = find_word_variants(model, sourceWord)
        if variants:
            print(f"Найдены варианты: {', '.join(variants[:10])}")
        else:
            # Показываем примеры слов из словаря
            sample_words = list(model.key_to_index.keys())[:20]
            print(f"\nПримеры слов из словаря (первые 20):")
            for i, w in enumerate(sample_words, 1):
                print(f"  {i}. {w}")
        print("\nПодсказка: слова могут храниться в формате 'слово_POS' (например, 'слон_NOUN')")
        return
    
    if found_source_word != sourceWord:
        print(f"Найдено слово в словаре: '{found_source_word}' (вместо '{sourceWord}')")
        sourceWord = found_source_word
    
    print(f"Исходное слово: {sourceWord}")
    print("Введите слово для сравнения (или 'quit' для выхода):")
    print("-" * 50)
    
    while True:
        try:
            input_word = input("\n> ").strip()
            
            if input_word.lower() in ['quit', 'exit', 'q']:
                print("Выход...")
                break
            
            if not input_word:
                continue
            
            # Нормализуем ввод (убираем лишние пробелы)
            input_word = input_word.strip()
            
            # Отладочный вывод (можно убрать после проверки)
            # print(f"DEBUG: Введено слово (bytes): {input_word.encode('utf-8')}")
            # print(f"DEBUG: Введено слово (repr): {repr(input_word)}")
            
            # Ищем слово в словаре (с учетом PoS тегов)
            found_input_word = find_word_in_model(model, input_word)
            
            if found_input_word is None:
                print(f"Слово '{input_word}' не найдено в словаре модели.")
                variants = find_word_variants(model, input_word)
                if variants:
                    print(f"Найдены варианты: {', '.join(variants[:10])}")
                    print("Попробуйте использовать один из вариантов.")
                else:
                    # Показываем примеры похожих слов из словаря
                    word_lower = input_word.lower()
                    similar_in_dict = [
                        w for w in model.key_to_index.keys() 
                        if word_lower in w.lower() or w.lower().startswith(word_lower[:3])
                    ][:10]
                    if similar_in_dict:
                        print(f"Похожие слова в словаре: {', '.join(similar_in_dict)}")
                    else:
                        print("Попробуйте другое слово или проверьте формат.")
                continue
            
            if found_input_word != input_word:
                print(f"Используется: '{found_input_word}' (вместо '{input_word}')")
                input_word = found_input_word
            
            # Вычисляем сходство
            similarity = model.similarity(sourceWord, input_word)
            
            # Выводим результат
            print(f"\nСходство между '{sourceWord}' и '{input_word}': {similarity:.4f}")
            print(f"Процент соответствия: {similarity * 100:.2f}%")
            
        except KeyboardInterrupt:
            print("\n\nВыход...")
            break
        except Exception as e:
            print(f"Ошибка: {e}")


if __name__ == '__main__':
    # Если запускается как скрипт, проверяем аргументы командной строки
    if len(sys.argv) > 1 and sys.argv[1] == 'api':
        # Запуск FastAPI сервера
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        # Запуск CLI интерфейса
        main()
