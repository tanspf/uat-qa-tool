import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('uat_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const user = await db.getUserByEmail(session.email);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
