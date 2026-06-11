import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer {
  questionId: string;
  text: string;
  savedAt: Date;
  timeSpent: number; // seconds
}

export interface ISessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  interviewId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  currentQuestionIndex: number;
  startTime: Date;
  endTime?: Date;
  totalTime?: number; // seconds
  status: 'in-progress' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: { type: String, required: true },
    text:       { type: String, default: ''    },
    savedAt:    { type: Date,   default: Date.now },
    timeSpent:  { type: Number, default: 0     },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISessionDocument>(
  {
    userId:               { type: Schema.Types.ObjectId, ref: 'User',      required: true, index: true },
    interviewId:          { type: Schema.Types.ObjectId, ref: 'Interview', required: true              },
    answers:              [AnswerSchema],
    currentQuestionIndex: { type: Number, default: 0  },
    startTime:            { type: Date,   default: Date.now },
    endTime:              { type: Date                  },
    totalTime:            { type: Number                },
    status:               { type: String, enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress' },
  },
  { timestamps: true }
);

export default mongoose.model<ISessionDocument>('Session', SessionSchema);