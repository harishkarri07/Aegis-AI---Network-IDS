import { NextRequest, NextResponse } from 'next/server';
import { getSecurityAlerts } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const hostname = searchParams.get('hostname') || undefined;
    const device_id = searchParams.get('device_id') || undefined;

    const data = await getSecurityAlerts({
      limit,
      offset,
      status,
      severity,
      hostname,
      device_id
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
