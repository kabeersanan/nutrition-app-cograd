import os
import json
import traceback
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment")

genai.configure(api_key=api_key)
app = FastAPI()
origins = [
    "https://nutrition-app-cograd.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Using Flash for speed, requiring JSON output
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