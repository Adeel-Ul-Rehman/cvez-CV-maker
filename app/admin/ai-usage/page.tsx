'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { toastError } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { Sparkles, CheckCircle2, XCircle, Cpu, Zap, Activity } from 'lucide-react';

interface AiUsageLogItem {
  id: string;
  userId: string;
  userEmail: string | null;
  feature: string;
  provider: string;
  model: string;
  tokensUsed: number | null;
  success: boolean;
  errorCode: string | null;
  durationMs: number;
  createdAt: string;
}

interface AiSummary {
  successRate: number;
  avgDurationMs: number;
  byFeature: { feature: string; count: number }[];
  byProvider: { provider: string; count: number }[];
}

export default function AdminAiUsagePage() {
  const [logs, setLogs] = useState<AiUsageLogItem[]>([]);
  const [summary, setSummary] = useState<AiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [featureFilter, setFeatureFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '25');
      if (featureFilter) query.set('feature', featureFilter);
      if (providerFilter) query.set('provider', providerFilter);
      if (successFilter !== '') query.set('success', successFilter);

      const res = await apiClient<{
        logs: AiUsageLogItem[];
        summary: AiSummary;
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/ai-usage?${query.toString()}`);

      if (res?.logs) {
        setLogs(res.logs);
        setSummary(res.summary);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError('Failed to load AI usage logs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, featureFilter, providerFilter, successFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          AI Telemetry & LLM Invocations
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Multi-provider fallback audit: Gemini → Groq → HuggingFace call latency and error monitoring ({total} total calls).
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900 border-slate-800 text-white space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Success Rate</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">{summary.successRate}%</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400">Target &gt;95% SLA</p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800 text-white space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Avg Latency</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-400">{summary.avgDurationMs}ms</span>
              <Zap className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-[11px] text-slate-400">Round-trip prompt time</p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800 text-white space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Top Provider</span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-amber-400 capitalize">
                {summary.byProvider[0]?.provider || 'None'}
              </span>
              <Cpu className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              {summary.byProvider[0]?.count || 0} calls fulfilled
            </p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800 text-white space-y-1">
            <span className="text-xs text-slate-400 uppercase font-semibold">Top Feature</span>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-primary-400 truncate max-w-[150px]">
                {summary.byFeature[0]?.feature || 'None'}
              </span>
              <Activity className="h-4 w-4 text-primary-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              {summary.byFeature[0]?.count || 0} invocations
            </p>
          </Card>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={featureFilter}
            onChange={(e) => {
              setFeatureFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All AI Features', value: '' },
              { label: 'Improve Summary', value: 'improve_summary' },
              { label: 'Improve Bullets', value: 'improve_bullets' },
              { label: 'Improve Skills', value: 'improve_skills' },
              { label: 'ATS Check', value: 'ats_check' },
              { label: 'Template Search', value: 'template_search' },
              { label: 'Template Recommend', value: 'template_recommend' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-40">
          <Select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Providers', value: '' },
              { label: 'Gemini (Google)', value: 'gemini' },
              { label: 'Groq', value: 'groq' },
              { label: 'HuggingFace', value: 'huggingface' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-36">
          <Select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Results', value: '' },
              { label: 'Success (200)', value: 'true' },
              { label: 'Failed (Fallback)', value: 'false' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Spinner size="lg" className="text-primary-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading AI usage telemetry...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No AI invocation logs match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Feature</th>
                  <th className="px-5 py-3.5">Provider & Model</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Tokens</th>
                  <th className="px-5 py-3.5">Latency</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-slate-200">
                      {log.feature}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-amber-400 uppercase font-semibold">{log.provider}</span>
                      <span className="text-slate-500 block text-[10px] truncate max-w-[160px]">{log.model}</span>
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 200
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                          <XCircle className="h-3.5 w-3.5" /> {log.errorCode || 'ERR'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      {log.userEmail || 'System/Guest'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {log.tokensUsed || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {log.durationMs}ms
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex justify-center">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
