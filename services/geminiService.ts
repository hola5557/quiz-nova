
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { QuizConfig, QuizData, QuestionType } from "../types";

const quizSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A fun, catchy title." },
    summary: { type: Type.STRING, description: "A very brief, energetic summary (max 2 sentences)." },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of 4 options if MCQ, or empty if not applicable." },
          correctAnswer: { type: Type.STRING, description: "The correct answer text." },
          explanation: { type: Type.STRING, description: "A short, fun explanation." },
          type: { type: Type.STRING, enum: ['mcq', 'true_false', 'short', 'fill_in'] }
        },
        required: ["id", "question", "correctAnswer", "explanation", "type"]
      }
    }
  },
  required: ["title", "summary", "questions"]
};

export const generateQuiz = async (
  text: string,
  file: { data: string; type: string } | null,
  config: QuizConfig
): Promise<QuizData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  let promptText = `
    Create a ${config.difficulty} difficulty quiz with ${config.questionCount} questions.
    Format: ${config.questionType}.
    Tone: Fun, Creative, Energetic.
    
    Requirements:
    1. Analyze content.
    2. Brief summary (max 2 sentences).
    3. Generate ${config.questionCount} questions.
    4. For 'Multiple Choice', provide 4 options. 
    5. For 'True/False', use options ["True", "False"].
    6. Keep explanations short and helpful.
    7. IMPORTANT: Do NOT refer to images, figures, tables, or diagrams in the questions (e.g. "as shown in the figure above") as the user cannot see them. Ensure all questions are text-based and self-contained.
  `;

  if (!text && !file) {
    throw new Error("No content provided");
  }

  const parts: any[] = [{ text: promptText }];

  if (text) {
    parts.push({ text: `\n\nCONTENT:\n${text}` });
  }

  if (file) {
    parts.push({
      inlineData: {
        mimeType: file.type,
        data: file.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for maximum speed
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from AI");

    return JSON.parse(responseText) as QuizData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};

export const generateExplainerVideo = async (customPrompt?: string): Promise<string> => {
  // Create a new instance to ensure we use the latest key if the user just selected one
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const model = "veo-3.1-fast-generate-preview";
  // Default conceptual prompt if none provided
  const prompt = customPrompt || "A cinematic 3D animation of a futuristic app interface. A glowing document uploads, processes with digital particles, and transforms into quiz questions and a winner's trophy. Neon cyan and fuchsia colors, high tech, smooth motion.";

  try {
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");
    
    // Important: Append API Key for playback as per SDK instructions
    return `${videoUri}&key=${process.env.API_KEY}`;

  } catch (error) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};
