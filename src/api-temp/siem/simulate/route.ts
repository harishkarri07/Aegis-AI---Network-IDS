import { NextRequest, NextResponse } from 'next/server';
import { triggerSimulationScenario } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenario = body.scenario || 'ssh_brute_force';
    const count = body.count || 5;
    const hostname = body.hostname || 'endpoint-alpha';
    const sourceIp = body.source_ip || '198.51.100.42';

    const result = await triggerSimulationScenario(scenario, count, hostname, sourceIp);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
