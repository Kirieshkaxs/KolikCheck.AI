// ═══════════════════════════════════════════════════════════════
//  KolikCheck.AI — Express API Server
//  Endpoints:
//    POST /api/analyze       — full vehicle analysis (VIN + photos)
//    POST /api/analyze-obd   — OBD-II error code analysis
//    GET  /api/vin/:vin      — VIN lookup via NHTSA vPIC and WMI
//    GET  /api/health        — server status & mode check
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { findDTC } from './obd-diagnostics.js';
import { decodeVin } from './vin-decoder.js';

// ── paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env from the server/ folder regardless of CWD
dotenv.config({ path: path.join(__dirname, '.env') });

// ── express setup ──
const app  = express();
const PORT = process.env.PORT || 8080;
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';

app.use(cors());
app.use(express.json());

// Serve the client (../client)
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── multer — in-memory photo uploads ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10, fields: 4, fieldSize: 512 },
  fileFilter(_req, file, cb) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(Object.assign(new Error('Photos must be JPEG, PNG or WebP.'), { status: 415 }));
    }
    cb(null, true);
  },
});

// ═══════════════════════════════════════════════
//  VIN VALIDATION
// ═══════════════════════════════════════════════

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
  const k = process.env.GEMINI_API_KEY?.trim();
  return !!(k && k !== 'your_gemini_api_key_here' && k !== 'твой_скопированный_ключ_сюда');
}

function getAI() {
  if (!isKeyConfigured()) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim(), httpOptions: { timeout: 25000 } });
  }
  return aiInstance;
}

async function generateJson(client, contents) {
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { responseMimeType: 'application/json' },
  });
  const data = JSON.parse(response.text ?? 'null');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid Gemini response.');
  return data;
}

const isText = value => typeof value === 'string' && value.trim() !== '';
const textList = value => Array.isArray(value) ? value.filter(isText) : [];
const validYear = year => /^\d{4}$/.test(year) && Number(year) >= 1980 && Number(year) <= new Date().getFullYear() + 1;
const PHOTO_VIEWS = ['front', 'rear', 'left', 'right', 'cabin', 'detail'];
const OBD_FORMAT = /^[PCBU][0-3][0-9A-F]{3}$/;
const OBD_SYSTEMS = { P: 'Powertrain', C: 'Chassis', B: 'Body', U: 'Network' };
const OBD_PRIORITY = { High: 3, Medium: 2, Low: 1 };

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
- assessedViews: unique identifiers for views that are clearly visible and actually inspected. Allowed values: front, rear, left (the vehicle's left side), right (the vehicle's right side), cabin (interior), detail (close-up of a specific area). Only include views shown clearly enough to assess.
- recommendations: array of strings with practical advice for the buyer
Set overallScore to null if the photos do not show a vehicle clearly enough to assess its condition.

Respond ONLY with valid JSON in this exact format (no markdown fences):
{
  "damages": [{"part": "...", "issue": "...", "severity": "Low"}],
  "overallScore": 75,
  "assessedViews": ["front", "left"],
  "recommendations": ["...", "..."]
}`
  );

  const data = await generateJson(client, contents);
  if (!Array.isArray(data.damages) || !Number.isFinite(data.overallScore) ||
      data.overallScore < 0 || data.overallScore > 100) return null;
  return {
    damages: data.damages.filter(d => isText(d?.part) && isText(d?.issue) &&
      ['Low', 'Medium', 'High'].includes(d.severity)),
    overallScore: Math.round(data.overallScore),
    assessedViews: [...new Set(textList(data.assessedViews).filter(view => PHOTO_VIEWS.includes(view)))],
    recommendations: textList(data.recommendations),
  };
}

function specsFromVin({ basic, engine, manufacturing }) {
  return [
    ['Engine displacement (L)', engine?.displacementL],
    ['Cylinders', engine?.engineCylinders],
    ['Engine power (hp)', engine?.engineHP],
    ['Fuel type', engine?.fuelTypePrimary],
    ['Transmission', engine?.transmissionStyle],
    ['Drivetrain', basic.driveType],
    ['Body type', basic.bodyClass],
    ['Assembly country', manufacturing?.plantCountry],
  ].filter(([, value]) => value != null && value !== '');
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
  Low:      'The photos suggest a low risk of visible damage. Confirm the condition in person.',
  Moderate: 'The photos suggest moderate condition concerns. Inspect the flagged areas before buying.',
  High:     'The photos suggest significant condition concerns. Arrange an inspection with a qualified mechanic.',
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
      ? 'Gemini API key configured'
      : 'Running in demo mode — set GEMINI_API_KEY in server/.env to enable AI analysis',
    vinDecode: 'vpic-wmi',
  });
});

// ── Main analysis ──
app.post('/api/analyze', upload.array('photos', 10), async (req, res) => {
  try {
    const { vin: rawVin, make: inputMake = '', model: inputModel = '', year: inputYear = '' } = req.body ?? {};
    const photos = req.files || [];

    if ([inputMake, inputModel, inputYear].some(value => typeof value !== 'string' || value.length > 120)) {
      return res.status(400).json({ error: 'Invalid vehicle fields.' });
    }
    const vin = typeof rawVin === 'string' ? rawVin.trim().toUpperCase() : '';
    const vinErr = validateVin(vin);
    if (vinErr) return res.status(400).json({ error: vinErr });

    // Validate year
    if (inputYear && !validYear(inputYear)) {
      const maxY = new Date().getFullYear() + 1;
      return res.status(400).json({ error: `Enter a year from 1980 to ${maxY}.` });
    }
    if (photos.reduce((total, photo) => total + photo.size, 0) > 12 * 1024 * 1024) {
      return res.status(413).json({ error: 'Photos must total 12 MB or less.' });
    }
    const isDemo = !isKeyConfigured();

    const [decoded, photoResult] = await Promise.all([
      decodeVin(vin),
      analyzePhotosWithGemini(photos).catch(err => {
        console.error('Gemini photo analysis failed:', err.message);
        return null;
      }),
    ]);
    const manual = { make: inputMake.trim(), model: inputModel.trim(), year: inputYear };
    const vehicle = {};
    const vehicleSources = {};
    for (const [field, value] of Object.entries(manual)) {
      const fromVin = decoded.basic[field] ?? '';
      vehicle[field] = value || fromVin;
      if (vehicle[field]) {
        vehicleSources[field] = value && value !== String(fromVin) ? 'manual' : decoded.fieldSources[field];
      }
    }

    const vinSpecs = specsFromVin(decoded);
    const specsAreDemo = isDemo && vinSpecs.length === 0;
    const specs = specsAreDemo ? DEMO_SPECS : vinSpecs;
    const damages = isDemo && photos.length ? DEMO_DAMAGES : (photoResult?.damages ?? []);
    const score = isDemo ? 75 : (photoResult?.overallScore ?? null);
    const risk = score === null ? null : score >= 80 ? 'Low' : score >= 70 ? 'Moderate' : 'High';
    const recs = [
      ...(risk ? [RISK_ADVICE[risk]] : []),
      ...(isDemo ? DEMO_RECS : (photoResult?.recommendations ?? [])),
    ];
    const history = isDemo ? DEMO_HISTORY : [];

    res.json({
      vin,
      vehicle,
      vehicleSources,
      specs,
      specsAreDemo,
      history,
      score,
      risk,
      damages,
      recs,
      isDemo,
      hasPhotos: photos.length > 0,
      photoAnalyzed: Boolean(photoResult),
      assessedViews: photoResult?.assessedViews ?? [],
      generatedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

async function lookupObdCodes(codes) {
  const results = new Map();
  for (const code of codes) {
    const local = findDTC(code);
    if (local) results.set(code, { ...local, isDemo: false, source: 'local' });
  }

  const client = getAI();
  const missing = codes.filter(code => !results.has(code));
  if (client && missing.length) {
    try {
      const data = await generateJson(client, `Explain these OBD-II codes in Russian: ${missing.join(', ')}.
Return {"results": [{"code":"P0300","description":"...","cause":["..."],"severity":"Low|Medium|High","recommendations":["..."]}]}.
Omit codes you cannot interpret reliably without manufacturer-specific information. Describe possible causes and diagnostic checks.`);
      const rows = Array.isArray(data.results) ? data.results : [];
      for (const row of rows) {
        if (!missing.includes(row?.code) || !isText(row.description)) continue;
        results.set(row.code, {
          code: row.code,
          system: OBD_SYSTEMS[row.code[0]],
          description: row.description,
          severity: Object.hasOwn(OBD_PRIORITY, row.severity) ? row.severity : null,
          cause: isText(row.cause) ? [row.cause] : textList(row.cause),
          recommendations: textList(row.recommendations),
          isDemo: false,
          source: 'gemini',
        });
      }
    } catch (err) {
      console.error('Gemini OBD analysis failed:', err.message);
    }
  }

  return codes.map(code => results.get(code) ?? {
    code, system: OBD_SYSTEMS[code[0]], source: 'unavailable',
  }).sort((a, b) => (OBD_PRIORITY[b.severity] ?? 0) - (OBD_PRIORITY[a.severity] ?? 0));
}

// Accept the original single-code payload and the batch payload.
app.post('/api/analyze-obd', async (req, res) => {
  try {
    const batch = Object.hasOwn(req.body ?? {}, 'codes');
    const input = batch ? req.body.codes : [req.body?.code];
    if (!Array.isArray(input) || input.length < 1 || input.length > 10) {
      return res.status(400).json({ error: 'Send between 1 and 10 OBD-II codes.' });
    }
    const codes = [...new Set(input.map(code => typeof code === 'string' ? code.trim().toUpperCase() : ''))];
    if (codes.some(code => !OBD_FORMAT.test(code))) {
      return res.status(400).json({ error: 'Enter valid OBD-II codes (e.g. P0300).' });
    }
    const results = await lookupObdCodes(codes);
    if (batch) return res.json({ results });
    if (results[0].source === 'unavailable') {
      return res.status(isKeyConfigured() ? 502 : 404).json({ error: 'No diagnostic information is available for this code.' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('OBD analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze OBD code.' });
  }
});

// ── VIN lookup ──
app.get('/api/vin/:vin', async (req, res) => {
  try {
    const vin = req.params.vin.trim().toUpperCase();
    const vinErr = validateVin(vin);
    if (vinErr) return res.status(400).json({ error: vinErr });

    res.json(await decodeVin(vin));
  } catch (err) {
    console.error('VIN decode error:', err.message);
    res.status(502).json({ error: 'VIN decoding failed. Please try again.' });
  }
});

// ── API fallback and request errors ──
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.message });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.type === 'entity.parse.failed' ? 'Invalid JSON body.' : err.message });
  }
  if (/^Multipart:|^Unexpected end of (form|file)/.test(err.message)) {
    return res.status(400).json({ error: 'Invalid multipart body.' });
  }
  console.error('Request error:', err.message);
  return res.status(500).json({ error: 'Internal server error.' });
});

// ── SPA fallback ──
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  const live = isKeyConfigured();
  console.log(`
KolikCheck.AI server running at http://localhost:${PORT}
Mode: ${live ? 'LIVE (Gemini API key configured)' : 'DEMO (set GEMINI_API_KEY in server/.env for AI analysis)'} | VIN decoder: NHTSA vPIC + WMI`
  );
});
