'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Info, Layers } from 'lucide-react';

interface TemplateDetail {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminTemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [templateKey, setTemplateKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Modern');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(1);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [cvCount, setCvCount] = useState(0);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await apiClient<{ template: TemplateDetail; cvCount: number }>(
          `/api/admin/templates/${templateId}`
        );
        if (res?.template) {
          const t = res.template;
          setTemplateKey(t.templateKey);
          setName(t.name);
          setDescription(t.description);
          setCategory(t.category);
          setIsActive(t.isActive);
          setDisplayOrder(t.displayOrder);
          setThumbnailUrl(t.thumbnailUrl || '');
          setCvCount(res.cvCount || 0);
        }
      } catch (err: any) {
        toastError('Failed to load template', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTemplate();
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch(`/api/admin/templates/${templateId}`, {
        name: name.trim(),
        description: description.trim(),
        category,
        isActive,
        displayOrder: Number(displayOrder),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });

      toastSuccess('Template metadata updated');
      router.push('/admin/templates');
    } catch (err: any) {
      toastError('Update failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-500" />
        <p className="text-sm font-medium text-slate-400">Loading template configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/templates">
            <Button size="sm" variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Templates Catalog
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-white font-display">
              Edit Template: {name}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Key: {templateKey} · Used by {cvCount} CVs</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 bg-slate-900 border-slate-800 text-white space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white"
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { label: 'ATS', value: 'ATS' },
                { label: 'Modern', value: 'Modern' },
                { label: 'Classic', value: 'Classic' },
                { label: 'EU', value: 'EU' },
                { label: 'Creative', value: 'Creative' },
                { label: 'UK', value: 'UK' },
                { label: 'USA', value: 'USA' },
                { label: 'Minimal', value: 'Minimal' },
              ]}
              className="bg-slate-950 border-slate-800 text-white"
            />
          </div>

          <Textarea
            label="Description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-slate-950 border-slate-800 text-white"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Input
              label="Display Order (Sequence)"
              type="number"
              min="1"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
              className="bg-slate-950 border-slate-800 text-white"
            />

            <div className="pt-5">
              <Switch
                label="Active for New CVs"
                helperText="Users can select this template in the creation wizard"
                checked={isActive}
                onChange={setIsActive}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Input
              label="Cloudinary Thumbnail URL (Optional)"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/.../cv-maker/template-thumbnails/..."
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
              helperText="Static thumbnails can be uploaded via /scripts/upload-thumbnails.ts"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <Link href="/admin/templates">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              Save Configuration
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
