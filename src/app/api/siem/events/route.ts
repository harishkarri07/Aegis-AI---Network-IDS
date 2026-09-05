import { NextResponse } from 'next/server';
import { getSecurityEvents, ingestSecurityPayload } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      hostname: searchParams.get('hostname') || undefined,
      device_id: searchParams.get('device-id') || undefined,
      event_type: searchParams.get('event-type') || undefined,
      action: searchParams.get('action') || undefined,
      status: searchParams.get('status') || undefined,
      source_ip: searchParams.get('source-ip') || undefined,
      username: searchParams.get('username') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await getSecurityEvents(params);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await ingestSecurityPayload(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}