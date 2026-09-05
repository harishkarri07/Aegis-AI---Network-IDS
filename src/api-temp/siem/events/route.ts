import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEvents, ingestSecurityPayload } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;
    const hostname = searchParams.get('hostname') || undefined;
    const device_id = searchParams.get('device_id') || undefined;
    const event_type = searchParams.get('event_type') || undefined;
    const action = searchParams.get('action') || undefined;
    const status = searchParams.get('status') || undefined;
    const source_ip = searchParams.get('source_ip') || undefined;
    const username = searchParams.get('username') || undefined;
    const search = searchParams.get('search') || undefined;

    const data = await getSecurityEvents({
      limit,
      offset,
      hostname,
      device_id,
      event_type,
      action,
      status,
      source_ip,
      username,
      search
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await ingestSecurityPayload(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
