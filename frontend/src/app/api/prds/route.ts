import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRD, TestCase } from '@/lib/types';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET() {
  const prds = await db.getAllPrds();
  return NextResponse.json(prds);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prdText = formData.get('prd_text') as string | null;

    if (!file && !prdText) {
      return NextResponse.json({ error: 'Vui lòng cung cấp file PDF hoặc nội dung text PRD' }, { status: 400 });
    }

    const prdId = crypto.randomUUID();
    let fileName = 'PRD_Document.pdf';
    let fileUrl = '';

    if (file) {
      fileName = file.name;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const savedPath = path.join(uploadsDir, `${prdId}_${fileName}`);
      fs.writeFileSync(savedPath, buffer);
      fileUrl = `/uploads/${prdId}_${fileName}`;
    } else {
      fileName = 'PRD_Text_Input.txt';
      fileUrl = '#text';
    }

    const prdRecord: PRD = {
      id: prdId,
      file_name: fileName,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    };
    await db.addPrd(prdRecord);

    let testCasesData: any[] = [];
    try {
      const fastApiFormData = new FormData();
      if (file) {
        fastApiFormData.append('file', file, fileName);
      }
      if (prdText) {
        fastApiFormData.append('prd_text', prdText);
      }

      const res = await fetch(`${FASTAPI_URL}/generate-test-cases`, {
        method: 'POST',
        body: fastApiFormData,
      });

      if (res.ok) {
        const json = await res.json();
        testCasesData = json.test_cases || [];
      } else {
        console.error('FastAPI generate-test-cases returned status:', res.status);
      }
    } catch (err) {
      console.error('Failed to communicate with FastAPI backend:', err);
    }

    const formattedTestCases: TestCase[] = testCasesData.map((tc, idx) => ({
      id: crypto.randomUUID(),
      prd_id: prdId,
      test_case_no: tc.test_case_no || `TC_${String(idx + 1).padStart(3, '0')}`,
      section: tc.section || 'General',
      precondition: tc.precondition || '',
      steps: tc.steps || '',
      expected_result: tc.expected_result || '',
      required_evidence_type: Array.isArray(tc.required_evidence_type) ? tc.required_evidence_type : ['screenshot'],
      evidence_note_for_tester: tc.evidence_note_for_tester || 'Chụp bằng chứng rõ ràng cho bước này',
      priority: tc.priority || 'medium',
      needs_clarification: !!tc.needs_clarification,
      clarification_reason: tc.clarification_reason || null,
      created_at: new Date().toISOString(),
    }));

    if (formattedTestCases.length > 0) {
      await db.addTestCases(formattedTestCases);
    }

    return NextResponse.json({
      prd: prdRecord,
      test_cases_count: formattedTestCases.length,
      test_cases: formattedTestCases,
      database_mode: db.isUsingSupabase() ? 'Supabase PostgreSQL (Real)' : 'Local File JSON',
    });
  } catch (error: any) {
    console.error('Error in POST /api/prds:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server khi upload PRD' }, { status: 500 });
  }
}
