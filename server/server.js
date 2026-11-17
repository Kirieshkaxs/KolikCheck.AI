import { GoogleGenAI } from '@google/genai';

// Инициализация (клиент сам подхватит ключ из переменной окружения GEMINI_API_KEY)
const ai = new GoogleGenAI();

async function analyzeCarError(errorDescription) {
  try {
    // Используем быструю и эффективную модель gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Расшифруй автомобильную ошибку OBD-II и дай рекомендации для ремонта: ${errorDescription}`,
    });

    console.log("Ответ от Gemini:", response.text);
    return response.text;
  } catch (error) {
    console.error("Ошибка при запросе к API:", error);
  }
}

// Пример вызова функции
analyzeCarError("P0300 - Обнаружены случайные/множественные пропуски зажигания в цилиндрах");