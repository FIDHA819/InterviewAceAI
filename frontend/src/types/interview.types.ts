export interface Question {
  id: string;
  text: string;
  expectedKeyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  category: string;
}

export interface Interview {
  _id: string;
  userId: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  questionCount: number;
  status: 'draft' | 'active' | 'completed';
  estimatedDuration: number;
  createdAt: string;
}

export interface CreateInterviewPayload {
  category: string;
  difficulty: string;
  count: number;
}