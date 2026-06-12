import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestionFeedback {
  questionId:  string;
  questionText: string;
  answerText:  string;
  score:       number;
  feedback:    string;
  keyPointsCovered: string[];
  keyPointsMissed:  string[];
}

export interface IFeedbackDocument extends Document {
  sessionId:   mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  userId:      mongoose.Types.ObjectId;
  scores: {
    technical:     number;
    communication: number;
    confidence:    number;
    overall:       number;
  };
  strengths:         string[];
  weaknesses:        string[];
  suggestions:       string[];
  summary:           string;
  questionFeedback:  IQuestionFeedback[];
  generatedAt:       Date;
  createdAt:         Date;
}

const QuestionFeedbackSchema = new Schema<IQuestionFeedback>(
  {
    questionId:       { type: String, required: true },
    questionText:     { type: String, required: true },
    answerText:       { type: String, default: ''    },
    score:            { type: Number, required: true  },
    feedback:         { type: String, required: true  },
    keyPointsCovered: [{ type: String }],
    keyPointsMissed:  [{ type: String }],
  },
  { _id: false }
);

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    sessionId:   { type: Schema.Types.ObjectId, ref: 'Session',   required: true, unique: true },
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview',  required: true },
    userId:      { type: Schema.Types.ObjectId, ref: 'User',       required: true, index: true },
    scores: {
      technical:     { type: Number, required: true },
      communication: { type: Number, required: true },
      confidence:    { type: Number, required: true },
      overall:       { type: Number, required: true },
    },
    strengths:        [{ type: String }],
    weaknesses:       [{ type: String }],
    suggestions:      [{ type: String }],
    summary:          { type: String, default: '' },
    questionFeedback: [QuestionFeedbackSchema],
    generatedAt:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IFeedbackDocument>('Feedback', FeedbackSchema);