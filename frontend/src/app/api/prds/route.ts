import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRD, TestCase } from '@/lib/types';
import { uploadFileToStorage } from '@/lib/supabaseStorage';
import crypto from 'crypto';

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
    let fileBuffer: Buffer | null = null;

    if (file) {
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      // Upload file to Supabase Storage (or Data URL fallback in-memory) - NO DISK WRITE (fs)
      fileUrl = await uploadFileToStorage(
        fileBuffer,
        fileName,
        file.type || 'application/pdf'
      );
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
      if (file && fileBuffer) {
        // Convert Buffer to Uint8Array for standard BlobPart compatibility
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: file.type || 'application/pdf' });
        fastApiFormData.append('file', blob, fileName);
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
        const errText = await res.text();
        console.error('FastAPI generate-test-cases returned status:', res.status, errText);
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
