'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { toastError } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { History, Search, Shield, Filter } from 'lucide-react';

interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '25');
      if (actionFilter) query.set('action', actionFilter);
      if (targetTypeFilter) query.set('targetType', targetTypeFilter);

      const res = await apiClient<{
        logs: AuditLogItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/audit-logs?${query.toString()}`);

      if (res?.logs) {
        setLogs(res.logs);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError('Failed to load audit logs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, targetTypeFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Administrative Audit Trail
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable forensic log of all administrative actions, data inspections, and configuration mutations ({total} entries).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Input
            placeholder="Filter by action string..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-44">
          <Select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Target Types', value: '' },
              { label: 'User (user)', value: 'user' },
              { label: 'CV (cv)', value: 'cv' },
              { label: 'Template (template)', value: 'template' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Spinner size="lg" className="text-primary-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No audit logs match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Administrator</th>
                  <th className="px-5 py-3.5">Target</th>
                  <th className="px-5 py-3.5">Metadata Snapshot</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-amber-400">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-200">
                      {log.adminEmail || 'System Process'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {log.targetType ? (
                        <span>
                          {log.targetType}: <span className="text-slate-300">{log.targetId?.slice(0, 8)}...</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
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
