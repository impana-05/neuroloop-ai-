export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  xp: number;
  level: number;
  stats: {
    totalQuizzes: number;
    correctAnswers: number;
    timeSpent: number; // in seconds
  };
  learningPersonality?: string;
  createdAt: number;
}

export interface Content {
  id: string;
  userId: string;
  title: string;
  rawText: string;
  concepts: Concept[];
  createdAt: number;
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Performance {
  userId: string;
  topicId: string;
  accuracy: number;
  attempts: number;
  weakScore: number;
  lastReviewed: number;
  nextReviewDate: number;
}

export interface Question {
  id: string;
  conceptId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAttempt {
  id: string;
  userId: string;
  contentId: string;
  questions: {
    questionId: string;
    correct: boolean;
    timeTaken: number;
  }[];
  score: number;
  timestamp: number;
}
