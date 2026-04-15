import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface UrgencyResult {
  score: number;
  category: string;
  reason: string;
}

export interface VolunteerMatch {
  volunteerName: string;
  skill: string;
  distance: string;
  matchReason: string;
}

export async function calculateUrgencyScore(description: string): Promise<UrgencyResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following description of a need for an NGO and provide an urgency score from 1 to 10.
      
      CRITICAL WEIGHTS:
      - Medical Emergency / Bleeding / Life-threatening: 10
      - No Water / Critical Water Shortage: 9
      - No Food / Starvation: 8
      - No Shelter / Exposure: 7
      - Sanitation / Disease Risk: 6
      - Education / Books: 3
      - Training / General: 2

      Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Urgency score from 1-10 based on weights" },
            category: { type: Type.STRING, description: "Category: Medical, Water, Food, Shelter, Sanitation, Education, Training" },
            reason: { type: Type.STRING, description: "Brief reason for the score" }
          },
          required: ["score", "category", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      score: result.score || 1,
      category: result.category || "General",
      reason: result.reason || "No reason provided"
    };
  } catch (error) {
    console.error("Error calculating urgency:", error);
    // Fallback keyword analysis with specific weights
    const keywords: Record<string, { score: number, cat: string }> = {
      "bleeding": { score: 10, cat: "Medical" },
      "medical": { score: 9, cat: "Medical" },
      "water": { score: 9, cat: "Water" },
      "food": { score: 8, cat: "Food" },
      "shelter": { score: 7, cat: "Shelter" },
      "books": { score: 3, cat: "Education" },
      "training": { score: 2, cat: "Training" }
    };
    let score = 1;
    let category = "General";
    for (const [kw, data] of Object.entries(keywords)) {
      if (description.toLowerCase().includes(kw)) {
        if (data.score > score) {
          score = data.score;
          category = data.cat;
        }
      }
    }
    return { score, category, reason: "Keyword-based fallback analysis" };
  }
}

export async function extractDataFromImage(base64Image: string): Promise<{
  name?: string;
  aadhaar?: string;
  category?: string;
  description?: string;
}> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Extract the following information from this paper survey image. 
            If a field is not found, leave it blank.
            Fields: Name, 12-digit Aadhaar Number, Category of Need (Medical, Water, Food, Shelter, Sanitation, Education, Training), and a brief Description of the need.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            aadhaar: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    return JSON.parse(text || "{}");
  } catch (error) {
    console.error("Error extracting data from image:", error);
    return {};
  }
}

export async function matchVolunteer(task: { category: string, description: string }): Promise<VolunteerMatch> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find a suitable volunteer match for the following task:
      Category: ${task.category}
      Description: ${task.description}
      
      Simulate a realistic volunteer profile.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            volunteerName: { type: Type.STRING },
            skill: { type: Type.STRING },
            distance: { type: Type.STRING, description: "e.g., 2.5 km" },
            matchReason: { type: Type.STRING }
          },
          required: ["volunteerName", "skill", "distance", "matchReason"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error matching volunteer:", error);
    return {
      volunteerName: "John Doe (Fallback)",
      skill: "General Support",
      distance: "5.0 km",
      matchReason: "Available in the vicinity"
    };
  }
}
