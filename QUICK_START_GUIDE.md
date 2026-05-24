# 🚀 Quick Start Guide - Barcode Scanner Feature

## Prerequisites
- Node.js 18+ installed
- Python 3.8+ installed
- Webcam/camera access
- Modern web browser (Chrome, Firefox, Edge, Safari)

---

## 📋 Step-by-Step Setup

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install the new `html5-qrcode` library along with all other dependencies.

### 2. Ensure Backend is Running

```bash
cd backend
pip install -r requirements.txt  # If not already done
python main.py
```

Backend should start on `http://localhost:8001`

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### 3. Start Frontend Development Server

In a new terminal:
```bash
cd frontend
npm run dev
```

Frontend should start on `http://localhost:9000`

---

## 🎮 Testing the Feature

### Access the Scanner:
1. Open browser to `http://localhost:9000`
2. Click "Product Scanner" in navigation
3. You should see three options:
   - ✨ **Scan Product Barcode** (NEW!)
   - 🖼️ Upload or drag image
   - 🗣️ Voice search

### Test Barcode Scanning:

#### Option A: Test with Mock Data (Recommended First)
1. Click "Scan Product Barcode"
2. Click "Try Again" after permission prompt
3. System will use mock data
4. You'll see results page

#### Option B: Test with Real Barcode (if webcam available)
1. Click "Scan Product Barcode"
2. Allow camera access when prompted
3. Hold product with visible barcode to camera
4. Wait for automatic detection
5. See results

#### Test Barcodes:
Try scanning these with real products:
- Water bottles (Plastic)
- Glass jars
- Cardboard boxes
- Aluminum cans
- Paper products

### Expected User Flow:
```
Click "Scan Product Barcode"
    ↓ (Modal opens)
Camera permission required
    ↓ (Grant permission)
Live barcode detection
    ↓ (Point at barcode)
Auto-detection & beep sound
    ↓ (Fetching product data...)
Results page displays with:
  - Product name
  - Sustainability score
  - Packaging analysis
  - Eco alternatives
```

---

## 🔍 Verify Installation

### Check Backend Status:
```bash
curl http://localhost:8001/
```

Should return:
```json
{
  "message": "Welcome to the EcoNova GreenLens API Backend!..."
}
```

### Test Barcode Endpoint:
```bash
curl -X POST http://localhost:8001/barcode/scan \
  -H "Content-Type: application/json" \
  -d '{"barcode": "5901234123457"}'
```

Should return product analysis with metadata.

### Check Frontend:
- Open `http://localhost:9000` in browser
- Look for "Scan Product Barcode" button on scanner page
- Browser console should show no errors

---

## 🎨 UI Elements to Look For

### Scanner Page:
- ✨ **Premium Barcode Button** with gradient and pulse effect
- 📱 Live camera display with animated border
- 🔄 Retry button on errors
- 🎯 Scan overlay with glowing border

### Results Page:
New sections for barcode scans:
- 📦 **Packaging Analysis** section
- 🧪 Material breakdown (Glass, Plastic, etc.)
- ♻️ Recyclability indicators
- 🌱 Eco certifications
- ⚠️ Environmental recommendations

---

## 🐛 Troubleshooting

### Camera Not Working
```
Error: "Camera permission denied"
→ Check browser privacy settings
→ Clear site data and retry
→ Try different browser
```

### Barcode Not Detected
```
✓ Ensure good lighting
✓ Hold camera steady
✓ Barcode visible in frame
✓ Try different barcodes
```

### Backend Connection Error
```
Error: "Failed to connect to backend"
→ Check backend is running: http://localhost:8001
→ Verify backend port (should be 8001)
→ Check NEXT_PUBLIC_BACKEND_URL in .env
```

### Barcode Not Found in Database
```
✓ Try another product
✓ Check barcode digits (8, 12, or 13 digits)
✓ Some products may not be in OpenFoodFacts
→ System will fallback to AI analysis
```

---

## 📊 Expected Results

### Example 1: Plastic Water Bottle
**Input:** Scan plastic bottle barcode  
**Output:**
- Product: "Plastic Water Bottle"
- Eco Score: 15/100 ⚠️
- Packaging: Plastic (PET) - Score: 2/10
- Alternatives: Glass bottle, Metal bottle, Recycled plastic

### Example 2: Glass Jar
**Input:** Scan glass container  
**Output:**
- Product: "Glass Storage Jar"
- Eco Score: 85/100 ✅
- Packaging: Glass - Score: 9/10
- Recommendation: "Great Choice!"

---

## 🎓 Feature Overview

### What Happens Behind the Scenes:

1. **Barcode Detection**
   - html5-qrcode reads camera stream
   - Detects UPC/EAN barcodes in real-time
   - Auto-stops after successful scan

2. **Product Lookup**
   - Barcode sent to OpenFoodFacts API
   - Retrieves: name, brand, packaging, eco labels
   - Extracts material information

3. **Sustainability Analysis**
   - Fetches from AI (Gemini/Groq/Grok)
   - Analyzes packaging materials
   - Generates eco-friendly alternatives

4. **Results Display**
   - Shows packaging breakdown
   - Material impact scoring
   - Eco certifications
   - Actionable recommendations

---

## 📱 Mobile Testing

### On Mobile Device:
1. Connect to local network
2. Open `http://[YOUR_IP]:9000`
3. Click "Scan Product Barcode"
4. Use phone camera to scan real products
5. See results instantly

### Mobile Features:
- ✅ Touch-friendly interface
- ✅ Full-screen camera view
- ✅ Camera torch support (if available)
- ✅ Responsive design
- ✅ Back camera support

---

## ⚙️ Configuration

### Environment Setup:
Create `frontend/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8001
```

Create `backend/.env`:
```
# Optional: Add API keys for better results
GOOGLE_GEMINI_API_KEY=your_api_key
GROQ_API_KEY=your_api_key
GROK_API_KEY=your_api_key
```

### Port Configuration:
- Frontend: 9000 (check `frontend/package.json`)
- Backend: 8001 (check `backend/main.py`)

---

## ✅ Success Checklist

After setup, verify:
- [ ] npm install completes without errors
- [ ] Backend starts on port 8001
- [ ] Frontend starts on port 9000
- [ ] No console errors in browser DevTools
- [ ] "Scan Product Barcode" button visible
- [ ] Camera permission prompt appears
- [ ] Can scan a test barcode (or see mock results)
- [ ] Results page displays with packaging analysis
- [ ] Dark/light theme toggles work
- [ ] Responsive on mobile view

---

## 🚀 Next Steps

### To Use in Production:
1. Build frontend: `npm run build`
2. Start backend with production server
3. Configure environment variables
4. Deploy to hosting platform
5. Enable HTTPS (required for camera access)

### To Extend:
1. Add more product databases
2. Integrate with shopping apps
3. Add local search history
4. Implement price comparison
5. Add social sharing features

---

## 📞 Support & Resources

### Documentation:
- `BARCODE_FEATURE_IMPLEMENTATION.md` - Full technical docs
- `README.md` - Project overview
- Component comments in code

### External APIs:
- **OpenFoodFacts**: https://world.openfoodfacts.org/api/
- **html5-qrcode**: https://github.com/mebjas/html5-qrcode
- **Gemini API**: https://ai.google.dev/

### Debugging:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for API calls
4. Check Application → Storage for localStorage

---

## 🎉 You're Ready!

The barcode scanner is now integrated and ready to use. Start scanning products and enjoy the eco-friendly insights!

**Happy Scanning! 🌍♻️**
