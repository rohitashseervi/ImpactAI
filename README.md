# ImpactAI: Smart Resource Allocation System

**Solving Scattered Community Needs with AI-Driven Intelligence**

ImpactAI is an offline-first, data-driven platform designed for NGOs and local social groups to transform scattered field reports into a real-time Command Center. It prioritizes critical human needs (Medical, Water, Food) and matches them with the nearest qualified volunteers.

## 🚀 The "Smart Loop" Architecture
Our solution follows a 5-step lifecycle optimized for rural and disaster-hit areas:

1.  **Check (Identity)**: Rapid 0.01s offline Aadhaar verification to prevent duplicate resource waste.
2.  **Collect (Intake)**: Hybrid data entry via manual forms or **Smart OCR Scanning** of paper surveys.
3.  **Share (P2P Sync)**: Simulated Bluetooth "whispering" allows volunteers to share "Done" lists without internet.
4.  **Score (Intelligence)**: Google Gemini AI analyzes needs and assigns a **1-10 Urgency Score** based on weighted priorities.
5.  **Solve (Allocation)**: Automated AI matching pairs critical tasks with the closest skilled volunteers.

## 🛠️ Tech Stack
*   **Frontend**: React (Vite) + TypeScript
*   **Design**: Bento Grid UI (Tailwind CSS + Framer Motion)
*   **AI Engine**: Google Gemini API (Vision for OCR & NLP for Urgency Scoring)
*   **Offline Engine**: Simulated LocalStorage-based NoSQL database for zero-latency field work.
*   **Sync Logic**: Store-now-sync-later architecture with global deduplication.

## 📦 Key Features
*   **Offline Gatekeeper**: Phone-style dialer for rapid identity verification.
*   **Smart Scanner**: AI-powered handwriting recognition for paper-to-digital transition.
*   **Command Center**: Real-time dashboard with Urgency Heatmaps and Crisis Indexing.
*   **Volunteer Matcher**: Proximity and skill-based task assignment.

## 🔧 Setup Instructions
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file and add your `GEMINI_API_KEY`.
4. Run `npm run dev` to start the local environment.

---
*Built for the Smart Resource Allocation Challenge.*
