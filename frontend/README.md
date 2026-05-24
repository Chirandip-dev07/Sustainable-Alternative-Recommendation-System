# EcoNova GreenLens
“Scan Smarter. Choose Greener.”

EcoNova GreenLens is an AI-powered sustainability scanner and eco-friendly recommendation platform. It helps users detect products via image or camera scanning and recommends greener alternatives using a proprietary sustainability scoring algorithm.

## Features
- **Real-Time AI Scanning:** Upload or capture an image of a product to instantly detect its material type and category using Google Gemini Vision.
- **Sustainability Scoring:** Our custom S = R + B + C engine calculates an Eco Score (0-30) based on Reusability (R), Biodegradability (B), and Carbon Impact (C).
- **Intelligent Recommendations:** Discover eco-friendly alternatives ranked by Eco Priority, Budget Priority, or a Balanced approach.
- **Comprehensive Dashboards:** Track personal environmental impact, save favorite green alternatives, and visualize sustainability metrics.

---

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- ShadCN UI
- Framer Motion

### Backend & Database
- Next.js API Routes / Server Actions
- Prisma ORM
- PostgreSQL
- NextAuth.js (v5) for secure authentication with JWT

### AI / ML Integrations
- Google Gemini API (`gemini-1.5-pro`) for advanced image recognition and sustainable data parsing.

---

## Getting Started

### Prerequisites
- Node.js v20+
- PostgreSQL (Local or Neon/Supabase)
- Google Gemini API Key
- Cloudinary Account (Optional, for persistent image hosting)

### Installation

1. **Clone & Install Dependencies**
```bash
git clone <repository_url>
cd econova-greenlens
npm install
```

2. **Environment Variables**
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/econova?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-jwt-key"
GEMINI_API_KEY="your-google-gemini-api-key"
```

3. **Database Setup**
```bash
npx prisma generate
npx prisma db push
```

4. **Run the Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## System Architecture

The EcoNova GreenLens application uses a monolithic serverless architecture powered by Next.js 15:
1. **Client Layer:** Next.js Server Components and Client Components seamlessly blending for fast hydration. Tailwind and ShadCN build the UI.
2. **API Layer:** Edge-ready API routes in `src/app/api` manage authentication (`next-auth`) and proxy calls to Google's Gemini Vision AI to hide API keys from the client.
3. **Data Layer:** Prisma interacts with PostgreSQL. All models (Users, Scans, Products, Categories, SavedAlternatives) are strictly typed and relational.

## Scalability Strategy
1. **Edge Deployment:** Vercel for frontend and serverless API execution allows instant scaling across global CDNs.
2. **Database:** PostgreSQL can be scaled using read replicas (e.g., Neon or AWS RDS) as scan volumes grow.
3. **Caching:** Implement Redis (Upstash) to cache frequent AI classifications (e.g., if multiple users scan identical barcodes or distinct generic products like "Plastic Water Bottle").

## AI Workflow
1. User uploads/captures a product image.
2. The UI sends a Base64 encoded image to `/api/scan`.
3. The API invokes Gemini 1.5 Pro Vision with a strict prompt structure to return a JSON object containing the product name, materials, and eco-metrics.
4. The system calculates the sustainability score, saves the scan in PostgreSQL, and generates dynamic recommendations.

## Sustainability Scoring Logic
The engine calculates an Eco Score (Max: 30) using the formula:
**S = R + B + C**

- **R (Reusability):** 0-10. High score indicates a long lifecycle (e.g., Stainless Steel = 10, Single-use Plastic = 1).
- **B (Biodegradability):** 0-10. High score indicates natural decomposition (e.g., Bamboo = 9, Styrofoam = 0).
- **C (Carbon Impact):** 0-10. High score indicates lower carbon footprint in manufacturing and transport. 
*Note: The algorithm is designed so a higher total score always equals a more sustainable product.*

## Monetization Opportunities
1. **B2B API Licensing:** Sell access to our trained sustainability API engine to e-commerce platforms (Shopify plugins) to display eco-scores at checkout.
2. **Affiliate Links:** Partner with sustainable brands to earn a commission when users purchase recommended alternatives.
3. **Premium Subscriptions (Pro Tier):** Advanced analytics, corporate carbon footprint tracking, and bulk-scanning capabilities for enterprises.

## Real-World Impact
EcoNova GreenLens empowers consumers at the point of decision. By providing immediate visual feedback on the environmental cost of everyday items and seamlessly offering practical alternatives, the platform bridges the gap between eco-awareness and actionable behavioral change, accelerating the shift towards a circular economy.
