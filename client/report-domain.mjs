export function riskForScore(score) {
  if (!Number.isFinite(score) || score < 0 || score > 100) return null
  return score >= 80 ? 'Low' : score >= 70 ? 'Moderate' : 'High'
}

export const REPORT_STORAGE_KEY = 'kolikcheck.last-report'
export const LANGUAGE_STORAGE_KEY = 'kolikcheck.language'
const STORAGE_VERSION = 1
const PHOTO_STATUSES = [
  'not_requested', 'success', 'not_configured', 'vehicle_not_visible', 'auth_error',
  'quota_exceeded', 'timeout', 'provider_unavailable', 'model_unavailable', 'invalid_response',
]
const strings = values => Array.isArray(values) && values.every(value => typeof value === 'string')
const rows = values => Array.isArray(values) && values.every(row =>
  Array.isArray(row) && row.length >= 2 && typeof row[0] === 'string' &&
  ['string', 'number'].includes(typeof row[1]))
const obdText = row => row && (row.description == null || typeof row.description === 'string') &&
  [row.cause, row.recommendations].every(value => value == null || strings(value))

export function encodeReport(report) {
  const { photos, storageWarning, ...data } = report
  return JSON.stringify({ version: STORAGE_VERSION, report: data })
}

export function decodeReport(value) {
  try {
    const { version, report } = JSON.parse(value)
    if (version !== STORAGE_VERSION || !report || typeof report.id !== 'string' ||
        typeof report.vin !== 'string' || typeof report.generatedAt !== 'string' ||
        !Number.isFinite(Date.parse(report.generatedAt)) || !PHOTO_STATUSES.includes(report.photoStatus) ||
        (report.photoStatus === 'success') !== Boolean(riskForScore(report.score)) ||
        !report.vehicle || !['make', 'model', 'year'].every(key =>
          ['string', 'number'].includes(typeof report.vehicle[key])) ||
        (report.score !== null && !riskForScore(report.score)) ||
        !rows(report.specs) || !rows(report.history) ||
        !strings(report.assessedViews) || !strings(report.submittedViews) || !strings(report.recs) ||
        !Array.isArray(report.damages) || !report.damages.every(row =>
          row && typeof row.part === 'string' && typeof row.issue === 'string') ||
        !Array.isArray(report.obd) || !report.obd.every(row => obdText(row) &&
          typeof row.code === 'string' && Object.values(row.translations ?? {}).every(obdText)) ||
        (report.blindSpots != null && !strings(report.blindSpots)) ||
        (report.repairItems != null && !strings(report.repairItems)) ||
        (report.repairCosts != null && (!Array.isArray(report.repairCosts) ||
          report.repairCosts.length !== (report.repairItems ?? report.damages).length ||
          !report.repairCosts.every(row => strings(row) && row.length === 2)))) return null
    return { ...report, photos: [] }
  } catch {
    return null
  }
}

export const SPEC_LABELS = {
  displacement: ['Объём двигателя, л', 'Қозғалтқыш көлемі, л', 'Engine displacement (L)'],
  cylinders: ['Цилиндры', 'Цилиндрлер', 'Cylinders'],
  power: ['Мощность двигателя, л. с.', 'Қозғалтқыш қуаты, а. к.', 'Engine power (hp)'],
  fuel: ['Топливо', 'Отын түрі', 'Fuel type'],
  transmission: ['Коробка передач', 'Беріліс қорабы', 'Transmission'],
  drivetrain: ['Привод', 'Жетек', 'Drivetrain'],
  body: ['Тип кузова', 'Шанақ түрі', 'Body type'],
  country: ['Страна сборки', 'Құрастырылған ел', 'Assembly country'],
  engine: ['Двигатель', 'Қозғалтқыш', 'Engine'],
};
