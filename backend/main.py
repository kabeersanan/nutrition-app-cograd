import os
import json
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
# In backend/main.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nutrition-app-cograd.vercel.app",
        "http://localhost:5174", # Your current Vite port from the screenshot
        "http://localhost:5173"  # Default Vite port just in case
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = genai.GenerativeModel('gemini-2.5-flash')

#Schema Definition
class FoodItem(BaseModel):
    name: str
    portion: str
    calories: int

class NutritionResponse(BaseModel):
    calories: int
    protein: int
    carbs: int
    fats: int
    items: List[FoodItem]

# Inference Logic
@app.get("/")
async def root():
    return {"message": "Nutrition App Backend is running!"}

@app.post("/analyze", response_model=NutritionResponse)
async def analyze_plate(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_data = await file.read()
        
        # System Prompt
        prompt = """
        Analyze this food image. Provide a precise nutritional breakdown.
        Return ONLY a JSON object with this exact structure:
        {
            "calories": total_number,
            "protein": grams_number,
            "carbs": grams_number,
            "fats": grams_number,
            "items": [{"name": "food name", "portion": "est. weight", "calories": number}]
        }
        Do not include markdown formatting or extra text.
        """

        response = model.generate_content([
            prompt,
            {"mime_type": file.content_type, "data": image_data}
        ])

        #to structure the output-avoid having jason written at the end.
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))