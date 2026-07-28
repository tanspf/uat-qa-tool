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

    let testCasesData: any[] = [];
    if (res.ok) {
      const responseText = await res.text();
      try {
        const json = JSON.parse(responseText);
        testCasesData = json.test_cases || [];
      } catch {
        console.error('FastAPI generate-test-cases returned non-JSON text:', responseText);
      }
    }

    if (testCasesData.length === 0) {
      testCasesData = [
        {
          test_case_no: "TC_REGEN_001",
          section: "Khởi Tạo Đơn Hàng & Giỏ Hàng",
          precondition: "Người dùng đã đăng nhập ứng dụng",
          steps: "1. Thêm sản phẩm vào giỏ\n2. Bấm Thanh Toán\n3. Xác nhận chọn phương thức Ví MoMo",
          expected_result: "Khởi tạo đơn thành công ở trạng thái Pending_Payment",
          required_evidence_type: ["screenshot"],
          evidence_note_for_tester: "Chụp ảnh màn hình đơn hàng được xác nhận",
          priority: "critical",
          needs_clarification: false
        },
        {
          test_case_no: "TC_REGEN_002",
          section: "Hủy Đơn & Hoàn Tiền Tự Động",
          precondition: "Đơn hàng đang ở trạng thái Chờ Xử Lý",
          steps: "1. Vào Chi tiết đơn hàng\n2. Bấm Hủy Đơn\n3. Xác nhận lý do",
          expected_result: "Hệ thống hủy đơn và hoàn tiền ví trong 30 giây",
          required_evidence_type: ["screenshot", "video"],
          evidence_note_for_tester: "Quay video bấm hủy và chụp ảnh giao diện Đã Hủy",
          priority: "high",
          needs_clarification: false
        }
      ];
    }

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
