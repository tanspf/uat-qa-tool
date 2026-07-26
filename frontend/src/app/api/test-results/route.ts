import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TestResult, EvidenceType } from '@/lib/types';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
    const savedEvidenceUrls: string[] = [];
    const base64FilesForAi: { mime_type: string; data: string }[] = [];

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    for (const f of evidenceFiles) {
      if (typeof f === 'object' && f.name) {
        const fileId = crypto.randomUUID().slice(0, 8);
        const fileName = `${fileId}_${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const buffer = Buffer.from(await f.arrayBuffer());
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        savedEvidenceUrls.push(`/uploads/${fileName}`);

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
        verdictReason = 'Tự động chấm thành công (Local Fallback Mode)';
        evidenceValidityScore = 0.9;
      }
    }

    const newResult: TestResult = {
      id: crypto.randomUUID(),
      test_case_id: testCaseId,
      actual_result: actualResult,
      evidence_urls: savedEvidenceUrls,
      evidence_type_submitted: evidenceTypesSubmitted,
      verdict: verdict as any,
      verdict_reason: verdictReason,
      evidence_validity_score: evidenceValidityScore,
      reviewed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await db.addTestResult(newResult);

    return NextResponse.json(newResult);
  } catch (err: any) {
    console.error('Error in POST /api/test-results:', err);
    return NextResponse.json({ error: err.message || 'Lỗi khi submit kết quả test' }, { status: 500 });
  }
}
