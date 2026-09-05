import { NextResponse } from 'next/server';
import { getSecurityAlerts, updateAlertStatus } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      hostname: searchParams.get('hostname') || undefined,
      device_id: searchParams.get('device-id') || undefined,
    };

    const result = await getSecurityAlerts(params);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) {
      return NextResponse.json({ error: 'Alert ID and status are required' }, { status: 400 });
    }

    const success = await updateAlertStatus(alertId, status as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED');
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}