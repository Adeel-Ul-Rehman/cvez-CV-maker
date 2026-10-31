'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { api, apiClient, ApiError, triggerBlobDownload } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastSuccess, toastError, toastInfo } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { CvPreviewFrame } from '@/components/features/cv/cv-preview-frame';
import {
  PlusCircle,
  FileText,
  Copy,
  Share2,
  Download,
  Trash2,
  Edit3,
  CheckCircle,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  MoreVertical,
  Sparkles,
} from 'lucide-react';

interface CvItem {
  id: string;
  title: string;
  template_key: string;
  is_public: boolean;
  public_slug?: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [cvs, setCvs] = useState<CvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CvItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null);
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);

  const fetchCvs = async () => {
    try {
      const data = await api.get<{ cvs: CvItem[] }>('/api/cvs');
      setCvs(data?.cvs || []);
    } catch (err: any) {
      toastError('Could not load CVs', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  const handleDuplicate = async (cv: CvItem) => {
    if (cvs.length >= 5) {
      toastError('Quota reached', 'You have reached the 5 CV limit.');
      return;
    }

    try {
      await api.post(`/api/cv/${cv.id}/duplicate`);
      toastSuccess('CV Duplicated', `Created a copy of ${cv.title}`);
      fetchCvs();
    } catch (err: any) {
      toastError('Duplication failed', err?.message);
    }
  };

  const handleToggleShare = async (cv: CvItem) => {
    try {
      const updated = await api.post<{ cv: { isPublic: boolean; publicSlug: string } }>(
        `/api/cv/${cv.id}/share`,
        { isPublic: !cv.is_public }
      );
      toastSuccess(
        updated.cv.isPublic ? 'Public sharing enabled' : 'Public sharing disabled',
        updated.cv.isPublic ? 'Anyone with the link can view this CV.' : 'The public link is now inactive.'
      );
      fetchCvs();
    } catch (err: any) {
      toastError('Share toggle failed', err?.message);
    }
  };

  const handleExportDownload = async (cvId: string, format: 'pdf' | 'docx' | 'png' | 'jpg', title: string) => {
    setDownloadingId(cvId);
    setActiveDownloadMenu(null);
    try {
      const blob = await apiClient.downloadBlob(`/api/cv/${cvId}/export/${format}`, 'POST');
      triggerBlobDownload(blob, `${(title || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`);
      toastSuccess('Download complete', `Exported ${title} as .${format}`);
    } catch (err: any) {
      toastError('Export failed', err?.message || 'Could not generate document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.delete(`/api/cv/${deleteTarget.id}`);
      toastSuccess('CV Deleted', `${deleteTarget.title} was removed.`);
      setDeleteTarget(null);
      fetchCvs();
    } catch (err: any) {
      toastError('Delete failed', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const isAtLimit = cvs.length >= 5;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* GREETING & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your resumes, optimize with AI, and stream downloads.
          </p>
        </div>

        <div>
          {isAtLimit ? (
            <div className="relative group">
              <Button variant="primary" disabled leftIcon={<PlusCircle className="h-4 w-4" />}>
                New CV
              </Button>
              <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-20">
                You've reached the 5 CV limit. Delete a CV to create a new one.
              </div>
            </div>
          ) : (
            <Link href="/cv/new">
              <Button variant="primary" leftIcon={<PlusCircle className="h-4 w-4" />}>
                New CV
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 5-CV LIMIT BANNER */}
      {isAtLimit && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Maximum CV Limit Reached (5 of 5):</span> You have reached your allocated quota. Delete an existing CV if you wish to create or duplicate another.
          </div>
        </div>
      )}

      {/* STATS ROW */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-2.5 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                My CVs
              </p>
              <p className="text-sm sm:text-2xl font-bold font-display text-slate-900 dark:text-white mt-0.5">
                {cvs.length} <span className="text-[10px] sm:text-sm font-normal text-slate-400">/ 5</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Status
              </p>
              <div className="mt-1 flex items-center justify-center sm:justify-start">
                {user?.emailVerified ? (
                  <Badge variant="success" className="text-[9px] sm:text-xs px-1.5 py-0">Verified</Badge>
                ) : (
                  <Badge variant="warning" className="text-[9px] sm:text-xs px-1.5 py-0">Unverified</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                Plan
              </p>
              <p className="text-xs sm:text-base font-bold text-slate-900 dark:text-white mt-1 truncate">
                <span className="text-primary-600 dark:text-primary-400">Free</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK ONBOARDING GUIDE FOR FIRST-TIME USERS */}
      {!loading && cvs.length <= 1 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border border-primary-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-bold text-xs sm:text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Quick Start: 3 Steps to Your Job-Ready CV</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Guided Assistant</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Select Template</p>
                <p className="text-[10px] text-slate-500 truncate">8 ATS-friendly layouts</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Enhance with AI</p>
                <p className="text-[10px] text-slate-500 truncate">Auto-write bullet points</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60">
              <div className="h-6 w-6 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">Download PDF</p>
                <p className="text-[10px] text-slate-500 truncate">Export & share anywhere</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CV LIST */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Documents</h2>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" withLogo label="Loading your resumes..." />
          </div>
        ) : cvs.length === 0 ? (
          <EmptyState
            title="No CVs Created Yet"
            description="Create your first job-winning resume with our ATS-friendly builder and smart AI assistant."
            actionLabel="Create Your First CV"
            onAction={() => router.push('/cv/new')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
            {cvs.map((cv) => (
              <Card
                key={cv.id}
                className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <Link href={`/cv/${cv.id}/editor`} className="block w-full h-full cursor-pointer">
                      <CvPreviewFrame cvId={cv.id} title={`${cv.title} preview`} />
                    </Link>

                    {/* Status Badge */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 pointer-events-none">
                      {cv.is_public ? (
                        <Badge variant="success" className="text-[9px] sm:text-xs px-1.5 py-0 shadow-xs">Public</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] sm:text-xs px-1.5 py-0 bg-white/90 dark:bg-slate-900/90 shadow-xs">Private</Badge>
                      )}
                    </div>

                    {/* Desktop Hover Overlay */}
                    <div className="hidden sm:flex absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 backdrop-blur-[2px]">
                      <Link href={`/cv/${cv.id}/editor`}>
                        <Button variant="primary" size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>
                          Edit CV
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="p-2.5 sm:p-4 space-y-0.5 sm:space-y-1">
                    <h3 className="font-semibold text-xs sm:text-base text-slate-900 dark:text-white truncate" title={cv.title}>
                      {cv.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                      Updated {formatDate(cv.updated_at)}
                    </p>
                  </div>
                </div>

                {/* Mobile Actions (Edit button + One-Tap PDF + Quick menu) */}
                <div className="sm:hidden p-2 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1">
                  <Link href={`/cv/${cv.id}/editor`} className="flex-1 min-w-0">
                    <Button variant="primary" size="sm" className="w-full text-[11px] h-7 px-1.5 py-0 font-medium">
                      Edit
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportDownload(cv.id, 'pdf', cv.title)}
                    loading={downloadingId === cv.id}
                    className="h-7 px-2 text-[11px] font-semibold text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-900 shrink-0"
                    title="Download PDF directly"
                    aria-label="Download PDF"
                  >
                    <Download className="h-3 w-3 mr-0.5" />
                    <span>PDF</span>
                  </Button>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuId(mobileMenuId === cv.id ? null : cv.id)}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      aria-label="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    {mobileMenuId === cv.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40 bg-black/20"
                          onClick={() => setMobileMenuId(null)}
                        />
                        <div className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 text-left text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              handleDuplicate(cv);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Duplicate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              handleToggleShare(cv);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                          >
                            <Share2 className={cv.is_public ? 'h-3.5 w-3.5 text-emerald-500' : 'h-3.5 w-3.5'} />
                            <span>{cv.is_public ? 'Make Private' : 'Make Public'}</span>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              handleExportDownload(cv.id, 'pdf', cv.title);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                          >
                            <Download className="h-3.5 w-3.5 text-primary-500" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              handleExportDownload(cv.id, 'docx', cv.title);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                          >
                            <Download className="h-3.5 w-3.5 text-blue-500" />
                            <span>Download DOCX</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              handleExportDownload(cv.id, 'png', cv.title);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                          >
                            <Download className="h-3.5 w-3.5 text-purple-500" />
                            <span>Download PNG</span>
                          </button>

                          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                          <button
                            type="button"
                            onClick={() => {
                              setMobileMenuId(null);
                              setDeleteTarget(cv);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete CV</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop Actions Footer */}
                <div className="hidden sm:flex p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 items-center justify-between gap-1 text-slate-500">
                  <Link href={`/cv/${cv.id}/editor`}>
                    <Button variant="ghost" size="sm" aria-label="Edit">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(cv)}
                    aria-label="Duplicate"
                    title="Duplicate CV"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleShare(cv)}
                    aria-label="Share"
                    title={cv.is_public ? 'Make Private' : 'Make Public'}
                  >
                    <Share2 className={cv.is_public ? 'h-4 w-4 text-emerald-500' : 'h-4 w-4'} />
                  </Button>

                  {/* Export Dropdown */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveDownloadMenu(activeDownloadMenu === cv.id ? null : cv.id)
                      }
                      loading={downloadingId === cv.id}
                      aria-label="Download formats"
                    >
                      <Download className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3 ml-0.5 text-slate-400" />
                    </Button>

                    {activeDownloadMenu === cv.id && (
                      <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 text-left text-xs">
                        <button
                          type="button"
                          onClick={() => handleExportDownload(cv.id, 'pdf', cv.title)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          Download as PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportDownload(cv.id, 'docx', cv.title)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          Download as DOCX
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportDownload(cv.id, 'png', cv.title)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          Download as PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportDownload(cv.id, 'jpg', cv.title)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                        >
                          Download as JPG
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(cv)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    aria-label="Delete CV"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/templates" className="block">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 transition-colors flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">Explore Resume Templates</p>
                <p className="text-xs text-slate-500">Preview Europass, Chronological, and Creative designs</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
          <Link href="/cv/new" className="block">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 transition-colors flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">Launch Guided Resume Wizard</p>
                <p className="text-xs text-slate-500">Step-by-step assistant with real-time AI bullet suggestions</p>
              </div>
              <ExternalLink className="h-4 w-4 text-slate-400" />
            </div>
          </Link>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete CV Document"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? All version snapshots will be permanently removed.`}
        confirmLabel="Delete Permanently"
      />
    </div>
  );
}
