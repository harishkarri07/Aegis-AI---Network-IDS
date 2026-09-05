import { NextResponse } from 'next/server';
import { getCorrelatedIncidents } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET() {
  try {
    const result = await getCorrelatedIncidents();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}