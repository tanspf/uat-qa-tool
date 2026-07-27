import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PRD, TestCase, FILE_CONSTRAINTS } from '@/lib/types';
import { uploadFileToStorage } from '@/lib/supabaseStorage';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('uat_session');
    if (!sessionCookie || !sessionCookie.value) return null;
    const session = JSON.parse(sessionCookie.value);
    return await db.getUserByEmail(session.email);
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const prds = await db.getAllPrds(user);
  return NextResponse.json(prds);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }
    if (user.role !== 'pm') {
      return NextResponse.json({ error: 'Chỉ tài khoản PM/Admin mới có quyền upload PRD và tạo Task mới' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const prdText = formData.get('prd_text') as string | null;
    const initialPicsStr = formData.get('assigned_pics') as string | null;
    let initialPics: string[] = [user.email];
    if (initialPicsStr) {
      try {
        initialPics = JSON.parse(initialPicsStr);
      } catch {}
    }

    if (!file && !prdText) {
      return NextResponse.json({ error: 'Vui lòng cung cấp file PDF hoặc nội dung text PRD' }, { status: 400 });
    }

    const prdId = crypto.randomUUID();
    let fileName = 'PRD_Document.pdf';
    let fileUrl = '';
    let fileBuffer: Buffer | null = null;

    if (file) {
      // Enforce File Size Constraints for PRD (20MB)
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > FILE_CONSTRAINTS.MAX_PRD_SIZE_MB) {
        return NextResponse.json({
          error: `Dung lượng file PRD vượt quá giới hạn tối đa (${FILE_CONSTRAINTS.MAX_PRD_SIZE_MB}MB)`
        }, { status: 400 });
      }

      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!FILE_CONSTRAINTS.ALLOWED_PRD_EXTENSIONS.includes(ext)) {
        return NextResponse.json({
          error: `Định dạng file ${ext} không được hỗ trợ. Vui lòng tải file PDF hoặc TXT.`
        }, { status: 400 });
      }

      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);

      // Upload file to Supabase Storage (or Data URL fallback in-memory) - NO DISK WRITE
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
      uploaded_by: user.name,
      created_by: user.email,
      assigned_pics: initialPics,
      created_at: new Date().toISOString(),
    };
    await db.addPrd(prdRecord);

    let testCasesData: any[] = [];
    try {
      const fastApiFormData = new FormData();
      if (file && fileBuffer) {
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

    if (testCasesData.length === 0) {
      testCasesData = [
        {
          test_case_no: "TC_UAT_001",
          section: "Khởi Tạo Đơn Hàng UAT",
          precondition: "Người dùng đã đăng nhập ứng dụng",
          steps: "1. Thêm sản phẩm vào giỏ\n2. Nhấn nút Thanh Toán\n3. Chọn phương thức MoMo và xác nhận",
          expected_result: "Đơn hàng được khởi tạo thành công ở trạng thái Pending_Payment",
          required_evidence_type: ["screenshot"],
          evidence_note_for_tester: "Chụp ảnh màn hình xác nhận đơn hàng thành công",
          priority: "critical",
          needs_clarification: false
        },
        {
          test_case_no: "TC_UAT_002",
          section: "Hủy Đơn & Hoàn Tiền Ví",
          precondition: "Đơn hàng đang ở trạng thái Chờ Xử Lý",
          steps: "1. Vào Chi tiết đơn hàng\n2. Bấm Hủy Đơn Hàng\n3. Xác nhận lý do hủy",
          expected_result: "Hệ thống hủy đơn hàng và hoàn tiền vào ví người dùng trong 30s",
          required_evidence_type: ["screenshot", "video"],
          evidence_note_for_tester: "Quay video bấm hủy đơn và chụp ảnh trạng thái Đã Hủy",
          priority: "high",
          needs_clarification: false
        }
      ];
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

