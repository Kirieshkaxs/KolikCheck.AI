# KolikCheck.AI 🚗🤖

> Smart secondary vehicle inspection platform tailored for the Kazakhstan market, powered by computer vision, VIN analytics, and OBD-II diagnostics. Built for **StartUp Battle IT FEST 2026 (KBTU)**.

---

## 📌 Problem & Context
Purchasing a used car on the secondary market in Kazakhstan (over 1M+ transactions annually) is high-risk. Sellers frequently mask body damage, manipulate odometers, and clear Electronic Control Unit (ECU) error codes right before a deal. Professional pre-purchase inspection services are expensive and slow. **KolikCheck.AI** solves this information asymmetry by delivering instant, AI-driven vehicle diagnostics straight from a smartphone.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5 / CSS3 / Vanilla JavaScript — single-page application, no frameworks
* **Backend:** Node.js + Express (REST API for vehicle analysis)
* **AI & Computer Vision:** Google Gemini API — `gemini-3.8-flash` (multimodal analysis of body photos and OBD-II trouble codes)
* **File Uploads:** Multer (in-memory photo handling for Gemini API processing)

---

## 🏗️ System Architecture
```text
[ Client — SPA (HTML / CSS / JS) ]
                │
          fetch /api/analyze
                ▼
[ Server — Node.js + Express ]
        ├──► Gemini API (AI Photo Defects & OBD-II DTC Parsing)
        ├──► VIN Decoder via API (make, year from 17-char VIN; built-in fallback)
        └──► Demo Fallback (when API key is not set)
                │
                ▼
[ Unified KolikCheck.AI Report (JSON → rendered in browser) ]
```

---

## 🚀 Key Features
1. **VIN Decoder & Risk Score:** Extracts make, model year from the 17-character VIN and calculates an overall deal risk index.
2. **AI Visual Inspection:** Uploads body photos to Gemini Vision, which flags scratches, dents, paint discrepancies, and alignment gaps panel by panel.
3. **OBD-II DTC Diagnostics:** Sends complex ECU error codes (e.g. `P0300`) to Gemini and returns plain, actionable repair advice.
4. **Instant Report:** Generates a full diagnostic brief with condition score, risk level, and buyer recommendations — viewable in browser or via `window.print()`.

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/KolikCheck.AI.git
cd KolikCheck.AI

# 2. Install server dependencies
cd server
npm install

# 3. Set your Gemini API key
#    Copy .env.example → .env and paste your key
cp ../.env.example .env
#    Edit .env → GEMINI_API_KEY=your_actual_key
#    Edit .env → VIN_DECODE_API_KEY=your_vin_decode_api_key  (optional; enables API-based VIN decoding)

# 4. Start the server
npm start
#    → http://localhost:3000
```

> **Demo mode:** If `GEMINI_API_KEY` is not set, the server runs with sample data so you can explore the UI without an API key.
> VIN decoding uses the external API when `VIN_DECODE_API_KEY` is set; otherwise it falls back to the built-in WMI/year tables.

---

## 📂 Project Structure
```
KolikCheck.AI/
├── client/
│   └── index.html        # SPA — landing page, inspect form, report
├── server/
│   ├── server.js          # Express API (analyze, analyze-obd, health)
│   ├── package.json       # Server dependencies
│   └── .env               # API keys (git-ignored)
├── .env.example           # Template for .env
├── .gitignore
├── package.json           # Root convenience scripts
└── README.md
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze` | Full vehicle analysis — accepts VIN + optional photos (multipart/form-data) |
| `POST` | `/api/analyze-obd` | OBD-II error code analysis — accepts `{ "code": "P0300" }` |
| `GET`  | `/api/health` | Server status and mode (live / demo) |

---

## 👥 Team & Responsibilities
* **Lead Developer & Architect:** Handles backend infrastructure, Gemini API integration, and hardware testing.
* **UI/UX & Product Lead:** Manages user interface design, user journey, and pitch presentation strategy.

---

## 🛡️ Responsible AI & Compliance (`AI-CARD`)
* **Transparency:** Every diagnostic conclusion details the underlying physical cause and affected automotive subsystem.
* **Security:** API keys are isolated via environment variables (`.env`). No sensitive owner personal data is retained.
* **Disclaimer:** Designed as an intelligent assistant to mitigate 80% of blind spots on the secondary market; does not replace a comprehensive physical lift inspection at a certified service station.

---

## 📄 License
This project is developed as part of the StartUp Battle IT FEST 2026 competition. All rights reserved.
