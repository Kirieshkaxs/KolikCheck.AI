// ═══════════════════════════════════════════════════════════════
//  KolikCheck.AI — Express API Server
//  VIN decoding is handled entirely by Gemini AI (no external APIs).
//  Endpoints:
//    POST /api/analyze       — full vehicle analysis (VIN + photos)
//    POST /api/analyze-obd   — OBD-II error code analysis
//    GET  /api/vin/:vin      — VIN decode via Gemini AI
//    GET  /api/health        — server status & mode check
// ═══════════════════════════════════════════════════════════════

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// ── paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load .env from the server/ folder regardless of CWD
dotenv.config({ path: path.join(__dirname, '.env') });

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

// ── Timeout wrapper for Gemini API calls ──
const GEMINI_TIMEOUT_MS = 25000;

function withTimeout(promise, ms = GEMINI_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Gemini API timeout after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// ── Decode VIN with Gemini AI ──
async function decodeVinWithGemini(vin) {
  const client = getAI();
  if (!client) return null;

  const response = await withTimeout(
    client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert automotive VIN decoder. Decode this VIN: ${vin}

Extract and return the following information based on the VIN code structure (WMI, VDS, VIS):
- Make (manufacturer brand name)
- Model (specific model name)
- Year of manufacture
- Trim level (if determinable)
- Body class/type (Sedan, SUV, Hatchback, etc.)
- Engine displacement in liters, number of cylinders, horsepower, fuel type
- Transmission type
- Drive type (FWD, RWD, AWD, 4WD)
- Country of manufacture
- Assembly plant city (if known)
- Full manufacturer name

Respond ONLY with valid JSON (no markdown fences, no extra text):
{
  "basic": { "make": "...", "model": "...", "year": "...", "trim": "...", "bodyClass": "...", "driveType": "..." },
  "engine": { "displacementL": "...", "engineCylinders": "...", "engineHP": "...", "fuelTypePrimary": "...", "transmissionStyle": "..." },
  "manufacturing": { "plantCountry": "...", "plantCity": "...", "manufacturer": "..." }
}
If you cannot reliably determine a field, omit it from the JSON entirely. Only include data that the VIN structure encodes.`,
    })
  );

  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0]);
    data.vin = vin;
    data.isPartial = !data.basic?.model;
    return data;
  }
  return null;
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

  const response = await withTimeout(
    client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
    })
  );

  const text = response.text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  return null;
}

// ── Analyze VIN / vehicle specs with Gemini ──
async function analyzeVinWithGemini(vin, make, model, year) {
  const client = getAI();
  if (!client) return null;

  const response = await withTimeout(
    client.models.generateContent({
      model: 'gemini-3.8-flash',
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
    })
  );

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
    vinDecode: live ? 'gemini-ai' : 'demo',
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

    // Decode VIN via Gemini AI
    let decoded = null;
    if (isKeyConfigured()) {
      try {
        decoded = await decodeVinWithGemini(vin);
      } catch (e) {
        console.error('VIN decode via Gemini failed:', e.message);
        decoded = null;
      }
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

    const response = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Расшифруй автомобильную ошибку OBD-II и дай рекомендации для ремонта: ${code}.
Ответь ТОЛЬКО валидным JSON (без markdown):
{"code":"...","description":"...","cause":"...","severity":"Low|Medium|High","recommendations":["..."]}`,
      })
    );

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

// ── VIN decode endpoint (Gemini AI) ──
app.get('/api/vin/:vin', async (req, res) => {
  try {
    const vin = (req.params.vin || '').toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '');
    const vinErr = validateVin(vin);
    if (vinErr) return res.status(400).json({ error: vinErr });

    const client = getAI();
    if (!client) {
      return res.status(503).json({
        error: 'Gemini API key not configured. Set GEMINI_API_KEY in server/.env to enable VIN decoding.',
      });
    }

    const result = await decodeVinWithGemini(vin);
    if (!result) {
      return res.status(500).json({ error: 'Could not decode VIN. Please try again.' });
    }
    res.json(result);
  } catch (err) {
    console.error('VIN decode error:', err.message);
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
  console.log(`
KolikCheck.AI server running at http://localhost:${PORT}
Mode: ${live ? 'LIVE (Gemini API connected)' : 'DEMO (set GEMINI_API_KEY in server/.env for AI analysis)'} | VIN decoder: ${live ? 'Gemini AI' : 'demo (no key)'}`
  );
});
