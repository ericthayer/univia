import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Service to handle Google Gemini API interactions.
 * Centralizes API logic for frontend usage.
 */
export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  private constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (this.apiKey && this.apiKey !== "your_gemini_api_key_here") {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Check if the API is configured and ready to use.
   */
  public isReady(): boolean {
    return !!this.genAI;
  }

  /**
   * Return the Generative AI client instance.
   */
  public getClient(): GoogleGenerativeAI {
    if (!this.genAI) {
      throw new Error("Gemini API Key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    return this.genAI;
  }

  /**
   * Helper to convert File to Gemini's inlineData format.
   */
  public static async fileToGenerativePart(file: File): Promise<{
    inlineData: { data: string; mimeType: string };
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const geminiService = GeminiService.getInstance();
