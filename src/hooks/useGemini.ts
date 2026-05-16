import { useState, useCallback } from 'react';
import { geminiService } from '../services/gemini.service';

type GeminiInlineDataPart = { inlineData: { data: string; mimeType: string } };
type GeminiTextPart = { text: string };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

interface GeminiGenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  thinkingConfig?: { thinkingBudget: number };
}

interface UseGeminiOptions {
  modelName?: string;
  useThinking?: boolean;
  thinkingBudget?: number;
  onError?: (error: Error) => void;
}

/**
 * Hook for using Google Gemini in components.
 * Supports text, images, and streaming responses according to Univia's strict standards.
 */
export const useGemini = ({
  modelName = "gemini-1.5-pro", // Univia's default stable pro model
  useThinking = false,
  thinkingBudget = 16384,
  onError,
}: UseGeminiOptions = {}) => {
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (prompt: string, files?: File[]) => {
    setIsLoading(true);
    setIsStreaming(false);
    setError(null);
    setResponse('');

    try {
      const client = geminiService.getClient();
      
      const generationConfig: GeminiGenerationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      };

      // Support for Gemini 3 reasoning features if enabled
      if (useThinking) {
        generationConfig.thinkingConfig = { thinkingBudget };
        generationConfig.maxOutputTokens = thinkingBudget + 4096;
      }

      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig,
      });

      // Prepare parts for multimodal support
      let parts: GeminiPart[] = [{ text: prompt }];
      
      if (files && files.length > 0) {
        const fileParts = await Promise.all(
          files.map(file => GeminiService_Helper_fileToGenerativePart(file))
        );
        parts = [...fileParts, ...parts];
      }

      const result = await model.generateContentStream(parts);
      
      setIsLoading(false);
      setIsStreaming(true);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setResponse(prev => prev + chunkText);
      }

      setIsStreaming(false);
      return fullText;

    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setIsLoading(false);
      setIsStreaming(false);
      if (onError) onError(errorObj);
      console.error("Gemini API Error:", errorObj);
      throw errorObj;
    }
  }, [modelName, useThinking, thinkingBudget, onError]);

  return {
    generate,
    response,
    isLoading,
    isStreaming,
    error,
    attribution: "Powered by Google Gemini",
    isReady: geminiService.isReady(),
  };
};

/**
 * Internal helper to avoid exposing too many static methods if not needed.
 */
async function GeminiService_Helper_fileToGenerativePart(file: File): Promise<GeminiInlineDataPart> {
  return new Promise<GeminiInlineDataPart>((resolve, reject) => {
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
