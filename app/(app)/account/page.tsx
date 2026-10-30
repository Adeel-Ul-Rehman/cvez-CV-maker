'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMe, logoutUser, updateUserProfile } from '@/store/slices/authSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import {
  User,
  Mail,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Shield,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete Account State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toastError('Name is required');
      return;
    }

    setSavingProfile(true);
    try {
      let finalAvatarUrl = user?.avatarUrl;

      // If user selected a new file, upload to /api/upload/avatar first
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await apiClient<{ avatarUrl: string }>('/api/upload/avatar', {
          method: 'POST',
          body: formData,
        });
        if (uploadRes?.avatarUrl) {
          finalAvatarUrl = uploadRes.avatarUrl;
        }
      }

      await apiClient.patch('/api/user/profile', {
        fullName: fullName.trim(),
        avatarUrl: finalAvatarUrl,
      });

      dispatch(updateUserProfile({ fullName: fullName.trim(), avatarUrl: finalAvatarUrl }));
      // Non-blocking background sync
      dispatch(fetchMe());
      setAvatarFile(null);
      toastSuccess('Profile updated successfully');
    } catch (err: any) {
      toastError('Failed to update profile', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toastError('Current password required');
      return;
    }
    if (newPassword.length < 8) {
      toastError('Password too short', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords mismatch', 'New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post('/api/user/change-password', {
        currentPassword,
        newPassword,
      });

      toastSuccess('Password changed', 'Please sign in again with your new password.');
      await dispatch(logoutUser());
      router.push('/login?message=password_changed');
    } catch (err: any) {
      toastError('Password change failed', err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toastError(
        user?.provider === 'google'
          ? 'Type DELETE to confirm'
          : 'Password required to delete account'
      );
      return;
    }

    setDeletingAccount(true);
    try {
      await apiClient.delete('/api/user/account', {
        password: deletePassword,
      });

      toastSuccess('Account deleted', 'Your account and all associated CVs have been removed.');
      await dispatch(logoutUser());
      router.push('/');
    } catch (err: any) {
      toastError('Failed to delete account', err.message);
    } finally {
      setDeletingAccount(false);
      setDeleteModalOpen(false);
    }
  };

  const isGoogleUser = user?.provider === 'google';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Page Title */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal profile, credentials, and account preferences.
        </p>
      </div>

      {/* Section 1: Personal Profile & Avatar */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Profile Details
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Your name and photo appear on your account and can be synced to your CVs.
          </p>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed pr-28 text-slate-500"
                  />
                  <div className="absolute right-3 top-2.5">
                    {isGoogleUser ? (
                      <Badge variant="outline" className="text-[10px] py-0.5 gap-1 font-medium border-slate-300 dark:border-slate-700">
                        <svg className="h-3 w-3 inline" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Google SSO
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] py-0.5">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isGoogleUser
                    ? 'Primary email managed via Google OAuth. Email cannot be modified.'
                    : 'Primary email used for sign-in and security notifications.'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                Profile Picture
              </label>
              <FileDropzone
                onFileSelect={(file) => setAvatarFile(file)}
                currentImageUrl={user?.avatarUrl}
                maxSizeKB={100}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Max 100 KB limit. Images are automatically optimized and compressed for lightning-fast loading.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="submit" variant="primary" loading={savingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Section 2: Security & Password */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary-600" />
            Security & Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your credentials and account authentication methods.
          </p>
        </div>

        {isGoogleUser ? (
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="h-11 w-11 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Signed in with Google Single Sign-On
                </span>
                <Badge variant="success" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your account is authenticated via Google (<span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span>). Because your login is verified through Google OAuth, you don&apos;t need a local password. For security settings or 2-factor verification, visit your Google Account security center.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="pt-2">
              <Button type="submit" variant="outline" loading={changingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Section 3: Danger Zone (Delete Account) */}
      <Card className="p-6 sm:p-8 border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Permanently delete your account and all associated CV documents, exports, and version history.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            leftIcon={<Trash2 className="h-4 w-4" />}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Account Password Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        description="This action is immediate and irrevocable. All your saved resumes and data will be permanently purged."
        size="md"
      >
        <div className="space-y-4">
          {isGoogleUser ? (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please type <strong className="text-slate-900 dark:text-slate-100 font-bold">DELETE</strong> to confirm permanent deletion of your Google account:
            </p>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please enter your password to confirm permanent deletion:
            </p>
          )}

          <Input
            type={isGoogleUser ? 'text' : 'password'}
            placeholder={isGoogleUser ? 'Type DELETE' : 'Enter your password...'}
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deletingAccount}
              onClick={handleDeleteAccount}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
