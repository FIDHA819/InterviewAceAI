export interface QuestionFeedback {
  questionId:       string;
  questionText:     string;
  answerText:       string;
  score:            number;
  feedback:         string;
  keyPointsCovered: string[];
  keyPointsMissed:  string[];
}

export interface Feedback {
  _id:         string;
  sessionId:   string;
  interviewId: string;
  userId:      string;
  scores: {
    technical:     number;
    communication: number;
    confidence:    number;
    overall:       number;
  };
  summary:          string;
  strengths:        string[];
  weaknesses:       string[];
  suggestions:      string[];
  questionFeedback: QuestionFeedback[];
  generatedAt:      string;
}