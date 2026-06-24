import mongoose, { Schema, Document } from 'mongoose';

export interface IAudit {
  matchScore:        number;
  missingKeywords:   string[];
  redFlags:          string[];
  strongSections:    { section: string; reason: string }[];
  weakSections:      { section: string; reason: string }[];
  genericIssues:     string[];
  comparisonInsight: string;
}

export interface IRewrite {
  rewrittenResume:  string;
  improvements:     { title: string; explanation: string }[];
}

export interface IJobMatchDocument extends Document {
  userId:          mongoose.Types.ObjectId;
  resumeId:        mongoose.Types.ObjectId;
  jobTitle:        string;
  companyName:     string;
  jobDescription:  string;
  jobUrl?:         string;
  audit:           IAudit;
  rewrite?:        IRewrite;
  coverLetter?:    string;
  applicationEmail?: string;
  status:          'audit_done' | 'rewrite_done' | 'applied';
  createdAt:       Date;
  updatedAt:       Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    matchScore:        { type: Number, default: 0 },
    missingKeywords:   [{ type: String }],
    redFlags:          [{ type: String }],
    strongSections:    [{ section: String, reason: String }],
    weakSections:      [{ section: String, reason: String }],
    genericIssues:     [{ type: String }],
    comparisonInsight: { type: String, default: '' },
  },
  { _id: false }
);

const ImprovementSchema = new Schema(
  { title: String, explanation: String },
  { _id: false }
);

const RewriteSchema = new Schema<IRewrite>(
  {
    rewrittenResume: { type: String, default: '' },
    improvements:    [ImprovementSchema],
  },
  { _id: false }
);

const JobMatchSchema = new Schema<IJobMatchDocument>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    resumeId:         { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobTitle:         { type: String, required: true },
    companyName:      { type: String, required: true },
    jobDescription:   { type: String, required: true },
    jobUrl:           { type: String, default: '' },
    audit:            { type: AuditSchema },
    rewrite:          { type: RewriteSchema },
    coverLetter:      { type: String, default: '' },
    applicationEmail: { type: String, default: '' },
    status:           {
      type: String,
      enum: ['audit_done', 'rewrite_done', 'applied'],
      default: 'audit_done',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IJobMatchDocument>('JobMatch', JobMatchSchema);