import { findDTC } from './obd-diagnostics.js';

// Code descriptions preserve the bank, sensor, cylinder and circuit qualifiers.
const descriptions = {
  P0100: ['Mass air flow (MAF) sensor circuit fault', 'Ауаның массалық шығыны (MAF) датчигінің тізбек ақауы'],
  P0101: ['MAF sensor range/performance', 'MAF датчигінің жұмыс ауқымы ауытқыған'],
  P0102: ['MAF sensor signal low', 'MAF датчигінің сигналы төмен'],
  P0103: ['MAF sensor signal high', 'MAF датчигінің сигналы жоғары'],
  P0104: ['MAF sensor signal intermittent', 'MAF датчигінің сигналы үзіледі'],
  P0110: ['Intake air temperature (IAT) sensor circuit fault', 'Кіретін ауа температурасы (IAT) датчигінің тізбек ақауы'],
  P0115: ['Engine coolant temperature (ECT) sensor circuit fault', 'Салқындатқыш температурасы (ECT) датчигінің тізбек ақауы'],
  P0116: ['ECT sensor range/performance', 'ECT датчигінің жұмыс ауқымы ауытқыған'],
  P0117: ['ECT sensor signal low', 'ECT датчигінің сигналы төмен'],
  P0118: ['ECT sensor signal high', 'ECT датчигінің сигналы жоғары'],
  P0120: ['Throttle position (TP) sensor circuit fault', 'Дроссель қалпы (TP) датчигінің тізбек ақауы'],
  P0121: ['TP sensor range/performance', 'TP датчигінің жұмыс ауқымы ауытқыған'],
  P0122: ['TP sensor signal low', 'TP датчигінің сигналы төмен'],
  P0123: ['TP sensor signal high', 'TP датчигінің сигналы жоғары'],
  P0125: ['Coolant too cold for closed-loop fuel control', 'Отынды кері байланыспен реттеу үшін салқындатқыш тым суық'],
  P0130: ['Oxygen sensor circuit fault (bank 1, sensor 1)', 'Оттегі датчигі тізбегінің ақауы (1-банк, 1-датчик)'],
  P0131: ['Oxygen sensor voltage low (bank 1, sensor 1)', 'Оттегі датчигінің кернеуі төмен (1-банк, 1-датчик)'],
  P0132: ['Oxygen sensor voltage high (bank 1, sensor 1)', 'Оттегі датчигінің кернеуі жоғары (1-банк, 1-датчик)'],
  P0133: ['Slow oxygen sensor response (bank 1, sensor 1)', 'Оттегі датчигі баяу жауап береді (1-банк, 1-датчик)'],
  P0134: ['No oxygen sensor activity (bank 1, sensor 1)', 'Оттегі датчигі белсенді емес (1-банк, 1-датчик)'],
  P0135: ['Oxygen sensor heater fault (bank 1, sensor 1)', 'Оттегі датчигі қыздырғышының ақауы (1-банк, 1-датчик)'],
  P0140: ['No oxygen sensor activity (bank 1, sensor 2)', 'Оттегі датчигі белсенді емес (1-банк, 2-датчик)'],
  P0141: ['Oxygen sensor heater fault (bank 1, sensor 2)', 'Оттегі датчигі қыздырғышының ақауы (1-банк, 2-датчик)'],
  P0150: ['Oxygen sensor circuit fault (bank 2, sensor 1)', 'Оттегі датчигі тізбегінің ақауы (2-банк, 1-датчик)'],
  P0171: ['Fuel mixture too lean (bank 1)', 'Отын қоспасы тым жұтаң (1-банк)'],
  P0172: ['Fuel mixture too rich (bank 1)', 'Отын қоспасы тым бай (1-банк)'],
  P0174: ['Fuel mixture too lean (bank 2)', 'Отын қоспасы тым жұтаң (2-банк)'],
  P0175: ['Fuel mixture too rich (bank 2)', 'Отын қоспасы тым бай (2-банк)'],
  P0200: ['Fuel injector circuit fault', 'Отын форсункаларының тізбек ақауы'],
  P0300: ['Random or multiple cylinder misfire', 'Бірнеше цилиндрде немесе кездейсоқ тұтану үзілісі'],
  P0325: ['Knock sensor 1 circuit fault', '1-детонация датчигінің тізбек ақауы'],
  P0335: ['Crankshaft position (CKP) sensor circuit fault', 'Иінді білік қалпы (CKP) датчигінің тізбек ақауы'],
  P0340: ['Camshaft position (CMP) sensor circuit fault', 'Тарату білігі қалпы (CMP) датчигінің тізбек ақауы'],
  P0341: ['Camshaft position sensor signal out of range', 'Тарату білігі датчигінің сигналы ауқымнан тыс'],
  P0400: ['Exhaust gas recirculation (EGR) fault', 'Шығарылған газды қайта айналдыру (EGR) жүйесінің ақауы'],
  P0401: ['Insufficient EGR flow', 'EGR ағыны жеткіліксіз'],
  P0420: ['Catalyst efficiency below threshold (bank 1)', 'Катализатор тиімділігі шектен төмен (1-банк)'],
  P0430: ['Catalyst efficiency below threshold (bank 2)', 'Катализатор тиімділігі шектен төмен (2-банк)'],
  P0440: ['Evaporative emissions (EVAP) system fault', 'Отын буын ұстау (EVAP) жүйесінің ақауы'],
  P0441: ['Incorrect EVAP purge flow', 'EVAP жүйесіндегі үрлеу ағыны дұрыс емес'],
  P0442: ['Small EVAP leak', 'EVAP жүйесінде шағын саңылау'],
  P0455: ['Large EVAP leak', 'EVAP жүйесінде үлкен саңылау'],
  P0456: ['Very small EVAP leak', 'EVAP жүйесінде өте шағын саңылау'],
  P0500: ['Vehicle speed sensor (VSS) fault', 'Көлік жылдамдығы (VSS) датчигінің ақауы'],
  P0505: ['Idle air control system fault', 'Бос жүрісті реттеу жүйесінің ақауы'],
  P0506: ['Idle speed below target', 'Бос жүріс айналымы межеден төмен'],
  P0507: ['Idle speed above target', 'Бос жүріс айналымы межеден жоғары'],
  P0562: ['System voltage low', 'Борт желісінің кернеуі төмен'],
  P0563: ['System voltage high', 'Борт желісінің кернеуі жоғары'],
  P0600: ['Control module data-link fault', 'Басқару блогының деректер байланысы ақаулы'],
  P0601: ['Internal control module memory fault', 'Басқару блогының ішкі жады ақаулы'],
  P0602: ['Control module programming error', 'Басқару блогын бағдарламалау қатесі'],
  P0603: ['Control module keep-alive memory error', 'Басқару блогының сақталатын жады ақаулы'],
  P0604: ['Control module RAM error', 'Басқару блогының жедел жады ақаулы'],
  P0605: ['Control module ROM error', 'Басқару блогының тұрақты жады ақаулы'],
  P0606: ['Control module processor fault', 'Басқару блогы процессорының ақауы'],
  P0607: ['Control module performance fault', 'Басқару блогының жұмыс ақауы'],
  P0620: ['Generator control circuit fault', 'Генераторды басқару тізбегінің ақауы'],
  P0700: ['Transmission control system fault', 'Беріліс қорабын басқару жүйесінің ақауы'],
  P0705: ['Transmission range sensor fault', 'Беріліс диапазоны датчигінің ақауы'],
  P0715: ['Transmission input speed sensor circuit fault', 'Беріліс қорабының кіріс білігі жылдамдығы датчигінің тізбек ақауы'],
  P0720: ['Transmission output speed sensor fault', 'Беріліс қорабының шығыс білігі жылдамдығы датчигінің ақауы'],
  P0730: ['Incorrect gear ratio', 'Беріліс қатынасы дұрыс емес'],
  P0740: ['Torque converter clutch circuit fault', 'Гидротрансформаторды бұғаттау ілінісінің тізбек ақауы'],
  P0750: ['Shift solenoid A fault', 'A ауыстыру соленоидының ақауы'],
  P0753: ['Shift solenoid A electrical fault', 'A ауыстыру соленоидының электр ақауы'],
  B0010: ['Driver airbag fault', 'Жүргізуші қауіпсіздік жастығының ақауы'],
  B0011: ['Passenger airbag fault', 'Жолаушы қауіпсіздік жастығының ақауы'],
  B0012: ['Side airbag fault', 'Бүйірлік қауіпсіздік жастығының ақауы'],
  B0013: ['Curtain airbag fault', 'Перде тәрізді қауіпсіздік жастығының ақауы'],
  B1000: ['Body module communication fault', 'Шанақ модульдері байланысының ақауы'],
  B1001: ['Lost communication with driver door module', 'Жүргізуші есігі модулімен байланыс үзілді'],
  B1002: ['Lost communication with passenger door module', 'Жолаушы есігі модулімен байланыс үзілді'],
  B1010: ['Low-beam headlamp circuit fault', 'Жақын жарық шамдары тізбегінің ақауы'],
  B1011: ['High-beam headlamp circuit fault', 'Алыс жарық шамдары тізбегінің ақауы'],
  B1020: ['Brake light circuit fault', 'Тежегіш шамы тізбегінің ақауы'],
  B1021: ['Turn signal circuit fault', 'Бұрылыс көрсеткіші тізбегінің ақауы'],
  B1100: ['Central locking fault', 'Орталық құлыптың ақауы'],
  B1101: ['Driver door lock fault', 'Жүргізуші есігі құлпының ақауы'],
  B1102: ['Passenger door lock fault', 'Жолаушы есігі құлпының ақауы'],
  B1200: ['Climate control fault', 'Климатты басқару жүйесінің ақауы'],
  B1201: ['Heater blower motor fault', 'Жылытқыш желдеткіші моторының ақауы'],
  B1300: ['Driver power window fault', 'Жүргізуші терезесін көтергіштің ақауы'],
  B1301: ['Passenger power window fault', 'Жолаушы терезесін көтергіштің ақауы'],
  C0010: ['Front left ABS wheel sensor fault', 'Алдыңғы сол жақ ABS доңғалақ датчигінің ақауы'],
  C0011: ['Front right ABS wheel sensor fault', 'Алдыңғы оң жақ ABS доңғалақ датчигінің ақауы'],
  C0012: ['Rear left ABS wheel sensor fault', 'Артқы сол жақ ABS доңғалақ датчигінің ақауы'],
  C0013: ['Rear right ABS wheel sensor fault', 'Артқы оң жақ ABS доңғалақ датчигінің ақауы'],
  C0035: ['ABS pump module fault', 'ABS сорғысы модулінің ақауы'],
  C0040: ['ABS solenoid valve fault', 'ABS электромагниттік клапанының ақауы'],
  C0100: ['Stability control (ESP) fault', 'Тұрақтандыру (ESP) жүйесінің ақауы'],
  C0110: ['Steering angle sensor fault', 'Руль бұрышы датчигінің ақауы'],
  C0200: ['Air suspension fault', 'Пневматикалық аспаның ақауы'],
  C0210: ['Air suspension compressor fault', 'Пневматикалық аспа компрессорының ақауы'],
  U0001: ['High-speed CAN bus fault', 'Жоғары жылдамдықты CAN шинасының ақауы'],
  U0002: ['Low-speed CAN bus fault', 'Төмен жылдамдықты CAN шинасының ақауы'],
  U0100: ['Lost communication with the engine controller (ECM/PCM)', 'Қозғалтқышты басқару блогымен (ECM/PCM) байланыс үзілді'],
  U0101: ['Lost communication with the transmission controller (TCM)', 'Беріліс қорабы блогымен (TCM) байланыс үзілді'],
  U0121: ['Lost communication with the ABS module', 'ABS модулімен байланыс үзілді'],
  U0140: ['Lost communication with the body control module (BCM)', 'Шанақты басқару блогымен (BCM) байланыс үзілді'],
  U0155: ['Lost communication with the instrument cluster', 'Аспаптар тақтасымен байланыс үзілді'],
  U0200: ['Lost communication with a door module', 'Есік модулімен байланыс үзілді'],
  U0250: ['Lost communication with the climate control module', 'Климатты басқару блогымен байланыс үзілді'],
  U0401: ['Invalid data from the engine controller', 'Қозғалтқыш блогынан қате деректер келді'],
  U0402: ['Invalid data from the transmission controller', 'Беріліс қорабы блогынан қате деректер келді'],
  U0415: ['Invalid data from the ABS module', 'ABS модулінен қате деректер келді'],
};
for (let cylinder = 1; cylinder <= 4; cylinder++) {
  descriptions[`P020${cylinder}`] = [`Injector circuit fault, cylinder ${cylinder}`, `${cylinder}-цилиндр форсункасы тізбегінің ақауы`];
  descriptions[`P030${cylinder}`] = [`Misfire in cylinder ${cylinder}`, `${cylinder}-цилиндрде тұтану үзілісі`];
}

// Pairs of possible causes and first checks. Specific checks take priority over system-level ones.
const checks = {
  air: ['Intake leaks, incorrect metering or a sensor circuit fault.', 'Compare live sensor readings and check the intake, connector and wiring.', 'Ауа саңылауы, қате өлшеу немесе датчик тізбегінің ақауы.', 'Датчик көрсеткіштерін салыстырып, ауа қабылдау жолын, ағытпаны және сымдарды тексеріңіз.'],
  oxygen: ['A wiring, sensor heater or exhaust fault can change sensor readings.', 'Check for exhaust leaks and verify the affected sensor and heater circuit.', 'Сым, қыздырғыш немесе шығару жүйесінің ақауы датчик көрсеткішін өзгертуі мүмкін.', 'Шығару жүйесінің герметикалығын, тиісті датчик пен қыздырғыш тізбегін тексеріңіз.'],
  coolant: ['Low coolant, thermostat trouble or a sensor circuit fault.', 'With the engine cold, check coolant level and compare the ECT reading with ambient temperature.', 'Салқындатқыш аз, термостат немесе датчик тізбегі ақаулы болуы мүмкін.', 'Қозғалтқыш суық кезде сұйықтық деңгейін тексеріп, датчик көрсеткішін ауа температурасымен салыстырыңыз.'],
  throttle: ['A sticking throttle, position sensor fault or damaged wiring.', 'Compare commanded and measured throttle position and inspect the connector.', 'Дроссель тұрып қалуы, қалпы датчигі не сымы ақаулы болуы мүмкін.', 'Сұралған және нақты дроссель қалпын салыстырып, ағытпаны тексеріңіз.'],
  lean: ['An intake leak, low fuel pressure or inaccurate airflow measurement.', 'Check for unmetered air and compare fuel trims and fuel pressure.', 'Артық ауа кіруі, отын қысымының төмендеуі немесе ауа шығынының қате өлшенуі.', 'Ауа саңылауларын, отын түзетулерін және отын қысымын тексеріңіз.'],
  rich: ['Excess fuel pressure, a leaking injector or inaccurate sensor readings.', 'Check fuel trims, fuel pressure and injector leakage.', 'Отын қысымы артық, форсунка ағуы немесе датчик қате көрсетуі мүмкін.', 'Отын түзетулерін, қысымын және форсункалар герметикалығын тексеріңіз.'],
  catalyst: ['An exhaust leak, deteriorated catalyst or upstream engine problem.', 'Rule out leaks and misfire, then compare oxygen sensor readings before replacing the catalyst.', 'Газ шығару жүйесінде саңылау, катализатордың тозуы немесе қозғалтқыш ақауы болуы мүмкін.', 'Катализаторды ауыстырмас бұрын саңылау мен тұтану үзілісін тексеріп, оттегі датчиктерін салыстырыңыз.'],
  EGR: ['A sticking EGR valve or obstructed passages.', 'Compare commanded EGR and measured flow, then inspect the valve and passages.', 'EGR клапаны қысылып қалуы немесе арналары бітелуі мүмкін.', 'EGR командасы мен нақты ағынды салыстырып, клапан мен арналарды тексеріңіз.'],
  EVAP: ['Loose fuel cap, a vapor line leak or a faulty purge valve.', 'Check the fuel cap and vapor lines, then test the purge valve or run a smoke test.', 'Бак қақпағы бос, бу құбырында саңылау немесе үрлеу клапаны ақаулы болуы мүмкін.', 'Бак қақпағын, бу құбырларын және клапанды тексеріңіз. Қажет болса түтін сынағын жасаңыз.'],
  'Fuel Injector Circuit': ['Injector, connector or control circuit fault.', 'Inspect injector wiring and test the injector circuit for the indicated cylinder.', 'Форсунка, ағытпа немесе басқару тізбегі ақаулы болуы мүмкін.', 'Форсунка сымдарын және көрсетілген цилиндр тізбегін тексеріңіз.'],
  'Ignition System': ['Ignition, fueling, compression or an engine sensor circuit fault, depending on the code.', 'Check the indicated circuit with live data and follow the vehicle service procedure.', 'Кодқа байланысты тұтану, отын беру, сығымдау немесе датчик тізбегі ақаулы болуы мүмкін.', 'Тікелей деректермен көрсетілген тізбекті тексеріп, көліктің сервистік нұсқаулығын қолданыңыз.'],
  misfire: ['Worn plugs, a failing coil, fueling or low compression.', 'Check misfire counts, plugs, coils and fueling; check compression if the fault persists.', 'Шамдар тозуы, катушка, отын беру немесе сығымдау ақауы болуы мүмкін.', 'Тұтану үзілістерін, шамдар мен катушкаларды және отын беруді тексеріңіз; қажет болса сығымдауды өлшеңіз.'],
  'Vehicle Speed Control': ['Sensor, connector or speed signal circuit fault.', 'Check live vehicle speed readings and inspect the sensor wiring.', 'Датчик, ағытпа немесе жылдамдық сигналының тізбегі ақаулы болуы мүмкін.', 'Жылдамдық көрсеткішін және датчик сымдарын тексеріңіз.'],
  'Idle Control System': ['An intake leak, dirty throttle or idle actuator fault.', 'Check for air leaks and compare actual idle speed with target.', 'Ауа саңылауы, кірлеген дроссель немесе бос жүріс жетегінің ақауы.', 'Ауа саңылауларын тексеріп, нақты бос жүріс айналымын межемен салыстырыңыз.'],
  'Computer Output Circuits': ['Irregular supply voltage, a poor connection or a control module fault.', 'Test battery voltage, charging, grounds and connectors before replacing a controller.', 'Қорек кернеуі тұрақсыз, байланыс нашар немесе басқару блогы ақаулы болуы мүмкін.', 'Блокты ауыстырмас бұрын аккумулятор кернеуін, зарядтауды, массаны және ағытпаларды тексеріңіз.'],
  'Transmission Control': ['A sensor, hydraulic, solenoid or transmission control fault.', 'Read transmission module codes and check the indicated circuit and fluid condition.', 'Датчик, гидравлика, соленоид немесе басқару блогы ақаулы болуы мүмкін.', 'Беріліс блогының кодтарын, көрсетілген тізбекті және сұйықтық күйін тексеріңіз.'],
  Airbag: ['A restraint module, connector or circuit fault.', 'Have an SRS specialist verify the manufacturer-specific code and inspect the restraint system.', 'Қауіпсіздік модулі, ағытпа немесе тізбек ақаулы болуы мүмкін.', 'SRS маманы өндіруші кодын нақтылап, қауіпсіздік жүйесін тексерсін.'],
  Lighting: ['A failed lamp, fuse, connector or wiring fault.', 'Check the specified lamp, fuse, connector and ground.', 'Шам, сақтандырғыш, ағытпа немесе сым ақауы болуы мүмкін.', 'Көрсетілген шамды, сақтандырғышты, ағытпаны және массаны тексеріңіз.'],
  'Central Locking': ['A lock actuator, fuse or wiring fault.', 'Test the affected lock and inspect the door harness.', 'Құлып жетегі, сақтандырғыш немесе сым ақауы болуы мүмкін.', 'Тиісті құлыпты және есік сымдарын тексеріңіз.'],
  'Climate Control': ['A blower, sensor, supply or climate module fault.', 'Check the affected circuit, fuses and climate module readings.', 'Желдеткіш, датчик, қорек немесе климат блогы ақаулы болуы мүмкін.', 'Тиісті тізбекті, сақтандырғыштарды және климат блогының деректерін тексеріңіз.'],
  'Power Windows': ['A motor, switch, regulator or door wiring fault.', 'Check the affected window switch, power supply and mechanism.', 'Мотор, қосқыш, көтергіш механизм немесе есік сымы ақаулы болуы мүмкін.', 'Терезе қосқышын, қорегін және механизмін тексеріңіз.'],
  ABS: ['A wheel signal, wiring or ABS module fault, depending on the code.', 'Have a technician confirm the ABS code and check the affected sensor or module.', 'Кодқа қарай доңғалақ сигналы, сым немесе ABS модулі ақаулы болуы мүмкін.', 'Маман ABS кодын нақтылап, көрсетілген датчикті немесе модульді тексерсін.'],
  ESP: ['A sensor signal, calibration or stability module fault.', 'Read the stability module and verify steering angle and wheel speed data.', 'Датчик сигналы, калибрлеу немесе тұрақтандыру блогы ақаулы болуы мүмкін.', 'Тұрақтандыру блогын оқып, руль бұрышы мен доңғалақ жылдамдығын тексеріңіз.'],
  'Air Suspension': ['An air leak, compressor fault or electrical supply problem.', 'Check air lines, system pressure and compressor power.', 'Ауа саңылауы, компрессор немесе электр қорегі ақаулы болуы мүмкін.', 'Ауа құбырларын, жүйе қысымын және компрессор қорегін тексеріңіз.'],
  Communication: ['Power loss, a poor connection or a data bus fault.', 'Check module power and grounds and scan related modules for network faults.', 'Қорек жоғалуы, нашар байланыс немесе деректер шинасының ақауы.', 'Блок қорегі мен массасын тексеріп, байланысты блоктардың желі кодтарын оқыңыз.'],
};

function checkKey(code, group) {
  if (code === 'P0110') return 'air';
  if (/^P011[5-8]$|^P0125$/.test(code)) return 'coolant';
  if (/^P012[0-3]$/.test(code)) return 'throttle';
  if (/^P01[345]/.test(code)) return 'oxygen';
  if (['P0171', 'P0174'].includes(code)) return 'lean';
  if (['P0172', 'P0175'].includes(code)) return 'rich';
  if (['P0420', 'P0430'].includes(code)) return 'catalyst';
  if (/^P040/.test(code)) return 'EGR';
  if (/^P04[45]/.test(code)) return 'EVAP';
  if (/^P030/.test(code)) return 'misfire';
  if (group === 'Fuel and Air Metering') return 'air';
  if (group === 'CAN Bus') return 'Communication';
  return group;
}

export function localObdResult(code, lang) {
  const entry = findDTC(code);
  if (!entry) return null;
  const [english, kazakh] = descriptions[code];
  const [enCause, enCheck, kzCause, kzCheck] = checks[checkKey(code, entry.group)];
  const translations = {
    ru: { description: entry.description, cause: entry.cause, recommendations: entry.recommendations },
    kz: { description: kazakh, cause: [kzCause], recommendations: [kzCheck] },
    en: { description: english, cause: [enCause], recommendations: [enCheck] },
  };
  return { ...entry, ...translations[lang], language: lang, translations, isDemo: false, source: 'local' };
}
