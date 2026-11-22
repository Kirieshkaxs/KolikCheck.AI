// ══════════════════════════════════════════════════════════════════════════════════
//  KolikCheck.AI — VIN Decoder Service
//  Primary: NHTSA vPIC (free, no key)  |  Fallback: auto.dev (AUTODEV_API_KEY)
//  Last resort: built-in WMI tables
// ══════════════════════════════════════════════════════════════════════════════════

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PARTIAL_CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000;
const vinCache = new Map();

function cacheGet(vin) {
  const e = vinCache.get(vin);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { vinCache.delete(vin); return null; }
  return e.data;
}
function cacheSet(vin, data, ttl = CACHE_TTL_MS) {
  vinCache.delete(vin);
  if (vinCache.size >= CACHE_MAX_ENTRIES) vinCache.delete(vinCache.keys().next().value);
  vinCache.set(vin, { data, expiresAt: Date.now() + ttl });
}

function validateVin(vin) {
  if (typeof vin !== 'string' || !vin.trim()) return 'VIN-код не указан.';
  const c = vin.toUpperCase().replace(/\s/g, '');
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(c)) {
    if (c.length !== 17) return `Неверная длина VIN (ожидается 17, получено ${c.length}).`;
    return 'VIN содержит недопустимые символы (исключены I, O, Q).';
  }
  return null;
}
function firstNonEmpty(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '' && v !== 'Not Available' && v !== '0') return v;
  }
  return undefined;
}
function toBool(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'да') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'нет') return false;
  return undefined;
}
const fetchJson = async (url, { timeoutMs = 4000 } = {}) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; } finally { clearTimeout(t); }
};

// ══════════════════════════════════════════════════════════════════════════════════
//  NHTSA vPIC — primary source
// ══════════════════════════════════════════════════════════════════════════════════

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';

const decodeViaNhtsa = async (vin) => {
  const url = `${NHTSA_BASE}/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`;
  const body = await fetchJson(url);
  if (!Array.isArray(body?.Results) || !body.Results[0]) return null;
  const r = body.Results[0];
  const make = firstNonEmpty(r, ['Make']);
  if (!make) return null;

  const modelYear = firstNonEmpty(r, ['ModelYear']);
  const model = firstNonEmpty(r, ['Model']);
  const trim = firstNonEmpty(r, ['Trim']);
  const bodyClass = firstNonEmpty(r, ['BodyClass']);
  const doors = firstNonEmpty(r, ['Doors']);
  const driveType = firstNonEmpty(r, ['DriveType']);
  const displacementL = firstNonEmpty(r, ['DisplacementL']);
  const engineCylinders = firstNonEmpty(r, ['EngineCylinders']);
  const engineHP = firstNonEmpty(r, ['EngineHP']);
  const fuelTypePrimary = firstNonEmpty(r, ['FuelTypePrimary']);
  const transmissionStyle = firstNonEmpty(r, ['TransmissionStyle']);
  const plantCountry = firstNonEmpty(r, ['PlantCountry']);
  const plantCity = firstNonEmpty(r, ['PlantCity']);
  const manufacturer = firstNonEmpty(r, ['Manufacturer']);

  const basic = {};
  if (make) basic.make = make;
  if (model) basic.model = model;
  if (modelYear) basic.year = modelYear;
  if (trim) basic.trim = trim;
  if (bodyClass) basic.bodyClass = bodyClass;
  if (doors !== undefined && doors !== '') basic.doors = doors;
  if (driveType) basic.driveType = driveType;

  const engine = {};
  if (displacementL !== undefined && displacementL !== '') engine.displacementL = displacementL;
  if (engineCylinders !== undefined && engineCylinders !== '') engine.engineCylinders = engineCylinders;
  if (engineHP !== undefined && engineHP !== '') engine.engineHP = engineHP;
  if (fuelTypePrimary) engine.fuelTypePrimary = fuelTypePrimary;
  if (transmissionStyle) engine.transmissionStyle = transmissionStyle;

  const manufacturing = {};
  if (plantCountry) manufacturing.plantCountry = plantCountry;
  if (plantCity) manufacturing.plantCity = plantCity;
  if (manufacturer) manufacturing.manufacturer = manufacturer;

  const safety = {};
  const setSafe = (key, val) => { if (val !== undefined) safety[key] = val; };
  setSafe('abs', toBool(firstNonEmpty(r, ['ABS'])));
  setSafe('esc', toBool(firstNonEmpty(r, ['ESC'])));
  setSafe('airBagLocFront', toBool(firstNonEmpty(r, ['AirBagLocFront'])));
  setSafe('airBagLocCurtain', toBool(firstNonEmpty(r, ['AirBagLocCurtain'])));
  setSafe('blindSpotMon', toBool(firstNonEmpty(r, ['BlindSpotMon'])));
  setSafe('forwardCollisionWarning', toBool(firstNonEmpty(r, ['ForwardCollisionWarning'])));
  setSafe('laneDepartureWarning', toBool(firstNonEmpty(r, ['LaneDepartureWarning'])));
  setSafe('adaptiveCruiseControl', toBool(firstNonEmpty(r, ['AdaptiveCruiseControl'])));

  const result = {};
  if (Object.keys(basic).length) result.basic = basic;
  if (Object.keys(engine).length) result.engine = engine;
  if (Object.keys(manufacturing).length) result.manufacturing = manufacturing;
  if (Object.keys(safety).length) result.safety = safety;
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════════
//  auto.dev — fallback source (requires AUTODEV_API_KEY)
// ══════════════════════════════════════════════════════════════════════════════════

const decodeViaAutodev = async (vin, apiKey) => {
  if (!apiKey) return null;
  const url = `https://auto.dev/api/vin/${encodeURIComponent(vin)}?apikey=${encodeURIComponent(apiKey)}`;
  const body = await fetchJson(url);
  if (!body) return null;
  const basic = {};
  if (body.make) basic.make = body.make;
  if (body.model) basic.model = body.model;
  if (body.year) basic.year = String(body.year);
  if (body.trim) basic.trim = body.trim;
  if (body.body_class) basic.bodyClass = body.body_class;
  if (body.drive_type) basic.driveType = body.drive_type;
  const engine = {};
  if (body.displacement_l) engine.displacementL = body.displacement_l;
  if (body.engine_cylinders) engine.engineCylinders = body.engine_cylinders;
  if (body.engine_hp) engine.engineHP = body.engine_hp;
  if (body.fuel_type_primary) engine.fuelTypePrimary = body.fuel_type_primary;
  if (body.transmission_style) engine.transmissionStyle = body.transmission_style;
  const manufacturing = {};
  if (body.plant_country) manufacturing.plantCountry = body.plant_country;
  if (body.plant_city) manufacturing.plantCity = body.plant_city;
  if (body.manufacturer) manufacturing.manufacturer = body.manufacturer;
  const result = {};
  if (Object.keys(basic).length) result.basic = basic;
  if (Object.keys(engine).length) result.engine = engine;
  if (Object.keys(manufacturing).length) result.manufacturing = manufacturing;
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════════
//  Built-in WMI tables — last resort fallback
// ══════════════════════════════════════════════════════════════════════════════════

const VIN_MAKES_3 = {
  JT: 'Toyota', JHM: 'Honda', JN: 'Nissan',
  KN: 'Kia',
  WVW: 'Volkswagen', WBA: 'BMW', WDD: 'Mercedes-Benz', WAU: 'Audi',
  WF0: 'Ford', XTA: 'Lada', XW8: 'Chevrolet',
  '5YJ': 'Tesla', '1G': 'General Motors', '1F': 'Ford',
  '2T': 'Toyota', '3VW': 'Volkswagen',
  JTD: 'Toyota', JTE: 'Toyota', JTK: 'Toyota', JTL: 'Toyota',
  JM0: 'Mazda', JM1: 'Mazda', JM2: 'Mazda',
  JN1: 'Nissan', JN2: 'Nissan', JN3: 'Nissan',
  JN8: 'Nissan', JNZ: 'Nissan',
  KL1: 'Chevrolet', KL2: 'Chevrolet', KL4: 'Chevrolet',
  KM8: 'Hyundai', KMH: 'Hyundai', KMJ: 'Hyundai', KML: 'Hyundai', KMM: 'Hyundai', KMN: 'Hyundai', KND: 'Kia', KNE: 'Kia',
  KNF: 'Kia', KNT: 'Kia',
  MAL: 'Mitsubishi', MM0: 'Mitsubishi', MM1: 'Mitsubishi',
  MR0: 'Mitsubishi', MR1: 'Mitsubishi',
  SAJ: 'Jaguar', SAL: 'Land Rover', SAM: 'Land Rover',
  SN1: 'Nissan', SUJ: 'Suzuki',
  WBS: 'BMW', WBY: 'BMW',
  WD1: 'Mercedes-Benz', WDB: 'Mercedes-Benz', WDC: 'Mercedes-Benz',
  WDF: 'Mercedes-Benz', WME: 'Mercedes-Benz', W0L: 'Smart',
  WA1: 'Audi', WAV: 'Audi',
  WV1: 'Volkswagen', WV2: 'Volkswagen', WV3: 'Volkswagen',
  WV4: 'Volkswagen', WV5: 'Volkswagen', WV6: 'Volkswagen',
  WVF: 'Volkswagen',
  '1FA': 'Ford', '1FB': 'Ford', '1FC': 'Ford', '1FD': 'Ford',
  '1FT': 'Ford', '1FV': 'Ford', '1FY': 'Ford',
  '1G1': 'Chevrolet', '1G2': 'Pontiac', '1G3': 'Oldsmobile', '1G4': 'Buick',
  '1G6': 'Cadillac', '1G7': 'Geo', '1G8': 'Saturn', '1GN': 'General Motors',
  '1GT': 'GMC', '1GZ': 'General Motors',
  '1HG': 'Honda', '1HH': 'Honda',
  '1J4': 'Jeep', '1J8': 'Jeep',
  '1N1': 'Nissan', '1N2': 'Nissan', '1N4': 'Nissan', '1N6': 'Nissan', '1N8': 'Nissan',
  '2FA': 'Ford', '2FH': 'Ford', '2FV': 'Ford',
  '2G1': 'Chevrolet', '2G2': 'Pontiac', '2G3': 'Oldsmobile', '2G4': 'Buick',
  '2G6': 'Cadillac', '2G7': 'Geo', '2G8': 'Saturn',
  '2HG': 'Honda',
  '2T1': 'Toyota', '2T2': 'Toyota', '2T3': 'Toyota', '2T4': 'Toyota',
  '2T5': 'Toyota', '2T6': 'Toyota', '2T7': 'Toyota', '2T8': 'Toyota',
  '3C': 'Chrysler', '3D': 'Dodge',
  '4S': 'Subaru',
  '4T': 'Toyota', '4U': 'Acura', '4V': 'Volvo', '4W': 'Volkswagen',
  '5J': 'Toyota', '5K': 'Kia', '5T': 'Toyota', '5NM': 'Hyundai',
};
const VIN_MAKES_2 = {
  JT: 'Toyota', JH: 'Honda', JN: 'Nissan',
  KM: 'Hyundai', KN: 'Kia',
  WV: 'Volkswagen', WB: 'BMW', WD: 'Mercedes-Benz', WA: 'Audi',
  WF: 'Ford', XT: 'Lada', XW: 'Chevrolet',
  '5Y': 'Tesla', '1G': 'General Motors', '1F': 'Ford',
  '2T': 'Toyota', '3V': 'Volkswagen',
  '5N': 'Hyundai',
};
const YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

const decodeViaWmi = (vin) => {
  const make =
    VIN_MAKES_3[vin.slice(0, 3)] ||
    VIN_MAKES_2[vin.slice(0, 2)] ||
    '';
  const i = YEAR_CODES.indexOf(vin[9]);
  const firstYear = 1980 + i;
  const hasSecondCycle = firstYear + 30 <= new Date().getFullYear() + 1;
  const basic = {};
  if (make) basic.make = make;
  if (make && i >= 0 && !hasSecondCycle) basic.year = String(firstYear);
  const result = {};
  if (Object.keys(basic).length) result.basic = basic;
  return result;
};

// ══════════════════════════════════════════════════════════════════════════════════
//  Public API: decodeVin(vin, options)
// ══════════════════════════════════════════════════════════════════════════════════

export const decodeVin = async (vin, { apiKey } = {}) => {
  const err = validateVin(vin);
  if (err) throw new Error(err);
  const cleanVin = vin.toUpperCase().replace(/\s/g, '');
  const cached = cacheGet(cleanVin);
  if (cached) return cached;

  // 1. Primary: NHTSA vPIC
  const result = (await decodeViaNhtsa(cleanVin)) ?? {};
  result.basic ??= {};
  const fieldSources = Object.fromEntries(Object.keys(result.basic).map(key => [key, 'vpic']));

  function fillMissing(data, source) {
    for (const section of ['basic', 'engine', 'manufacturing']) {
      for (const [key, value] of Object.entries(data?.[section] ?? {})) {
        result[section] ??= {};
        if (result[section][key]) continue;
        result[section][key] = value;
        if (section === 'basic') fieldSources[key] = source;
      }
    }
  }

  // 2. Fallback: auto.dev if NHTSA missing Model and key is set
  if (!result.basic.model && apiKey) {
    fillMissing(await decodeViaAutodev(cleanVin, apiKey), 'autodev');
  }
  fillMissing(decodeViaWmi(cleanVin), 'wmi');

  const isPartial = !result.basic.make || !result.basic.model || !result.basic.year;
  const final = { ...result, fieldSources, isPartial };
  final.vin = cleanVin;
  cacheSet(cleanVin, final, isPartial ? PARTIAL_CACHE_TTL_MS : CACHE_TTL_MS);
  return final;
};

export { validateVin, cacheGet, cacheSet, vinCache };
