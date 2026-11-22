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
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { localObdResult } from './obd-localization.js';
import { decodeVin } from './vin-decoder.js';
import { apiError, LANGUAGES, localized } from './localization.js';
import { preparePhotos, providerStatus } from './photo-analysis.js';
import { riskForScore, SPEC_LABELS } from '../client/report-domain.mjs';

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
app.use('/api', (req, res, next) => {
  const lang = req.query.lang ?? 'ru';
  if (typeof lang !== 'string' || !Object.hasOwn(LANGUAGES, lang)) return apiError(res, 400, 'language');
  res.locals.language = lang;
  next();
});
app.use(express.json());

// Serve the client (../client)
app.use(express.static(path.join(__dirname, '..', 'client')));

// ── multer — in-memory photo uploads ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10, fields: 5, fieldSize: 512 },
});

// ═══════════════════════════════════════════════
//  VIN VALIDATION
// ═══════════════════════════════════════════════

function validateVin(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

// ═══════════════════════════════════════════════
//  GEMINI AI INTEGRATION
// ═══════════════════════════════════════════════
let aiInstance = null;
let lastPhotoCheck = null;

function isKeyConfigured() {
  const k = process.env.GEMINI_API_KEY?.trim();
  return Boolean(k && k !== 'your_gemini_api_key_here' && k !== 'твой_скопированный_ключ_сюда');
}

function getAI() {
  if (!isKeyConfigured()) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY.trim(),
      httpOptions: { timeout: 25000, retryOptions: { attempts: 1 } },
    });
  }
  return aiInstance;
}

async function generateJson(client, contents) {
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { responseMimeType: 'application/json' },
  });
  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw Object.assign(new Error('Incomplete model response'), { code: 'invalid_response' });
  }
  const data = JSON.parse(response.text ?? 'null');
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw Object.assign(new Error('Unexpected model response'), { code: 'invalid_response' });
  }
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
async function analyzePhotosWithGemini(photos, lang) {
  if (photos.length === 0) return { status: 'not_requested' };
  if (!isKeyConfigured()) return { status: 'not_configured' };

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
    `You are a professional vehicle inspector. Analyze these photos and identify visible damage, wear, or concerns.
Write all free-text fields in ${LANGUAGES[lang]}. Keep the JSON keys, severity and view identifiers unchanged.

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

  try {
    const data = await generateJson(getAI(), contents);
    const assessedViews = [...new Set(textList(data.assessedViews).filter(view => PHOTO_VIEWS.includes(view)))];
    if (data.overallScore === null) {
      lastPhotoCheck = { status: 'operational', checkedAt: new Date().toISOString() };
      return { status: 'vehicle_not_visible' };
    }
    if (!Array.isArray(data.damages) || !Array.isArray(data.recommendations) ||
        !riskForScore(data.overallScore) || !assessedViews.length) {
      throw Object.assign(new Error('Unexpected photo response'), { code: 'invalid_response' });
    }
    lastPhotoCheck = { status: 'operational', checkedAt: new Date().toISOString() };
    return {
      status: 'success',
      damages: data.damages.filter(d => isText(d?.part) && isText(d?.issue) &&
        ['Low', 'Medium', 'High'].includes(d.severity)),
      overallScore: Math.trunc(data.overallScore),
      assessedViews,
      recommendations: textList(data.recommendations),
    };
  } catch (err) {
    const status = providerStatus(err);
    lastPhotoCheck = { status, checkedAt: new Date().toISOString() };
    console.warn('Gemini photo analysis:', status);
    return { status };
  }
}

function specsFromVin({ basic, engine, manufacturing }, lang) {
  return [
    ['displacement', engine?.displacementL],
    ['cylinders', engine?.engineCylinders],
    ['power', engine?.engineHP],
    ['fuel', engine?.fuelTypePrimary],
    ['transmission', engine?.transmissionStyle],
    ['drivetrain', basic.driveType],
    ['body', basic.bodyClass],
    ['country', manufacturing?.plantCountry],
    ['engine', engine?.name],
  ].filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => [localized(SPEC_LABELS[key], lang), value, key]);
}

const autodevKey = () => process.env.AUTODEV_API_KEY?.trim();

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
      ? 'Gemini is configured. See gemini.status for the last photo check.'
      : 'Set GEMINI_API_KEY in the server environment to enable photo analysis.',
    gemini: {
      configured: live,
      model: GEMINI_MODEL,
      status: live ? lastPhotoCheck?.status ?? 'not_checked' : 'not_configured',
      checkedAt: live ? lastPhotoCheck?.checkedAt ?? null : null,
    },
    vinDecode: autodevKey() ? 'vpic-autodev-wmi' : 'vpic-wmi',
  });
});

// ── Main analysis ──
app.post('/api/analyze', upload.array('photos', 10), async (req, res) => {
  try {
    const { vin: rawVin = '', make: inputMake = '', model: inputModel = '', year: inputYear = '',
      obdCodes = '' } = req.body ?? {};
    const photos = req.files || [];

    if ([rawVin, inputMake, inputModel, inputYear, obdCodes].some(value => typeof value !== 'string' || value.length > 160) ||
        inputMake.length > 120 || inputModel.length > 120) {
      return apiError(res, 400, 'fields');
    }
    const vin = rawVin.trim().toUpperCase();
    if (vin && !validateVin(vin)) return apiError(res, 400, 'vin');
    const codes = [...new Set(obdCodes.toUpperCase().split(/[\s,;]+/).filter(Boolean))];
    if (codes.length > 10 || codes.some(code => !OBD_FORMAT.test(code))) {
      return apiError(res, 400, 'obd');
    }
    if (!vin && !photos.length && !codes.length) {
      return apiError(res, 400, 'evidence');
    }

    // Validate year
    if (inputYear && !validYear(inputYear)) {
      return apiError(res, 400, 'year');
    }
    if (photos.reduce((total, photo) => total + photo.size, 0) > 12 * 1024 * 1024) {
      return apiError(res, 413, 'photo_total');
    }
    const prepared = await preparePhotos(photos);
    const lang = res.locals.language;
    const [decoded, photoResult, obd] = await Promise.all([
      vin ? decodeVin(vin, { apiKey: autodevKey() }) : { basic: {}, fieldSources: {} },
      analyzePhotosWithGemini(prepared, lang),
      codes.length ? lookupObdCodes(codes, lang) : [],
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

    const score = photoResult?.overallScore ?? null;
    const risk = riskForScore(score);

    res.json({
      id: vin || randomUUID(),
      vin,
      vehicle,
      vehicleSources,
      language: lang,
      specs: specsFromVin(decoded, lang),
      history: [],
      score,
      risk,
      damages: photoResult?.damages ?? [],
      recs: photoResult.recommendations ?? [],
      obd,
      isDemo: false,
      hasPhotos: photos.length > 0,
      photoAnalyzed: photoResult.status === 'success',
      photoStatus: photoResult.status,
      assessedViews: photoResult?.assessedViews ?? [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    if (err.code === 'invalid_image') return apiError(res, err.status, err.code);
    console.error('Analysis failed');
    return apiError(res, 500, 'unavailable');
  }
});

async function lookupObdCodes(codes, lang) {
  const results = new Map();
  for (const code of codes) {
    const local = localObdResult(code, lang);
    if (local) results.set(code, local);
  }

  const missing = codes.filter(code => !results.has(code));
  if (isKeyConfigured() && missing.length) {
    try {
      const data = await generateJson(getAI(), `Explain these OBD-II codes in ${LANGUAGES[lang]}: ${missing.join(', ')}.
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
          language: lang,
        });
      }
    } catch (err) {
      console.warn('Gemini OBD analysis:', providerStatus(err));
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
      return apiError(res, 400, 'obd');
    }
    const codes = [...new Set(input.map(code => typeof code === 'string' ? code.trim().toUpperCase() : ''))];
    if (codes.some(code => !OBD_FORMAT.test(code))) {
      return apiError(res, 400, 'obd');
    }
    const results = await lookupObdCodes(codes, res.locals.language);
    if (batch) return res.json({ results });
    if (results[0].source === 'unavailable') {
      return apiError(res, isKeyConfigured() ? 502 : 404, 'obd_missing');
    }
    res.json(results[0]);
  } catch (err) {
    console.error('OBD analysis failed');
    return apiError(res, 500, 'unavailable');
  }
});

// ── VIN lookup ──
app.get('/api/vin/:vin', async (req, res) => {
  try {
    const vin = req.params.vin.trim().toUpperCase();
    if (!validateVin(vin)) return apiError(res, 400, 'vin');

    res.json(await decodeVin(vin, { apiKey: autodevKey() }));
  } catch (err) {
    console.error('VIN lookup failed');
    return apiError(res, 502, 'unavailable');
  }
});

// ── API fallback and request errors ──
app.use('/api', (_req, res) => apiError(res, 404, 'not_found'));

app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return apiError(res, 413, 'photo_size');
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') return apiError(res, 400, 'photo_count');
    return apiError(res, 400, 'request');
  }
  if (err.status >= 400 && err.status < 500) {
    return apiError(res, err.status, 'request');
  }
  if (/^Multipart:|^Unexpected end of (form|file)/.test(err.message)) {
    return apiError(res, 400, 'request');
  }
  console.error('Request failed');
  return apiError(res, 500, 'unavailable');
});

// ── SPA fallback ──
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// ── Start ──
const server = app.listen(PORT, '0.0.0.0', () => {
  const live = isKeyConfigured();
  console.log(`
KolikCheck.AI server running at http://localhost:${server.address().port}
Mode: ${live ? 'LIVE (Gemini API key configured)' : 'DEMO (set GEMINI_API_KEY in server/.env for AI analysis)'} | VIN decoder: NHTSA vPIC + WMI`
  );
});
