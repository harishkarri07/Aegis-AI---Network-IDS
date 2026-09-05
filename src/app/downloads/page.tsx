'use client';

import React from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { DownloadsCenter } from '@/components/website/DownloadsCenter';
import { FaqSection } from '@/components/website/FaqSection';

export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col">
      <WebsiteNav />
      <DownloadsCenter />
      <FaqSection />
      <WebsiteFooter />
    </div>
  );
}
