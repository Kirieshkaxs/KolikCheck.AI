// ═══════════════════════════════════════════════════════════════
//  KolikCheck.AI — Express API Server
//  Endpoints:
//    POST /api/analyze       — full vehicle analysis (VIN + photos)
//    POST /api/analyze-obd   — OBD-II error code analysis
//    GET  /api/health        — server status & mode check
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { decodeVin as decodeVinService, validateVin as validateVinService } from './vin-decoder.js';

// ── paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env from the server/ folder regardless of CWD
dotenv.config({ path: path.join(__dirname, '.env') });

// ═════════════════════════════════════════════════════════════════
//  VIN DECODE API (external, requires API key)
//  Set VIN_DECODE_API_KEY and optionally VIN_DECODE_API_BASE_URL in server/.env
// ═════════════════════════════════════════════════════════════════
const VIN_DECODE_API_KEY  = process.env.VIN_DECODE_API_KEY;
const VIN_DECODE_API_BASE = process.env.VIN_DECODE_API_BASE_URL || 'https://api.example.com/v1/vin';
const AUTODEV_API_KEY     = process.env.AUTODEV_API_KEY;

function isVinApiConfigured() {
  return !!(VIN_DECODE_API_KEY && VIN_DECODE_API_BASE);
}

// ── express setup ──
const app  = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Serve the client (../client)
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── multer — in-memory photo uploads ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

// ═══════════════════════════════════════════════
//  VIN DECODER (built-in)
// ═══════════════════════════════════════════════
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

// Letters A�Y (skipping I,O,Q,U,Z) = 2010�2030, digits 1�9 = 2001�2009
// Built-in VIN decoder � extracts make and model year from WMI (chars 1�3) and year code (char 10).
// NOTE: model (e.g. "Tucson") cannot be determined from VIN alone without a paid decode API.
// Set VIN_DECODE_API_KEY in server/.env to use the external API for full make/model/year/specs.
function decodeVin(vin) {
  const make =
    VIN_MAKES_3[vin.slice(0, 3)] ||
    VIN_MAKES_2[vin.slice(0, 2)] ||
    '';

  const i = YEAR_CODES.indexOf(vin[9]);
  let year = '';
  if (i >= 0) {
    // Letters A�Y (skipping I,O,Q,U,Z) = 2010�2030, digits 1�9 = 2001�2009
    year = i < 21 ? (2010 + i).toString() : (2001 + (i - 21)).toString();
  }
  return { make, year };
}

// ═════════════════════════════════════════════════════════════════
//  Decode VIN via external API (requires VIN_DECODE_API_KEY)
// ═════════════════════════════════════════════════════════════════
async function decodeVinViaApi(vin) {
  if (!isVinApiConfigured()) return null;

  try {
    const url = `${VIN_DECODE_API_BASE.replace(/\/$/, '')}/${encodeURIComponent(vin)}`;
    const headers = {};
    // Most VIN APIs accept the key as a Bearer token. Some providers use a custom header
    // such as X-Api-Key — uncomment/adjust the line below to match your provider:
    headers['Authorization'] = `Bearer ${VIN_DECODE_API_KEY}`;
    // headers['X-Api-Key'] = VIN_DECODE_API_KEY;

    const response = await fetch(url, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || typeof data !== 'object') return null;

    // Normalise common provider field names — adjust keys to match your API's response:
    const make = data.make || data.manufacturer || data.make_name || data.Make || '';
    const year = data.year || data.model_year || data.Year || data.YearOfManufacture || '';
    const model = data.model || data.model_name || data.Model || '';

    if (!make && !year) return null;
    return { make: String(make), year: year ? String(year) : '', model: model ? String(model) : '' };
  } catch (err) {
    console.error('VIN decode API error:', err.message);
    return null;
  }
}

function validateVin(vin) {
  if (!vin) return 'Enter the 17-character VIN.';
  if (vin.length !== 17) return `A VIN has 17 characters. You entered ${vin.length}.`;
  if (/[IOQ]/i.test(vin)) return 'A VIN never contains the letters I, O or Q.';
  if (!/^[A-HJ-NPR-Z0-9]+$/i.test(vin)) return 'VIN must contain only valid characters (no I, O, Q).';
  return '';
}

// ═══════════════════════════════════════════════
//  GEMINI AI INTEGRATION
// ═══════════════════════════════════════════════
let aiInstance = null;

function isKeyConfigured() {
  const k = process.env.GEMINI_API_KEY;
  return !!(k && k !== 'your_gemini_api_key_here' && k !== 'твой_скопированный_ключ_сюда');
}

function getAI() {
  if (!isKeyConfigured()) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

// ── Analyze photos with Gemini Vision ──
async function analyzePhotosWithGemini(photos) {
  const client = getAI();
  if (!client || photos.length === 0) return null;

  const contents = [];

  // Add each photo as an inline-data part
  for (const photo of photos) {
    contents.push({
      inlineData: {
        mimeType: photo.mimetype,
        data: photo.buffer.toString('base64'),
      },
    });
  }

  // Text prompt
  contents.push(
    `You are a professional vehicle inspector. Analyze these car photos and identify any visible damage, wear, or concerns.

For each issue found, provide:
- part: the car part affected (e.g. "Front bumper", "Hood", "Rear left door")
- issue: short description of the problem
- severity: "Low", "Medium", or "High"

Also provide:
- overallScore: a number 0–100 representing overall visual condition (100 = perfect)
- recommendations: array of strings with practical advice for the buyer

Respond ONLY with valid JSON in this exact format (no markdown fences):
{
  "damages": [{"part": "...", "issue": "...", "severity": "Low"}],
  "overallScore": 75,
  "recommendations": ["...", "..."]
}`
  );

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return null;
}

// ── Analyze VIN / vehicle specs with Gemini ──
async function analyzeVinWithGemini(vin, make, model, year) {
  const client = getAI();
  if (!client) return null;

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are an automotive expert. Given this vehicle information:
- VIN: ${vin}
- Make: ${make || 'unknown'}
- Model: ${model || 'unknown'}
- Year: ${year || 'unknown'}

Provide detailed vehicle specifications and common issues for this model.
Respond ONLY with valid JSON (no markdown fences):
{
  "specs": [["Engine", "..."], ["Transmission", "..."], ["Drivetrain", "..."], ["Body type", "..."], ["Estimated mileage", "unknown"]],
  "commonIssues": ["..."],
  "marketNotes": "Brief note about this car in the Kazakhstan / CIS market"
}`,
  });

  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return null;
}

// ═══════════════════════════════════════════════
//  DEMO / FALLBACK DATA
// ═══════════════════════════════════════════════
const DEMO_SPECS = [
  ['Engine', '2.5 L, 4-cylinder petrol'],
  ['Transmission', '8-speed automatic'],
  ['Drivetrain', 'All-wheel drive'],
  ['Body type', 'Sedan'],
  ['Estimated mileage', '87 000 km'],
];
const DEMO_DAMAGES = [
  { part: 'Front bumper', issue: 'Light scratches and paint chips', severity: 'Low' },
  { part: 'Rear left door', issue: 'Paint tone differs from nearby panels — possible repaint', severity: 'Medium' },
  { part: 'Windshield', issue: 'Small chip, lower right corner', severity: 'Low' },
];
const DEMO_HISTORY = [
  ['Registration', 'Kazakhstan, 2 previous owners'],
  ['Theft / wanted check', 'No record found'],
  ['Reported accidents', '1 minor incident (2021)'],
];
const DEMO_RECS = [
  'Ask the seller for service records and compare the mileage.',
  'Have a mechanic inspect the rear left door for body filler or repaint.',
  'Take a test drive and listen for noise from the engine and gearbox.',
  'Confirm the VIN plate on the car matches the VIN on the documents.',
];
const RISK_ADVICE = {
  Low:      'Overall risk is low. Confirm the details below in person before paying.',
  Moderate: 'Risk is moderate. Negotiate the price and inspect the flagged areas before you buy.',
  High:     'Risk is high. Do not pay a deposit until a qualified mechanic has inspected the car.',
};

// ═══════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════

// ── Health check ──
app.get('/api/health', (_req, res) => {
  const live = isKeyConfigured();
  res.json({
    status: 'ok',
    mode: live ? 'live' : 'demo',
    message: live
      ? 'Gemini API connected'
      : 'Running in demo mode — set GEMINI_API_KEY in server/.env to enable AI analysis',
    vinDecode: isVinApiConfigured() ? 'api' : 'builtin',
  });
});

// ── Main analysis ──
app.post('/api/analyze', upload.array('photos', 10), async (req, res) => {
  try {
    const { vin: rawVin, make: inputMake, model: inputModel, year: inputYear } = req.body;
    const photos = req.files || [];

    // Validate VIN
    const vin = (rawVin || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '');
    const vinErr = validateVin(vin);
    if (vinErr) return res.status(400).json({ error: vinErr });

    // Validate year
    if (inputYear) {
      const y = Number(inputYear);
      const maxY = new Date().getFullYear() + 1;
      if (!Number.isInteger(y) || y < 1980 || y > maxY)
        return res.status(400).json({ error: `Enter a year from 1980 to ${maxY}.` });
    }

// Decode VIN via new service (NHTSA > auto.dev > WMI fallback)
    let decoded = null;
    try {
      decoded = await decodeVinService(vin, { apiKey: AUTODEV_API_KEY });
    } catch (e) {
      decoded = null;
    }
    const make  = inputMake  || (decoded?.basic?.make || '');
    const model = inputModel || (decoded?.basic?.model || '');
    const year  = inputYear  || (decoded?.basic?.year || '');

    // ── Call Gemini (parallel) — falls back to demo data if key not set ──
    let photoResult = null;
    let vinResult   = null;

    if (isKeyConfigured()) {
      const results = await Promise.allSettled([
        photos.length > 0 ? analyzePhotosWithGemini(photos) : Promise.resolve(null),
        analyzeVinWithGemini(vin, make, model, year),
      ]);
      photoResult = results[0].status === 'fulfilled' ? results[0].value : null;
      vinResult   = results[1].status === 'fulfilled' ? results[1].value : null;
    }

    const isDemo = !photoResult && !vinResult;

    // Specs
    const specs = vinResult?.specs || DEMO_SPECS;

    // Damages
    let damages;
    if (photoResult?.damages) {
      damages = photoResult.damages;
    } else if (photos.length > 0) {
      damages = DEMO_DAMAGES;
    } else {
      damages = [];
    }

    // Score
    let score;
    if (typeof photoResult?.overallScore === 'number') {
      score = Math.max(0, Math.min(100, photoResult.overallScore));
    } else {
      const seed = [...vin].reduce((s, c) => s + c.charCodeAt(0), 0);
      score = 60 + (seed % 31);
    }

    const risk = score >= 80 ? 'Low' : score >= 70 ? 'Moderate' : 'High';

    // Recommendations
    const recs = [
      RISK_ADVICE[risk],
      ...(photoResult?.recommendations || DEMO_RECS),
    ];

    // History (demo — a real integration would query a government DB)
    const history = DEMO_HISTORY;

    res.json({
      vin,
      vehicle: { make, model, year },
      specs,
      history,
      score,
      risk,
      damages,
      recs,
      isDemo,
      hasPhotos: photos.length > 0,
      generatedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ── OBD-II code analysis ──
app.post('/api/analyze-obd', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Error code is required.' });

    const client = getAI();
    if (!client) {
      return res.json({
        code,
        description: 'Demo mode — set GEMINI_API_KEY to get real OBD-II analysis.',
        isDemo: true,
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Расшифруй автомобильную ошибку OBD-II и дай рекомендации для ремонта: ${code}.
Ответь ТОЛЬКО валидным JSON (без markdown):
{"code":"...","description":"...","cause":"...","severity":"Low|Medium|High","recommendations":["..."]}`,
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json({ ...JSON.parse(jsonMatch[0]), isDemo: false });
    } else {
      res.json({ code, description: text, isDemo: false });
    }
  } catch (err) {
    console.error('OBD analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze OBD code.' });
  }
});

// ── VIN decode endpoint ──
app.get('/api/vin/:vin', async (req, res) => {
  try {
    const { vin } = req.params;
    const validationErr = validateVinService(vin);
    if (validationErr) return res.status(400).json({ error: validationErr });

    const result = await decodeVinService(vin, { apiKey: AUTODEV_API_KEY });
    res.json(result);
  } catch (err) {
    console.error('VIN decode error:', err.message);
    if (err.message.includes('VIN')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'VIN decoding failed. Please try again.' });
  }
});

// ── SPA fallback — serve index.html for all other routes ──
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  const live = isKeyConfigured();
  const vinMode = isVinApiConfigured() ? 'external API' : 'built-in tables';
  console.log(`
KolikCheck.AI server running at http://localhost:${PORT}
Mode: ${live ? 'LIVE (Gemini API connected)' : 'DEMO (set GEMINI_API_KEY in server/.env for AI analysis)'} | VIN decoder: ${vinMode}${isVinApiConfigured() ? ' (VIN_DECODE_API_KEY set)' : ''}`
);
});





