'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Trash2,
  User,
  FileText,
  Calendar,
  Layers,
  ExternalLink,
} from 'lucide-react';

interface AdminCvDetail {
  id: string;
  title: string;
  templateKey: string;
  data: any;
  config: any;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userFullName: string | null;
  userId: string;
  versionCount: number;
  exportCount: number;
}

export default function AdminCvDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [cv, setCv] = useState<AdminCvDetail | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadCv() {
      try {
        const res = await apiClient<AdminCvDetail>(`/api/admin/cvs/${cvId}`);
        if (res) {
          setCv(res);
        }
      } catch (err: any) {
        toastError('Failed to load CV details', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCv();
  }, [cvId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/cvs/${cvId}`);
      toastSuccess('CV deleted permanently');
      router.push('/admin/cvs');
    } catch (err: any) {
      toastError('Failed to delete CV', err.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading || !cv) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-500" />
        <p className="text-sm font-medium text-slate-400">Loading CV inspection record...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/cvs">
            <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              CVs Catalog
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-display">
              {cv.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {cv.id}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteConfirmOpen(true)}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Purge Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Metadata & Owner Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Owner Card */}
          <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary-400" /> Owner Account
              </h3>
              <Link href={`/admin/users/${cv.userId}`}>
                <Button size="sm" variant="ghost" className="text-xs text-primary-400 hover:text-primary-300 p-0 h-auto">
                  View Account
                </Button>
              </Link>
            </div>

            <div>
              <p className="font-semibold text-sm">{cv.userFullName || 'No display name'}</p>
              <p className="text-xs text-slate-400 font-mono">{cv.userEmail}</p>
            </div>
          </Card>

          {/* Document Metadata Card */}
          <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800">
              Document Specs
            </h3>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Template Key</span>
              <span className="font-mono text-slate-200">{cv.templateKey}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Public Status</span>
              {cv.isPublic ? (
                <Badge variant="success" className="text-[10px]">
                  Public
                </Badge>
              ) : (
                <span className="text-slate-500">Private</span>
              )}
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Revisions Saved</span>
              <span className="font-mono text-slate-200">{cv.versionCount} versions</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Exports Generated</span>
              <span className="font-mono text-slate-200">{cv.exportCount} downloads</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Last Modified</span>
              <span className="text-slate-300">{format(new Date(cv.updatedAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Full CV Live Preview */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Rendered Document Inspector
          </h3>

          <div className="w-full bg-slate-950 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-x-auto flex justify-center">
            <div className="w-[820px] max-w-full bg-white rounded-sm overflow-hidden shadow-2xl shrink-0">
              <iframe
                src={`/api/cv/${cv.id}/preview?raw=1`}
                title="Live Document Preview"
                className="w-full h-[1160px] border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Permanently Delete CV?"
        description="This will purge the document, all version history snapshots, and associated export logs from PostgreSQL."
        confirmLabel="Purge Document"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
