'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { Layers, Edit3, AlertCircle, Info, ExternalLink, UploadCloud } from 'lucide-react';

interface TemplateAdminItem {
  id: string;
  templateKey: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    try {
      const res = await apiClient<{ templates: TemplateAdminItem[] }>('/api/admin/templates');
      if (res?.templates) {
        setTemplates(res.templates);
      }
    } catch (err: any) {
      toastError('Failed to load templates', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleToggleActive = async (tpl: TemplateAdminItem) => {
    try {
      await apiClient.patch(`/api/admin/templates/${tpl.id}`, {
        isActive: !tpl.isActive,
      });
      toastSuccess(`Template ${!tpl.isActive ? 'activated' : 'deactivated'}`);
      loadTemplates();
    } catch (err: any) {
      toastError('Failed to toggle active status', err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-500" />
        <p className="text-sm font-medium text-slate-400">Loading templates catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Templates Catalog Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active CV designs, category taxonomies, display sequencing, and asset thumbnails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/templates/import">
            <Button variant="primary" leftIcon={<UploadCloud className="h-4 w-4" />}>
              Import Word Template (.docx)
            </Button>
          </Link>
        </div>
      </div>

      {/* Deploy Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/50 flex items-start gap-3 text-xs text-blue-200">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">System Architecture Note:</p>
          <p className="mt-0.5 leading-relaxed text-blue-300">
            Adding entirely new document layouts requires registering their React rendering component and DOCX template XML in the codebase. You can modify names, descriptions, categories, display order, and active availability for all 3 registered templates below.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        {templates.map((tpl) => (
          <Card
            key={tpl.id}
            className="p-5 bg-slate-900 border-slate-800 text-white flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            {/* Thumbnail Mini Preview */}
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <iframe
                src={`/api/templates/${tpl.templateKey}/sample-preview`}
                title={tpl.name}
                className="w-[800px] h-[1100px] origin-top-left scale-[0.34] pointer-events-none select-none bg-white"
                tabIndex={-1}
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-[10px] bg-slate-950/80">
                  {tpl.category}
                </Badge>
                <Badge
                  variant={tpl.isActive ? 'success' : 'danger'}
                  className="text-[10px]"
                >
                  {tpl.isActive ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-100">{tpl.name}</h3>
                <span className="text-[11px] font-mono text-slate-400">Order: {tpl.displayOrder}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>
              <p className="text-[11px] font-mono text-slate-500 pt-1">Key: {tpl.templateKey}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Available:</span>
                <Switch checked={tpl.isActive} onChange={() => handleToggleActive(tpl)} />
              </div>

              <Link href={`/admin/templates/${tpl.id}`}>
                <Button size="sm" variant="outline" className="border-slate-800 text-slate-200" leftIcon={<Edit3 className="h-3.5 w-3.5" />}>
                  Edit Metadata
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
