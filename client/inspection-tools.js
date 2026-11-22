const PHOTO_VIEWS = ['front', 'rear', 'left', 'right', 'cabin', 'detail']
const VIN_FIELDS = ['make', 'model', 'year']
const CHECK_ITEMS = ['documents', 'coldStart', 'testDrive', 'lift']
const OBD_SYSTEMS = { P: 'Powertrain', C: 'Chassis', B: 'Body', U: 'Network' }
const OBD_PRIORITY = { High: 3, Medium: 2, Low: 1 }
const COMPARE_KEY = 'kolikcheck.comparison.v1'

const TOOL_TEXT = {
  ru: {
    navCompare: 'Сравнение', compareTitle: 'Сравнение автомобилей',
    photoGuideHint: 'Снимите автомобиль целиком с четырёх сторон, затем салон и детали крупным планом.',
    photoNext: 'Следующий ракурс', photoGuideReady: 'Все ракурсы добавлены.',
    photoViewLabel: 'Ракурс фото', removePhotoLabel: 'Удалить фото', photoUnlabeled: 'Без метки',
    photoViews: ['Спереди', 'Сзади', 'Слева', 'Справа', 'Салон', 'Крупный план'],
    photoCoverageTitle: 'Какие ракурсы проверены', photoAssessed: 'Оценено по фото',
    photoSubmitted: 'Загружено, оценка недоступна', photoMissing: 'Не проверено',
    vinPartial: 'Найдена часть данных. Сверьте поля с документами и заполните пропуски.',
    vinFound: 'Данные найдены. Сверьте их с документами автомобиля.',
    vinNoMatch: 'В справочнике нет данных по этому VIN. Заполните поля вручную.',
    sourceManual: 'Введено вручную', sourceWmi: 'Локальный справочник WMI (предварительно)',
    checklistTitle: 'Чек-лист очного осмотра',
    checklistHint: 'Отмечайте выполненные шаги. Отметки сохраняются в этом браузере для текущего VIN.',
    checklistVin: 'Введите VIN или сформируйте отчёт, чтобы отмечать выполненные шаги.',
    checklistReport: 'Отметки сохраняются в этом браузере для этого отчёта.',
    checks: ['Сверить VIN на автомобиле и в документах', 'Проверить холодный запуск двигателя',
      'Провести тест-драйв', 'Осмотреть днище и подвеску на подъёмнике'],
    checksDone: 'Проверок выполнено', storageError: 'Браузер не смог сохранить изменения.',
    obdLead: 'Введите до 10 кодов через пробел, запятую, точку с запятой или с новой строки.',
    obdLabel: 'Коды OBD-II', obdBtn: 'Проверить коды',
    obdHint: 'Известные коды доступны из локального справочника без Gemini. Трактовки могут зависеть от модели автомобиля.',
    obdErrFormat: 'Введите коды в формате P0300. Проверьте разделители и символы.',
    obdLimit: 'Можно проверить до 10 кодов за раз.',
    inspectObd: 'Коды OBD-II (необязательно)', obdAi: 'Источник — Gemini.',
    obdUnavailable: 'Расшифровка недоступна. Сверьте код с документацией автомобиля.',
    obdOrder: 'Порядок проверок по серьёзности кодов',
    obdSystems: ['Двигатель и трансмиссия', 'Шасси', 'Кузов', 'Связь блоков'],
    compareEmpty: 'Сохраните отчёты после осмотра, чтобы сравнить до трёх автомобилей в этом браузере.',
    compareAdd: 'Добавить автомобиль', compareSave: 'Сохранить для сравнения', compareSaved: 'Отчёт сохранён.',
    compareFull: 'В сравнении уже три автомобиля. Удалите один, чтобы добавить новый.',
    compareRemove: 'Убрать из сравнения', comparePrice: 'Цена продавца, ₸', compareMileage: 'Заявленный пробег, км',
    comparePhotoFindings: 'Замечания по фото', comparePhotoClean: 'На оценённых фото замечаний нет',
    compareDemo: 'Демо-оценка', compareObdEmpty: 'Коды не введены',
    comparisonDetails: 'Данные для сравнения', wholeNumbers: 'Введите целые неотрицательные числа.',
  },
  kz: {
    navCompare: 'Салыстыру', compareTitle: 'Автокөліктерді салыстыру',
    photoGuideHint: 'Көлікті төрт жағынан толық түсіріңіз. Содан кейін салон мен бөлшектерді жақыннан түсіріңіз.',
    photoNext: 'Келесі ракурс', photoGuideReady: 'Барлық ракурс қосылды.',
    photoViewLabel: 'Фото ракурсы', removePhotoLabel: 'Фотосуретті өшіру', photoUnlabeled: 'Белгісіз',
    photoViews: ['Алдыңғы жағы', 'Артқы жағы', 'Сол жағы', 'Оң жағы', 'Салон', 'Жақыннан'],
    photoCoverageTitle: 'Тексерілген ракурстар', photoAssessed: 'Фото бойынша бағаланды',
    photoSubmitted: 'Жүктелді, бағалау қолжетімсіз', photoMissing: 'Тексерілмеді',
    vinPartial: 'Деректердің бір бөлігі табылды. Құжаттармен салыстырып, бос өрістерді толтырыңыз.',
    vinFound: 'Деректер табылды. Оларды көлік құжаттарымен салыстырыңыз.',
    vinNoMatch: 'Анықтамалықта бұл VIN туралы дерек жоқ. Өрістерді қолмен толтырыңыз.',
    sourceManual: 'Қолмен енгізілді', sourceWmi: 'Жергілікті WMI анықтамалығы (алдын ала)',
    checklistTitle: 'Көлікті көзбе-көз тексеру тізімі',
    checklistHint: 'Орындалған қадамдарды белгілеңіз. Белгілер осы браузерде осы VIN бойынша сақталады.',
    checklistVin: 'Орындалған қадамдарды белгілеу үшін VIN енгізіңіз немесе есеп жасаңыз.',
    checklistReport: 'Белгілер осы есеп үшін браузерде сақталады.',
    checks: ['Көліктегі VIN-ді құжатпен салыстыру', 'Қозғалтқыштың суық күйде іске қосылуын тексеру',
      'Сынақ жүргізу', 'Көліктің түбі мен аспасын көтергіште қарау'],
    checksDone: 'Орындалған тексерулер', storageError: 'Браузер өзгерістерді сақтай алмады.',
    obdLead: '10 кодқа дейін бос орынмен, үтірмен, нүктелі үтірмен немесе жаңа жолмен бөліп енгізіңіз.',
    obdLabel: 'OBD-II кодтары', obdBtn: 'Кодтарды тексеру',
    obdHint: 'Белгілі кодтар Gemini-сіз жергілікті анықтамалықтан табылады. Мағынасы көлік моделіне байланысты болуы мүмкін.',
    obdErrFormat: 'Кодтарды P0300 пішімінде енгізіңіз. Бөлгіштер мен таңбаларды тексеріңіз.',
    obdLimit: 'Бір ретте 10 кодқа дейін тексеруге болады.',
    inspectObd: 'OBD-II кодтары (міндетті емес)', obdAi: 'Дереккөз — Gemini.',
    obdUnavailable: 'Түсіндірме қолжетімсіз. Кодты көлік құжаттамасымен салыстырыңыз.',
    obdOrder: 'Кодтардың маңыздылығына қарай тексеру реті',
    obdSystems: ['Қозғалтқыш пен беріліс қорабы', 'Шасси', 'Шанақ', 'Блоктар байланысы'],
    compareEmpty: 'Осы браузерде үш көлікке дейін салыстыру үшін тексеру есептерін сақтаңыз.',
    compareAdd: 'Көлік қосу', compareSave: 'Салыстыру үшін сақтау', compareSaved: 'Есеп сақталды.',
    compareFull: 'Салыстыруда үш көлік бар. Жаңасын қосу үшін біреуін алып тастаңыз.',
    compareRemove: 'Салыстырудан алып тастау', comparePrice: 'Сатушы бағасы, ₸', compareMileage: 'Мәлімделген жүріс, км',
    comparePhotoFindings: 'Фотодағы ескертулер', comparePhotoClean: 'Бағаланған фотоларда ескерту жоқ',
    compareDemo: 'Демо бағалау', compareObdEmpty: 'Кодтар енгізілмеді',
    comparisonDetails: 'Салыстыру деректері', wholeNumbers: 'Теріс емес бүтін сандарды енгізіңіз.',
  },
  en: {
    navCompare: 'Compare', compareTitle: 'Compare Vehicles',
    photoGuideHint: 'Photograph the entire vehicle from all four sides, then take interior photos and close-ups.',
    photoNext: 'Next view', photoGuideReady: 'All views added.',
    photoViewLabel: 'Photo view', removePhotoLabel: 'Remove photo', photoUnlabeled: 'Unlabeled',
    photoViews: ['Front', 'Rear', 'Left side', 'Right side', 'Interior', 'Close-up'],
    photoCoverageTitle: 'Photo coverage', photoAssessed: 'Assessed from photos',
    photoSubmitted: 'Uploaded, assessment unavailable', photoMissing: 'Unchecked',
    vinPartial: 'Partial match. Verify these fields against the documents and fill in the gaps.',
    vinFound: 'Vehicle details found. Verify them against the vehicle documents.',
    vinNoMatch: 'No reference data for this VIN. Fill in the fields manually.',
    sourceManual: 'Entered manually', sourceWmi: 'Local WMI reference (preliminary)',
    checklistTitle: 'In-Person Inspection Checklist',
    checklistHint: 'Mark each completed step. Your progress is saved in this browser for the current VIN.',
    checklistVin: 'Enter a VIN or create a report to mark completed steps.',
    checklistReport: 'Your progress is saved for this report in this browser.',
    checks: ['Match the VIN on the vehicle and documents', 'Check the engine’s cold start',
      'Take a test drive', 'Inspect the underbody and suspension on a lift'],
    checksDone: 'Checks completed', storageError: 'The browser could not save the changes.',
    obdLead: 'Enter up to 10 codes separated by spaces, commas, semicolons, or newlines.',
    obdLabel: 'OBD-II Codes', obdBtn: 'Check Codes',
    obdHint: 'Known codes use the local reference and are available without Gemini. Definitions can vary by vehicle model.',
    obdErrFormat: 'Enter codes in the P0300 format. Check the separators and characters.',
    obdLimit: 'You can check up to 10 codes at a time.',
    inspectObd: 'OBD-II codes (optional)', obdAi: 'Source is Gemini.',
    obdUnavailable: 'No explanation available. Check the code against the vehicle documentation.',
    obdOrder: 'Suggested check order by code severity',
    obdSystems: ['Powertrain', 'Chassis', 'Body', 'Network'],
    compareEmpty: 'Save your inspection reports to compare up to three vehicles in this browser.',
    compareAdd: 'Add vehicle', compareSave: 'Save for comparison', compareSaved: 'Report saved.',
    compareFull: 'Three vehicles are saved. Remove one to add another.',
    compareRemove: 'Remove from comparison', comparePrice: 'Asking price, ₸', compareMileage: 'Declared mileage, km',
    comparePhotoFindings: 'Photo findings', comparePhotoClean: 'No issues detected in the assessed photos',
    compareDemo: 'Sample assessment', compareObdEmpty: 'No codes entered',
    comparisonDetails: 'Comparison details', wholeNumbers: 'Enter nonnegative whole numbers.',
  },
}

for (const [lang, translations] of Object.entries(TOOL_TEXT)) Object.assign(I18N[lang], translations)

function photoViewLabel(view) {
  return t('photoViews')[PHOTO_VIEWS.indexOf(view)] ?? t('photoUnlabeled')
}

function renderPhotoGuide(cid) {
  const uploaded = new Set(photoStores[cid].map(photo => photo.view))
  const next = PHOTO_VIEWS.find(view => !uploaded.has(view))
  document.getElementById(cid + '-guide').innerHTML = PHOTO_VIEWS.map(view =>
    `<button type="button" class="btn ghost ${view === next ? 'next' : ''}" data-view="${view}">${uploaded.has(view) ? '✓ ' : ''}${photoViewLabel(view)}</button>`
  ).join('')
  document.getElementById(cid + '-next').textContent = next
    ? `${t('photoNext')} · ${photoViewLabel(next)}`
    : t('photoGuideReady')
}

function photoCoverage(report) {
  const uploaded = new Set(report.submittedViews)
  const assessed = new Set(report.assessedViews)
  const rows = PHOTO_VIEWS.map(view => [
    photoViewLabel(view),
    t(assessed.has(view) ? 'photoAssessed' : uploaded.has(view) ? 'photoSubmitted' : 'photoMissing'),
  ])
  return `<h4>${t('photoCoverageTitle')}</h4>${specRows(rows)}`
}

function vinField(field) {
  return document.getElementById('insp' + field[0].toUpperCase() + field.slice(1))
}

function vinSourceLabel(source) {
  return ({ vpic: 'NHTSA vPIC', autodev: 'auto.dev', wmi: t('sourceWmi'), manual: t('sourceManual') })[source] ?? ''
}

function updateVinSourceLabels() {
  for (const field of VIN_FIELDS) {
    const input = vinField(field)
    document.getElementById(input.id + 'Source').textContent = vinSourceLabel(input.dataset.source)
  }
}

for (const field of VIN_FIELDS) {
  vinField(field).addEventListener('input', event => {
    event.target.dataset.source = event.target.value ? 'manual' : ''
    updateVinSourceLabels()
  })
}

function newInspection() {
  const vin = document.getElementById('inspVin')
  vin.value = ''
  vin.dispatchEvent(new Event('input'))
  document.getElementById('inspObd').value = ''
  for (const id of ['inspObdErr', 'inspVinErr', 'inspYearErr', 'inspEvidenceErr', 'inspUpload-errbox']) showErr(id, '')
  photoStores.inspUpload.forEach(photo => URL.revokeObjectURL(photo.url))
  photoStores.inspUpload.length = 0
  renderThumbs('inspUpload')
  goTo('inspect')
  vin.focus()
}

function continueWithPhotos() {
  const report = state.report
  newInspection()
  const vin = document.getElementById('inspVin')
  vin.value = report.vin
  vin.dispatchEvent(new Event('input'))
  for (const field of VIN_FIELDS) {
    const input = vinField(field)
    input.value = report.vehicle[field]
    input.dataset.source = report.vehicleSources?.[field] ?? ''
  }
  updateVinSourceLabels()
  document.getElementById('inspObd').value = report.obd.map(row => row.code).join(', ')
  document.getElementById('inspUpload-guide').querySelector('button').focus()
}

function parseObdCodes(value) {
  const codes = [...new Set(value.toUpperCase().split(/[\s,;]+/).filter(Boolean))]
  if (codes.length > 10) return { codes: [], error: t('obdLimit') }
  if (codes.some(code => !/^[PCBU][0-3][0-9A-F]{3}$/.test(code))) {
    return { codes: [], error: t('obdErrFormat') }
  }
  return { codes, error: '' }
}

async function fetchObdBatch(codes) {
  const response = await fetch('/api/analyze-obd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codes }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !Array.isArray(data.results)) throw new Error(data.error || t('serverConnErr'))
  return data.results
}

function resultList(items) {
  return items?.length ? `<ul class="recs">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''
}

function obdResultsHtml(results) {
  const ordered = [...results].sort((a, b) => (OBD_PRIORITY[b.severity] ?? 0) - (OBD_PRIORITY[a.severity] ?? 0))
  const priority = ordered.filter(row => row.recommendations?.length)
  const recommended = new Set()
  const sequence = priority.flatMap(row => row.recommendations.map(text => ({ code: row.code, text })))
    .filter(({ text }) => {
      if (recommended.has(text)) return false
      recommended.add(text)
      return true
    })
  const checks = sequence.length ? `<h4>${t('obdOrder')}</h4>
    <ol class="recs">${sequence.map(({code, text}) => `<li><code>${escapeHtml(code)}</code> · ${escapeHtml(text)}</li>`).join('')}</ol>` : ''

  const groups = Object.values(OBD_SYSTEMS).map((system, index) => {
    const rows = ordered.filter(row => (row.system ?? OBD_SYSTEMS[row.code[0]]) === system)
    if (!rows.length) return ''
    const entries = rows.map(row => `<div class="obd-entry">
      <div class="obd-heading"><strong>${escapeHtml(row.code)}</strong>${chip(row.severity)}</div>
      <p>${escapeHtml(row.description || t('obdUnavailable'))}</p>
      ${row.cause?.length ? `<h4>${t('obdCauses')}</h4>${resultList(row.cause)}` : ''}
      ${row.source === 'local' ? `<p class="hint">${t('obdLocal')}</p>` : ''}
      ${row.source === 'gemini' ? `<p class="hint">${t('obdAi')}</p>` : ''}
    </div>`).join('')
    return `<section class="obd-group"><h4>${t('obdSystems')[index]}</h4>${entries}</section>`
  }).join('')
  return checks + groups
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function refreshChecklists() {
  const inspectVin = normalizeVin(document.getElementById('inspVin').value)
  renderChecklist('inspectChecklist', validateVin(inspectVin) ? '' : inspectVin, 'checklistHint')
  const report = state.report
  renderChecklist('reportChecklist', report?.id, report?.vin && !report.isExample ? 'checklistHint' : 'checklistReport')
}

function renderChecklist(id, identity, hint) {
  const card = document.getElementById(id)
  if (!card) return
  const key = 'kolikcheck.checklist.v1.' + identity
  const stored = identity ? readArray(key) : []
  const checked = CHECK_ITEMS.filter(item => stored.includes(item))
  card.dataset.identity = identity || ''
  card.innerHTML = `<h3>${t('checklistTitle')}</h3>
    <p>${t(identity ? hint : 'checklistVin')}</p>
    <fieldset class="checklist" aria-label="${t('checklistTitle')}" ${identity ? '' : 'disabled'}>
      ${CHECK_ITEMS.map((item, i) => `<label><input type="checkbox" value="${item}" ${checked.includes(item) ? 'checked' : ''}>${t('checks')[i]}</label>`).join('')}
    </fieldset>
    <p data-progress aria-live="polite">${t('checksDone')} · ${checked.length}/${CHECK_ITEMS.length}</p>
    <div class="err" data-check-error role="status"></div>`

  card.onchange = event => {
    const values = Array.from(card.querySelectorAll('input:checked'), input => input.value)
    try {
      localStorage.setItem(key, JSON.stringify(values))
    } catch {
      event.target.checked = !event.target.checked
      card.querySelector('[data-check-error]').textContent = t('storageError')
      return
    }
    for (const targetId of ['inspectChecklist', 'reportChecklist']) {
      const target = document.getElementById(targetId)
      if (target?.dataset.identity !== identity) continue
      for (const checkbox of target.querySelectorAll('input')) checkbox.checked = values.includes(checkbox.value)
      target.querySelector('[data-progress]').textContent = `${t('checksDone')} · ${values.length}/${CHECK_ITEMS.length}`
      target.querySelector('[data-check-error]').textContent = ''
    }
  }
}

function savedVehicles() {
  return readArray(COMPARE_KEY)
    .filter(row => typeof row?.id === 'string' || (typeof row?.vin === 'string' && !validateVin(row.vin)))
    .slice(0, 3)
    .map(row => ({ ...row, id: row.id || row.vin }))
}

function compareForm(report) {
  const saved = savedVehicles().find(vehicle => vehicle.id === report.id)
  const values = report.comparisonDraft ?? saved ?? report.comparisonDefaults ?? {}
  return `<section class="card tool-card comparison-editor">
    <h3>${t('comparisonDetails')}</h3>
    <form id="compareForm">
      <div class="cols2">
        <div class="field"><label for="comparePrice">${t('comparePrice')}</label><input id="comparePrice" name="price" type="number" min="0" step="1" value="${escapeHtml(values.price)}"></div>
        <div class="field"><label for="compareMileage">${t('compareMileage')}</label><input id="compareMileage" name="mileage" type="number" min="0" step="1" value="${escapeHtml(values.mileage)}"></div>
      </div>
      <button type="submit" class="btn">${t('compareSave')}</button>
      <button type="button" class="btn ghost" onclick="goTo('compare')">${t('navCompare')}</button>
      <p id="compareSaveStatus" class="hint" role="status">${saved ? t('compareSaved') : ''}</p>
    </form>
  </section>`
}

function bindCompareForm() {
  const form = document.getElementById('compareForm')
  const report = state.report
  const details = () => Object.fromEntries(new FormData(form))
  form.oninput = () => { report.comparisonDraft = details() }
  form.onsubmit = event => {
    event.preventDefault()
    const status = document.getElementById('compareSaveStatus')
    const values = details()
    const valid = Object.values(values).every(value => value === '' ||
      (/^\d+$/.test(value) && Number.isSafeInteger(Number(value))))
    if (!valid) {
      status.textContent = t('wholeNumbers')
      return
    }
    const vehicles = savedVehicles()
    const position = vehicles.findIndex(row => row.id === report.id)
    if (position === -1 && vehicles.length >= 3) {
      status.textContent = t('compareFull')
      return
    }
    const estimate = repairTotals(report.repairCosts)
    const snapshot = {
      id: report.id, vin: report.vin, title: Object.values(report.vehicle).filter(Boolean).join(' '),
      price: values.price, mileage: values.mileage,
      isExample: report.isExample, photoAnalyzed: report.photoAnalyzed,
      photoFindings: report.isExample ? [] : report.damages.map(row => `${row.part} · ${row.issue}`),
      estimate: estimate.count && !estimate.invalid ? { low: estimate.low, high: estimate.high } : null,
      codes: report.obd.map(row => row.code),
    }
    if (position === -1) vehicles.push(snapshot)
    else vehicles[position] = snapshot
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(vehicles))
      status.textContent = t('compareSaved')
    } catch {
      status.textContent = t('storageError')
    }
  }
}

function renderComparison() {
  const panel = document.getElementById('comparisonContent')
  const vehicles = savedVehicles()
  const formatNumber = value => /^\d+$/.test(value ?? '') ? new Intl.NumberFormat(document.documentElement.lang).format(Number(value)) : '—'
  const rows = [
    [t('comparePrice'), row => formatNumber(row.price)],
    [t('compareMileage'), row => formatNumber(row.mileage)],
    [t('repairTitle'), row => row.estimate ? formatRepairRange(row.estimate) : '—'],
    [t('comparePhotoFindings'), row => {
      if (row.isExample) return resultList(t('camry').defects.map(([part, issue]) => `${part} · ${issue}`))
      if (row.isDemo) return t('compareDemo')
      if (!row.photoAnalyzed) return t('photoMissing')
      return resultList(Array.isArray(row.photoFindings) ? row.photoFindings : []) || t('comparePhotoClean')
    }],
    [t('obdLabel'), row => escapeHtml(Array.isArray(row.codes) && row.codes.length ? row.codes.join(', ') : t('compareObdEmpty'))],
  ]
  const table = vehicles.length ? `<div class="comparison-scroll" tabindex="0" aria-label="${t('compareTitle')}">
    <table class="comparison">
      <thead><tr><th scope="col">${t('vehInfo')}</th>${vehicles.map(row => `<th scope="col">
        <div>${escapeHtml(row.title || row.vin || t('vehInfo'))}</div>
        <code>${escapeHtml(row.vin || t('vinNotProvided'))}</code>${row.isExample ? ` <small>${t('compareDemo')}</small>` : ''}<br>
        <button type="button" class="btn ghost sm" data-remove-report="${escapeHtml(row.id)}">${t('compareRemove')}</button>
      </th>`).join('')}</tr></thead>
      <tbody>${rows.map(([label, value]) => `<tr><th scope="row">${label}</th>${vehicles.map(row => `<td>${value(row)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>` : `<p>${t('compareEmpty')}</p>`
  panel.innerHTML = `${table}<p id="compareRemoveStatus" class="err" role="status"></p>
    <button type="button" class="btn" onclick="newInspection()">${t('compareAdd')}</button>`
  panel.onclick = event => {
    const id = event.target.closest('[data-remove-report]')?.dataset.removeReport
    if (!id) return
    try {
      localStorage.setItem(COMPARE_KEY, JSON.stringify(savedVehicles().filter(row => row.id !== id)))
      renderComparison()
    } catch {
      document.getElementById('compareRemoveStatus').textContent = t('storageError')
    }
  }
}
