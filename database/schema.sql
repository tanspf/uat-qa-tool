-- UAT QA Tool Database Schema for Supabase / PostgreSQL

-- 0. Table for Users (Authentication & RBAC)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text check (role in ('pm', 'tester')) not null default 'tester',
  created_at timestamptz default now()
);

-- Seed default foody.vn admin users
insert into users (email, password_hash, name, role)
values 
  ('huuutan.trinh@foody.vn', 'password123', 'Trịnh Hữu Tân (PM Lead)', 'pm'),
  ('huutan.trinh@foody.vn', 'password123', 'Trịnh Hữu Tân (PM Lead)', 'pm')
on conflict (email) do nothing;

-- 1. Table for PRDs (Tasks)
create table if not exists prds (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text not null,
  uploaded_by text default 'PM/BA User',
  created_by text,
  assigned_pics text[] default '{}',
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

-- 3. Table for Test Results (Audit log for Submitter & Timestamp)
create table if not exists test_results (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid references test_cases(id) on delete cascade,
  tester_id text default 'tester_anonymous',
  tester_name text default 'UAT Tester',
  submitted_by text,
  submitted_at timestamptz default now(),
  actual_result text,
  evidence_urls text[],
  evidence_type_submitted text[],
  verdict text check (verdict in ('pass','fail','blocked','pending_review')),
  verdict_reason text,
  evidence_validity_score numeric,
  human_override_verdict text,
  human_override_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Indexing for fast dashboard & list queries
create index if not exists idx_test_cases_prd_id on test_cases(prd_id);
create index if not exists idx_test_results_test_case_id on test_results(test_case_id);
