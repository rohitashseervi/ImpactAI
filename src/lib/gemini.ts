import { GoogleGenAI, Type } from "@google/genai";
import { Volunteer } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.0-flash";

// ==================== URGENCY SCORING ====================

export interface UrgencyResult {
  score: number;
  category: string;
  reason: string;
}

export async function calculateUrgencyScore(
  description: string,
  communityContext?: string
): Promise<UrgencyResult> {
  try {
    const contextPrompt = communityContext
      ? `\n\nCOMMUNITY CONTEXT (existing reports for this area):\n${communityContext}\nConsider cumulative needs when scoring.`
      : '';

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are an AI urgency analyst for an NGO resource allocation platform. Analyze the following description and provide an urgency score from 1 to 10.

      CRITICAL WEIGHTS:
      - Medical Emergency / Bleeding / Life-threatening: 9-10
      - No Water / Critical Water Shortage: 8-9
      - No Food / Starvation: 7-8
      - No Shelter / Exposure: 6-7
      - Sanitation / Disease Risk: 5-6
      - Education / Books: 2-3
      - Training / General: 1-2

      If multiple needs overlap, weight toward the most critical one.
      ${contextPrompt}

      Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Urgency score from 1-10" },
            category: { type: Type.STRING, description: "Primary category: Medical, Water, Food, Shelter, Sanitation, Education" },
            reason: { type: Type.STRING, description: "Brief reason for the score in 1-2 sentences" }
          },
          required: ["score", "category", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      score: Math.min(10, Math.max(1, result.score || 1)),
      category: result.category || "General",
      reason: result.reason || "No reason provided"
    };
  } catch (error) {
    console.error("Error calculating urgency:", error);
    const keywords: Record<string, { score: number; cat: string }> = {
      "bleeding": { score: 10, cat: "Medical" },
      "emergency": { score: 9, cat: "Medical" },
      "medical": { score: 9, cat: "Medical" },
      "water": { score: 8, cat: "Water" },
      "food": { score: 7, cat: "Food" },
      "shelter": { score: 6, cat: "Shelter" },
      "sanitation": { score: 5, cat: "Sanitation" },
      "education": { score: 3, cat: "Education" },
    };
    let score = 1;
    let category = "General";
    for (const [kw, data] of Object.entries(keywords)) {
      if (description.toLowerCase().includes(kw) && data.score > score) {
        score = data.score;
        category = data.cat;
      }
    }
    return { score, category, reason: "Keyword-based fallback analysis" };
  }
}

// ==================== OCR - FIELD REPORT EXTRACTION ====================

export interface ExtractedReportData {
  communityName?: string;
  location?: string;
  needCategory?: string;
  description?: string;
  peopleAffected?: string;
  currentResources?: string;
  fieldWorkerName?: string;
  dateOfSurvey?: string;
}

export async function extractFieldReportFromImage(base64Image: string): Promise<ExtractedReportData> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `You are an OCR assistant for an NGO field survey platform. Extract the following information from this paper survey image. This could be handwritten or printed. If a field is not clearly visible, leave it as an empty string.

            Fields to extract:
            - Community Name (village, area, or locality name)
            - Location (district, state, or address)
            - Need Category (one of: Medical, Water, Food, Shelter, Sanitation, Education)
            - Description (description of the problem/need)
            - People Affected (approximate number)
            - Current Resources (what help is already available)
            - Field Worker Name (who filled the survey)
            - Date of Survey`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            communityName: { type: Type.STRING },
            location: { type: Type.STRING },
            needCategory: { type: Type.STRING },
            description: { type: Type.STRING },
            peopleAffected: { type: Type.STRING },
            currentResources: { type: Type.STRING },
            fieldWorkerName: { type: Type.STRING },
            dateOfSurvey: { type: Type.STRING },
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error extracting data from image:", error);
    return {};
  }
}

// ==================== VOLUNTEER MATCHING ====================

export interface VolunteerMatchResult {
  volunteerId: string;
  volunteerName: string;
  skill: string;
  matchScore: number;
  matchReason: string;
}

export async function matchVolunteer(
  task: { category: string; description: string; location?: { lat: number; lng: number } },
  volunteers: Volunteer[]
): Promise<VolunteerMatchResult> {
  if (volunteers.length === 0) {
    return {
      volunteerId: '',
      volunteerName: 'No volunteers available',
      skill: 'N/A',
      matchScore: 0,
      matchReason: 'No active volunteers found in the system',
    };
  }

  try {
    // Send top 5 volunteers max to keep prompt concise
    const top5 = volunteers.slice(0, 5);
    const volunteerSummary = top5.map((v, i) =>
      `${i + 1}. ID:${v.volunteerId} Name:${v.name} Skills:${v.skills.join(',')} Location:${v.locationText} Availability:${v.availability} Experience:${v.experienceLevel}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Match the best volunteer for this task.

TASK: ${task.category} - ${task.description}

VOLUNTEERS:
${volunteerSummary}

Pick the best match by skill relevance and availability. Return the volunteer's exact ID and name.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            volunteerId: { type: Type.STRING, description: "The ID of the best matching volunteer" },
            volunteerName: { type: Type.STRING, description: "Name of the matched volunteer" },
            skill: { type: Type.STRING, description: "The primary relevant skill" },
            matchScore: { type: Type.NUMBER, description: "Match quality score 1-100" },
            matchReason: { type: Type.STRING, description: "Why this volunteer is the best match (2-3 sentences)" },
          },
          required: ["volunteerId", "volunteerName", "skill", "matchScore", "matchReason"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    // Validate the returned volunteerId exists
    const validVolunteer = volunteers.find(v => v.volunteerId === result.volunteerId);
    if (validVolunteer) {
      return result;
    }
    // If AI returned invalid ID, use name to find
    const byName = volunteers.find(v => v.name === result.volunteerName);
    if (byName) {
      return { ...result, volunteerId: byName.volunteerId };
    }
    // Fallback to first volunteer
    return {
      volunteerId: volunteers[0].volunteerId,
      volunteerName: volunteers[0].name,
      skill: volunteers[0].skills[0] || 'General',
      matchScore: 50,
      matchReason: 'Auto-assigned to nearest available volunteer',
    };
  } catch (error: any) {
    console.error("Error matching volunteer:", error?.message || error);
    // Intelligent fallback: pick volunteer with most relevant skill
    const skillMap: Record<string, string[]> = {
      'Medical': ['Doctor', 'Nurse', 'Paramedic'],
      'Water': ['Plumber', 'Engineer'],
      'Food': ['Cook', 'Supply Chain', 'Driver'],
      'Shelter': ['Construction', 'Engineer'],
      'Sanitation': ['Sanitation Worker', 'Social Worker'],
      'Education': ['Teacher', 'Translator'],
    };
    const relevant = skillMap[task.category] || [];
    const bestMatch = volunteers.find(v => v.skills.some(s => relevant.includes(s))) || volunteers[0];
    const matchedSkill = bestMatch.skills.find(s => relevant.includes(s)) || bestMatch.skills[0] || 'General';
    return {
      volunteerId: bestMatch.volunteerId,
      volunteerName: bestMatch.name,
      skill: matchedSkill,
      matchScore: 60,
      matchReason: `Matched by skill relevance: ${matchedSkill} is suitable for ${task.category} needs. (Auto-matched)`,
    };
  }
}

// ==================== COMMUNITY INSIGHTS ====================

export async function generateCommunityInsights(
  communityName: string,
  reports: { category: string; description: string; urgencyScore: number; peopleAffected: number }[]
): Promise<string> {
  if (reports.length === 0) return 'No reports available for this community yet.';

  try {
    const reportSummary = reports.map((r, i) =>
      `Report ${i + 1}: Category=${r.category}, Urgency=${r.urgencyScore}/10, People Affected=${r.peopleAffected}, Description="${r.description}"`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are an analyst for an NGO platform. Given the following field reports for community "${communityName}", provide a concise summary (3-4 sentences) highlighting:
      1. The most critical needs
      2. Total estimated people affected
      3. Top 3 priority actions recommended

      REPORTS:
      ${reportSummary}`,
    });

    return response.text || 'Unable to generate insights.';
  } catch (error) {
    console.error("Error generating insights:", error);
    return 'AI insights temporarily unavailable. Please review reports manually.';
  }
}
