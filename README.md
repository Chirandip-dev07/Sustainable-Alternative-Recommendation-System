# 🌍 EcoNova GreenLens
> **"Scan Smarter. Choose Greener."**

EcoNova GreenLens is a premium, AI-powered sustainability scanner and eco-friendly recommendation platform. It enables consumers to instantly evaluate the environmental impact of everyday items using advanced image recognition or real-time barcode scanning. The application calculates precise sustainability metrics and guides users toward eco-friendly alternatives, bridging the gap between eco-awareness and actionable daily habits.

---

## 🚀 Key Features

*   **✨ Real-Time Barcode Scanning (UPC/EAN):** Scan product barcodes using your webcam or mobile camera to retrieve instant sustainability data via the OpenFoodFacts API, backed up by intelligent AI analysis.
*   **📷 AI Image Recognition:** Upload or capture an image of a product to automatically classify materials and packaging types using Google Gemini Vision AI.
*   **🌱 Proprietary Sustainability Scoring Engine:** Evaluates products based on our custom **$S = R + B + C$** formula, grading items from 0-30 on Reusability, Biodegradability, and Carbon Impact.
*   **🔄 Smart Recommendations:** Recommends alternative products based on user preferences—prioritizing either Eco Impact, Budget/Price, or a Balanced approach.
*   **📊 Impact Dashboard:** View real-time personal analytics, track saved eco-alternatives, and monitor carbon reduction metrics.

---

## 🛠️ Tech Stack

### Frontend Component
*   **Framework:** Next.js 15 (App Router) & React 19
*   **Languages:** TypeScript & JavaScript
*   **Styling:** Tailwind CSS & ShadCN UI
*   **Animations:** Framer Motion
*   **Libraries:** `html5-qrcode` (for smooth in-browser barcode detection)

### Backend Component
*   **Framework:** FastAPI (Python 3.8+)
*   **Database:** PostgreSQL (via Prisma ORM in the Next.js API layer)
*   **Authentication:** NextAuth.js (v5) with secure JWT handling
*   **AI Models:** Google Gemini API (`gemini-1.5-pro` & `gemini-1.5-flash`) for structural data extraction

---

## 📁 Repository Structure

```text
econova-greenlens/
├── backend/                  # FastAPI Python backend server
│   ├── main.py               # Main application routing and business logic
│   ├── requirements.txt      # Python package dependencies
│   └── backend_cache.json    # Local classification caching
│
├── frontend/                 # Next.js 15 frontend application
│   ├── src/                  # App components, pages, hooks, and utilities
│   ├── public/               # Static assets and icons
│   ├── prisma/               # Database schema definitions and migrations
│   ├── package.json          # Node.js configurations and dependencies
│   └── .env                  # Environment secrets configuration (Excluded from git)
│
├── .gitignore                # Global ignore rules for clean repository uploads
└── README.md                 # Project root documentation (this file)
```

---

## ⚙️ Quick Start & Installation

Ensure you have **Node.js (v18+)**, **Python (v3.8+)**, and **PostgreSQL** installed.

### 1. Set Up the Backend
Navigate to the `backend/` directory, install packages, and spin up the server:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*The backend server will launch at `http://localhost:8001`.*

### 2. Set Up the Frontend
In a new terminal window, configure environment variables, install dependencies, and start the development server:

```bash
cd frontend
npm install
```

Configure a `.env` file in the `frontend/` directory with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/econova?schema=public"
NEXTAUTH_URL="http://localhost:9000"
NEXTAUTH_SECRET="your-secret-jwt-key"
GEMINI_API_KEY="your-google-gemini-api-key"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8001"
```

Initialize your PostgreSQL database and run the Next.js dev server:
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*The web interface will launch at `http://localhost:9000`.*

---

## 🧪 Sustainability Scoring Logic

Our custom engine ranks items with an **Eco Score (Max: 30)** using the formula:
$$\mathbf{S = R + B + C}$$

| Metric | Range | Description |
| :--- | :--- | :--- |
| **R (Reusability)** | $0 - 10$ | Represents the product lifespan (e.g., Stainless Steel = 10, Single-use Plastic = 1). |
| **B (Biodegradability)**| $0 - 10$ | Rate of natural decomposition (e.g., Organic Bamboo = 9, Styrofoam = 0). |
| **C (Carbon Impact)** | $0 - 10$ | Measures relative greenhouse emissions from production & transport (Lower impact = higher score). |

*A higher cumulative Eco Score reflects a more eco-friendly product with lower lifecycle emissions.*

---

## 🎨 Expected Scanner Flow

```mermaid
graph TD
    A[Start Scanner Page] --> B{Select Scan Method}
    B -->|Camera Scan| C[Request Camera Permission]
    B -->|Upload Image| D[Upload Product Image File]
    B -->|Barcode Scan| E[Scan UPC/EAN Barcode]
    
    C -->|Granted| F[Live Camera Stream]
    F -->|Capture Image| G[Gemini Vision AI Analysis]
    D --> G
    
    E -->|OpenFoodFacts Lookup| H{Product Found?}
    H -->|Yes| I[Extract Product & Materials]
    H -->|No| G
    
    I --> J[Run Scoring Engine]
    G --> J
    
    J --> K[Display Results & Recommendations Dashboard]
```

---

## 🌍 Real-World Impact

EcoNova GreenLens empowers consumers directly at the point of purchase. By providing immediate visual feedback on the environmental cost of everyday items and offering practical, highly rated green alternatives, the platform bridges the gap between environmental awareness and positive behavioral change—paving the way for a cleaner, more circular economy.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
