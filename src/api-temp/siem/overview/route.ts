import { NextResponse } from 'next/server';
import { getSocOverview } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET() {
  try {
    const overview = await getSocOverview();
    return NextResponse.json(overview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
