'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, FileSpreadsheet, RefreshCw, FileText } from 'lucide-react';
import {
  Button,
  Card,
  ErrorBanner,
  LoadingBlock,
  SectionHeader
} from '../ui';

export const ReportsView: React.FC = () => {
  const [markdownReport, setMarkdownReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/siem/reports?format=markdown');
      if (!res.ok) throw new Error(`Report request failed (${res.status})`);
      const text = await res.text();
      setMarkdownReport(text);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not load the report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Audit reports"
        description="Automated security summaries, incident telemetry audits, and CSV export for post-incident review."
        actions={
          <>
            <Button variant="secondary" onClick={fetchReport} disabled={isLoading}>
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
            <Button variant="secondary" onClick={handleCopy} disabled={isLoading || !markdownReport}>
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy report'}
            </Button>
            <a
              href="/api/siem/reports?format=csv"
              download="aegis_siem_alerts.csv"
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3.5 rounded-control text-caption font-medium whitespace-nowrap select-none bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export alerts CSV
            </a>
          </>
        }
      />

      <Card className="p-6">
        {isLoading ? (
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <LoadingBlock rows={6} className="max-w-xl w-full" />
            <p className="text-caption text-muted">Generating report from the SQLite audit log…</p>
          </div>
        ) : error ? (
          <ErrorBanner
            title="Report unavailable"
            description="The report could not be generated right now."
            detail={error}
            action={
              <Button variant="secondary" size="sm" onClick={fetchReport}>
                Try again
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-caption text-muted">
              <FileText className="w-4 h-4" />
              Markdown report
            </div>
            <pre className="font-mono text-caption text-secondary whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {markdownReport || '(Empty report)'}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
};
