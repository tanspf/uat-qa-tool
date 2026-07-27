import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('uat_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có tối thiểu 6 ký tự' }, { status: 400 });
    }

    const user = await db.getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    if (user.password !== oldPassword) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại (cũ) không chính xác' }, { status: 400 });
    }

    const updated = await db.updateUserPassword(session.email, newPassword);
    if (!updated) {
      return NextResponse.json({ error: 'Không thể cập nhật mật khẩu' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (err: any) {
    console.error('Error in POST /api/auth/change-password:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server khi đổi mật khẩu' }, { status: 500 });
  }
}
