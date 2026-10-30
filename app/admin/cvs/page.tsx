'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { toastError } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { FileText, Eye, Filter } from 'lucide-react';

interface CvListItem {
  id: string;
  userId: string;
  userEmail: string;
  title: string;
  templateKey: string;
  isPublic: boolean;
  updatedAt: string;
  versionCount: number;
  exportCount: number;
}

export default function AdminCvsPage() {
  const router = useRouter();
  const [cvs, setCvs] = useState<CvListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [templateFilter, setTemplateFilter] = useState('');
  const [publicFilter, setPublicFilter] = useState('');

  const loadCvs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '20');
      if (templateFilter) query.set('templateKey', templateFilter);
      if (publicFilter !== '') query.set('isPublic', publicFilter);

      const res = await apiClient<{
        cvs: CvListItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/cvs?${query.toString()}`);

      if (res?.cvs) {
        setCvs(res.cvs);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError('Failed to load CVs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCvs();
  }, [page, templateFilter, publicFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            CV Documents Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global catalog of created resumes, templates in use, version checkpoints, and export stats ({total} total).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={templateFilter}
            onChange={(e) => {
              setTemplateFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Templates', value: '' },
              { label: 'Adeel Ul Rehman Signature', value: 'adeel-signature' },
              { label: 'Europass CV', value: 'europass' },
              { label: 'JobHire Chronological', value: 'jobhire-chronological' },
              { label: 'JobHire Creative', value: 'jobhire-creative' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-44">
          <Select
            value={publicFilter}
            onChange={(e) => {
              setPublicFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Visibility', value: '' },
              { label: 'Public Only', value: 'true' },
              { label: 'Private Only', value: 'false' },
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
            <p className="text-xs text-slate-400">Loading CV records...</p>
          </div>
        ) : cvs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No CV documents match the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Document Title & ID</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Template</th>
                  <th className="px-5 py-3.5">Sharing</th>
                  <th className="px-5 py-3.5">Versions</th>
                  <th className="px-5 py-3.5">Exports</th>
                  <th className="px-5 py-3.5">Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {cvs.map((cv) => (
                  <tr
                    key={cv.id}
                    onClick={() => router.push(`/admin/cvs/${cv.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-100">{cv.title}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{cv.id.slice(0, 8)}...</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {cv.userEmail}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="font-mono text-[10px] border-slate-700 text-slate-300">
                        {cv.templateKey}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {cv.isPublic ? (
                        <Badge variant="success" className="text-[10px]">
                          Public
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Private</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {cv.versionCount}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">
                      {cv.exportCount}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {format(new Date(cv.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/cvs/${cv.id}`}>
                        <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white">
                          <Eye className="h-4 w-4 mr-1" /> Inspect
                        </Button>
                      </Link>
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
