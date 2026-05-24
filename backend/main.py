import os
import base64
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from google import genai
import json
from dotenv import load_dotenv

# Load the environment variables from the frontend directory's .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env')
load_dotenv(dotenv_path)

app = FastAPI(title="EcoNova GreenLens AI Backend")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import urllib.request

CACHE_FILE = os.path.join(os.path.dirname(__file__), "backend_cache.json")

def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading cache: {e}")
    return {}

def save_cache(cache_data: dict):
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache_data, f, indent=2)
    except Exception as e:
        print(f"Error saving cache: {e}")

def get_request_hash(text: Optional[str], image: Optional[str]) -> str:
    h = hashlib.sha256()
    if text:
        h.update(f"text:{text}".encode("utf-8"))
    if image:
        img_data = image.split(",")[1] if "," in image else image
        h.update(f"image:{img_data}".encode("utf-8"))
    return h.hexdigest()

def get_gemini_keys() -> List[str]:
    keys_str = os.environ.get("GOOGLE_GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY") or ""
    return [k.strip() for k in keys_str.split(",") if k.strip()]

def call_groq_or_grok_fallback(text: Optional[str], image: Optional[str], base_prompt: str) -> Optional[dict]:
    grok_key = os.environ.get("GROK_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")
    
    endpoints = []
    if grok_key:
        endpoints.append({
            "name": "Grok",
            "url": "https://api.x.ai/v1/chat/completions",
            "key": grok_key,
            "model_text": "grok-2-1212",
            "model_vision": "grok-2-vision-1212"
        })
    if groq_key:
        endpoints.append({
            "name": "Groq",
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "key": groq_key,
            "model_text": "llama-3.3-70b-versatile",
            "model_vision": "llama-3.2-11b-vision-preview"
        })
        
    for ep in endpoints:
        try:
            print(f"Attempting fallback to {ep['name']}...")
            headers = {
                "Authorization": f"Bearer {ep['key']}",
                "Content-Type": "application/json"
            }
            
            messages = []
            model = ep['model_text']
            
            if image:
                model = ep['model_vision']
                img_data = image.split(",")[1] if "," in image else image
                mime_type = "image/jpeg"
                if image.startswith("data:image"):
                    mime_type = image.split(";")[0].split(":")[1]
                data_url = f"data:{mime_type};base64,{img_data}"
                
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Analyze this product image carefully and identify the product.\n{base_prompt}"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": data_url
                            }
                        }
                    ]
                })
            else:
                messages.append({
                    "role": "user",
                    "content": f'Analyze this product description carefully and identify the product based on the description: "{text}".\n{base_prompt}'
                })
                
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }
            
            req = urllib.request.Request(
                ep['url'],
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=15) as res:
                response_data = json.loads(res.read().decode("utf-8"))
                response_content = response_data["choices"][0]["message"]["content"]
                cleaned_text = response_content.replace("```json", "").replace("```", "").strip()
                ai_data = json.loads(cleaned_text)
                print(f"Fallback to {ep['name']} succeeded!")
                return ai_data
        except Exception as e:
            print(f"Fallback to {ep['name']} failed: {str(e)}")
            
    return None


class ScanRequest(BaseModel):
    image: Optional[str] = None
    text: Optional[str] = None

class EcoAlternative(BaseModel):
    name: str
    material: str
    estimatedPriceINR: float
    reason: str
    alternativeType: str # "budget", "balanced", or "eco"

class ScanResponse(BaseModel):
    productName: str
    category: str
    materialType: str
    estimatedPriceINR: float
    reusabilityScore: int
    biodegradabilityScore: int
    carbonImpactScore: int
    ecoAlternatives: List[EcoAlternative]

@app.get("/")
async def root():
    return {
        "message": "Welcome to the EcoNova GreenLens API Backend! This is just the API server. Please open the frontend website at http://localhost:3000 in your browser to use the application."
    }

def hash_string_to_index(s: str, limit: int) -> int:
    if not s:
        return 0
    h = hashlib.md5(s.encode('utf-8', errors='ignore')).hexdigest()
    return int(h, 16) % limit

def get_smart_mock_data(text: Optional[str], image: Optional[str]) -> dict:
    templates = [
        # 0: Bottle
        {
            "productName": "Generic Plastic Bottle",
            "category": "Beverage Container",
            "materialType": "PET Plastic",
            "estimatedPriceINR": 20.0,
            "reusabilityScore": 2,
            "biodegradabilityScore": 2,
            "carbonImpactScore": 8,
            "ecoAlternatives": [
                {"name": "Recycled Plastic Bottle", "material": "RPET Plastic", "estimatedPriceINR": 40.0, "alternativeType": "budget", "reason": "Affordable alternative made from recycled materials, reducing virgin plastic demand."},
                {"name": "Glass Water Bottle", "material": "Glass", "estimatedPriceINR": 120.0, "alternativeType": "balanced", "reason": "Highly reusable, non-toxic, and infinitely recyclable at a moderate price."},
                {"name": "Steel Water Bottle", "material": "Stainless Steel", "estimatedPriceINR": 350.0, "alternativeType": "eco", "reason": "Ultimate durability and reuse lifespan; completely eliminates single-use bottle consumption."}
            ]
        },
        # 1: Coffee Cup
        {
            "productName": "Single-use Coffee Cup",
            "category": "Food Service Tableware",
            "materialType": "Polyethylene-coated Paper",
            "estimatedPriceINR": 15.0,
            "reusabilityScore": 1,
            "biodegradabilityScore": 4,
            "carbonImpactScore": 6,
            "ecoAlternatives": [
                {"name": "Clay Kulhad Cup", "material": "Natural Clay", "estimatedPriceINR": 10.0, "alternativeType": "budget", "reason": "Extremely cheap, traditional, and 100% biodegradable clay cup."},
                {"name": "Ceramic Mug", "material": "Ceramic", "estimatedPriceINR": 100.0, "alternativeType": "balanced", "reason": "Durable, reusable thousands of times, and perfect for office/home use."},
                {"name": "Stainless Steel Tumbler", "material": "Stainless Steel", "estimatedPriceINR": 350.0, "alternativeType": "eco", "reason": "Insulated, extremely long-lasting, and highly sustainable premium carry option."}
            ]
        },
        # 2: Shopping Bag
        {
            "productName": "Plastic Shopping Bag",
            "category": "Shopping Bag",
            "materialType": "LDPE Plastic",
            "estimatedPriceINR": 5.0,
            "reusabilityScore": 1,
            "biodegradabilityScore": 1,
            "carbonImpactScore": 7,
            "ecoAlternatives": [
                {"name": "Recycled Paper Bag", "material": "Recycled Kraft Paper", "estimatedPriceINR": 10.0, "alternativeType": "budget", "reason": "Very cheap, biodegradable, and made from 100% recycled paper fibers."},
                {"name": "Jute Shopping Bag", "material": "Jute Fiber", "estimatedPriceINR": 80.0, "alternativeType": "balanced", "reason": "Strong, natural plant fiber, reusable for years, and highly biodegradable."},
                {"name": "Cotton Canvas Tote Bag", "material": "Cotton Canvas", "estimatedPriceINR": 150.0, "alternativeType": "eco", "reason": "Washable, aesthetic, premium durability, and reusable for a lifetime."}
            ]
        },
        # 3: Toothbrush
        {
            "productName": "Plastic Toothbrush",
            "category": "Personal Care",
            "materialType": "Nylon and Polypropylene",
            "estimatedPriceINR": 45.0,
            "reusabilityScore": 1,
            "biodegradabilityScore": 0,
            "carbonImpactScore": 6,
            "ecoAlternatives": [
                {"name": "Bamboo Toothbrush", "material": "Organic Bamboo", "estimatedPriceINR": 60.0, "alternativeType": "budget", "reason": "Affordable, biodegradable organic bamboo body with charcoal bristles."},
                {"name": "Neem Wood Toothbrush", "material": "Neem Wood", "estimatedPriceINR": 110.0, "alternativeType": "balanced", "reason": "Made from anti-bacterial neem wood, fully compostable and eco-friendly."},
                {"name": "Reusable Replaceable Head Toothbrush", "material": "Bio-plastic and Bamboo", "estimatedPriceINR": 250.0, "alternativeType": "eco", "reason": "Premium reusable handle where only the bamboo bristle head is replaced, minimizing waste."}
            ]
        },
        # 4: Cutlery
        {
            "productName": "Disposable Plastic Cutlery",
            "category": "Tableware",
            "materialType": "Polystyrene Plastic",
            "estimatedPriceINR": 5.0,
            "reusabilityScore": 1,
            "biodegradabilityScore": 1,
            "carbonImpactScore": 8,
            "ecoAlternatives": [
                {"name": "Birchwood Disposable Spoon", "material": "Birch Wood", "estimatedPriceINR": 10.0, "alternativeType": "budget", "reason": "Compostable, chemical-free, and breaks down naturally in weeks."},
                {"name": "Reusable Bamboo Spoon", "material": "Natural Bamboo", "estimatedPriceINR": 45.0, "alternativeType": "balanced", "reason": "Reusable, lightweight, biodegradable, and highly portable."},
                {"name": "Stainless Steel Spoon Set", "material": "Stainless Steel", "estimatedPriceINR": 180.0, "alternativeType": "eco", "reason": "Dishwasher-safe, infinitely reusable, and extremely durable premium alternative."}
            ]
        }
    ]

    if text:
        text_lower = text.lower()
        if any(w in text_lower for w in ["bottle", "coke", "pepsi", "soda", "drink", "water"]):
            idx = 0
            prod_name = text.title() if "bottle" in text_lower else f"{text.title()} Bottle"
        elif any(w in text_lower for w in ["cup", "glass", "mug", "tea", "coffee"]):
            idx = 1
            prod_name = text.title() if "cup" in text_lower else f"{text.title()} Cup"
        elif any(w in text_lower for w in ["bag", "shopping", "polythene", "plastic bag"]):
            idx = 2
            prod_name = text.title() if "bag" in text_lower else f"{text.title()} Bag"
        elif any(w in text_lower for w in ["toothbrush", "brush", "colgate"]):
            idx = 3
            prod_name = text.title()
        elif any(w in text_lower for w in ["spoon", "fork", "knife", "cutlery", "plate", "bowl"]):
            idx = 4
            prod_name = text.title()
        else:
            return {
                "productName": text.title(),
                "category": "General Goods",
                "materialType": "Mixed Synthetics",
                "estimatedPriceINR": 100.0,
                "reusabilityScore": 4,
                "biodegradabilityScore": 2,
                "carbonImpactScore": 5,
                "ecoAlternatives": [
                    {"name": f"Recycled {text.title()}", "material": "Recycled / Organic Materials", "estimatedPriceINR": 80.0, "alternativeType": "budget", "reason": "Affordable alternative made using sustainable, carbon-neutral manufacturing processes."},
                    {"name": f"Eco-friendly {text.title()}", "material": "Recycled / Organic Materials", "estimatedPriceINR": 150.0, "alternativeType": "balanced", "reason": "Balanced alternative offering high sustainability at a moderate price."},
                    {"name": f"Premium Organic {text.title()}", "material": "Organic / Premium Restored", "estimatedPriceINR": 350.0, "alternativeType": "eco", "reason": "Premium eco option focusing on maximum longevity and biological breakdown."}
                ]
            }
        
        res = templates[idx].copy()
        res["productName"] = prod_name
        return res

    elif image:
        idx = hash_string_to_index(image, len(templates))
        return templates[idx]

    return templates[0]

@app.post("/scan")
async def scan_product(request: ScanRequest):
    print("------------------- FASTAPI SCAN REQUEST -------------------")
    print(f"Text parameter: {request.text}")
    print(f"Image parameter length: {len(request.image) if request.image else 'None'}")
    if request.image:
        print(f"Image start: {request.image[:100]}")

    if not request.image and not request.text:
        raise HTTPException(status_code=400, detail="Image or text is required")

    # 1. Check cache first
    req_hash = get_request_hash(request.text, request.image)
    cache = load_cache()
    if req_hash in cache:
        print("Cache hit! Serving scan result from cache.")
        return cache[req_hash]

    base_prompt = """
Use Indian market context and estimate all prices strictly in Indian Rupees (₹ INR), not USD.
Provide sustainability metrics for the product.
Return ONLY a strict JSON object with no markdown formatting or extra text.

The JSON must match this structure exactly:
{
  "productName": "String",
  "category": "String",
  "materialType": "String",
  "estimatedPriceINR": Number,
  "reusabilityScore": Number,
  "biodegradabilityScore": Number,
  "carbonImpactScore": Number,
  "ecoAlternatives": [
    {
      "name": "String",
      "material": "String",
      "estimatedPriceINR": Number,
      "alternativeType": "budget" | "balanced" | "eco",
      "reason": "String"
    }
  ]
}

Scoring Rules:
- Reusability Score: 0-10 (10 = highly reusable)
- Biodegradability Score: 0-10 (10 = highly biodegradable)
- Carbon Impact Score: 0-10 (0 = low impact, 10 = high impact)

Alternative Selection Rules:
- Return EXACTLY three alternatives in the "ecoAlternatives" array.
- For "alternativeType", use:
  1) "budget": An affordable, low-cost choice, with a price close to or lower than the original product.
  2) "balanced": A mid-range priced option representing a great balance of durability, cost, and eco-friendliness.
  3) "eco": A premium, highly sustainable option with maximum environmental benefit, where price is secondary.
- Estimate realistic, category-appropriate prices in Indian Rupees (INR) for the Indian market. Do not use hardcoded or generic price limits across different kinds of products (e.g. cutlery, bags, electronics, clothing should all have their own natural price scale).

The product identification should be accurate and practical.
Provide realistic Indian market pricing.
Suggest meaningful eco-friendly alternatives with clear sustainability benefits.
"""

    gemini_keys = get_gemini_keys()
    ai_data = None
    success = False

    # 2. Try Gemini API keys sequentially
    if gemini_keys:
        for idx, key in enumerate(gemini_keys):
            try:
                print(f"Attempting Gemini API with key {idx+1}/{len(gemini_keys)} (prefix: {key[:8]}...)")
                temp_client = genai.Client(api_key=key)
                contents = []

                if request.image:
                    prompt = f"Analyze this product image carefully and identify the product.\n{base_prompt}"
                    base64_data = request.image.split(",")[1] if "," in request.image else request.image
                    mime_type = "image/jpeg"
                    if request.image.startswith("data:image"):
                        mime_type = request.image.split(";")[0].split(":")[1]
                    
                    contents.append(prompt)
                    contents.append(
                        genai.types.Part.from_bytes(
                            data=base64.b64decode(base64_data),
                            mime_type=mime_type
                        )
                    )
                else:
                    prompt = f'Analyze this product description carefully and identify the product based on the description: "{request.text}".\n{base_prompt}'
                    contents.append(prompt)

                response = temp_client.models.generate_content(
                    model="gemini-3.5-flash",
                    contents=contents
                )
                response_text = response.text
                cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
                ai_data = json.loads(cleaned_text)
                success = True
                print("Gemini API call succeeded!")
                break
            except Exception as e:
                print(f"Gemini API attempt {idx+1} failed: {str(e)}")

    # 3. Try Grok/Groq fallbacks if Gemini failed or no keys
    if not success:
        try:
            ai_data = call_groq_or_grok_fallback(request.text, request.image, base_prompt)
            if ai_data:
                success = True
        except Exception as e:
            print(f"Grok/Groq fallback failed: {str(e)}")

    # 4. Fallback to smart local mock data
    if not success:
        print("All API methods failed. Serving smart local mock data.")
        ai_data = get_smart_mock_data(request.text, request.image)

    # 5. Cache and return the result
    try:
        cache[req_hash] = ai_data
        save_cache(cache)
    except Exception as e:
        print(f"Failed to cache result: {str(e)}")

    return ai_data

class BarcodeRequest(BaseModel):
    barcode: str

class ProductMetadata(BaseModel):
    barcode: str
    name: str
    brand: str
    packaging: str
    packagingMaterials: List[str]
    labels: List[str]

@app.post("/barcode/scan")
async def scan_barcode(request: BarcodeRequest):
    """
    Scan a product barcode using OpenFoodFacts API and analyze its sustainability
    """
    print(f"------------------- BARCODE SCAN REQUEST -------------------")
    print(f"Barcode: {request.barcode}")
    
    if not request.barcode or not request.barcode.strip():
        raise HTTPException(status_code=400, detail="Barcode is required")
    
    barcode = request.barcode.strip().replace("-", "").replace(" ", "")
    
    # 1. Check cache first
    cache_key = f"barcode:{barcode}"
    cache = load_cache()
    if cache_key in cache:
        print(f"Cache hit for barcode {barcode}")
        return cache[cache_key]
    
    # 2. Fetch from OpenFoodFacts
    product_metadata = None
    try:
        print(f"Fetching from OpenFoodFacts API for barcode: {barcode}")
        import urllib.request
        
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        headers = {"User-Agent": "EcoNova-GreenLens/1.0"}
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            
            if data.get("status") == 1 and data.get("product"):
                product = data["product"]
                
                # Extract packaging materials
                packaging_materials = []
                packaging_text = product.get("packaging_text", "").lower()
                if packaging_text:
                    if "plastic" in packaging_text or "pet" in packaging_text:
                        packaging_materials.append("Plastic")
                    if "glass" in packaging_text:
                        packaging_materials.append("Glass")
                    if "metal" in packaging_text or "aluminum" in packaging_text or "steel" in packaging_text:
                        packaging_materials.append("Metal")
                    if "paper" in packaging_text or "cardboard" in packaging_text:
                        packaging_materials.append("Paper")
                    if "wood" in packaging_text:
                        packaging_materials.append("Wood")
                
                # Extract labels
                labels = []
                labels_text = product.get("labels", "").lower()
                if labels_text:
                    if "organic" in labels_text:
                        labels.append("Organic")
                    if "fair trade" in labels_text or "fairtrade" in labels_text:
                        labels.append("Fair Trade")
                    if "recyclable" in labels_text:
                        labels.append("Recyclable")
                    if "biodegradable" in labels_text:
                        labels.append("Biodegradable")
                    if "vegan" in labels_text:
                        labels.append("Vegan")
                
                if product.get("eco_score"):
                    labels.append(f"Eco-Score: {product['eco_score'].upper()}")
                
                product_metadata = {
                    "barcode": barcode,
                    "name": product.get("product_name", "Unknown Product"),
                    "brand": product.get("brands", "Unknown Brand"),
                    "packaging": product.get("packaging", "Not specified"),
                    "packagingMaterials": packaging_materials if packaging_materials else ["Unspecified"],
                    "labels": labels,
                    "category": product.get("categories", "Unknown"),
                    "imageUrl": product.get("image_url", ""),
                }
                print(f"Product found: {product_metadata['name']}")
            else:
                print(f"Product not found in OpenFoodFacts for barcode: {barcode}")
    except Exception as e:
        print(f"OpenFoodFacts API error: {str(e)}")
    
    # 3. If product found in OpenFoodFacts, analyze and send to recommendation engine
    if product_metadata:
        product_description = f"{product_metadata['name']} - {product_metadata['brand']}"
        if product_metadata.get('packagingMaterials'):
            product_description += f" (Packaging: {', '.join(product_metadata['packagingMaterials'])})"
        
        # Call the existing /scan endpoint with text parameter
        try:
            print(f"Calling /scan endpoint for: {product_description}")
            response = await scan_product(ScanRequest(text=product_description))
            
            # Enhance response with barcode metadata
            response_data = {
                "scanId": hashlib.md5(barcode.encode()).hexdigest(),
                "barcode": barcode,
                "productMetadata": product_metadata,
                "data": response,
                "error": None
            }
            
            # Cache the result
            try:
                cache[cache_key] = response_data
                save_cache(cache)
            except Exception as e:
                print(f"Failed to cache barcode result: {str(e)}")
            
            return response_data
        except Exception as e:
            print(f"Error calling /scan endpoint: {str(e)}")
    
    # 4. Fallback: generate mock data based on barcode
    print(f"Generating fallback data for barcode: {barcode}")
    
    # Try to infer product type from packaging materials or default to generic
    fallback_description = product_metadata["name"] if product_metadata else f"Product {barcode}"
    
    try:
        response = await scan_product(ScanRequest(text=fallback_description))
    except Exception as e:
        print(f"Fallback scan failed: {str(e)}")
        response = get_smart_mock_data(fallback_description, None)
    
    response_data = {
        "scanId": hashlib.md5(barcode.encode()).hexdigest(),
        "barcode": barcode,
        "productMetadata": product_metadata or {
            "barcode": barcode,
            "name": "Unknown Product",
            "brand": "Unknown",
            "packaging": "Not available",
            "packagingMaterials": ["Unspecified"],
            "labels": []
        },
        "data": response,
        "error": "Product data from OpenFoodFacts unavailable" if not product_metadata else None
    }
    
    # Cache the result
    try:
        cache[cache_key] = response_data
        save_cache(cache)
    except Exception as e:
        print(f"Failed to cache fallback result: {str(e)}")
    
    return response_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
