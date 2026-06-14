export interface ResumeAnalysis {
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

export interface Resume {
  _id:        string;
  userId:     string;
  fileName:   string;
  fileSize:   number;
  analysis:   ResumeAnalysis;
  analyzedAt: string;
  createdAt:  string;
}