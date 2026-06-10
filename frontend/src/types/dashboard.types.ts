export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  topics: string[];
  totalQuestions: number;
}

export interface UserStats {
  totalInterviews: number;
  averageScore: number;
  streak: number;
  bestCategory: string;
  recentSessions: RecentSession[];
}

export interface RecentSession {
  _id: string;
  title: string;
  category: string;
  score: number;
  date: string;
  status: 'completed' | 'abandoned';
}