# 🍽️ MacroVision

**AI-powered nutrition tracker** — snap a photo of your plate, get an instant macro/micronutrient breakdown, and log it by meal to track your total daily intake.

🔗 **Live demo:** https://nutrition-app-cograd.vercel.app

> Upload or capture a meal photo → Google Gemini Vision identifies the foods and estimates nutrition → review/edit the breakdown → log it as breakfast/lunch/dinner/snack → see your running daily totals.

<!-- Add a screenshot or GIF here — it's the highest-impact thing on a README -->
<!-- ![MacroVision demo](docs/demo.gif) -->

---

## ✨ Features

- 📸 **Photo analysis** — capture from camera or upload an image; Gemini Vision returns calories, protein, carbs, fats, and micros (zinc, calcium, iron).
- ✅ **Interactive review** — toggle individual items on/off and add missing ones; totals recompute live.
- 🗂️ **Meal logging** — save a plate under breakfast / lunch / dinner / snack.
- 📊 **Daily intake** — a "Today" view groups meals by type and sums the day's total nutrients.
- 👤 **Per-device history** — each browser gets an anonymous id (no login), so history is scoped per device.
- 🗑️ **Full CRUD** — log, view, and delete meals.

## 🏗️ Architecture

```
React (browser)  →  FastAPI (Python)  →  SQLite (meals.db)
 capture / view      validate + REST       persist / query
        │                  │
        └──────────────────┴──→  Google Gemini Vision (image → nutrition JSON)
```

Three clean layers: the React frontend handles capture and display, FastAPI handles validation and the REST API, and a thin `sqlite3` data-access module (`backend/db.py`) owns all persistence. Gemini is called only for image analysis.

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, axios, lucide-react |
| Backend | FastAPI, Uvicorn, Pydantic |
| Database | SQLite (Python stdlib `sqlite3` — zero extra deps) |
| AI | Google Gemini 2.5 Flash (vision + JSON output) |
| Deploy | Vercel (frontend), Render (backend) |
| PWA | `vite-plugin-pwa` (installable) |

## 🔌 API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Analyze a meal image → nutrition JSON |
| `POST` | `/meals` | Log a plate under a meal type |
| `GET`  | `/meals?date=today` | Meals grouped by type + computed daily totals |
| `DELETE` | `/meals/{id}` | Delete a logged meal |

The `/meals` endpoints require an `X-Device-Id` header (the anonymous per-browser id).

## 🚀 Running Locally

**Prerequisites:** Node.js 18+, Python 3.10+, a [Google Gemini API key](https://aistudio.google.com/apikey).

**1. Clone & configure**
```bash
git clone <your-repo-url>
cd nutrition-app-cograd
```
Create a `.env` in the project root:
```
GEMINI_API_KEY="your_key_here"
```

**2. Backend** (terminal 1)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 10000
```
Backend runs at `http://127.0.0.1:10000` (interactive API docs at `/docs`).

**3. Frontend** (terminal 2)
```bash
npm install
npm run dev
```
Open the printed URL (typically `http://localhost:5173`). The frontend defaults to the local backend; override with `VITE_BACKEND_URL` for a deployed backend.

## 🧠 Engineering Highlights

- **Handling unreliable LLM output** — the model can return markdown-fenced JSON, floats where integers are expected, or non-JSON; `/analyze` strips fences, coerces types, and returns a clean `502` when the model doesn't produce valid JSON.
- **Persistence isolated behind one module** — `db.py` is the only code that touches SQL (parameterized queries throughout, no string concatenation), so the storage engine could be swapped without changing the API.
- **Per-device data isolation** — every `/meals` query is scoped by `X-Device-Id`, and deletes are guarded so one device can't remove another's data.
- **CORS for any dev port** — a regex origin keeps production locked to the deployed domain while allowing any `localhost` port in development.

## 🗺️ Roadmap

- Integrate **USDA FoodData Central** for authoritative nutrition (currently AI-estimated).
- Daily goals + progress; weekly trend charts.
- Result caching by image hash; rate limiting.
- Automated tests (pytest + Vitest) in CI.
- Hosted SQLite (Turso) so history survives backend restarts on free hosting.

---

_Note: nutrition values are AI estimates and not a substitute for professional dietary advice._
