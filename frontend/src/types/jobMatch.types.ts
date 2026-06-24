export interface AuditSection {
  section: string;
  reason:  string;
}

export interface Audit {
  matchScore:        number;
  missingKeywords:   string[];
  redFlags:          string[];
  strongSections:    AuditSection[];
  weakSections:      AuditSection[];
  genericIssues:     string[];
  comparisonInsight: string;
}

export interface Improvement {
  title:       string;
  explanation: string;
}

export interface Rewrite {
  rewrittenResume: string;
  improvements:    Improvement[];
}

export interface JobMatch {
  _id:              string;
  jobTitle:         string;
  companyName:      string;
  jobDescription:   string;
  jobUrl?:          string;
  audit:            Audit;
  rewrite?:         Rewrite;
  coverLetter?:     string;
  applicationEmail?: string;
  status:           'audit_done' | 'rewrite_done' | 'applied';
  createdAt:        string;
}