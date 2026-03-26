// ── MySQL row ─────────────────────────────────────────────────────────────────
export interface IChatLog {
  id:              number;
  tceb_user_id:    number | null;
  conversation_id: string;
  query:           string;
  answer_text:     string | null;
  answer_html:     string | null;
  created_at:      string | null;
  updated_at:      string | null;
}

export interface ISession {
  conversation_id:  string;
  tceb_user_id:     number | null;
  message_count:    number;
  first_message_at: string | null;
  last_message_at:  string | null;
  preview:          string;
}

export interface ISessionMeta {
  _id?:            string;
  conversation_id: string;
  sentiment?:      'positive' | 'neutral' | 'negative';
  sentimentScore?: number;
  topic?:          string;
  tags:            string[];
  summary?:        string;
  is_answered?:    boolean;
  is_flagged?:     boolean;
  flag_reason?:    string;
  admin_notes:     IAdminNote[];
  analyzed_at?:    string;
  createdAt?:      string;
  updatedAt?:      string;
}

export interface IAdminNote {
  _id?:        string;
  authorEmail: string;
  text:        string;
  createdAt?:  string;
}

export type ISessionFull = ISession & { meta?: ISessionMeta };

export interface PaginatedResponse<T> {
  data: T[]; total: number; page: number; pageSize: number; totalPages: number;
}

export interface DashboardStats {
  totalMessages:   number;
  totalSessions:   number;
  uniqueUsers:     number;
  todayMessages:   number;
  analyzedCount:   number;
  flaggedCount:    number;
  negativeCount:   number;
  messageTrend:    { date: string; count: number }[];
  sessionTrend:    { date: string; count: number }[];
  hourlyVolume:    { hour: number; count: number }[];
  topUsers:        { tceb_user_id: number; count: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  topTopics:       { topic: string; count: number }[];
}

export interface ChatFilters {
  search?: string; conversation_id?: string; tceb_user_id?: string;
  sentiment?: string; is_flagged?: string;
  dateFrom?: string; dateTo?: string; page?: number; pageSize?: number;
}
