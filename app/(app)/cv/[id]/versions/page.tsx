'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, History, RotateCcw, Clock, CheckCircle } from 'lucide-react';

interface VersionItem {
  id: string;
  created_at: string;
}

export default function CvVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null);

  useEffect(() => {
    async function loadVersions() {
      try {
        const res = await apiClient.get<{ versions: VersionItem[] }>(`/api/cv/${cvId}/versions`);
        if (res.data?.versions) {
          setVersions(res.data.versions);
        }
      } catch (err: any) {
        toastError('Failed to load version history', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [cvId]);

  const handleRestore = async () => {
    if (!selectedVersion) return;
    setRestoring(true);
    try {
      await apiClient.post(`/api/cv/${cvId}/restore/${selectedVersion.id}`, {});
      toastSuccess('Version restored successfully', 'Your CV data has reverted to this milestone.');
      router.push(`/cv/${cvId}/editor`);
    } catch (err: any) {
      toastError('Failed to restore version', err.message);
    } finally {
      setRestoring(false);
      setSelectedVersion(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link href={`/cv/${cvId}/editor`}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Editor
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              Version History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Every save automatically snapshots your document state. You can restore prior revisions anytime.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="self-start sm:self-auto">
          {versions.length} Revisions Recorded
        </Badge>
      </div>

      {/* Versions List */}
      {versions.length === 0 ? (
        <EmptyState
          icon={<History className="h-10 w-10 text-slate-400" />}
          title="No previous versions available"
          description="Make edits in the CV editor to automatically build your revision timeline."
          action={{
            label: 'Return to Editor',
            onClick: () => router.push(`/cv/${cvId}/editor`),
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {versions.map((ver, idx) => {
              const dateObj = new Date(ver.created_at);
              const isLatest = idx === 0;

              return (
                <div key={ver.id} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-white dark:bg-slate-950 transition-colors ${
                      isLatest
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-slate-300 dark:border-slate-700 group-hover:border-primary-500'
                    }`}
                  />

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {format(dateObj, 'MMM d, yyyy · h:mm:ss a')}
                        </h3>
                        {isLatest && (
                          <Badge variant="success" className="text-[10px] py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Saved {formatDistanceToNow(dateObj, { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isLatest ? 'ghost' : 'outline'}
                        onClick={() => setSelectedVersion(ver)}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        disabled={isLatest}
                      >
                        Restore This Version
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(selectedVersion)}
        onClose={() => setSelectedVersion(null)}
        onConfirm={handleRestore}
        title="Restore CV Version?"
        description={
          selectedVersion
            ? `Are you sure you want to restore the version from ${format(
                new Date(selectedVersion.created_at),
                'MMM d, yyyy h:mm a'
              )}? A snapshot of your current state will be saved first.`
            : ''
        }
        confirmLabel="Restore Version"
        variant="warning"
        loading={restoring}
      />
    </div>
  );
}
