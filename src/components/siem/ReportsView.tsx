'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Check
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [markdownReport, setMarkdownReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/siem/reports?format=markdown');
      const text = await res.text();
      setMarkdownReport(text);
    } catch (err) {
      console.error(err);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00d4ff]" />
            SOC Executive & Compliance Reports
          </h2>
          <p className="text-xs text-[#7090b0] mt-0.5">
            Automated security summaries, incident telemetry audits, and CSV export for incident post-mortems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <FileText className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy MD'}
          </button>

          <a
            href="/api/siem/reports?format=csv"
            download="aegis_siem_alerts.csv"
            className="px-3 py-1.5 bg-[#00d4ff] hover:bg-white text-[#0a0e1a] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Alerts CSV
          </a>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1e3a5f] p-6 rounded-xl">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[#7090b0] flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00d4ff]" />
            Generating dynamic SOC executive report from SQLite audit log...
          </div>
        ) : (
          <pre className="font-mono text-xs text-[#b0c4de] whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {markdownReport}
          </pre>
        )}
      </div>
    </div>
  );
};
