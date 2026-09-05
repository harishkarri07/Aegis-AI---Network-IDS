import { NextResponse } from 'next/server';
import { getDetectionRules } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET() {
  try {
    const data = await getDetectionRules();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
