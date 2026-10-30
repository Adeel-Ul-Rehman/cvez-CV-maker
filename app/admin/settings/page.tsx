'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Construction, Clock, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          System Settings & Platform Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Global email SMTP relays, AI rate limit thresholds, Cloudinary storage buckets, and security policies.
        </p>
      </div>

      <Card className="p-12 text-center bg-slate-900 border-slate-800 text-white space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-800 text-primary-400 flex items-center justify-center mx-auto shadow-inner">
          <Construction className="h-8 w-8" />
        </div>

        <div>
          <Badge variant="primary" className="mb-2">
            Coming Soon · Phase 2 Architecture
          </Badge>
          <h2 className="text-xl font-bold text-slate-100">
            Advanced Dynamic Settings Console
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            All system parameters (rate limits, SMTP credentials, model endpoints) are currently safely governed via environment variables in <code className="text-amber-400 font-mono">.env</code>. Dynamic in-dashboard toggle overrides are planned for the upcoming release.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Button variant="outline" className="border-slate-800 text-slate-300" disabled leftIcon={<Clock className="h-4 w-4" />}>
            Under Development
          </Button>
        </div>
      </Card>
    </div>
  );
}
