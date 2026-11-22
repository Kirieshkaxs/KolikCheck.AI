export const LANGUAGES = { ru: 'Russian', kz: 'Kazakh', en: 'English' };
const copy = {
  language: ['Поддерживаются языки ru, kz и en.', 'ru, kz және en тілдеріне қолдау көрсетіледі.', 'Use ru, kz, or en.'],
  vin: ['Укажите корректный VIN из 17 символов без I, O и Q.', 'I, O және Q әріптерінсіз 17 таңбалы VIN енгізіңіз.', 'Enter a valid 17-character VIN without I, O or Q.'],
  fields: ['Проверьте данные автомобиля.', 'Көлік деректерін тексеріңіз.', 'Check the vehicle fields.'],
  obd: ['Введите от 1 до 10 кодов OBD-II, например P0300.', '1–10 OBD-II кодын енгізіңіз, мысалы P0300.', 'Enter 1–10 valid OBD-II codes (for example, P0300).'],
  obd_missing: ['Расшифровка этого кода недоступна.', 'Бұл кодтың түсіндірмесі қолжетімсіз.', 'No explanation is available for this code.'],
  evidence: ['Добавьте VIN, хотя бы одну фотографию или код OBD-II.', 'VIN, кемінде бір фото немесе OBD-II кодын қосыңыз.', 'Add a VIN, at least one photo, or an OBD-II code.'],
  year: ['Укажите год выпуска от 1980 до следующего года.', '1980 жылдан келесі жылға дейінгі жылды енгізіңіз.', 'Enter a model year from 1980 through next year.'],
  invalid_image: ['Не удалось прочитать фото. Загрузите статичный JPEG, PNG или WebP до 25 мегапикселей.', 'Фото оқылмады. 25 мегапиксельге дейінгі статикалық JPEG, PNG немесе WebP жүктеңіз.', 'A photo could not be decoded. Use a static JPEG, PNG, or WebP up to 25 megapixels.'],
  photo_size: ['Одно фото может занимать до 8 МиБ.', 'Бір фото 8 МиБ-тан аспауы керек.', 'Each photo must be at most 8 MiB.'],
  photo_total: ['Общий размер фото не должен превышать 12 МиБ.', 'Фотолардың жалпы көлемі 12 МиБ-тан аспауы керек.', 'Photos must total at most 12 MiB.'],
  photo_count: ['Можно загрузить до 10 фотографий.', '10 фотосуретке дейін жүктеуге болады.', 'Upload at most 10 photos.'],
  request: ['Не удалось прочитать запрос.', 'Сұрауды оқу мүмкін болмады.', 'The request could not be read.'],
  unavailable: ['Сервис временно недоступен. Попробуйте позже.', 'Қызмет уақытша қолжетімсіз. Кейінірек қайталаңыз.', 'The service is temporarily unavailable. Try again later.'],
  not_found: ['Маршрут API не найден.', 'API бағыты табылмады.', 'API endpoint not found.'],
};


export function localized(values, lang) {
  return values[Object.keys(LANGUAGES).indexOf(lang)] ?? values[0];
}

export function apiError(res, status, code) {
  return res.status(status).json({
    code,
    error: localized(copy[code], res.locals.language),
    ...(code === 'invalid_image' ? { photoStatus: 'invalid_image' } : {}),
  });
}
