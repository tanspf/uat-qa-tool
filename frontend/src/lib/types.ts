export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type EvidenceType = 'screenshot' | 'screen_recording' | 'api_response' | 'log';
export type Verdict = 'pass' | 'fail' | 'blocked' | 'pending_review';

export interface PRD {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_by?: string;
  created_at: string;
}

export interface TestCase {
  id: string;
  prd_id: string;
  test_case_no: string;
  section: string;
  precondition: string;
  steps: string;
  expected_result: string;
  required_evidence_type: EvidenceType[];
  evidence_note_for_tester: string;
  priority: Priority;
  needs_clarification: boolean;
  clarification_reason?: string | null;
  created_at: string;
  // Computed / joined fields
  latest_result?: TestResult | null;
}

export interface TestResult {
  id: string;
  test_case_id: string;
  tester_id?: string;
  actual_result: string;
  evidence_urls: string[];
  evidence_type_submitted: EvidenceType[];
  verdict: Verdict;
  verdict_reason: string;
  evidence_validity_score: number;
  reviewed_at?: string;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  pending_review: number;
  untested: number;
  pass_rate: number;
  priority_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
