# KolikCheck.AI 🚗🤖

> Smart secondary vehicle inspection platform tailored for the Kazakhstan market, powered by computer vision, VIN analytics, and OBD-II diagnostics. Built for **StartUp Battle IT FEST 2026 (KBTU)**.

---

## 📌 Problem & Context
Buying a used car can involve hidden body damage, unreliable mileage claims, and unresolved faults. **KolikCheck.AI** helps buyers review visible damage and interpret supplied fault codes before arranging an in-person inspection.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5 / CSS3 / Vanilla JavaScript — single-page application, no frameworks
* **Backend:** Node.js 22+ and Express
* **AI & Computer Vision:** Google Gemini API. The default model is `gemini-3.8-flash`, configurable through `GEMINI_MODEL`.
* **File Uploads:** Multer (in-memory photo handling for Gemini API processing)

---

## 🏗️ System Architecture
```text
[ Client — SPA (HTML / CSS / JS) ]
        ├──► Browser storage (checklists and comparison)
                │
          Same-origin REST API
                ▼
[ Server — Node.js + Express ]
        ├──► NHTSA vPIC + local WMI reference (VIN lookup)
        ├──► Local OBD-II reference (known trouble codes)
        └──► Gemini API (photo assessment and additional OBD-II explanations)
                │
                ▼
[ Unified KolikCheck.AI Report (JSON → rendered in browser) ]
```

---

## 🚀 Key Features
1. **Guided photo inspection.** Add front, rear, left, right, interior, and close-up photos. Select a view before uploading or label existing photos. The report shows which views Gemini assessed, which were submitted without an assessment, and which remain unchecked. Live condition scores and risk labels require a successful assessment.
2. **VIN reference lookup.** Use **Decode VIN** to fill in the make, model, and model year when available. Results come from [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/), with a local WMI fallback for limited identification. Each populated field shows its source. Verify and edit the values against the vehicle documents.
3. **Multi-code OBD-II lookup.** Enter up to 10 codes separated by spaces, commas, semicolons, or newlines. Results group the codes by system and suggest a check order based on severity. To include the codes in a report, enter them on the inspection form.
4. **In-person checklist.** Track the VIN and document check, cold start, test drive, and lift inspection. The checklist is saved per VIN and is available on the inspection form and the report.
5. **Vehicle comparison.** Enter the seller’s asking price in tenge and the stated mileage in the report, then choose **Save for comparison**. Open **Compare** to see up to three vehicles side by side by price, mileage, photo findings, and OBD-II codes. Saving the same VIN updates its entry. The comparison stores report details in the current browser, excluding photos.
6. **Camry 70 sample report.** Open it from the home page without entering vehicle data or calling external APIs. The fictional 2019 Almaty case includes a 68/100 photo score, two defects, unchecked areas, two OBD-II codes, and an illustrative repair estimate. It can be saved for comparison.
7. **Repair estimate in tenge.** Enter a shop quote or price range for each listed defect. The report totals the entered amounts, and you can save the total alongside the report in the comparison.

Both inspection forms accept a VIN, listing photos, OBD-II codes, or any combination of those inputs. A report based only on scanner codes has no photo rating. Use the browser’s print dialog from the report to save a PDF.

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Kirieshkaxs/KolikCheck.AI.git
cd KolikCheck.AI

# 2. Install server dependencies
npm ci --prefix server

# 3. Optional for live analysis
cp .env.example server/.env
#    Edit server/.env and set GEMINI_API_KEY

# 4. Start the server
npm start
#    → http://localhost:8080
```

In PowerShell, use `Copy-Item .env.example server/.env` for step 3. The server reads `server/.env` regardless of the working directory. Set `PORT` there or in the environment to change the port.

The Camry example, VIN lookup, known OBD-II codes, checklist, and comparison are available without Gemini. If the photo assessment is unavailable, the report still shows the information it could retrieve.

For Google Cloud Run, run `powershell -ExecutionPolicy Bypass -File deploy-cloud-run.ps1`. The script uses the Google Cloud CLI and Cloud Build and deploys a public service.

---

## 📂 Project Structure
```
KolikCheck.AI/
├── client/
│   ├── index.html          # SPA — inspection, reporting, OBD-II and comparison views
│   ├── inspection-tools.js # Photo coverage, checklist, batch OBD-II, comparison
│   └── report-example.js   # Local Camry example and repair estimate calculator
├── server/
│   ├── server.js          # Express API (analyze, analyze-obd, health)
│   ├── obd-diagnostics.js # Local OBD-II reference
│   ├── vin-decoder.js     # NHTSA vPIC lookup and local WMI fallback
│   ├── package.json       # Server dependencies
│   ├── package-lock.json
│   └── .env               # API keys (git-ignored)
├── .env.example           # Template for .env
├── .gitignore
├── package.json           # Root convenience scripts
├── Dockerfile
├── deploy-cloud-run.ps1
└── README.md
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Accepts multipart fields `vin`, `make`, `model`, `year`, `obdCodes` (separated by spaces, commas, semicolons or newlines), and repeated `photos`. Requires at least one of `vin`, `photos`, or `obdCodes`. Returns vehicle fields with `vehicleSources`, assessed photo views in `assessedViews`, and code results in `obd` |
| `POST` | `/api/analyze-obd` | Accepts `{ "codes": ["P0300", "P0420"] }` and returns `{ "results": [...] }` with a source per code. The original `{ "code": "P0300" }` format returns one result object |
| `GET` | `/api/vin/:vin` | Returns `basic` vehicle fields, `fieldSources`, and `isPartial`. Reports missing fields as a partial result |
| `GET` | `/api/health` | Server availability and configured mode (`live` or `demo`) |

Photo uploads accept JPEG, PNG, and WebP, with a maximum of 10 files, 8 MiB per file, and 12 MiB total.

---

## 👥 Team & Responsibilities
* **Lead Developer & Architect:** Handles backend infrastructure, Gemini API integration, and hardware testing.
* **UI/UX & Product Lead:** Manages user interface design, user journey, and pitch presentation strategy.

---

## 🛡️ Responsible AI & Compliance (`AI-CARD`)
* **Data handling.** The server sends VINs to NHTSA vPIC for lookup and keeps uploaded photos in memory for the request. With a Gemini key configured, it sends photos and codes missing from the local reference to Gemini. Checklists and comparison entries stay in browser storage. Keep API keys in server-side environment variables.
* **Coverage.** Reports cover the submitted evidence. Confirm findings with vehicle documents and an in-person inspection. The sample repair costs are illustrative. Real report totals use the prices entered by the user.

---

## 📄 License
This project is developed as part of the StartUp Battle IT FEST 2026 competition. All rights reserved.
