const EXAMPLE_ID = 'example-camry-70'
const CAMRY_COPY = {
  ru: {
    sampleButton: 'Посмотреть пример отчёта (Camry 70)',
    sampleRiskTitle: 'Риск по фото',
    sampleBanner: 'Демонстрационный отчёт. VIN, наблюдения и цены приведены для примера.',
    sampleVin: 'Условный VIN', reportCity: 'Город', vinNotProvided: 'VIN не указан',
    evidenceRequired: 'Добавьте хотя бы одно фото, код OBD-II или VIN.',
    blindSpotsTitle: 'Слепые зоны',
    repairTitle: 'Ориентировочная смета ремонта',
    repairHelp: 'Введите цены из предложений СТО. Можно указать одну сумму или диапазон в тенге.',
    repairExampleHelp: 'Суммы в примере условные. Уточните цены и объём работ на СТО перед торгом.',
    repairMin: 'От, ₸', repairMax: 'До, ₸', repairTotal: 'Итого по заполненным позициям',
    repairInvalid: 'Укажите целые суммы от 0 до 1 млрд ₸. Нижняя граница не должна превышать верхнюю.',
    camry: {
      city: 'Алматы',
      defects: [
        ['Заднее правое крыло', 'Разнотон краски относительно соседней двери. Возможен повторный окрас.'],
        ['Капот', 'На крепёжных болтах видны следы кручения. Уточните причину снятия капота.'],
      ],
      blindSpots: [
        'Пороги не видны на фото. Проверьте на СТО состояние металла и швов.',
        'Днище не видно на фото. Осмотрите его на подъёмнике на СТО.',
      ],
      repairs: ['Подготовка и окраска заднего правого крыла', 'Проверка креплений капота и геометрии зазоров', 'Диагностика по кодам P0420 и P0171'],
      codes: [
        ['Эффективность катализатора ниже порога (банк 1).', 'Утечка выхлопа или снижение эффективности катализатора.', 'Проверить герметичность выпуска и показания кислородных датчиков.'],
        ['Слишком бедная смесь (банк 1).', 'Подсос воздуха или недостаточная подача топлива.', 'Проверить герметичность впуска и топливные коррекции.'],
      ],
      advice: [
        'Проверьте замечания по фото при осмотре.',
        'Возьмите смету СТО на переговоры и обсудите скидку, если работы подтвердятся.',
      ],
      specs: [['Двигатель', '2,5 л, бензин'], ['Коробка передач', 'Автоматическая']],
    },
  },
  kz: {
    sampleButton: 'Есеп үлгісін көру (Camry 70)',
    sampleRiskTitle: 'Фото бойынша қауіп',
    sampleBanner: 'Демо есеп. VIN, бақылау нәтижелері және бағалар мысал ретінде берілген.',
    sampleVin: 'Шартты VIN', reportCity: 'Қала', vinNotProvided: 'VIN көрсетілмеген',
    evidenceRequired: 'Кемінде бір фото, OBD-II коды немесе VIN қосыңыз.',
    blindSpotsTitle: 'Фотода көрінбейтін жерлер',
    repairTitle: 'Жөндеудің шамамен сметасы',
    repairHelp: 'Автосервис ұсынған бағаларды енгізіңіз. Теңгемен бір соманы немесе баға аралығын көрсете аласыз.',
    repairExampleHelp: 'Мысалдағы сомалар шартты. Саудаласпас бұрын жұмыс көлемі мен бағасын автосервистен нақтылаңыз.',
    repairMin: 'Бастап, ₸', repairMax: 'Дейін, ₸', repairTotal: 'Толтырылған тармақтардың жалпы сомасы',
    repairInvalid: '0 мен 1 млрд ₸ аралығындағы бүтін сомаларды енгізіңіз. Төменгі шек жоғарғы шектен аспауы керек.',
    camry: {
      city: 'Алматы',
      defects: [
        ['Оң жақ артқы қанат', 'Бояу реңкі жанындағы есіктен өзгеше. Қайта боялған болуы мүмкін.'],
        ['Капот', 'Бекіту болттарында бұрау іздері бар. Капоттың неге алынғанын анықтаңыз.'],
      ],
      blindSpots: [
        'Табалдырықтар фотода көрінбейді. Металл мен тігістерді автосервисте тексеріңіз.',
        'Көлік түбі фотода көрінбейді. Оны автосервисте көтергішпен тексеріңіз.',
      ],
      repairs: ['Оң жақ артқы қанатты дайындау және бояу', 'Капот бекіткіштері мен саңылауларын тексеру', 'P0420 және P0171 кодтары бойынша диагностика'],
      codes: [
        ['Катализатор тиімділігі шектен төмен (1-банк).', 'Шығару жүйесінде саңылау болуы немесе катализатор тиімділігінің төмендеуі.', 'Шығару жүйесінің герметикалығын және оттегі датчиктерінің көрсеткіштерін тексеріңіз.'],
        ['Отын қоспасы тым жұтаң (1-банк).', 'Артық ауаның кіруі немесе отынның жеткіліксіз берілуі.', 'Ауа кіретін жүйенің герметикалығын және отын түзетулерін тексеріңіз.'],
      ],
      advice: [
        'Фотодағы белгілерді көзбе-көз тексеріңіз.',
        'Жөндеу қажеттігі расталса, автосервис сметасын көрсетіп, жеңілдік туралы сөйлесіңіз.',
      ],
      specs: [['Қозғалтқыш', '2,5 л, бензин'], ['Беріліс қорабы', 'Автоматты']],
    },
  },
  en: {
    sampleButton: 'View sample report (Camry 70)',
    sampleRiskTitle: 'Risk from photos',
    sampleBanner: 'Sample report. The VIN, findings and prices are illustrative.',
    sampleVin: 'Sample VIN', reportCity: 'City', vinNotProvided: 'VIN not provided',
    evidenceRequired: 'Add at least one photo, an OBD-II code, or a VIN.',
    blindSpotsTitle: 'Blind spots',
    repairTitle: 'Estimated repair costs',
    repairHelp: 'Enter shop quotes in tenge. You can enter a single amount or a range.',
    repairExampleHelp: 'Sample costs are illustrative. Ask a shop to confirm the scope and prices before negotiating.',
    repairMin: 'From, ₸', repairMax: 'To, ₸', repairTotal: 'Total for priced items',
    repairInvalid: 'Enter whole amounts from ₸0 to ₸1 billion. The lower amount must be at or below the upper amount.',
    camry: {
      city: 'Almaty',
      defects: [
        ['Right rear quarter panel', 'The paint tone differs from the adjacent door, suggesting a possible repaint.'],
        ['Hood', 'Tool marks are visible on the mounting bolts. Ask why the hood was removed.'],
      ],
      blindSpots: [
        'The rocker panels are outside the photos. Ask a shop to inspect the metal and seams.',
        'The underbody is outside the photos. Ask a shop to inspect it on a lift.',
      ],
      repairs: ['Prepare and repaint the right rear quarter panel', 'Inspect hood mounts and panel gaps', 'Run diagnostics for P0420 and P0171'],
      codes: [
        ['Catalyst efficiency below threshold (bank 1).', 'An exhaust leak or reduced catalyst efficiency.', 'Check for exhaust leaks and review oxygen sensor readings.'],
        ['Fuel mixture too lean (bank 1).', 'Unmetered intake air or insufficient fuel supply.', 'Check for intake leaks and review fuel-trim readings.'],
      ],
      advice: [
        'Confirm the photo findings in person.',
        'Bring the shop estimate to the negotiation and discuss a discount if the work is confirmed.',
      ],
      specs: [['Engine', '2.5 L petrol'], ['Transmission', 'Automatic']],
    },
  },
}

for (const [lang, translations] of Object.entries(CAMRY_COPY)) Object.assign(I18N[lang], translations)

function localizedCamryExample() {
  const copy = t('camry')
  return {
    city: copy.city,
    damages: copy.defects.map(([part, issue]) => ({ part, issue, severity: 'Medium' })),
    blindSpots: copy.blindSpots,
    repairItems: copy.repairs,
    specs: copy.specs,
    recs: copy.advice,
    obd: copy.codes.map(([description, cause, recommendation], index) => ({
      code: ['P0420', 'P0171'][index],
      description,
      cause: [cause],
      severity: 'Medium',
      recommendations: [recommendation],
    })),
  }
}

function openCamryExample() {
  setCurrentReport({
    id: EXAMPLE_ID,
    isExample: true,
    ...localizedCamryExample(),
    vin: '4T1B11HK0KU000000',
    vehicle: { make: 'Toyota', model: 'Camry 70', year: '2019' },
    score: 68,
    risk: 'High',
    hasPhotos: true,
    photoAnalyzed: true,
    photoStatus: 'success',
    assessedViews: ['front', 'rear', 'right'],
    submittedViews: ['front', 'rear', 'right'],
    photos: [],
    history: [],
    generatedAt: new Date().toISOString(),
    repairCosts: [['90000', '150000'], ['18000', '35000'], ['25000', '45000']],
    comparisonDefaults: { price: '11900000', mileage: '126000' },
  })
  renderReport()
  goTo('report')
}

function formatTenge(amount) {
  return `${new Intl.NumberFormat(document.documentElement.lang).format(amount)} ₸`
}

function formatRepairRange({ low, high }) {
  return low === high ? formatTenge(low) : `${formatTenge(low)} – ${formatTenge(high)}`
}

function repairTotals(costs) {
  const total = { low: 0, high: 0, count: 0, invalid: false }
  for (const [first, last] of costs ?? []) {
    if (!first && !last) continue
    const low = first || last
    const high = last || first
    if (![low, high].every(value => /^\d+$/.test(value) && Number(value) <= 1_000_000_000) ||
        Number(low) > Number(high)) {
      total.invalid = true
      continue
    }
    total.low += Number(low)
    total.high += Number(high)
    total.count++
  }
  return total
}

function repairEstimateHtml(report) {
  const items = report.repairItems ?? report.damages.map(damage => damage.part)
  if (!items.length) return ''
  report.repairCosts ??= items.map(() => ['', ''])
  return `<section class="card tool-card" id="repairEstimate">
    <h3>${t('repairTitle')}</h3>
    <p>${t(report.isExample ? 'repairExampleHelp' : 'repairHelp')}</p>
    ${items.map((label, index) => `<div class="repair-row">
      <strong id="repair-item-${index}">${escapeHtml(label)}</strong>
      ${['repairMin', 'repairMax'].map((bound, column) => `<div class="repair-input">
        <label for="repair-${index}-${column}" id="repair-bound-${index}-${column}">${t(bound)}</label>
        <input type="number" min="0" max="1000000000" step="1" id="repair-${index}-${column}"
          aria-labelledby="repair-item-${index} repair-bound-${index}-${column}"
          data-row="${index}" data-column="${column}" value="${escapeHtml(report.repairCosts[index][column])}">
      </div>`).join('')}
      <span class="print-only" data-printed-cost="${index}"></span>
    </div>`).join('')}
    <div class="repair-total">${t('repairTotal')} <output id="repairTotal" aria-live="polite"></output></div>
    <div class="err" id="repairError" role="status"></div>
  </section>`
}

function bindRepairEstimate(report) {
  const section = document.getElementById('repairEstimate')
  if (!section) return
  const output = document.getElementById('repairTotal')
  const error = document.getElementById('repairError')
  function update() {
    const result = repairTotals(report.repairCosts)
    output.textContent = result.count ? formatRepairRange(result) : '—'
    error.textContent = result.invalid ? t('repairInvalid') : ''
    section.querySelectorAll('[data-printed-cost]').forEach(el => {
      const amount = repairTotals([report.repairCosts[el.dataset.printedCost]])
      el.textContent = amount.count ? formatRepairRange(amount) : '—'
    })
  }
  section.oninput = event => {
    const input = event.target
    if (!input.matches('input[data-row]')) return
    report.repairCosts[input.dataset.row][input.dataset.column] = input.validity.badInput ? 'invalid' : input.value
    update()
    saveCurrentReport()
  }
  update()
}
