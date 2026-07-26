import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TestCase } from '@/lib/types';
import crypto from 'crypto';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const prd = await db.getPrdById(id);
  if (!prd) {
    return NextResponse.json({ error: 'Không tìm thấy PRD' }, { status: 404 });
  }

  try {
    const fastApiFormData = new FormData();
    fastApiFormData.append('prd_text', `PRD File: ${prd.file_name}`);

    const res = await fetch(`${FASTAPI_URL}/generate-test-cases`, {
      method: 'POST',
      body: fastApiFormData,
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Lỗi khi gọi service sinh test case' }, { status: res.status });
    }

    const json = await res.json();
    const testCasesData = json.test_cases || [];

    const formattedTestCases: TestCase[] = testCasesData.map((tc: any, idx: number) => ({
      id: crypto.randomUUID(),
      prd_id: id,
      test_case_no: tc.test_case_no || `TC_${String(idx + 1).padStart(3, '0')}`,
      section: tc.section || 'General',
      precondition: tc.precondition || '',
      steps: tc.steps || '',
      expected_result: tc.expected_result || '',
      required_evidence_type: tc.required_evidence_type || ['screenshot'],
      evidence_note_for_tester: tc.evidence_note_for_tester || 'Chụp bằng chứng rõ ràng',
      priority: tc.priority || 'medium',
      needs_clarification: !!tc.needs_clarification,
      clarification_reason: tc.clarification_reason || null,
      created_at: new Date().toISOString(),
    }));

    await db.addTestCases(formattedTestCases);

    return NextResponse.json({
      message: 'Sinh test case thành công',
      test_cases: formattedTestCases,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
