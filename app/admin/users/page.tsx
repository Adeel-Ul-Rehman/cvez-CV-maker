'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { Users, Search, Eye, Filter } from 'lucide-react';

interface UserListItem {
  id: string;
  email: string;
  fullName: string | null;
  role: 'user' | 'admin';
  emailVerified: boolean;
  cvCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('page', String(page));
      query.set('limit', '20');
      if (search.trim()) query.set('search', search.trim());
      if (roleFilter) query.set('role', roleFilter);
      if (verifiedFilter !== '') query.set('verified', verifiedFilter);

      const res = await apiClient<{
        users: UserListItem[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/api/admin/users?${query.toString()}`);

      if (res?.users) {
        setUsers(res.users);
        setTotal(res.total);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      toastError('Failed to load users', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, verifiedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            User Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered candidate accounts, administrative roles, and verification statuses ({total} total).
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border-slate-800 text-white"
          />
        </div>

        <div className="w-36">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Roles', value: '' },
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <div className="w-40">
          <Select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Verification', value: '' },
              { label: 'Verified', value: 'true' },
              { label: 'Unverified', value: 'false' },
            ]}
            className="bg-slate-900 border-slate-800 text-white text-xs"
          />
        </div>

        <Button type="submit" size="sm" variant="outline" className="border-slate-800 text-slate-200">
          <Search className="h-4 w-4 mr-1" /> Search
        </Button>
      </form>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Spinner size="lg" className="text-primary-500 mx-auto" />
            <p className="text-xs text-slate-400">Loading user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No users match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">CV Count</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-100">{u.fullName || 'No name set'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={u.role === 'admin' ? 'warning' : 'outline'}
                        className="text-[10px] uppercase font-mono"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center text-emerald-400 font-medium text-[11px]">
                          ● Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-400 font-medium text-[11px]">
                          ○ Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-200">
                      {u.cvCount} / 5
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/users/${u.id}`}>
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
