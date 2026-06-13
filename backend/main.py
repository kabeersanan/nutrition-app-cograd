import os
import json
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pydantic import BaseModel
from typing import List
from datetime import datetime
from dotenv import load_dotenv

# db.py lives next to this file. Support both launch styles:
#   uvicorn main:app          (cwd = backend/)   -> import db
#   uvicorn backend.main:app  (cwd = repo root)  -> from backend import db
try:
    from . import db
except ImportError:
    import db

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment")

genai.configure(api_key=api_key)
app = FastAPI()

# Create the meals table on startup (no-op if it already exists).
db.init_db()
# Production origin is locked to the exact Vercel domain.
origins = [
    "https://nutrition-app-cograd.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # Dev: allow localhost / 127.0.0.1 on ANY port, so it doesn't matter which
    # port Vite picks (5173, 5174, ...). A request is allowed if it's in
    # `origins` OR matches this regex.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using Flash for speed, requiring JSON output.
# gemini-2.0-flash was retired by Google (returns 404); 2.5-flash is the current
# stable flash model with vision + JSON support.
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config={"response_mime_type": "application/json"},
)

# 1. Schema Definition Updated for Phase 2
class FoodItem(BaseModel):
    name: str
    portion: str
    calories: int
    protein: int  # Added
    carbs: int    # Added
    fats: int     # Added
    zinc_mg: int
    calcium_mg: int
    iron_mg: int

class NutritionResponse(BaseModel):
    calories: int
    protein: int
    carbs: int
    fats: int
    zinc_mg: int
    calcium_mg: int
    iron_mg: int
    source_database: str  # Added for attribution
    items: List[FoodItem]


# --- Meal history models (Phase 3) ---
# Lenient on purpose: the frontend sends manual items (all-zero) and extra UI
# flags like `checked`/`isManual`, which Pydantic ignores. Numbers are floats so
# both int macros and fractional micros are accepted.
class MealItem(BaseModel):
    name: str
    portion: str = ""
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fats: float = 0
    zinc_mg: float = 0
    calcium_mg: float = 0
    iron_mg: float = 0

class LogMealRequest(BaseModel):
    meal_type: str
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fats: float = 0
    zinc_mg: float = 0
    calcium_mg: float = 0
    iron_mg: float = 0
    items: List[MealItem] = []

# The 7 nutrient keys we sum/return, defined once so POST and GET stay in sync.
NUTRIENT_KEYS = ("calories", "protein", "carbs", "fats", "zinc_mg", "calcium_mg", "iron_mg")
MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}


# inference Logic
@app.get("/")
async def root():
    return {"message": "Nutrition App Backend is running!"}

@app.post("/analyze", response_model=NutritionResponse)
async def analyze_plate(file: UploadFile = File(...)):
    # validating file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()

        # prompt Updated to demand per-item macros and database attribution
        prompt = """
        Analyze this food image. Provide a precise nutritional breakdown.
        Return ONLY a JSON object with this exact structure (all numeric fields must be integers, no decimals):
        {
            "calories": total_integer,
            "protein": grams_integer,
            "carbs": grams_integer,
            "fats": grams_integer,
            "zinc_mg": milligrams_integer,
            "calcium_mg": milligrams_integer,
            "iron_mg": milligrams_integer,
            "source_database": "Name of the reference database used",
            "items": [
                {
                    "name": "food name", 
                    "portion": "est. weight", 
                    "calories": integer,
                    "protein": integer,
                    "carbs": integer,
                    "fats": integer,
                    "zinc_mg": integer,
                    "calcium_mg": integer,
                    "iron_mg": integer
                }
            ]
        }
        """

        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": image_data}
        ])

        raw = (response.text or "").strip()
        clean_json = raw.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(clean_json)
        except json.JSONDecodeError:
            print(f"[analyze] Gemini returned non-JSON:\n{raw}")
            raise HTTPException(status_code=502, detail="Model did not return valid JSON")

        # 3. Enhanced Coercion Logic: Ensure no floats slip through to Pydantic
        # Update both loops to include the new keys
        for key in ("calories", "protein", "carbs", "fats", "zinc_mg", "calcium_mg", "iron_mg"):
            if key in parsed and isinstance(parsed[key], float):
                parsed[key] = int(round(parsed[key]))
                
        for item in parsed.get("items", []):
            for macro in ("calories", "protein", "carbs", "fats", "zinc_mg", "calcium_mg", "iron_mg"):
                if macro in item and isinstance(item.get(macro), float):
                    item[macro] = int(round(item[macro]))

        return parsed
        
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {e}")


# --- Meal history endpoints (Phase 3) ---

@app.post("/meals")
async def log_meal(payload: LogMealRequest, x_device_id: str = Header(None)):
    """Save one analyzed plate under a meal type for this device."""
    if not x_device_id:
        raise HTTPException(status_code=400, detail="Missing X-Device-Id header")

    meal_type = payload.meal_type.lower().strip()
    if meal_type not in MEAL_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"meal_type must be one of {sorted(MEAL_TYPES)}",
        )

    totals = {key: getattr(payload, key) for key in NUTRIENT_KEYS}
    items = [item.model_dump() for item in payload.items]
    logged_at = datetime.now().isoformat(timespec="seconds")

    meal_id = db.insert_meal(x_device_id, meal_type, logged_at, totals, items)
    return {"id": meal_id, "meal_type": meal_type, "logged_at": logged_at}


@app.get("/meals")
async def list_meals(date: str = "today", x_device_id: str = Header(None)):
    """Return this device's meals for a date, grouped by type, plus daily totals."""
    if not x_device_id:
        raise HTTPException(status_code=400, detail="Missing X-Device-Id header")

    target_date = datetime.now().strftime("%Y-%m-%d") if date == "today" else date
    meals = db.get_meals_for_date(x_device_id, target_date)

    # We already have every row (needed to display each plate), so sum in Python
    # rather than issuing a second SUM/GROUP BY query.
    daily_totals = {key: 0 for key in NUTRIENT_KEYS}
    meals_by_type = {}
    for meal in meals:
        meals_by_type.setdefault(meal["meal_type"], []).append(meal)
        for key in NUTRIENT_KEYS:
            daily_totals[key] += meal.get(key) or 0

    # Micros are floats; round for clean display.
    for key in ("zinc_mg", "calcium_mg", "iron_mg"):
        daily_totals[key] = round(daily_totals[key], 1)

    return {"date": target_date, "meals_by_type": meals_by_type, "daily_totals": daily_totals}


@app.delete("/meals/{meal_id}")
async def remove_meal(meal_id: int, x_device_id: str = Header(None)):
    """Delete a meal, but only if it belongs to this device."""
    if not x_device_id:
        raise HTTPException(status_code=400, detail="Missing X-Device-Id header")

    deleted = db.delete_meal(x_device_id, meal_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"ok": True}