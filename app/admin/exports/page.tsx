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
import { DownloadCloud, CheckCircle2, XCircle } from 'lucide-react';

interface ExportEventItem {
  id: string;
  userId: string;
  userEmail: string | null;
  cvId: string;
  cvTitle: string;
  format: string;
  templateKey: string;
  durationMs: number | null;
  success: boolean;
  errorCode: string | null;
  createdAt: string;
}

export default function AdminExportsPage() {
  const [exportsList, setExportsList] = useState<ExportEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [formatFilter, setFormatFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState('');

  const loadExports = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '25');
      if (formatFilter) query.set('format', formatFilter);
      if (successFilter !== '') query.set('success', successFilter);

      const res = await apiClient<{
        exports: ExportEventItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/exports?${query.toString()}`);

      if (res?.exports) {
        setExportsList(res.exports);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError('Failed to load export telemetry', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExports();
  }, [page, formatFilter, successFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
          Export Telemetry & Generation Logs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Serverless Puppeteer rendering performance and binary compilation success rates ({total} total exports).
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            value={formatFilter}
            onChange={(e) => {
              setFormatFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Formats', value: '' },
              { label: 'PDF Document', value: 'pdf' },
              { label: 'DOCX Word', value: 'docx' },
              { label: 'PNG Image', value: 'png' },
              { label: 'JPG Image', value: 'jpg' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-44">
          <Select
            value={successFilter}
            onChange={(e) => {
              setSuccessFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Successful Only', value: 'true' },
              { label: 'Failed Only', value: 'false' },
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
            <p className="text-xs text-slate-400">Loading export telemetry...</p>
          </div>
        ) : exportsList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No export events match the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Format</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">CV Document</th>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Error Info</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {exportsList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="border-slate-700 text-slate-200 uppercase font-mono">
                        {item.format}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      {item.success ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-sans font-medium text-slate-200 max-w-xs truncate">
                      {item.cvTitle}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {item.userEmail || 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {item.durationMs ? `${item.durationMs}ms` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-rose-400">
                      {item.errorCode || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans">
                      {format(new Date(item.createdAt), 'MMM d, yyyy HH:mm:ss')}
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
