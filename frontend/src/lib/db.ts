import fs from 'fs';
import path from 'path';
import { PRD, TestCase, TestResult, DashboardStats } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

interface DbSchema {
  prds: PRD[];
  test_cases: TestCase[];
  test_results: TestResult[];
}

function ensureStoreExists(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: DbSchema = { prds: [], test_cases: [], test_results: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const content = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(content) as DbSchema;
  } catch (err) {
    const initial: DbSchema = { prds: [], test_cases: [], test_results: [] };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveStore(data: DbSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const db = {
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // PRDs
  async getAllPrds(): Promise<PRD[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data as PRD[];
    }
    const store = ensureStoreExists();
    return store.prds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPrdById(id: string): Promise<PRD | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as PRD;
    }
    const store = ensureStoreExists();
    return store.prds.find(p => p.id === id) || null;
  },

  async addPrd(prd: PRD): Promise<PRD> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('prds').insert([prd]);
      if (error) console.error('Supabase error inserting PRD:', error);
    }
    const store = ensureStoreExists();
    store.prds.unshift(prd);
    saveStore(store);
    return prd;
  },

  // Test Cases
  async getTestCases(prdId?: string): Promise<TestCase[]> {
    let cases: TestCase[] = [];
    let resultsMap: Record<string, TestResult> = {};

    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('test_cases').select('*');
      if (prdId) query = query.eq('prd_id', prdId);
      const { data: tcData, error: tcErr } = await query;
      if (!tcErr && tcData) {
        cases = tcData as TestCase[];
        const caseIds = cases.map(c => c.id);
        if (caseIds.length > 0) {
          const { data: resData } = await supabase
            .from('test_results')
            .select('*')
            .in('test_case_id', caseIds)
            .order('created_at', { ascending: false });
          if (resData) {
            resData.forEach((r: any) => {
              if (!resultsMap[r.test_case_id]) {
                resultsMap[r.test_case_id] = r as TestResult;
              }
            });
          }
        }
        return cases.map(tc => ({
          ...tc,
          latest_result: resultsMap[tc.id] || null,
        })).sort((a, b) => a.test_case_no.localeCompare(b.test_case_no, undefined, { numeric: true }));
      }
    }

    const store = ensureStoreExists();
    cases = store.test_cases;
    if (prdId) {
      cases = cases.filter(c => c.prd_id === prdId);
    }

    return cases.map(tc => {
      const results = store.test_results.filter(r => r.test_case_id === tc.id);
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return {
        ...tc,
        latest_result: results[0] || null,
      };
    }).sort((a, b) => a.test_case_no.localeCompare(b.test_case_no, undefined, { numeric: true }));
  },

  async addTestCases(cases: TestCase[]): Promise<TestCase[]> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('test_cases').insert(cases);
      if (error) console.error('Supabase error inserting test cases:', error);
    }
    const store = ensureStoreExists();
    store.test_cases.push(...cases);
    saveStore(store);
    return cases;
  },

  async getTestCaseById(id: string): Promise<TestCase | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data: tc, error } = await supabase
        .from('test_cases')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && tc) {
        const { data: resData } = await supabase
          .from('test_results')
          .select('*')
          .eq('test_case_id', id)
          .order('created_at', { ascending: false })
          .limit(1);
        return {
          ...(tc as TestCase),
          latest_result: resData && resData[0] ? (resData[0] as TestResult) : null,
        };
      }
    }

    const store = ensureStoreExists();
    const tc = store.test_cases.find(c => c.id === id);
    if (!tc) return null;
    const results = store.test_results.filter(r => r.test_case_id === tc.id);
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      ...tc,
      latest_result: results[0] || null,
    };
  },

  // Test Results
  async addTestResult(result: TestResult): Promise<TestResult> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('test_results').insert([result]);
      if (error) console.error('Supabase error inserting test result:', error);
    }
    const store = ensureStoreExists();
    store.test_results.unshift(result);
    saveStore(store);
    return result;
  },

  async getTestResultsByCaseId(testCaseId: string): Promise<TestResult[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('test_case_id', testCaseId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as TestResult[];
    }
    const store = ensureStoreExists();
    return store.test_results
      .filter(r => r.test_case_id === testCaseId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Dashboard Aggregation
  async getDashboardStats(prdId: string): Promise<DashboardStats> {
    const cases = await this.getTestCases(prdId);
    let total = cases.length;
    let pass = 0;
    let fail = 0;
    let blocked = 0;
    let pending_review = 0;
    let untested = 0;

    const priority_counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    cases.forEach(tc => {
      const prio = tc.priority || 'medium';
      if (priority_counts[prio] !== undefined) {
        priority_counts[prio]++;
      }

      if (!tc.latest_result) {
        untested++;
      } else {
        const v = tc.latest_result.verdict;
        if (v === 'pass') pass++;
        else if (v === 'fail') fail++;
        else if (v === 'blocked') blocked++;
        else if (v === 'pending_review') pending_review++;
        else untested++;
      }
    });

    const evaluatedCount = pass + fail + blocked + pending_review;
    const pass_rate = evaluatedCount > 0 ? Math.round((pass / total) * 100) : 0;

    return {
      total,
      pass,
      fail,
      blocked,
      pending_review,
      untested,
      pass_rate,
      priority_counts,
    };
  }
};
