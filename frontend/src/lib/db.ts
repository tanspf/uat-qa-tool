import fs from 'fs';
import path from 'path';
import { PRD, TestCase, TestResult, DashboardStats, User } from './types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'db_store.json');

interface DbSchema {
  users: User[];
  prds: PRD[];
  test_cases: TestCase[];
  test_results: TestResult[];
}

// Pre-seeded default users (@foody.vn only)
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_pm_super_1',
    email: 'huuutan.trinh@foody.vn',
    password: 'password123',
    name: 'Trịnh Hữu Tân (PM Lead)',
    role: 'pm',
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr_pm_super_2',
    email: 'huutan.trinh@foody.vn',
    password: 'password123',
    name: 'Trịnh Hữu Tân (PM Lead)',
    role: 'pm',
    created_at: new Date().toISOString(),
  },
];

// In-memory cache for serverless execution
let memoryStore: DbSchema = { users: DEFAULT_USERS, prds: [], test_cases: [], test_results: [] };

function ensureStoreExists(): DbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      memoryStore.users = DEFAULT_USERS;
      fs.writeFileSync(STORE_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
      return memoryStore;
    }
    const content = fs.readFileSync(STORE_FILE, 'utf-8');
    memoryStore = JSON.parse(content) as DbSchema;
    if (!memoryStore.users) memoryStore.users = [];
    
    // Ensure default foody.vn admin accounts are present
    DEFAULT_USERS.forEach(defUser => {
      if (!memoryStore.users.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
        memoryStore.users.push(defUser);
      }
    });

    return memoryStore;
  } catch (err) {
    if (!memoryStore.users) memoryStore.users = [];
    DEFAULT_USERS.forEach(defUser => {
      if (!memoryStore.users.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
        memoryStore.users.push(defUser);
      }
    });
    return memoryStore;
  }
}

function saveStore(data: DbSchema) {
  memoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore read-only filesystem errors on Vercel
  }
}

export const db = {
  isUsingSupabase(): boolean {
    return isSupabaseConfigured();
  },

  // USERS & AUTH
  async getAllUsers(): Promise<User[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) return data as User[];
    }
    const store = ensureStoreExists();
    return store.users;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    const users = await this.getAllUsers();
    return users.find(u => u.id === id) || null;
  },

  async grantUser(user: User): Promise<User> {
    const lowerEmail = user.email.toLowerCase().trim();
    if (!lowerEmail.endsWith('@foody.vn')) {
      throw new Error('Chỉ chấp nhận cấp quyền cho địa chỉ email doanh nghiệp thuộc tên miền @foody.vn');
    }
    user.email = lowerEmail;
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('users').upsert([user], { onConflict: 'email' });
      if (error) console.error('Supabase error granting user:', error);
    }
    const store = ensureStoreExists();
    const existingIndex = store.users.findIndex(u => u.email.toLowerCase() === lowerEmail);
    if (existingIndex >= 0) {
      store.users[existingIndex] = user;
    } else {
      store.users.push(user);
    }
    saveStore(store);
    return user;
  },

  async updateUserPassword(email: string, newPassword_hash: string): Promise<boolean> {
    const lowerEmail = email.toLowerCase().trim();
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('users')
        .update({ password_hash: newPassword_hash })
        .eq('email', lowerEmail);
      if (error) console.error('Supabase error updating password:', error);
    }
    const store = ensureStoreExists();
    const user = store.users.find(u => u.email.toLowerCase() === lowerEmail);
    if (user) {
      user.password = newPassword_hash;
      saveStore(store);
      return true;
    }
    return false;
  },

  // PRDs (Tasks) with RBAC filtering
  async getAllPrds(user?: User | null): Promise<PRD[]> {
    let allPrds: PRD[] = [];

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) allPrds = data as PRD[];
    } else {
      const store = ensureStoreExists();
      allPrds = store.prds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Role-based access control filtering:
    // PM role sees ALL Tasks (PRDs).
    // Tester role sees ONLY Tasks assigned to them (or created by them).
    if (!user || user.role === 'pm') {
      return allPrds;
    }

    // Tester role filtering
    return allPrds.filter(p => {
      const assigned = p.assigned_pics || [];
      const isAssigned = assigned.includes(user.email) || assigned.includes(user.id);
      const isCreator = p.created_by === user.email || p.created_by === user.id;
      return isAssigned || isCreator;
    });
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
    if (!prd.assigned_pics) prd.assigned_pics = [];
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('prds').insert([prd]);
      if (error) console.error('Supabase error inserting PRD:', error);
    }
    const store = ensureStoreExists();
    store.prds.unshift(prd);
    saveStore(store);
    return prd;
  },

  async assignPicsToPrd(prdId: string, assignedPics: string[]): Promise<PRD | null> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('prds')
        .update({ assigned_pics: assignedPics })
        .eq('id', prdId);
      if (error) console.error('Supabase error updating assigned PICs:', error);
    }
    const store = ensureStoreExists();
    const prd = store.prds.find(p => p.id === prdId);
    if (prd) {
      prd.assigned_pics = assignedPics;
      saveStore(store);
      return prd;
    }
    return null;
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

  // Test Results & Audit Log
  async addTestResult(result: TestResult): Promise<TestResult> {
    if (!result.submitted_at) result.submitted_at = new Date().toISOString();
    if (!result.submitted_by) result.submitted_by = result.tester_id || 'anonymous';
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

  async getAuditLogs(): Promise<Array<TestResult & { test_case_no?: string; section?: string; prd_file_name?: string }>> {
    const store = ensureStoreExists();
    let allResults: TestResult[] = store.test_results;

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) allResults = data as TestResult[];
    }

    const prdsMap = new Map((await this.getAllPrds()).map(p => [p.id, p.file_name]));
    const casesMap = new Map((await this.getTestCases()).map(c => [c.id, c]));

    return allResults.map(r => {
      const tc = casesMap.get(r.test_case_id);
      return {
        ...r,
        test_case_no: tc?.test_case_no || 'N/A',
        section: tc?.section || 'N/A',
        prd_file_name: tc ? prdsMap.get(tc.prd_id) || 'Unknown PRD' : 'Unknown PRD',
      };
    });
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
        const v = tc.latest_result.human_override_verdict || tc.latest_result.verdict;
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

