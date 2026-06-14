import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeAnalysis {
  atsScore:      number;
  skills:        string[];
  missingSkills: string[];
  experience:    string;
  education:     string;
  suggestions:   string[];
  jobTitles:     string[];
  keywords:      string[];
  formatScore:   number;
  contentScore:  number;
}

export interface IResumeDocument extends Document {
  userId:      mongoose.Types.ObjectId;
  fileName:    string;
  fileSize:    number;
  parsedText:  string;
  analysis:    IResumeAnalysis;
  analyzedAt:  Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    atsScore:      { type: Number, default: 0    },
    skills:        [{ type: String }],
    missingSkills: [{ type: String }],
    experience:    { type: String, default: ''   },
    education:     { type: String, default: ''   },
    suggestions:   [{ type: String }],
    jobTitles:     [{ type: String }],
    keywords:      [{ type: String }],
    formatScore:   { type: Number, default: 0    },
    contentScore:  { type: Number, default: 0    },
  },
  { _id: false }
);

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName:   { type: String, required: true },
    fileSize:   { type: Number, default: 0    },
    parsedText: { type: String, default: ''   },
    analysis:   { type: ResumeAnalysisSchema, default: () => ({}) },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IResumeDocument>('Resume', ResumeSchema);