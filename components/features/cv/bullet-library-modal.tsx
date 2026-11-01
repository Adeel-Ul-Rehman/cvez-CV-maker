'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Sparkles, BookOpen, Plus, Search, Tag, Filter } from 'lucide-react';
import {
  PREWRITTEN_BULLETS_BY_ROLE,
  findPrewrittenBulletsForRole,
  PrewrittenBullet,
} from '@/lib/cv/bullet-library-data';

interface BulletLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
  onSelectBullet: (bulletText: string) => void;
}

export function BulletLibraryModal({
  isOpen,
  onClose,
  defaultRole = '',
  onSelectBullet,
}: BulletLibraryModalProps) {
  const [selectedRole, setSelectedRole] = useState(
    defaultRole || PREWRITTEN_BULLETS_BY_ROLE[0].role
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [customBullets, setCustomBullets] = useState<PrewrittenBullet[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Active bullets from static library or AI generated
  const activeBullets = useMemo(() => {
    if (customBullets && customBullets.length > 0) {
      return customBullets;
    }
    return findPrewrittenBulletsForRole(selectedRole);
  }, [selectedRole, customBullets]);

  // Filter bullets by search term
  const filteredBullets = useMemo(() => {
    if (!searchQuery.trim()) return activeBullets;
    const q = searchQuery.toLowerCase();
    return activeBullets.filter(
      (b) =>
        b.text.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.impactType.toLowerCase().includes(q)
    );
  }, [activeBullets, searchQuery]);

  // Generate more with AI on demand
  const handleGenerateAiBullets = async () => {
    const roleToQuery = searchQuery.trim() || selectedRole;
    if (!roleToQuery) return;

    setAiLoading(true);
    try {
      const res = await apiClient.post<{ data: { bullets: PrewrittenBullet[] } }>(
        '/api/ai/bullet-library',
        { jobTitle: roleToQuery }
      );
      if (res.data?.data?.bullets) {
        setCustomBullets(res.data.data.bullets);
        toastSuccess('Generated New AI Bullets!', `Added ${res.data.data.bullets.length} bullets for "${roleToQuery}".`);
      }
    } catch (err: any) {
      toastError('AI Generation Failed', err.message || 'Could not fetch dynamic bullets.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleInsert = (text: string) => {
    onSelectBullet(text);
    toastSuccess('Inserted into Experience bullet list!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="High-Impact Bullet Point Library"
      size="lg"
    >
      <div className="space-y-4">
        {/* Role Quick Selection Pills */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Popular Job Roles:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {PREWRITTEN_BULLETS_BY_ROLE.map((group) => (
              <button
                key={group.role}
                type="button"
                onClick={() => {
                  setSelectedRole(group.role);
                  setCustomBullets(null);
                  setSearchQuery('');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedRole === group.role && !customBullets
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {group.role}
              </button>
            ))}
          </div>
        </div>

        {/* Search & AI Generate Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search or enter any job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateAiBullets}
            loading={aiLoading}
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-primary-500" />}
            className="shrink-0 text-xs"
          >
            AI Generate for "{searchQuery || selectedRole}"
          </Button>
        </div>

        {/* Bullets List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {filteredBullets.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>No prewritten bullets matched "{searchQuery}".</p>
              <Button
                size="sm"
                variant="primary"
                onClick={handleGenerateAiBullets}
                loading={aiLoading}
                leftIcon={<Sparkles className="h-3.5 w-3.5" />}
              >
                Generate Custom AI Bullets for "{searchQuery}"
              </Button>
            </div>
          ) : (
            filteredBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-800 transition-colors space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md">
                      {bullet.category}
                    </span>
                    {bullet.impactType && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        {bullet.impactType}
                      </span>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsert(bullet.text)}
                    className="h-7 px-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Insert
                  </Button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {/* Highlight bracketed placeholders */}
                  {bullet.text.split(/(\[[^\]]+\])/g).map((part, i) =>
                    part.startsWith('[') && part.endsWith(']') ? (
                      <span
                        key={i}
                        className="font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 px-1 py-0.5 rounded"
                      >
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

