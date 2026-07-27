import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const logs = await db.getAuditLogs();
    return NextResponse.json({
      total_submissions: logs.length,
      logs: logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi khi truy vấn audit logs' }, { status: 500 });
  }
}
