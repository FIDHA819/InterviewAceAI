export interface OverviewStats {
  totalSessions:    number;
  totalTimeSpent:   number;
  avgTime:          number;
  avgOverall:       number;
  avgTechnical:     number;
  avgCommunication: number;
  avgConfidence:    number;
  bestScore:        number;
  streak:           number;
  bestCategory:     string;
  weakAreas:        string[];
}

export interface CategoryStat {
  category:     string;
  avgScore:     number;
  avgTechnical: number;
  count:        number;
  bestScore:    number;
}

export interface TrendPoint {
  session:       string;
  overall:       number;
  technical:     number;
  communication: number;
  confidence:    number;
  category:      string;
  date:          string;
}

export interface HistoryRow {
  _id:           string;
  overall:       number;
  technical:     number;
  communication: number;
  confidence:    number;
  title:         string;
  category:      string;
  difficulty:    string;
  questionCount: number;
  totalTime?:    number;
  createdAt:     string;
}

export interface AnalyticsData {
  overview:      OverviewStats;
  categoryStats: CategoryStat[];
  scoreTrend:    TrendPoint[];
}