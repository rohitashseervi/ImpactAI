# ImpactAI: Smart Resource Allocation System

**Turning scattered NGO field data into a single, AI-prioritized Command Center.**

NGOs and social groups do critical ground work in underserved communities, but their data about needs (Medical, Water, Food, Shelter, Sanitation, Education) is scattered across paper surveys, WhatsApp messages, and spreadsheets. ImpactAI unifies this data, surfaces the most urgent problems with AI, and smart-matches volunteers to tasks based on skills, location, and availability.

**Live Demo:** https://smart-response-96dd5.web.app
**Demo Admin:** `admin@gmail.com` / `123456` (pre-filled on the login page — just click Sign In)

---

## The Smart Loop

1. **Collect** — NGOs submit field reports manually, or upload a photo of a paper survey and let Gemini OCR extract the data.
2. **Aggregate** — Reports are deduplicated by community (name + pin code), so multiple NGOs working the same area build a shared picture.
3. **Score** — Gemini assigns a 1–10 urgency score to each report using description, people affected, and community context.
4. **Visualize** — Admin Command Center shows stats, an urgency bar chart, and an interactive Google Map of community hotspots.
5. **Match** — Admin clicks "AI Match" on a task; Gemini picks the best volunteer from the real roster based on skills, location, and availability.
6. **Notify** — Volunteer gets a real-time notification and tracks task status from assigned → in-progress → completed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6 + TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion + Lucide Icons |
| Auth | Firebase Authentication (role-based: NGO / Volunteer / Admin) |
| Database | Firebase Firestore (core data) + Realtime Database (notifications) |
| AI | Google Gemini (urgency scoring, OCR, volunteer matching, community insights) |
| Maps | Google Maps JavaScript API |
| Charts | Recharts |
| Routing | React Router v7 (lazy-loaded, role-protected routes) |
| Hosting | Firebase Hosting |

---

## Key Features

- **NGO Portal** — Submit field reports manually or via Smart OCR paper-survey scanning.
- **Admin Command Center** — Aggregated stats, urgency chart, Google Maps hotspot view, and AI-assisted volunteer matching.
- **Volunteer Dashboard** — Assigned tasks, real-time notifications, status updates.
- **Gemini OCR** — Upload a photo of a paper survey; Gemini Vision extracts community name, category, description, people affected.
- **AI Urgency Scoring** — Each report gets a 1–10 urgency score with community context.
- **AI Volunteer Matching** — Gemini ranks real volunteers for a task; falls back to skill-based heuristics if the AI service is unavailable.
- **Dark / Light Mode** — Theme toggle persists in localStorage, available on both landing and dashboards.

---

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/rohitashseervi/ImpactAI.git
   cd ImpactAI/smart-response
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file at the project root with:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_REALTIME_DB_URL=...
   VITE_GOOGLE_MAPS_API_KEY=...
   ```
4. Start the dev server:
   ```
   npm run dev
   ```
5. (First-time only) Visit `/setup` to create an admin account and seed demo data (7 communities, 15 reports, 3 NGOs, 10 volunteers).

---

## Deployment

```
npm run build
firebase deploy --only hosting
```

---

*Built for the Google Solution Hackathon — Smart Resource Allocation Challenge.*
