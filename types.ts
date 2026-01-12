
export enum AppStep {
  UPLOAD = 'UPLOAD',
  CONFIG = 'CONFIG',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS',
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
  VERY_HARD = 'Very Hard',
}

export enum QuestionType {
  MCQ = 'Multiple Choice',
  TRUE_FALSE = 'True/False',
  SHORT_ANSWER = 'Short Answer',
  FILL_IN_BLANK = 'Fill in Blanks',
}

export interface QuizQuestion {
  id: number;
  question: string;
  options?: string[]; // Only for MCQ
  correctAnswer: string;
  explanation: string;
  type: 'mcq' | 'true_false' | 'short' | 'fill_in';
}

export interface QuizData {
  title: string;
  summary: string;
  questions: QuizQuestion[];
}

export interface QuizConfig {
  difficulty: Difficulty;
  questionCount: number;
  questionType: QuestionType;
  enableTimer: boolean;
  secondsPerQuestion: number;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  avatar: string;
  isUser?: boolean;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}
