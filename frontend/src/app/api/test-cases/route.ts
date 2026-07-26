import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prdId = searchParams.get('prd_id') || undefined;

  const cases = await db.getTestCases(prdId);
  return NextResponse.json(cases);
}
