import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TestResult, EvidenceType, FILE_CONSTRAINTS } from '@/lib/types';
import { uploadFileToStorage } from '@/lib/supabaseStorage';
import crypto from 'crypto';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testCaseId = searchParams.get('test_case_id');

  if (!testCaseId) {
    return NextResponse.json({ error: 'Thiếu test_case_id' }, { status: 400 });
  }

  const results = await db.getTestResultsByCaseId(testCaseId);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const testCaseId = formData.get('test_case_id') as string;
    const actualResult = formData.get('actual_result') as string || '';
    const testerName = (formData.get('tester_name') as string) || 'Tester UAT';
    const testerId = (formData.get('tester_id') as string) || 'tester_default';
    const evidenceTypesSubmittedStr = formData.get('evidence_type_submitted') as string || '[]';
    let evidenceTypesSubmitted: EvidenceType[] = [];

    try {
      evidenceTypesSubmitted = JSON.parse(evidenceTypesSubmittedStr);
    } catch {
      evidenceTypesSubmitted = [];
    }

    const testCase = await db.getTestCaseById(testCaseId);
    if (!testCase) {
      return NextResponse.json({ error: 'Không tìm thấy test case' }, { status: 404 });
    }

    const evidenceFiles = formData.getAll('evidence_files') as (File | string)[];

    // File Upload Constraints Enforcement
    if (evidenceFiles.length > FILE_CONSTRAINTS.MAX_EVIDENCE_FILES_COUNT) {
      return NextResponse.json({
        error: `Vượt quá số lượng bằng chứng tối đa (${FILE_CONSTRAINTS.MAX_EVIDENCE_FILES_COUNT} file)`
      }, { status: 400 });
    }

    const savedEvidenceUrls: string[] = [];
    const base64FilesForAi: { mime_type: string; data: string }[] = [];

    for (const f of evidenceFiles) {
      if (typeof f === 'object' && f.name) {
        // Enforce File Size Limit (15MB)
        const sizeMb = f.size / (1024 * 1024);
        if (sizeMb > FILE_CONSTRAINTS.MAX_EVIDENCE_SIZE_MB) {
          return NextResponse.json({
            error: `File ${f.name} vượt quá dung lượng cho phép (${FILE_CONSTRAINTS.MAX_EVIDENCE_SIZE_MB}MB)`
          }, { status: 400 });
        }

        const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
        if (!FILE_CONSTRAINTS.ALLOWED_EVIDENCE_EXTENSIONS.includes(ext)) {
          return NextResponse.json({
            error: `Định dạng file ${ext} không được hỗ trợ cho bằng chứng test`
          }, { status: 400 });
        }

        const buffer = Buffer.from(await f.arrayBuffer());

        // Upload evidence file to Supabase Storage (or Data URL fallback in-memory) - NO DISK WRITE
        const publicUrl = await uploadFileToStorage(
          buffer,
          f.name,
          f.type || 'application/octet-stream'
        );
        savedEvidenceUrls.push(publicUrl);

        if (f.type.startsWith('image/')) {
          const b64 = buffer.toString('base64');
          base64FilesForAi.push({
            mime_type: f.type || 'image/png',
            data: b64,
          });
        }
      } else if (typeof f === 'string' && f.trim()) {
        savedEvidenceUrls.push(f.trim());
      }
    }

    const judgePayload = {
      expected_result: testCase.expected_result,
      required_evidence_type: testCase.required_evidence_type,
      evidence_type_submitted: evidenceTypesSubmitted,
      actual_result: actualResult,
      evidence_urls: savedEvidenceUrls,
      evidence_files_base64: base64FilesForAi,
    };

    let verdict = 'pending_review';
    let verdictReason = 'Chưa thể kết luận';
    let evidenceValidityScore = 0.5;

    try {
      const judgeRes = await fetch(`${FASTAPI_URL}/judge-test-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(judgePayload),
      });

      if (judgeRes.ok) {
        const judgeData = await judgeRes.json();
        verdict = judgeData.verdict || 'pending_review';
        verdictReason = judgeData.verdict_reason || '';
        evidenceValidityScore = judgeData.evidence_validity_score ?? 0.5;
      } else {
        console.error('FastAPI /judge-test-result error status:', judgeRes.status);
        verdictReason = 'Lỗi hệ thống khi gọi AI judge';
      }
    } catch (err: any) {
      console.error('Failed to contact FastAPI judge:', err);
      const missing = testCase.required_evidence_type.filter(
        reqType => !evidenceTypesSubmitted.includes(reqType as EvidenceType)
      );
      if (missing.length > 0) {
        verdict = 'blocked';
        verdictReason = `Thiếu loại bằng chứng bắt buộc: [${missing.join(', ')}]`;
        evidenceValidityScore = 0.0;
      } else {
        verdict = 'pass';
        verdictReason = 'Tự động chấm thành công (Serverless Fallback Mode)';
        evidenceValidityScore = 0.9;
      }
    }

    const nowIso = new Date().toISOString();

    const newResult: TestResult = {
      id: crypto.randomUUID(),
      test_case_id: testCaseId,
      tester_id: testerId,
      tester_name: testerName,
      actual_result: actualResult,
      evidence_urls: savedEvidenceUrls,
      evidence_type_submitted: evidenceTypesSubmitted,
      verdict: verdict as any,
      verdict_reason: verdictReason,
      evidence_validity_score: evidenceValidityScore,
      reviewed_at: nowIso,
      created_at: nowIso,
    };

    await db.addTestResult(newResult);

    console.log(`[AUDIT LOG] Test Result Submitted | Submitter: ${testerName} (${testerId}) | Time: ${nowIso} | Verdict: ${verdict}`);

    return NextResponse.json(newResult);
  } catch (err: any) {
    console.error('Error in POST /api/test-results:', err);
    return NextResponse.json({ error: err.message || 'Lỗi khi submit kết quả test' }, { status: 500 });
  }
}
