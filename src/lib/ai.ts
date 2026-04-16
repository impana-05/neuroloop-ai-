import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const aiService = {
  async generateConcepts(content: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the core educational concepts from the following content. For each concept, provide a title, a brief description, and an initial difficulty level (easy, medium, hard). Return as JSON.
      
      Content: ${content.substring(0, 10000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
            },
            required: ["title", "description", "difficulty"]
          }
        }
      }
    });
    if (!response?.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  },

  async generateQuestions(concepts: any[], difficulty: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 5 multiple-choice questions based on these concepts at a ${difficulty} difficulty level. 
      
      Style Guidelines:
      - Tone: Friendly, gamified, and encouraging (e.g., "Let's see if you can spot...", "Can you guess which one...").
      - Difficulty Level: ${difficulty}. Adjust the complexity of the questions and options to match this level.
      - Options: Clear and distinct, but appropriately challenging for the ${difficulty} level.
      - Hint: Provide a short, helpful hint for each question that guides the user without giving away the answer.
      - Goal: "Learn while playing" feel.
      
      Concepts: ${JSON.stringify(concepts)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              conceptId: { type: Type.STRING },
              text: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              hint: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ["conceptId", "text", "options", "correctAnswer", "explanation", "hint", "difficulty"]
          }
        }
      }
    });
    if (!response?.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  },

  async summarizeContent(content: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a concise summary of the following content, highlighting key takeaways.
      
      Content: ${content.substring(0, 5000)}`
    });
    return response?.text || "No summary available";
  },

  async evaluateTeachBack(userAnswer: string, concept: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user is trying to explain the concept of "${concept}" in their own words. Evaluate their understanding. Provide feedback on what they got right, what they missed, and a score from 0-100. Return as JSON.
      
      User Answer: ${userAnswer}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            missedPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["score", "feedback", "missedPoints"]
        }
      }
    });
    if (!response?.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  },

  async askGemini(question: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AI assistant for NeuroLoop AI, an adaptive learning platform. 
      The user is asking about the website. Provide a detailed explanation of what NeuroLoop AI is and how it works.
      
      Key Features of NeuroLoop AI:
      1. Neural Mapping: Users upload PDFs, and the AI extracts core educational concepts (Neural Nodes).
      2. Adaptive Learning Loops: The system generates personalized MCQs based on the extracted concepts.
      3. Teach-Back Method: Users explain concepts in their own words, and the AI evaluates their understanding with a score and feedback.
      4. Spaced Repetition: The system tracks mastery and schedules reviews to optimize long-term retention.
      5. Cognitive Analytics: Visualizes XP, accuracy, and mastery trends.
      
      User Question: ${question}`,
      config: {
        systemInstruction: "You are a helpful and knowledgeable AI assistant for NeuroLoop AI. Be concise but thorough."
      }
    });
    return response?.text || "I'm sorry, I couldn't generate a response at this time.";
  }
};
