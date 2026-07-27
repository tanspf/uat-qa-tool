export type EvidenceType = 'screenshot' | 'video' | 'log' | 'api_response';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

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
  needs_clarification?: boolean;
  clarification_reason?: string | null;
  created_at: string;

  // Joined / latest test result
  latest_result?: TestResult | null;
}

export interface TestResult {
  id: string;
  test_case_id: string;
  tester_id?: string;
  tester_name?: string;
  actual_result: string;
  evidence_urls: string[];
  evidence_type_submitted: EvidenceType[];
  verdict: Verdict;
  verdict_reason: string;
  evidence_validity_score: number;

  // Human Override Fields (PIC / QA Lead Override)
  human_override_verdict?: Verdict | null;
  human_override_reason?: string | null;
  reviewed_by?: string | null;

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

// File Upload Constraints
export const FILE_CONSTRAINTS = {
  MAX_PRD_SIZE_MB: 20,
  MAX_EVIDENCE_SIZE_MB: 15,
  MAX_EVIDENCE_FILES_COUNT: 5,
  ALLOWED_PRD_EXTENSIONS: ['.pdf', '.txt'],
  ALLOWED_PRD_MIME_TYPES: ['application/pdf', 'text/plain'],
  ALLOWED_EVIDENCE_EXTENSIONS: [
    '.png', '.jpg', '.jpeg', '.webp', '.gif',
    '.mp4', '.webm', '.mov',
    '.txt', '.log', '.json', '.xml'
  ],
  ALLOWED_EVIDENCE_MIME_TYPES: [
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'text/plain', 'text/x-log', 'application/json', 'application/xml', 'text/xml'
  ]
};
