-- UAT QA Tool Database Schema for Supabase / PostgreSQL

-- 1. Table for PRDs
create table if not exists prds (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  uploaded_by uuid,
  created_at timestamptz default now()
);

-- 2. Table for Test Cases
create table if not exists test_cases (
  id uuid primary key default gen_random_uuid(),
  prd_id uuid references prds(id) on delete cascade,
  test_case_no text not null,
  section text,
  precondition text,
  steps text not null,
  expected_result text not null,
  required_evidence_type text[] not null,
  evidence_note_for_tester text not null,
  priority text check (priority in ('critical','high','medium','low')),
  needs_clarification boolean default false,
  clarification_reason text,
  created_at timestamptz default now()
);

-- 3. Table for Test Results
create table if not exists test_results (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid references test_cases(id) on delete cascade,
  tester_id uuid,
  actual_result text,
  evidence_urls text[],
  evidence_type_submitted text[],
  verdict text check (verdict in ('pass','fail','blocked','pending_review')),
  verdict_reason text,
  evidence_validity_score numeric,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexing for fast dashboard & list queries
create index if not exists idx_test_cases_prd_id on test_cases(prd_id);
create index if not exists idx_test_results_test_case_id on test_results(test_case_id);
