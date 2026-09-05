import { NextRequest, NextResponse } from 'next/server';
import { updateAlertStatus } from '@/lib/siem-service';

export async function generateStaticParams() {
  return [];
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const status = body.status?.toUpperCase();

    if (!['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be OPEN, ACKNOWLEDGED, or RESOLVED.' },
        { status: 400 }
      );
    }

    const success = await updateAlertStatus(id, status);
    return NextResponse.json({ success, alert_id: id, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
