import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { decodeReport, encodeReport, riskForScore } from '../../client/report-domain.mjs';
import { DTC_DATABASE } from '../obd-diagnostics.js';
import { localObdResult } from '../obd-localization.js';
import { providerStatus } from '../photo-analysis.js';

test('risk boundaries include both endpoints and never assign risk without a score', () => {
  assert.deepEqual([0, 68, 69, 70, 79, 80, 100, null].map(riskForScore),
    ['High', 'High', 'High', 'Moderate', 'Moderate', 'Low', 'Low', null]);
});

test('all local OBD codes have descriptions, causes and checks in RU, KZ and EN', () => {
  for (const { code } of DTC_DATABASE) {
    const ru = localObdResult(code, 'ru');
    assert.doesNotMatch(JSON.stringify(ru.translations.ru), /Conductors/);
    for (const lang of ['en', 'kz']) {
      const result = localObdResult(code, lang);
      assert.equal(result.code, code);
      assert.ok(result.cause.length && result.recommendations.length && result.description);
      assert.notEqual(result.description, ru.description);
    }
  }
});

test('versioned report data preserves quotes and excludes photo URLs', () => {
  const report = {
    id: 'test', vin: '', vehicle: { make: '', model: '', year: '' },
    photoStatus: 'success', score: 68, generatedAt: '2026-11-22T07:10:00Z',
    specs: [], history: [], assessedViews: ['front'], submittedViews: ['front'],
    recs: [], damages: [{ part: 'Hood', issue: 'Dent' }], obd: [],
    repairCosts: [['1000', '2000']], photos: ['blob:test'],
  };
  const encoded = encodeReport(report);
  assert.doesNotMatch(encoded, /blob:test/);
  assert.deepEqual(decodeReport(encoded), { ...report, photos: [] });
  assert.equal(decodeReport(encoded.replace('"version":1', '"version":8')), null);
  assert.equal(decodeReport(encodeReport({ ...report, repairCosts: [] })), null);
  assert.equal(decodeReport('{broken'), null);
});

const fakeKey = 'test-server-key';
const mockVinProviders = `
const realFetch = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = new URL(input?.url ?? input);
  if (url.hostname === 'vpic.nhtsa.dot.gov') {
    return Response.json({Results: url.pathname.endsWith('1HGCM82633A004352')
      ? [{Make:'Honda', Model:'Accord', ModelYear:'2003', DriveType:'FWD'}] : []});
  }
  if (url.hostname === 'auto.dev') {
    if (options?.headers?.Authorization !== 'Bearer ${fakeKey}' || url.search) throw Error('Invalid VIN authorization');
    if (url.pathname.endsWith('1HGCM82633A004353')) {
      return Response.json({make:{name:'Honda'}, model:{name:'Accord'}, years:[{year:2003}], engine:{size:2.4}});
    }
    return new Response(null,{status:404});
  }
  if (url.hostname === '127.0.0.1') return realFetch(input, options);
  throw Error('Unexpected outbound request');
};`;

async function startApp(t, env) {
  const child = spawn(process.execPath, [
    '--import', 'data:text/javascript,' + encodeURIComponent(mockVinProviders),
    fileURLToPath(new URL('../server.js', import.meta.url)),
  ], { env: { ...process.env, PORT: '0', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  const logs = [];
  child.stderr.on('data', chunk => logs.push(String(chunk)));
  t.after(async () => {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit'); }
    assert.doesNotMatch(logs.join(''), /test-server-key|provider-secret-placeholder/);
  });
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server failed to start')), 5000);
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      const port = output.match(/localhost:(\d+)/)?.[1];
      if (port) { clearTimeout(timer); resolve('http://127.0.0.1:' + port); }
    });
    child.once('exit', code => { clearTimeout(timer); reject(new Error('Server exited: ' + code)); });
  });
  return url;
}

function upload(base, { file, fields = {}, lang = 'ru', mime = 'image/png' } = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (file) form.append('photos', new Blob([file], { type: mime }), 'photo.png');
  return fetch(base + '/api/analyze?lang=' + lang, { method: 'POST', body: form });
}

test('photo validation, safe Gemini statuses, VIN fallback and API locale', { timeout: 20000 }, async t => {
  let next = { overallScore: 68, assessedViews: ['right'], recommendations: ['Test'], damages: [] };
  const prompts = [];
  const upstream = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    prompts.push(body);
    res.setHeader('Content-Type', 'application/json');
    if (next.http) {
      res.statusCode = next.http;
      res.end(JSON.stringify({ error: { code: next.http, message: 'provider-secret-placeholder' } }));
      return;
    }
    res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(next) }] } }] }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => upstream.close());
  const base = await startApp(t, {
    GEMINI_API_KEY: fakeKey, GEMINI_MODEL: 'gemini-3.8-flash', AUTODEV_API_KEY: fakeKey,
    GOOGLE_GEMINI_BASE_URL: 'http://127.0.0.1:' + upstream.address().port,
  });
  const health = async () => (await (await fetch(base + '/api/health')).json()).gemini;
  assert.deepEqual(await health(), {
    configured: true, model: 'gemini-3.8-flash', status: 'not_checked', checkedAt: null,
  });
  const png = await sharp({ create: { width: 12, height: 16, channels: 3, background: 'blue' } }).png().toBuffer();
  const broken = await upload(base, { file: 'not a real image', lang: 'kz' });
  assert.equal(broken.status, 415);
  assert.equal((await broken.json()).photoStatus, 'invalid_image');
  const truncated = await upload(base, { file: png.subarray(0, 28) });
  assert.equal(truncated.status, 422);
  const oversized = await sharp({ create: { width: 5100, height: 5000, channels: 3, background: 'blue' } }).png().toBuffer();
  assert.equal((await upload(base, { file: oversized })).status, 422);
  assert.equal((await upload(base, { file: Buffer.alloc(8 * 1024 * 1024 + 1) })).status, 413);
  for (const [count, size, expected] of [[2, 7 * 1024 * 1024, 413], [11, 1, 400]]) {
    const form = new FormData();
    for (let i = 0; i < count; i++) form.append('photos', new Blob([Buffer.alloc(size)]), 'photo.jpg');
    assert.equal((await fetch(base + '/api/analyze', { method: 'POST', body: form })).status, expected);
  }
  assert.equal(prompts.length, 0);
  const single = await upload(base, { file: png, mime: 'text/plain', lang: 'en', fields: { vin: '1HGCM82633A004352', obdCodes: 'P0300' } });
  assert.equal(single.status, 200);
  const result = await single.json();
  assert.equal(result.photoStatus, 'success');
  assert.equal(result.score, 68);
  assert.equal(result.risk, 'High');
  assert.equal(result.obd[0].language, 'en');
  assert.match(prompts[0], /free-text fields in English/);
  assert.ok(Date.parse((await health()).checkedAt));
  for (const [reply, expected] of [
    [{ overallScore: null }, 'vehicle_not_visible'],
    [{}, 'invalid_response'],
    [{ http: 401 }, 'auth_error'], [{ http: 429 }, 'quota_exceeded'],
    [{ http: 504 }, 'timeout'], [{ http: 503 }, 'provider_unavailable'], [{ http: 404 }, 'model_unavailable'],
  ]) {
    next = reply;
    const response = await (await upload(base, {
      file: png, fields: { vin: '1HGCM82633A004352', obdCodes: 'P0300' },
    })).json();
    assert.equal(response.photoStatus, expected);
    assert.equal(response.photoAnalyzed, false);
    assert.equal(response.score, null);
    assert.equal(response.risk, null);
    assert.equal(response.vehicle.make, 'Honda');
    assert.equal(response.obd[0].code, 'P0300');
  }
  const fallback = await (await fetch(base + '/api/vin/1HGCM82633A004353?lang=kz')).json();
  assert.equal(fallback.fieldSources.model, 'autodev');
  assert.equal(fallback.isPartial, false);
  const wmi = await (await fetch(base + '/api/vin/1HGCM82633A004354')).json();
  assert.equal(wmi.fieldSources.make, 'wmi');
  assert.equal(wmi.isPartial, true);
  const report = await (await upload(base, { fields: { vin: fallback.vin }, lang: 'ru' })).json();
  assert.ok(report.specs.some(([name]) => name === 'Объём двигателя, л'));
  assert.equal(report.photoStatus, 'not_requested');
  assert.equal((await fetch(base + '/api/vin/1HGCM82633A004353?lang=fr')).status, 400);
});

test('no-key mode reports configuration separately and does not invent vehicle results', async t => {
  const base = await startApp(t, { GEMINI_API_KEY: '', AUTODEV_API_KEY: '' });
  const health = await (await fetch(base + '/api/health')).json();
  assert.equal(health.gemini.status, 'not_configured');
  const webp = await sharp({ create: { width: 4, height: 4, channels: 3, background: 'red' } }).webp().toBuffer();
  const report = await (await upload(base, { file: webp })).json();
  assert.equal(report.photoStatus, 'not_configured');
  assert.equal(report.score, null);
  assert.deepEqual(report.damages, []);
  assert.deepEqual(report.history, []);
  assert.equal(providerStatus({ name: 'TimeoutError' }), 'timeout');
});
