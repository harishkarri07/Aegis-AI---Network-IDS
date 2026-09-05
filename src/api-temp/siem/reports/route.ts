import { NextRequest, NextResponse } from 'next/server';
import { generateExecutiveReport } from '@/lib/siem-service';

export const generateStaticParams = async () => {
  return [];
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'markdown') as 'markdown' | 'csv';

    const content = await generateExecutiveReport(format);

    if (format === 'csv') {
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="aegis_siem_alerts.csv"'
        }
      });
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
