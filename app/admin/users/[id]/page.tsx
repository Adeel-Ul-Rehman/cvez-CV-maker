'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Shield,
  Trash2,
  FileText,
  DownloadCloud,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface UserDetail {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: 'user' | 'admin';
    emailVerified: boolean;
    provider: string;
    avatarUrl: string | null;
    cvCount: number;
    createdAt: string;
    updatedAt: string;
  };
  cvs: Array<{
    id: string;
    title: string;
    templateKey: string;
    updatedAt: string;
    isPublic: boolean;
  }>;
  stats: {
    exportsCount: number;
    aiCallsCount: number;
  };
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserDetail | null>(null);

  // Mutation states
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [emailVerified, setEmailVerified] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // Dialogs
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUser = async () => {
    try {
      const res = await apiClient<UserDetail>(`/api/admin/users/${userId}`);
      if (res?.user) {
        setData(res);
        setRole(res.user.role);
        setEmailVerified(res.user.emailVerified);
      }
    } catch (err: any) {
      toastError('Failed to load user details', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const handleUpdate = async () => {
    setSavingChanges(true);
    try {
      await apiClient.patch(`/api/admin/users/${userId}`, {
        role,
        emailVerified,
      });
      toastSuccess('User updated successfully');
      loadUser();
    } catch (err: any) {
      toastError('Failed to update user', err.message);
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/users/${userId}`);
      toastSuccess('User removed permanently');
      router.push('/admin/users');
    } catch (err: any) {
      toastError('Failed to delete user', err.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-500" />
        <p className="text-sm font-medium text-slate-400">Loading user account record...</p>
      </div>
    );
  }

  const { user, cvs, stats } = data;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Users Directory
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-display">
              {user.fullName || 'User Profile'}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {user.id}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="danger"
          onClick={() => setDeleteConfirmOpen(true)}
          leftIcon={<Trash2 className="h-4 w-4" />}
        >
          Purge User Account
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Settings Card */}
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 border-slate-800 text-white space-y-6">
            <div className="flex items-center gap-4">
              <Avatar src={user.avatarUrl} name={user.fullName} size="lg" />
              <div>
                <h3 className="font-bold text-base">{user.fullName || 'Unnamed'}</h3>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={user.role === 'admin' ? 'warning' : 'outline'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.emailVerified ? 'success' : 'danger'}>
                    {user.emailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4 text-xs">
              <Select
                label="Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                options={[
                  { label: 'Standard User (user)', value: 'user' },
                  { label: 'System Administrator (admin)', value: 'admin' },
                ]}
                className="bg-slate-950 border-slate-800 text-white"
              />

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-semibold text-slate-200">Email Verification Status</p>
                  <p className="text-[11px] text-slate-400">Override OTP verification check</p>
                </div>
                <Switch checked={emailVerified} onChange={setEmailVerified} />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Button
                  fullWidth
                  variant="primary"
                  loading={savingChanges}
                  onClick={handleUpdate}
                >
                  Save Account Changes
                </Button>
              </div>
            </div>
          </Card>

          {/* Activity Metrics Card */}
          <Card className="p-5 bg-slate-900 border-slate-800 text-white space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Usage Telemetry
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="block text-xl font-bold text-emerald-400">{cvs.length}</span>
                <span className="text-[10px] text-slate-400">CV Documents</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="block text-xl font-bold text-blue-400">{stats.exportsCount}</span>
                <span className="text-[10px] text-slate-400">Exports Generated</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="block text-xl font-bold text-amber-400">{stats.aiCallsCount}</span>
                <span className="text-[10px] text-slate-400">AI Invocations</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="block text-xl font-bold text-primary-400">{user.provider}</span>
                <span className="text-[10px] text-slate-400">Auth Method</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: User's CVs List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-400" />
            Owned CV Documents ({cvs.length} / 5)
          </h3>

          {cvs.length === 0 ? (
            <Card className="p-8 text-center bg-slate-900 border-slate-800 text-slate-400 text-sm">
              This user has not created any CV documents yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {cvs.map((cv) => (
                <Card
                  key={cv.id}
                  className="p-4 bg-slate-900 border-slate-800 text-white hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-100">{cv.title}</h4>
                      <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-[10px]">
                        {cv.templateKey}
                      </Badge>
                      {cv.isPublic && (
                        <Badge variant="success" className="text-[10px]">
                          Public
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Last edited {format(new Date(cv.updatedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>

                  <Link href={`/admin/cvs/${cv.id}`}>
                    <Button size="sm" variant="outline" className="border-slate-800 text-slate-200" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Inspect Document
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={`Permanently delete user ${user.email}?`}
        description="All user records, active sessions, and associated CVs will be immediately purged. This operation cannot be reversed."
        confirmLabel="Purge Account"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
