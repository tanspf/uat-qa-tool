import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ prd_id: string }> }
) {
  const { prd_id } = await params;
  const prd = await db.getPrdById(prd_id);
  if (!prd) {
    return NextResponse.json({ error: 'Không tìm thấy PRD' }, { status: 404 });
  }

  const stats = await db.getDashboardStats(prd_id);
  const testCases = await db.getTestCases(prd_id);

  const issuesList = testCases.filter(
    tc => tc.latest_result && (tc.latest_result.verdict === 'fail' || tc.latest_result.verdict === 'blocked')
  );

  return NextResponse.json({
    prd,
    stats,
    issues: issuesList,
    database_mode: db.isUsingSupabase() ? 'Supabase PostgreSQL (Real)' : 'Local File JSON',
  });
}
