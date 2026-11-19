// ════════════════════════════════════════════════════════════════════════════════
//  KolikCheck.AI — Lokalnaya baza diagnostiki EBU (ECU) i BK
//  Ne trebuet podklyucheniya k AI. Vse razbor kodov rabotaet oффлайн.
// ════════════════════════════════════════════════════════════════════════════════

const DTC_DATABASE = [
  // ══ P0xxx — Топливо, воздух, выхлоп (Powertrain) ══
  { code: 'P0100', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи датчика массового расхода воздуха (MAF)', severity: 'Medium', cause: ['Загрязнён или повреждён датчик MAF', 'Повреждена проводка датчика', 'Течь воздуха после датчика'], recommendations: ['Очистить или заменить датчик MAF', 'Проверить шланги впуска на наличие течей', 'Проверить разъём и проводку датчика'], obdType: 'P' },
  { code: 'P0101', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Диапазон/производительность датчика MAF вне нормы', severity: 'Medium', cause: ['Некорректные показания MAF', 'Засорённый воздухофильтр', 'Течь вакуума'], recommendations: ['Заменить воздухофильтр', 'Проверить датчик MAF', 'Проверить впускной тракт на течи'], obdType: 'P' },
  { code: 'P0102', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Низкий уровень сигнала датчика MAF', severity: 'Medium', cause: ['Обрыв цепи датчика MAF', 'Короткое замыкание на массу', 'Плохой контакт разъёма'], recommendations: ['Проверить проводку и разъём MAF', 'Измерить напряжение на датчике', 'При необходимости заменить датчик'], obdType: 'P' },
  { code: 'P0103', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Высокий уровень сигнала датчика MAF', severity: 'Medium', cause: ['Короткое замыкание на плюс', 'Неисправный датчик MAF'], recommendations: ['Проверить цепи питания датчика MAF', 'Заменить датчик MAF при подтверждении неисправности'], obdType: 'P' },
  { code: 'P0104', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Прерывистый сигнал датчика MAF', severity: 'Medium', cause: ['Прерывистый контакт разъёма', 'Повреждённая изоляция проводов'], recommendations: ['Проверить разъём и жгут проводов MAF на износ'], obdType: 'P' },
  { code: 'P0110', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи датчика температуры входящего воздуха (IAT)', severity: 'Low', cause: ['Неисправен датчик IAT', 'Повреждена проводка'], recommendations: ['Проверить датчик температуры воздуха', 'Проверить Conductors и разъём'], obdType: 'P' },
  { code: 'P0115', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи датчика температуры охлаждающей жидкости (ECT)', severity: 'Medium', cause: ['Неисправен датчик ECT', 'Низкий уровень охлаждающей жидкости', 'Повреждена проводка'], recommendations: ['Проверить уровень ОЖ', 'Заменить датчик температуры ОЖ', 'Проверить проводку датчика'], obdType: 'P' },
  { code: 'P0116', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Диапазон/производительность датчика ECT', severity: 'Medium', cause: ['Термостат застрял открытым', 'Неисправен датчик ECT'], recommendations: ['Проверить термостат', 'Заменить датчик ECT'], obdType: 'P' },
  { code: 'P0117', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Низкий уровень сигнала датчика ECT', severity: 'Medium', cause: ['Обрыв цепи датчика ECT', 'Короткое замыкание на массу'], recommendations: ['Проверить проводку ECT', 'Заменить датчик при необходимости'], obdType: 'P' },
  { code: 'P0118', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Высокий уровень сигнала датчика ECT', severity: 'Medium', cause: ['Короткое замыкание на плюс', 'Неисправен датчик ECT'], recommendations: ['Проверить цепь питания ECT', 'Заменить датчик ECT'], obdType: 'P' },
  { code: 'P0120', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи датчика положения дроссельной заслонки (TP)', severity: 'Medium', cause: ['Неисправен датчик TP', 'Повреждена проводка', 'Износ контактов'], recommendations: ['Проверить датчик положения дросселя', 'Проверить разъём и жгут'], obdType: 'P' },
  { code: 'P0121', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Диапазон/производительность датчика TP', severity: 'Medium', cause: ['Некорректные показания TP', 'Залипание дросселя'], recommendations: ['Очистить дроссельный узел', 'Проверить датчик TP'], obdType: 'P' },
  { code: 'P0122', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Низкий уровень сигнала датчика TP', severity: 'Medium', cause: ['Обрыв цепи TP', 'Короткое замыкание на массу'], recommendations: ['Проверить проводку и разъём TP'], obdType: 'P' },
  { code: 'P0123', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Высокий уровень сигнала датчика TP', severity: 'Medium', cause: ['Короткое замыкание на плюс'], recommendations: ['Проверить цепь питания TP'], obdType: 'P' },
  { code: 'P0125', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Недостаточная температура ОЖ для закрытия цикла обратной связи топливно-воздушной смеси', severity: 'Medium', cause: ['Термостат застрял открытым', 'Низкий уровень ОЖ', 'Неисправен датчик ECT'], recommendations: ['Проверить термостат', 'Долить ОЖ', 'Заменить датчик ECT'], obdType: 'P' },
  { code: 'P0130', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи лямбда-зонда (O2) банк 1 датчик 1', severity: 'Medium', cause: ['Неисправен датчик кислорода', 'Повреждена проводка', 'Утечка выхлопных газов'], recommendations: ['Проверить лямбда-зонд перед катализатором', 'Проверить Conductors и разъём'], obdType: 'P' },
  { code: 'P0131', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Низкое напряжение лямбда-зонда банк 1 датчик 1', severity: 'Medium', cause: ['Бедная смесь', 'Неисправен датчик O2', 'Утечка вакуума'], recommendations: ['Проверить датчик кислорода', 'Проверить утечки вакуума'], obdType: 'P' },
  { code: 'P0132', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Высокое напряжение лямбда-зонда банк 1 датчик 1', severity: 'Medium', cause: ['Богатая смесь', 'Неисправен датчик O2', 'Засорён топливный фильтр'], recommendations: ['Заменить лямбда-зонд', 'Проверить давление топлива'], obdType: 'P' },
  { code: 'P0133', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Медленная реакция лямбда-зонда банк 1 датчик 1', severity: 'Low', cause: ['Загрязнён датчик O2', 'Утечка выхлопа перед датчиком'], recommendations: ['Заменить лямбда-зонд', 'Проверить выпускной коллектор'], obdType: 'P' },
  { code: 'P0134', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Отсутствие активности лямбда-зонда банк 1 датчик 1', severity: 'Medium', cause: ['Повреждён нагреватель датчика', 'Обрыв цепи'], recommendations: ['Проверить нагреватель лямбда-зонда', 'Заменить датчик O2'], obdType: 'P' },
  { code: 'P0135', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность нагревателя лямбда-зонда банк 1 датчик 1', severity: 'Medium', cause: ['Перегорел нагреватель датчика', 'Обрыв цепи нагревателя'], recommendations: ['Проверить предохранитель нагревателя лямбда-зонда', 'Заменить лямбда-зонд'], obdType: 'P' },
  { code: 'P0140', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Отсутствие активности лямбда-зонда банк 1 датчик 2', severity: 'Medium', cause: ['Неисправен датчик O2 после катализатора', 'Обрыв проводки'], recommendations: ['Проверить датчик кислорода после катализатора', 'Проверить Conductors'], obdType: 'P' },
  { code: 'P0141', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность нагревателя лямбда-зонда банк 1 датчик 2', severity: 'Low', cause: ['Перегорел нагреватель', 'Обрыв цепи'], recommendations: ['Заменить датчик O2 банк 1 датчик 2'], obdType: 'P' },
  { code: 'P0150', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Неисправность цепи лямбда-зонда банк 2 датчик 1', severity: 'Medium', cause: ['Неисправен датчик O2 банк 2', 'Повреждена проводка'], recommendations: ['Проверить лямбда-зонд банк 2'], obdType: 'P' },
  { code: 'P0171', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Смесь слишком бедная (банк 1)', severity: 'Medium', cause: ['Утечка воздуха (вакуум)', 'Засорён топливный фильтр', 'Низкое давление топлива', 'Неисправен датчик MAF'], recommendations: ['Проверить вакуумные шланги на течи', 'Заменить топливный фильтр', 'Проверить давление в топливной раме'], obdType: 'P' },
  { code: 'P0172', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Смесь слишком богатая (банк 1)', severity: 'Medium', cause: ['Забит воздушный фильтр', 'Неисправен регулятор давления топлива', 'Протекают форсунки'], recommendations: ['Заменить воздухофильтр', 'Проверить форсунки на протечку'], obdType: 'P' },
  { code: 'P0174', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Смесь слишком бедная (банк 2)', severity: 'Medium', cause: ['Утечка воздуха банк 2', 'Неисправен датчик MAF банк 2'], recommendations: ['Проверить впускные шланги банк 2'], obdType: 'P' },
  { code: 'P0175', system: 'Powertrain', group: 'Fuel and Air Metering', description: 'Смесь слишком богатая (банк 2)', severity: 'Medium', cause: ['Неисправные форсунки банк 2'], recommendations: ['Проверить форсунки банк 2'], obdType: 'P' },
  // P02xx — Топливо и воздух (инжектор)
  { code: 'P0200', system: 'Powertrain', group: 'Fuel Injector Circuit', description: 'Неисправность цепи форсунок', severity: 'Medium', cause: ['Обрыв цепи форсунки', 'Короткое замыкание', 'Неисправен драйвер форсунок в ЭБУ'], recommendations: ['Проверить Conductors форсунок', 'Измерить сопротивление форсунок'], obdType: 'P' },
  { code: 'P0201', system: 'Powertrain', group: 'Fuel Injector Circuit', description: 'Неисправность цепи форсунки цилиндра 1', severity: 'Medium', cause: ['Обрыв цепи форсунки 1', 'Неисправна форсунка 1'], recommendations: ['Заменить форсунку цилиндра 1', 'Проверить проводку'], obdType: 'P' },
  { code: 'P0202', system: 'Powertrain', group: 'Fuel Injector Circuit', description: 'Неисправность цепи форсунки цилиндра 2', severity: 'Medium', cause: ['Обрыв цепи форсунки 2', 'Неисправна форсунка 2'], recommendations: ['Заменить форсунку цилиндра 2'], obdType: 'P' },
  { code: 'P0203', system: 'Powertrain', group: 'Fuel Injector Circuit', description: 'Неисправность цепи форсунки цилиндра 3', severity: 'Medium', cause: ['Обрыв цепи форсунки 3', 'Неисправна форсунка 3'], recommendations: ['Заменить форсунку цилиндра 3'], obdType: 'P' },
  { code: 'P0204', system: 'Powertrain', group: 'Fuel Injector Circuit', description: 'Неисправность цепи форсунки цилиндра 4', severity: 'Medium', cause: ['Обрыв цепи форсунки 4', 'Неисправна форсунка 4'], recommendations: ['Заменить форсунку цилиндра 4'], obdType: 'P' },
  // P03xx — Зажигание
  { code: 'P0300', system: 'Powertrain', group: 'Ignition System', description: 'Случайные/множественные пропуски зажигания', severity: 'High', cause: ['Изношены свечи зажигания', 'Неисправны катушки зажигания', 'Утечка вакуума', 'Низкое давление топлива'], recommendations: ['Заменить свечи зажигания', 'Проверить катушки зажигания', 'Проверить вакуумные шланги'], obdType: 'P' },
  { code: 'P0301', system: 'Powertrain', group: 'Ignition System', description: 'Пропуск зажигания цилиндра 1', severity: 'High', cause: ['Неисправна свеча цилиндра 1', 'Неисправна катушка цилиндра 1', 'Низкое сжатие'], recommendations: ['Заменить свечу цилиндра 1', 'Заменить катушку зажигания цилиндра 1'], obdType: 'P' },
  { code: 'P0302', system: 'Powertrain', group: 'Ignition System', description: 'Пропуск зажигания цилиндра 2', severity: 'High', cause: ['Неисправна свеча цилиндра 2', 'Неисправна катушка цилиндра 2'], recommendations: ['Заменить свечу цилиндра 2', 'Заменить катушку цилиндра 2'], obdType: 'P' },
  { code: 'P0303', system: 'Powertrain', group: 'Ignition System', description: 'Пропуск зажигания цилиндра 3', severity: 'High', cause: ['Неисправна свеча цилиндра 3', 'Неисправна катушка цилиндра 3'], recommendations: ['Заменить свечу цилиндра 3'], obdType: 'P' },
  { code: 'P0304', system: 'Powertrain', group: 'Ignition System', description: 'Пропуск зажигания цилиндра 4', severity: 'High', cause: ['Неисправна свеча цилиндра 4', 'Неисправна катушка цилиндра 4'], recommendations: ['Заменить свечу цилиндра 4'], obdType: 'P' },
  { code: 'P0325', system: 'Powertrain', group: 'Ignition System', description: 'Неисправность цепи датчика детонации 1', severity: 'Medium', cause: ['Неисправен датчик детонации', 'Повреждена проводка'], recommendations: ['Заменить датчик детонации', 'Проверить Conductors'], obdType: 'P' },
  { code: 'P0335', system: 'Powertrain', group: 'Ignition System', description: 'Неисправность цепи датчика положения коленвала (CKP)', severity: 'High', cause: ['Неисправен датчик CKP', 'Поврежён ведущий диск', 'Обрыв цепи'], recommendations: ['Заменить датчик положения коленвала', 'Проверить зазор датчика'], obdType: 'P' },
  { code: 'P0340', system: 'Powertrain', group: 'Ignition System', description: 'Неисправность цепи датчика положения распредвала (CMP)', severity: 'High', cause: ['Неисправен датчик CMP', 'Поврежён ремень ГРМ', 'Обрыв цепи'], recommendations: ['Заменить датчик положения распредвала', 'Проверить ремень ГРМ'], obdType: 'P' },
  { code: 'P0341', system: 'Powertrain', group: 'Ignition System', description: 'Неправильный сигнал датчика положения распредвала', severity: 'Medium', cause: ['Неисправен датчик CMP', 'Проблемы с ремнём ГРМ'], recommendations: ['Заменить датчик CMP'], obdType: 'P' },
  // P04xx — Выброс отработавших газов
  { code: 'P0400', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Неисправность системы рециркуляции отработавших газов (EGR)', severity: 'Medium', cause: ['Забит клапан EGR', 'Забиты каналы EGR', 'Неисправен электроклапан EGR'], recommendations: ['Очистить клапан EGR', 'Заменить электроклапан EGR'], obdType: 'P' },
  { code: 'P0401', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Недостаточный поток EGR', severity: 'Medium', cause: ['Забиты каналы рециркуляции'], recommendations: ['Очистить каналы EGR от нагара'], obdType: 'P' },
  { code: 'P0420', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Низкая эффективность катализатора (банк 1)', severity: 'High', cause: ['Изношен катализатор', 'Неисправен лямбда-зонд после катализатора', 'Пропуски зажигания'], recommendations: ['Проверить лямбда-зонд после катализатора', 'Заменить катализатор при подтверждении'], obdType: 'P' },
  { code: 'P0430', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Низкая эффективность катализатора (банк 2)', severity: 'High', cause: ['Изношен катализатор банк 2'], recommendations: ['Проверить лямбда-зонд банк 2', 'Заменить катализатор'], obdType: 'P' },
  { code: 'P0440', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Неисправность системы адсорбции паров топлива (EVAP)', severity: 'Low', cause: ['Не закрыта крышка бензобака', 'Утечка паров топлива', 'Неисправен клапан адсорбера'], recommendations: ['Закрыть крышку бензобака', 'Проверить клапан адсорбера'], obdType: 'P' },
  { code: 'P0441', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Неправильный поток в системе адсорбции паров', severity: 'Low', cause: ['Засорён адсорбер', 'Неисправен клапан продувки'], recommendations: ['Проверить адсорбер и клапаны системы EVAP'], obdType: 'P' },
  { code: 'P0442', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Небольшая утечка в системе адсорбции паров', severity: 'Low', cause: ['Не плотно закрыта крышка бака', 'Трещина в шланге адсорбера'], recommendations: ['Проверить крышку бензобака', 'Проверить шланги адсорбера'], obdType: 'P' },
  { code: 'P0455', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Большая утечка в системе адсорбции паров', severity: 'Medium', cause: ['Отсутствует крышка бензобака', 'Разорван шланг адсорбера'], recommendations: ['Установить крышку бензобака', 'Заменить повреждённые шланги'], obdType: 'P' },
  { code: 'P0456', system: 'Powertrain', group: 'Auxiliary Emission Controls', description: 'Маленькая утечка в системе адсорбции паров', severity: 'Low', cause: ['Не герметично закрыта крышка бака'], recommendations: ['Проверить крышку бака'], obdType: 'P' },
  // P05xx — Холостой ход, скорость
  { code: 'P0500', system: 'Powertrain', group: 'Vehicle Speed Control', description: 'Неисправность датчика скорости автомобиля (VSS)', severity: 'Medium', cause: ['Неисправен датчик скорости', 'Обрыв цепи датчика'], recommendations: ['Заменить датчик скорости', 'Проверить Conductors'], obdType: 'P' },
  { code: 'P0505', system: 'Powertrain', group: 'Idle Control System', description: 'Неисправность системы управления холостым ходом (IAC)', severity: 'Medium', cause: ['Забит клапан холостого хода', 'Неисправен шаговый двигатель IAC'], recommendations: ['Очистить клапан холостого хода', 'Заменить клапан IAC'], obdType: 'P' },
  { code: 'P0506', system: 'Powertrain', group: 'Idle Control System', description: 'Низкая частота вращения на холостом ходу', severity: 'Low', cause: ['Забит канал воздуха холостого хода'], recommendations: ['Очистить дроссельный узел'], obdType: 'P' },
  { code: 'P0507', system: 'Powertrain', group: 'Idle Control System', description: 'Высокая частота вращения на холостом ходу', severity: 'Low', cause: ['Утечка воздуха', 'Залипание дросселя'], recommendations: ['Проверить утечки впуска', 'Очистить дроссельный узел'], obdType: 'P' },
  { code: 'P0562', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Низкое напряжение бортовой сети', severity: 'Medium', cause: ['Разряжен аккумулятор', 'Неисправен генератор', 'Окислены клеммы'], recommendations: ['Проверить аккумулятор', 'Проверить генератор и ремень', 'Очистить клеммы аккумулятора'], obdType: 'P' },
  { code: 'P0563', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Высокое напряжение бортовой сети', severity: 'Medium', cause: ['Неисправен регулятор напряжения генератора'], recommendations: ['Проверить генератор и регулятор напряжения'], obdType: 'P' },
  { code: 'P0600', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Неисправность сетевой связи ЭБУ (CAN)', severity: 'High', cause: ['Обрыв CAN-шины', 'Неисправен ЭБУ', 'Помехи на шине'], recommendations: ['Проверить CAN-шину и терминирующие резисторы', 'Проверить подключение всех модулей'], obdType: 'P' },
  { code: 'P0601', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Ошибка внутренней памяти ЭБУ (ROM)', severity: 'High', cause: ['Неисправность микропроцессора ЭБУ', 'Повреждение прошивки'], recommendations: ['Перепрошить ЭБУ', 'Заменить ЭБУ'], obdType: 'P' },
  { code: 'P0602', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Ошибка программирования ЭБУ', severity: 'High', cause: ['Неверная прошивка', 'Ошибка перепрошивки'], recommendations: ['Перепрошить ЭБУ оригинальной прошивкой'], obdType: 'P' },
  { code: 'P0603', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Ошибка внутренней памяти ЭБУ (Keep Alive Memory)', severity: 'Medium', cause: ['Отключён аккумулятор', 'Неисправность памяти ЭБУ'], recommendations: ['Проверить клеммы аккумулятора', 'Перезагрузить ЭБУ'], obdType: 'P' },
  { code: 'P0604', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Ошибка внутренней памяти ЭБУ (RAM)', severity: 'High', cause: ['Неисправность оперативной памяти ЭБУ'], recommendations: ['Заменить или отремонтировать ЭБУ'], obdType: 'P' },
  { code: 'P0605', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Ошибка внутренней памяти ЭБУ (ROM)', severity: 'High', cause: ['Повреждение ПЗУ ЭБУ'], recommendations: ['Заменить ЭБУ'], obdType: 'P' },
  { code: 'P0606', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Неисправность процессора ЭБУ', severity: 'High', cause: ['Неисправность микроконтроллера ЭБУ'], recommendations: ['Заменить ЭБУ'], obdType: 'P' },
  { code: 'P0607', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Неисправность производительности ЭБУ', severity: 'High', cause: ['Перегрев ЭБУ', 'Неисправность процессора'], recommendations: ['Проверить охлаждение ЭБУ', 'Заменить ЭБУ'], obdType: 'P' },
  { code: 'P0620', system: 'Powertrain', group: 'Computer Output Circuits', description: 'Неисправность цепи генератора', severity: 'Medium', cause: ['Неисправен генератор', 'Обрыв цепи управления генератором'], recommendations: ['Проверить генератор', 'Проверить Conductors управления'], obdType: 'P' },
  // P07xx — Коробка передач
  { code: 'P0700', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность системы управления трансмиссией (TCM)', severity: 'Medium', cause: ['Неисправен модуль управления коробкой (TCM)', 'Общая неисправность АКПП'], recommendations: ['Проверить уровень и состояние ATF', 'Диагностировать TCM'], obdType: 'P' },
  { code: 'P0705', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность датчика диапазона передачи (TR)', severity: 'Medium', cause: ['Неисправен датчик позиции селектора'], recommendations: ['Проверить датчик позиции селектора'], obdType: 'P' },
  { code: 'P0715', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность датчика скорости выходного вала коробки', severity: 'Medium', cause: ['Неисправен датчик скорости выходного вала'], recommendations: ['Заменить датчик скорости выходного вала'], obdType: 'P' },
  { code: 'P0720', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность датчика скорости выходного вала', severity: 'Medium', cause: ['Обрыв цепи датчика'], recommendations: ['Проверить Conductors датчика скорости'], obdType: 'P' },
  { code: 'P0730', system: 'Powertrain', group: 'Transmission Control', description: 'Неверное передаточное число', severity: 'Medium', cause: ['Проскальзывание сцеплений АКПП', 'Низкий уровень ATF'], recommendations: ['Проверить уровень ATF', 'Диагностировать коробку передач'], obdType: 'P' },
  { code: 'P0740', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность цепи блокировки гидротрансформатора (TCC)', severity: 'Medium', cause: ['Неисправен соленоид блокировки', 'Забиты каналы гидроблока'], recommendations: ['Заменить соленоид блокировки', 'Промыть гидроблок'], obdType: 'P' },
  { code: 'P0750', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность соленоида переключения передач A', severity: 'Medium', cause: ['Неисправен соленоид A', 'Обрыв цепи соленоида'], recommendations: ['Заменить соленоид переключения A'], obdType: 'P' },
  { code: 'P0753', system: 'Powertrain', group: 'Transmission Control', description: 'Неисправность цепи соленоида переключения передач A', severity: 'Medium', cause: ['Электрическая неисправность соленоида A'], recommendations: ['Проверить цепь соленоида A'], obdType: 'P' },
];
// ══ Bxxxx — Кузов (Body) ══
  { code: 'B0010', system: 'Body', group: 'Airbag', description: 'Неисправность подушки безопасности водителя', severity: 'High', cause: ['Неисправен датчик удара', 'Обрыв цепи подушки'], recommendations: ['Проверить Conductors подушки безопасности', 'Заменить модуль подушки'], obdType: 'B' },
  { code: 'B0011', system: 'Body', group: 'Airbag', description: 'Неисправность подушки безопасности пассажира', severity: 'High', cause: ['Неисправна подушка пассажира', 'Обрыв цепи'], recommendations: ['Заменить подушку безопасности пассажира'], obdType: 'B' },
  { code: 'B0012', system: 'Body', group: 'Airbag', description: 'Неисправность боковой подушки безопасности', severity: 'High', cause: ['Неисправен датчик бокового удара'], recommendations: ['Заменить датчик бокового удара'], obdType: 'B' },
  { code: 'B0013', system: 'Body', group: 'Airbag', description: 'Неисправность шторки безопасности', severity: 'High', cause: ['Неисправна шторка безопасности'], recommendations: ['Заменить шторку безопасности'], obdType: 'B' },
  { code: 'B1000', system: 'Body', group: 'Communication', description: 'Неисправность связи модулей кузова', severity: 'Medium', cause: ['Обрыв CAN-шины кузова'], recommendations: ['Проверить CAN-шину кузова'], obdType: 'B' },
  { code: 'B1001', system: 'Body', group: 'Communication', description: 'Потеря связи с модулем двери водителя', severity: 'Low', cause: ['Неисправен модуль двери'], recommendations: ['Проверить Conductors модуля двери'], obdType: 'B' },
  { code: 'B1002', system: 'Body', group: 'Communication', description: 'Потеря связи с модулем двери пассажира', severity: 'Low', cause: ['Неисправен модуль двери пассажира'], recommendations: ['Проверить модуль двери пассажира'], obdType: 'B' },
  { code: 'B1010', system: 'Body', group: 'Lighting', description: 'Неисправность цепи ближнего света фар', severity: 'Medium', cause: ['Перегорела лампочка', 'Обрыв Conductors'], recommendations: ['Заменить лампу фары', 'Проверить предохранитель'], obdType: 'B' },
  { code: 'B1011', system: 'Body', group: 'Lighting', description: 'Неисправность цепи дальнего света фар', severity: 'Medium', cause: ['Перегорела лампа дальнего света'], recommendations: ['Заменить лампу дальнего света'], obdType: 'B' },
  { code: 'B1020', system: 'Body', group: 'Lighting', description: 'Неисправность цепи стоп-сигнала', severity: 'Medium', cause: ['Перегорела лампа стоп-сигнала'], recommendations: ['Заменить лампу стоп-сигнала'], obdType: 'B' },
  { code: 'B1021', system: 'Body', group: 'Lighting', description: 'Неисправность цепи поворотника', severity: 'Low', cause: ['Перегорела лампа поворотника'], recommendations: ['Заменить лампу поворотника'], obdType: 'B' },
  { code: 'B1100', system: 'Body', group: 'Central Locking', description: 'Неисправность центрального замка', severity: 'Low', cause: ['Неисправен актуатор замка', 'Обрыв Conductors'], recommendations: ['Заменить актуатор центрального замка'], obdType: 'B' },
  { code: 'B1101', system: 'Body', group: 'Central Locking', description: 'Неисправность замка двери водителя', severity: 'Low', cause: ['Неисправен замок двери'], recommendations: ['Заменить замок двери водителя'], obdType: 'B' },
  { code: 'B1102', system: 'Body', group: 'Central Locking', description: 'Неисправность замка двери пассажира', severity: 'Low', cause: ['Неисправен замок двери'], recommendations: ['Заменить замок двери пассажира'], obdType: 'B' },
  { code: 'B1200', system: 'Body', group: 'Climate Control', description: 'Неисправность климат-контроля', severity: 'Low', cause: ['Неисправен датчик температуры салона'], recommendations: ['Проверить датчик температуры салона'], obdType: 'B' },
  { code: 'B1201', system: 'Body', group: 'Climate Control', description: 'Неисправность мотора печки', severity: 'Low', cause: ['Перегорел мотор вентилятора'], recommendations: ['Заменить мотор вентилятора печки'], obdType: 'B' },
  { code: 'B1300', system: 'Body', group: 'Power Windows', description: 'Неисправность стеклоподъёмника водителя', severity: 'Low', cause: ['Неисправен мотор стеклоподъёмника'], recommendations: ['Заменить мотор стеклоподъёмника'], obdType: 'B' },
  { code: 'B1301', system: 'Body', group: 'Power Windows', description: 'Неисправность стеклоподъёмника пассажира', severity: 'Low', cause: ['Неисправен мотор стеклоподъёмника'], recommendations: ['Заменить мотор стеклоподъёмника'], obdType: 'B' },
  // ══ Cxxxx — Шасси (Chassis) ══
  { code: 'C0010', system: 'Chassis', group: 'ABS', description: 'Неисправность датчика скорости колеса ABS переднего левого', severity: 'High', cause: ['Неисправен датчик ABS', 'Загрязнён датчик'], recommendations: ['Очистить или заменить датчик ABS'], obdType: 'C' },
  { code: 'C0011', system: 'Chassis', group: 'ABS', description: 'Неисправность датчика скорости колеса ABS переднего правого', severity: 'High', cause: ['Неисправен датчик ABS'], recommendations: ['Заменить датчик ABS'], obdType: 'C' },
  { code: 'C0012', system: 'Chassis', group: 'ABS', description: 'Неисправность датчика скорости колеса ABS заднего левого', severity: 'High', cause: ['Неисправен датчик ABS'], recommendations: ['Заменить датчик ABS'], obdType: 'C' },
  { code: 'C0013', system: 'Chassis', group: 'ABS', description: 'Неисправность датчика скорости колеса ABS заднего правого', severity: 'High', cause: ['Неисправен датчик ABS'], recommendations: ['Заменить датчик ABS'], obdType: 'C' },
  { code: 'C0035', system: 'Chassis', group: 'ABS', description: 'Неисправность насоса модуля ABS', severity: 'High', cause: ['Неисправен насос ABS'], recommendations: ['Заменить насос ABS или модуль'], obdType: 'C' },
  { code: 'C0040', system: 'Chassis', group: 'ABS', description: 'Неисправность электроклапана ABS', severity: 'High', cause: ['Заклинило электроклапан ABS'], recommendations: ['Заменить электроклапан ABS'], obdType: 'C' },
  { code: 'C0100', system: 'Chassis', group: 'ESP', description: 'Неисправность системы ESP', severity: 'High', cause: ['Неисправен модуль ESP'], recommendations: ['Диагностировать модуль ESP'], obdType: 'C' },
  { code: 'C0110', system: 'Chassis', group: 'ESP', description: 'Неисправность датчика угла поворота рулевого колеса', severity: 'Medium', cause: ['Неисправен датчик угла руля'], recommendations: ['Провести калибровку датчика угла руля'], obdType: 'C' },
  { code: 'C0200', system: 'Chassis', group: 'Air Suspension', description: 'Неисправность пневмоподвески', severity: 'Medium', cause: ['Течь пневмоэлемента', 'Неисправен компрессор'], recommendations: ['Проверить пневмоэлементы на течи'], obdType: 'C' },
  { code: 'C0210', system: 'Chassis', group: 'Air Suspension', description: 'Неисправность компрессора пневмоподвески', severity: 'Medium', cause: ['Перегорел компрессор'], recommendations: ['Заменить компрессор пневмоподвески'], obdType: 'C' },
  // ══ Uxxxx — Сеть (Network) ══
  { code: 'U0001', system: 'Network', group: 'CAN Bus', description: 'Неисправность CAN шины высокоскоростной', severity: 'High', cause: ['Обрыв CAN-шины', 'Короткое замыкание CAN'], recommendations: ['Проверить CAN-шину и терминаторы'], obdType: 'U' },
  { code: 'U0002', system: 'Network', group: 'CAN Bus', description: 'Неисправность CAN шины низкоскоростной', severity: 'High', cause: ['Повреждена низкоскоростная CAN шина'], recommendations: ['Проверить низкоскоростную CAN-шину'], obdType: 'U' },
  { code: 'U0100', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем управления двигателем (ECM/PCM)', severity: 'High', cause: ['Обрыв Conductors к ЭБУ двигателя'], recommendations: ['Проверить Conductors к ЭБУ'], obdType: 'U' },
  { code: 'U0101', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем управления трансмиссией (TCM)', severity: 'High', cause: ['Потеря связи с TCM'], recommendations: ['Проверить Conductors к TCM'], obdType: 'U' },
  { code: 'U0121', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем ABS', severity: 'High', cause: ['Обрыв Conductors к модулю ABS'], recommendations: ['Проверить модуль ABS'], obdType: 'U' },
  { code: 'U0140', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем кузова (BCM)', severity: 'Medium', cause: ['Потеря связи с BCM'], recommendations: ['Проверить модуль BCM'], obdType: 'U' },
  { code: 'U0155', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем приборной панели', severity: 'Medium', cause: ['Потеря связи с комбинацией приборов'], recommendations: ['Проверить комбинацию приборов'], obdType: 'U' },
  { code: 'U0200', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем двери', severity: 'Low', cause: ['Потеря связи с модулем двери'], recommendations: ['Проверить модуль двери'], obdType: 'U' },
  { code: 'U0250', system: 'Network', group: 'Communication', description: 'Потеря связи с модулем климат-контроля', severity: 'Low', cause: ['Потеря связи с климат-контролем'], recommendations: ['Проверить модуль климат-контроля'], obdType: 'U' },
  { code: 'U0401', system: 'Network', group: 'Communication', description: 'Неверные данные от модуля управления двигателем', severity: 'Medium', cause: ['Помехи на CAN-шине'], recommendations: ['Проверить CAN-шину'], obdType: 'U' },
  { code: 'U0402', system: 'Network', group: 'Communication', description: 'Неверные данные от модуля трансмиссии', severity: 'Medium', cause: ['Помехи на CAN-шине'], recommendations: ['Проверить CAN-шину'], obdType: 'U' },
  { code: 'U0415', system: 'Network', group: 'Communication', description: 'Неверные данные от модуля ABS', severity: 'Medium', cause: ['Помехи на CAN-шине'], recommendations: ['Проверить CAN-шину'], obdType: 'U' },
];
// ════════════════════════════════════════════════════════════════════════════════
//  PID-параметры ЭБУ (Mode 01 — данные в реальном времени)
// ════════════════════════════════════════════════════════════════════════════════

const ECU_PIDS = [
  { pid: '00', name: 'Поддерживаемые PID (01-20)', unit: 'bitmask', description: 'Битовая маска поддерживаемых параметров Mode 01', normal: '—' },
  { pid: '01', name: 'Статус мониторинга после очистки DTC', unit: 'bitmask', description: 'Статус завершения мониторинга систем после стирания ошибок', normal: '—' },
  { pid: '02', name: 'Неисправности, вызванные условиями движения (freeze frame)', unit: '—', description: 'Коды неисправностей, зафиксированные в моментальном снимке', normal: '—' },
  { pid: '03', name: 'Поддерживаемые PID (21-40)', unit: 'bitmask', description: 'Битовая маска поддержки PID 21-40', normal: '—' },
  { pid: '04', name: 'Расчётная нагрузка на двигатель', unit: '%', formula: 'A / 2.55', normal: '10–35% (холостой), 60–90% (под нагрузкой)', description: 'Соотношение текущего притока воздуха к максимальному' },
  { pid: '05', name: 'Температура охлаждающей жидкости (ECT)', unit: '°C', formula: 'A – 40', normal: '80–105°C', description: 'Температура жидкости системы охлаждения' },
  { pid: '06', name: 'Кратковременная коррекция топлива банк 1', unit: '%', formula: 'A / 1.28 – 100', normal: '-10%…+10%', description: 'Кратковременная корректировка смеси' },
  { pid: '07', name: 'Долгосрочная коррекция топлива банк 1', unit: '%', formula: 'A / 1.28 – 100', normal: '-10%…+10%', description: 'Долгосрочная корректировка смеси' },
  { pid: '08', name: 'Кратковременная коррекция топлива банк 2', unit: '%', formula: 'A / 1.28 – 100', normal: '-10%…+10%', description: 'Кратковременная корректировка смеси банк 2' },
  { pid: '09', name: 'Долгосрочная коррекция топлива банк 2', unit: '%', formula: 'A / 1.28 – 100', normal: '-10%…+10%', description: 'Долгосрочная корректировка смеси банк 2' },
  { pid: '0A', name: 'Давление топлива в раме', unit: 'кПа', formula: 'A * 3', normal: '300–400 кПа', description: 'Давление топлива в топливной раме' },
  { pid: '0B', name: 'Расход воздуха (MAF)', unit: 'г/с', formula: '((A * 256) + B) / 100', normal: '3–15 г/с (холостой), 50–200 г/с (под нагрузкой)', description: 'Массовый расход входящего воздуха' },
  { pid: '0C', name: 'Частота вращения двигателя (RPM)', unit: 'об/мин', formula: '(((A * 256) + B) / 4)', normal: '700–900 об/мин (холостой)', description: 'Частота вращения коленчатого вала' },
  { pid: '0D', name: 'Скорость автомобиля', unit: 'км/ч', formula: 'A', normal: '0–200 км/ч', description: 'Скорость движения автомобиля' },
  { pid: '0E', name: 'Время опережения зажигания цилиндра 1', unit: 'гр.', formula: 'A / 2 – 64', normal: '—', description: 'Угол опережения зажигания' },
  { pid: '0F', name: 'Температура всасываемого воздуха (IAT)', unit: '°C', formula: 'A – 40', normal: '-10…+50°C', description: 'Температура воздуха перед дросселем' },
  { pid: '10', name: 'Дроссельная заслонка', unit: '%', formula: 'A / 2.55', normal: '0–15% (холостой), 80–100% (полный газ)', description: 'Положение дроссельной заслонки' },
  { pid: '11', name: 'Температура воздуха на выходе из двигателя', unit: '°C', formula: 'A – 40', normal: '—', description: 'Температура воздуха после радиатора' },
  { pid: '12', name: 'Команда дроссельной заслонки', unit: '%', formula: 'A / 2.55', normal: '0–100%', description: 'Команда ЭБУ на открытие дросселя' },
  { pid: '13', name: 'Положение дроссельной заслонки датчик B', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Дублирующий датчик положения дросселя' },
  { pid: '14', name: 'Команда дросселя датчик B', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда ЭБУ для датчика B' },
  { pid: '15', name: 'Время работы двигателя с момента запуска', unit: 'сек', formula: '((A * 256) + B)', normal: '—', description: 'Секунды с момента запуска двигателя' },
  { pid: '1C', name: 'Требование к активации ОБД', unit: '—', description: 'Статус требования активации системы диагностики', normal: '—' },
  { pid: '1D', name: 'Пробег с момента очистки кодов неисправностей', unit: 'км', formula: 'A * 256 + B', normal: '—', description: 'Пробег после стирания ошибок' },
  { pid: '1E', name: 'Пробег с момента прохождения теста выхлопа', unit: 'км', formula: 'A * 256 + B', normal: '—', description: 'Пробег после последнего теста выхлопа' },
  { pid: '1F', name: 'Время работы двигателя с момента включения зажигания', unit: 'сек', formula: 'A * 256 + B', normal: '—', description: 'Секунды работы двигателя с момента включения зажигания' },
  { pid: '20', name: 'Поддерживаемые PID (21-40)', unit: 'bitmask', description: 'Битовая маска PID 21-40', normal: '—' },
  { pid: '21', name: 'Дистанция, пройденная с момента включения Мチェка', unit: 'км', formula: 'A * 256 + B', normal: '—', description: 'Километры с момента загорания Check Engine' },
  { pid: '22', name: 'Давление топлива в раме (диапазон)', unit: 'кПа', formula: '(A * 256 + B) * 0.079', normal: '—', description: 'Альтернативное измерение давления топлива' },
  { pid: '23', name: 'Датчик давления во впускном коллекторе', unit: 'кПа', formula: 'A', normal: '20–100 кПа', description: 'Абсолютное давление в впускном коллекторе (MAP)' },
  { pid: '24', name: 'Датчик положения дросселя B', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Дополнительный датчик положения дросселя' },
  { pid: '25', name: 'Датчик положения дросселя C', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Третий датчик положения дросселя' },
  { pid: '26', name: 'Команда дроссельной заслонки B', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда дросселя для датчика B' },
  { pid: '27', name: 'Команда дроссельной заслонки C', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда дросселя для датчика C' },
  { pid: '28', name: 'Регулировка холостого хода', unit: '%', formula: 'A / 2.55 – 100', normal: '-20%…+20%', description: 'Корректировка воздуха холостого хода' },
  { pid: '29', name: 'Кратковременная коррекция банка 3', unit: '%', formula: 'A / 1.28 – 100', normal: '—', description: 'Кратковременная корректировка смеси банк 3' },
  { pid: '2A', name: 'Долгосрочная коррекция банка 3', unit: '%', formula: 'A / 1.28 – 100', normal: '—', description: 'Долгосрочная корректировка смеси банк 3' },
  { pid: '2B', name: 'Кратковременная коррекция банка 4', unit: '%', formula: 'A / 1.28 – 100', normal: '—', description: 'Кратковременная корректировка смеси банк 4' },
  { pid: '2C', name: 'Долгосрочная коррекция банка 4', unit: '%', formula: 'A / 1.28 – 100', normal: '—', description: 'Долгосрочная корректировка смеси банк 4' },
  { pid: '2D', name: 'Давление вписки испарителей (EVAP)', unit: 'кПа', formula: '((A * 256) + B) / 4 – 32768', normal: '—', description: 'Давление в системе адсорбции паров топлива' },
  { pid: '2E', name: 'Датчик управления парогенератором', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Уровень управления клапаном адсорбера' },
  { pid: '2F', name: 'Уровень топлива в баке', unit: '%', formula: 'A / 2.55', normal: '0–100%', description: 'Оставшийся уровень топлива' },
  { pid: '30', name: 'Количество тёплых циклов с момента очистки кодов', unit: '—', formula: 'A', normal: '—', description: 'Счётчик тёплых циклов двигателя' },
  { pid: '31', name: 'Пробег с момента очистки кодов неисправностей', unit: 'км', formula: 'A * 256 + B', normal: '—', description: 'Пробег после сброса ошибок' },
  { pid: '32', name: 'Давление в топливной раме (диапазон 2)', unit: 'кПа', formula: '(A * 256 + B) * 0.079', normal: '—', description: 'Дополнительное измерение давления топлива' },
  { pid: '33', name: 'Датчик давления сжатого воздуха', unit: 'кПа', formula: 'A', normal: '—', description: 'Давление в турбокомпрессоре' },
  { pid: '34', name: 'Датчик положения дросселя E', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Пятый датчик положения дросселя' },
  { pid: '35', name: 'Датчик положения дросселя F', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Шестой датчик положения дросселя' },
  { pid: '36', name: 'Команда дроссельной заслонки D', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда дросселя D' },
  { pid: '37', name: 'Команда дроссельной заслонки E', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда дросселя E' },
  { pid: '38', name: 'Команда дроссельной заслонки F', unit: '%', formula: 'A / 2.55', normal: '—', description: 'Команда дросселя F' },
  { pid: '39', name: 'Расход воздуха (заслонка)', unit: 'г/с', formula: '((A * 256) + B) / 100', normal: '—', description: 'Альтернативный измерение расхода воздуха' },
  { pid: '3A', name: 'Температура охлаждающей жидкости (альтернативная)', unit: '°C', formula: 'A – 40', normal: '—', description: 'Альтернативный датчик температуры ОЖ' },
  { pid: '3B', name: 'Температура всасываемого воздуха (альтернативная)', unit: '°C', formula: 'A – 40', normal: '—', description: 'Альтернативный датчик температуры воздуха' },
  { pid: '3C', name: 'Датчик давления впускного коллектора (альтернативный)', unit: 'кПа', formula: 'A', normal: '—', description: 'Альтернативный датчик MAP' },
  { pid: '3D', name: 'Датчик температуры топлива', unit: '°C', formula: 'A – 40', normal: '—', description: 'Температура топлива в раме' },
  { pid: '3E', name: 'Датчик давления в топливной раме', unit: 'кПа', formula: 'A * 3', normal: '—', description: 'Давление топлива в раме' },
  { pid: '3F', name: 'Датчик давления впуска', unit: 'кПа', formula: 'A', normal: '—', description: 'Давление во впускном тракте' },
  { pid: '40', name: 'Поддерживаемые PID (41-60)', unit: 'bitmask', description: 'Битовая маска PID 41-60', normal: '—' },
];
// ════════════════════════════════════════════════════════════════════════════════
//  Коды неисправностей БК (Body Control Module — блок управления кузовом)
//  BK = Бортовой Компьютер / Блок управления кузовом
// ════════════════════════════════════════════════════════════════════════════════

const BK_CODES = [
  { code: 'BK-001', module: 'BCM', description: 'Неисправность блока управления кузовом (BCM)', severity: 'Medium', cause: ['Питание модуля отсутствует', 'Обрыв Conductors питания'], recommendations: ['Проверить предохранитель BCM', 'Проверить Conductors питания блока'], obdType: 'BK' },
  { code: 'BK-002', module: 'BCM', description: 'Неисправность связи BCM с CAN-шиной', severity: 'Medium', cause: ['Повреждена CAN-шина', 'Неисправен приёмопередатчик CAN'], recommendations: ['Проверить CAN-шину кузова', 'Проверить терминаторы CAN'], obdType: 'BK' },
  { code: 'BK-003', module: 'BCM', description: 'Неисправность центрального замка BCM', severity: 'Low', cause: ['Неисправен актуатор замка', 'Обрыв цепи управления'], recommendations: ['Проверить актуатор центрального замка'], obdType: 'BK' },
  { code: 'BK-004', module: 'BCM', description: 'Неисправность стеклоподъёмников BCM', severity: 'Low', cause: ['Неисправен мотор стеклоподъёмника'], recommendations: ['Проверить мотор стеклоподъёмника'], obdType: 'BK' },
  { code: 'BK-005', module: 'BCM', description: 'Неисправность зеркал BCM', severity: 'Low', cause: ['Неисправен мотор зеркала'], recommendations: ['Проверить мотор регулировки зеркал'], obdType: 'BK' },
  { code: 'BK-006', module: 'BCM', description: 'Неисправность освещения салона BCM', severity: 'Low', cause: ['Перегорела лампа освещения'], recommendations: ['Заменить лампу освещения салона'], obdType: 'BK' },
  { code: 'BK-007', module: 'BCM', description: 'Неисправность щёток стеклоочистителя BCM', severity: 'Low', cause: ['Неисправен мотор стеклоочистителя'], recommendations: ['Проверить мотор стеклоочистителя'], obdType: 'BK' },
  { code: 'BK-008', module: 'BCM', description: 'Неисправность сигнализации BCM', severity: 'Medium', cause: ['Неисправен сирена', 'Обрыв цепи сигнализации'], recommendations: ['Проверить сирену сигнализации'], obdType: 'BK' },
  { code: 'BK-009', module: 'BCM', description: 'Неисправность иммобилайзера BCM', severity: 'High', cause: ['Неисправен чип ключа', 'Неисправен антенный узел'], recommendations: ['Попробовать другой ключ', 'Проверить антенну иммобилайзера'], obdType: 'BK' },
  { code: 'BK-010', module: 'BCM', description: 'Неисправность стеклоподъёмника водителя BCM', severity: 'Low', cause: ['Неисправен мотор стеклоподъёмника водителя'], recommendations: ['Заменить мотор стеклоподъёмника'], obdType: 'BK' },
  { code: 'BK-011', module: 'BCM', description: 'Неисправность стеклоподъёмника пассажира BCM', severity: 'Low', cause: ['Неисправен мотор стеклоподъёмника пассажира'], recommendations: ['Заменить мотор стеклоподъёмника'], obdType: 'BK' },
  { code: 'BK-012', module: 'BCM', description: 'Неисправность замка багажника BCM', severity: 'Low', cause: ['Неисправен актуатор багажника'], recommendations: ['Проверить актуатор багажника'], obdType: 'BK' },
  { code: 'BK-013', module: 'BCM', description: 'Неисправность датчика дождя BCM', severity: 'Low', cause: ['Загрязнён датчик дождя'], recommendations: ['Очистить лобовое стекло у датчика'], obdType: 'BK' },
  { code: 'BK-014', module: 'BCM', description: 'Неисправность датчика света BCM', severity: 'Low', cause: ['Неисправен датчик освещения'], recommendations: ['Заменить датчик света'], obdType: 'BK' },
  { code: 'BK-015', module: 'BCM', description: 'Неисправность подогрева зеркал BCM', severity: 'Low', cause: ['Перегорел нагреватель зеркала'], recommendations: ['Заменить нагреватель зеркала'], obdType: 'BK' },
  { code: 'BK-016', module: 'BCM', description: 'Неисправность подогрева сидений BCM', severity: 'Low', cause: ['Перегорел нагреватель сиденья'], recommendations: ['Проверить нагреватель сиденья'], obdType: 'BK' },
  { code: 'BK-017', module: 'BCM', description: 'Неисправность электростеклоподъёмника задней двери BCM', severity: 'Low', cause: ['Неисправен мотор задней двери'], recommendations: ['Заменить мотор стеклоподъёмника задней двери'], obdType: 'BK' },
  { code: 'BK-018', module: 'BCM', description: 'Неисправность замка капота BCM', severity: 'Low', cause: ['Неисправен датчик капота'], recommendations: ['Проверить датчик капота'], obdType: 'BK' },
  { code: 'BK-019', module: 'BCM', description: 'Неисправность сигнала BCM', severity: 'Medium', cause: ['Неисправен клаксон'], recommendations: ['Проверить клаксон'], obdType: 'BK' },
  { code: 'BK-020', module: 'BCM', description: 'Неисправность подсветки приборной панели BCM', severity: 'Low', cause: ['Перегорела лампа подсветки'], recommendations: ['Заменить лампу подсветки'], obdType: 'BK' },
];

// ════════════════════════════════════════════════════════════════════════════════
//  Поисковые функции
// ════════════════════════════════════════════════════════════════════════════════

function findDTC(code) {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return DTC_DATABASE.find(d => d.code === normalized);
}

function findECUPID(pid) {
  const normalized = pid.toUpperCase().replace(/[^0-9A-F]/g, '');
  return ECU_PIDS.find(p => p.pid === normalized);
}

function findBKCode(code) {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return BK_CODES.find(b => b.code === normalized);
}

function searchDTC(query) {
  const q = query.toUpperCase();
  return DTC_DATABASE.filter(d =>
    d.code.includes(q) ||
    d.description.toUpperCase().includes(q) ||
    d.group.toUpperCase().includes(q) ||
    d.system.toUpperCase().includes(q)
  );
}

function searchECUPID(query) {
  const q = query.toUpperCase();
  return ECU_PIDS.filter(p =>
    p.pid.includes(q) ||
    p.name.toUpperCase().includes(q) ||
    p.description.toUpperCase().includes(q)
  );
}

function searchBK(query) {
  const q = query.toUpperCase();
  return BK_CODES.filter(b =>
    b.code.includes(q) ||
    b.description.toUpperCase().includes(q) ||
    b.module.toUpperCase().includes(q)
  );
}

export { DTC_DATABASE, ECU_PIDS, BK_CODES, findDTC, findECUPID, findBKCode, searchDTC, searchECUPID, searchBK };
