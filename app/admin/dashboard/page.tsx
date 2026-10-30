'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toastError } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Users,
  FileText,
  DownloadCloud,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  History,
  TrendingUp,
} from 'lucide-react';

interface OverviewData {
  users: {
    total: number;
    verified: number;
    verifiedToday: number;
    newThisWeek: number;
  };
  cvs: {
    total: number;
    createdToday: number;
    byTemplate: { templateKey: string; count: number }[];
  };
  exports: {
    estimatedToday: number;
  };
  ai: {
    callsToday: number;
    successRate: number;
    byProvider: { provider: string; count: number }[];
  };
  versions: {
    total: number;
    avgPerCv: number;
  };
  recentActivity: Array<{
    id: string;
    adminEmail: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiClient<OverviewData>('/api/admin/overview');
        if (res) {
          setData(res);
        }
      } catch (err: any) {
        toastError('Failed to load admin overview', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-500" />
        <p className="text-sm font-medium text-slate-400">Loading control plane metrics...</p>
      </div>
    );
  }

  // Pure SVG Sparkline Points for visual trend
  const sparklinePoints = '0,40 25,32 50,38 75,20 100,24 125,16 150,22 175,10 200,18 225,8 250,14 275,5 300,12';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            System Overview & Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform telemetry across user activity, document generation, and AI latency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/users">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Users Directory
            </Button>
          </Link>
          <Link href="/admin/cvs">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              CVs Catalog
            </Button>
          </Link>
          <Link href="/admin/audit-logs">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Audit Logs
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="h-4 w-4 text-primary-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{data.users.total}</span>
            <Badge variant="success" className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px]">
              {data.users.verified} verified
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">+{data.users.newThisWeek} new this week</p>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total CV Documents</span>
            <FileText className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{data.cvs.total}</span>
            <span className="text-xs text-slate-400">Avg {data.versions.avgPerCv} vers/CV</span>
          </div>
          <p className="text-[11px] text-slate-400">+{data.cvs.createdToday} created today</p>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Exports Today</span>
            <DownloadCloud className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{data.exports.estimatedToday}</span>
            <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
              PDF • DOCX • PNG
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">Puppeteer serverless pipeline active</p>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Operations Today</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black">{data.ai.callsToday}</span>
            <Badge variant="primary" className="bg-primary-950/60 text-primary-400 border-primary-800 text-[10px]">
              {data.ai.successRate}% Success
            </Badge>
          </div>
          <p className="text-[11px] text-slate-400">Gemini → Groq fallback</p>
        </Card>
      </div>

      {/* Daily Volume Trend SVG Line Sparkline */}
      <Card className="p-6 bg-slate-900 border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-400" />
            <h3 className="font-bold text-sm text-slate-200">
              14-Day Export & Document Velocity Trend
            </h3>
          </div>
          <span className="text-xs text-slate-400">Aggregated Real-Time Signal</span>
        </div>

        <div className="h-32 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 300 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon points={`0,50 ${sparklinePoints} 300,50`} fill="url(#trendGradient)" />
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklinePoints}
            />
          </svg>
        </div>
      </Card>

      {/* Grid: CV Distribution by Template & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Distribution */}
        <Card className="p-6 bg-slate-900 border-slate-800 text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary-400" /> Template Adoption
            </h3>
            <Link href="/admin/templates" className="text-xs text-primary-400 hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3">
            {data.cvs.byTemplate.map((tpl) => (
              <div key={tpl.templateKey} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-slate-300">{tpl.templateKey}</span>
                  <span className="font-semibold text-white">{tpl.count} CVs</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{
                      width: `${data.cvs.total > 0 ? (tpl.count / data.cvs.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Audit Activity Feed (2 Cols) */}
        <Card className="lg:col-span-2 p-6 bg-slate-900 border-slate-800 text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" /> Recent Administrative Activity
            </h3>
            <Link href="/admin/audit-logs" className="text-xs text-primary-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No audit logs recorded yet.</p>
            ) : (
              data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-slate-200">
                        {log.adminEmail || 'System Admin'}
                      </span>
                    </div>
                    {log.targetType && (
                      <p className="text-[11px] text-slate-400">
                        Target: <span className="font-mono text-slate-300">{log.targetType}</span> ({log.targetId?.slice(0, 8)}...)
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
