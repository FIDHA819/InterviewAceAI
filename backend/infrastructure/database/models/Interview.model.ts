import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  id: string;
  text: string;
  expectedKeyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
  category: string;
}

export interface IInterviewDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: IQuestion[];
  questionCount: number;
  status: 'draft' | 'active' | 'completed';
  estimatedDuration: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id:                { type: String, required: true },
  text:              { type: String, required: true },
  expectedKeyPoints: [{ type: String }],
  difficulty:        { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  timeLimit:         { type: Number, default: 180 },
  category:          { type: String, required: true },
}, { _id: false });

const InterviewSchema = new Schema<IInterviewDocument>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:             { type: String, required: true },
    category:          { type: String, required: true },
    difficulty:        { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    questions:         [QuestionSchema],
    questionCount:     { type: Number, required: true },
    status:            { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
    estimatedDuration: { type: Number, default: 30 },
  },
  { timestamps: true }
);

export default mongoose.model<IInterviewDocument>('Interview', InterviewSchema);