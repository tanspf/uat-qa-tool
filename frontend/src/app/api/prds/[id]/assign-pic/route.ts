import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prdId } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('uat_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'pm') {
      return NextResponse.json({ error: 'Chỉ có tài khoản PM/Admin mới có quyền phân công PIC' }, { status: 403 });
    }

    const { assigned_pics } = await req.json();
    if (!Array.isArray(assigned_pics)) {
      return NextResponse.json({ error: 'assigned_pics phải là danh sách email PIC' }, { status: 400 });
    }

    const updatedPrd = await db.assignPicsToPrd(prdId, assigned_pics);
    if (!updatedPrd) {
      return NextResponse.json({ error: 'Không tìm thấy PRD Task' }, { status: 404 });
    }

    return NextResponse.json(updatedPrd);
  } catch (err: any) {
    console.error('Error in POST /api/prds/[id]/assign-pic:', err);
    return NextResponse.json({ error: 'Lỗi server khi phân công PIC' }, { status: 500 });
  }
}
