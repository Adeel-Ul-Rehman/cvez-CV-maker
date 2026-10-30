'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toastError, toastSuccess } from '@/components/ui/toast';
import {
  UploadCloud,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  Palette,
  Type,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';

export default function AdminTemplateImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [inputMode, setInputMode] = useState<'upload' | 'path'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localFilePath, setLocalFilePath] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateKey, setTemplateKey] = useState('');
  const [category, setCategory] = useState('Modern');
  const [isAts, setIsAts] = useState(false);

  // Status state
  const [importing, setImporting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const handleNameChange = (val: string) => {
    setTemplateName(val);
    if (!templateKey || templateKey === slugify(templateName)) {
      setTemplateKey(slugify(val));
    }
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setSelectedFile(file);
      const inferredName = file.name.replace(/\.docx$/i, '').replace(/[_-]/g, ' ');
      if (!templateName) handleNameChange(inferredName);
    } else {
      toastError('Please drop a valid .docx Word file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const inferredName = file.name.replace(/\.docx$/i, '').replace(/[_-]/g, ' ');
      if (!templateName) handleNameChange(inferredName);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toastError('Template Name is required');
      return;
    }

    if (inputMode === 'upload' && !selectedFile) {
      toastError('Please choose or drag-and-drop a .docx file');
      return;
    }

    if (inputMode === 'path' && !localFilePath.trim()) {
      toastError('Please enter the local disk file path');
      return;
    }

    setImporting(true);
    setProgressMsg('Analyzing document XML and extracting layout...');

    try {
      let res: Response;

      if (inputMode === 'upload' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', templateName.trim());
        formData.append('key', templateKey.trim() || slugify(templateName));
        formData.append('category', category);
        formData.append('isAts', String(isAts));

        setTimeout(() => setProgressMsg('Extracting embedded media & typography...'), 1200);
        setTimeout(() => setProgressMsg('Rendering preview & capturing thumbnail...'), 2800);

        res = await fetch('/api/admin/templates/import', {
          method: 'POST',
          body: formData,
        });
      } else {
        setTimeout(() => setProgressMsg('Extracting layout from local file path...'), 1200);
        setTimeout(() => setProgressMsg('Rendering preview & capturing thumbnail...'), 2800);

        res = await fetch('/api/admin/templates/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filePath: localFilePath.trim(),
            name: templateName.trim(),
            key: templateKey.trim() || slugify(templateName),
            category,
            isAts,
          }),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'Failed to import template');
      }

      toastSuccess(`Template "${templateName}" imported successfully!`);
      setImportResult(json.data);
    } catch (err: any) {
      toastError('Import failed', err.message);
    } finally {
      setImporting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <Link href="/admin/templates">
            <span className="text-xs text-primary-400 hover:underline inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Templates Catalog
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-primary-400" />
            Word Template Importer
          </h1>
          <p className="text-xs text-slate-400">
            Import any Word (.docx) file to automatically extract column structures, colors, fonts, profile photos, and register it for candidates.
          </p>
        </div>
      </div>

      {!importResult ? (
        /* IMPORT FORM */
        <form onSubmit={handleImport} className="space-y-6">
          {/* File Selection Method Switcher */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'upload'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Upload Word File (.docx)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('path')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'path'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enter Local File Path
            </button>
          </div>

          {/* Upload Dropzone */}
          {inputMode === 'upload' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-primary-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-full bg-primary-950/60 border border-primary-800/60 flex items-center justify-center text-primary-400">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? (
                    <span className="text-primary-400 font-bold">{selectedFile.name}</span>
                  ) : (
                    'Click to browse or drop your .docx Word file here'
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Microsoft Word (.docx) documents with embedded pictures and styling.
                </p>
              </div>
            </div>
          ) : (
            /* Local File Path Input */
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary-400" />
                Absolute File Path on Disk:
              </label>
              <Input
                placeholder="e.g. E:\Cv_maker\downloaded_templates\Adeel Ul Rehman.docx"
                value={localFilePath}
                onChange={(e) => {
                  setLocalFilePath(e.target.value);
                  const basename = e.target.value.split(/[/\\]/).pop()?.replace(/\.docx$/i, '');
                  if (basename && !templateName) {
                    handleNameChange(basename);
                  }
                }}
              />
              <p className="text-[11px] text-slate-400">
                Directly point to any Word template file on your computer.
              </p>
            </div>
          )}

          {/* Template Details Card */}
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-5 text-white">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Template Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Template Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Adeel Ul Rehman Signature"
                  value={templateName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Slug Key <span className="text-slate-500">(auto-generated)</span>
                </label>
                <Input
                  placeholder="e.g. adeel-ul-rehman"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(slugify(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Template Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { label: 'Modern', value: 'Modern' },
                  { label: 'Creative', value: 'Creative' },
                  { label: 'ATS Friendly', value: 'ATS' },
                  { label: 'Classic', value: 'Classic' },
                  { label: 'EU / Europass', value: 'EU' },
                  { label: 'Minimal', value: 'Minimal' },
                  { label: 'Academic', value: 'Academic' },
                ]}
              />

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="atsCheckbox"
                  checked={isAts}
                  onChange={(e) => setIsAts(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="atsCheckbox" className="text-xs text-slate-300 cursor-pointer">
                  Tag as <strong>ATS-Friendly</strong> (Single-column parser optimized)
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                The extractor will detect colors, fonts, 1 or 2 columns, and create a single-page layout.
              </span>

              <Button
                type="submit"
                variant="primary"
                loading={importing}
                leftIcon={<Sparkles className="h-4 w-4" />}
              >
                Analyze & Import Template
              </Button>
            </div>

            {importing && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-primary-400">
                <Spinner size="sm" />
                <span>{progressMsg || 'Processing template...'}</span>
              </div>
            )}
          </Card>
        </form>
      ) : (
        /* IMPORT SUCCESS VIEW */
        <div className="space-y-6">
          <Card className="p-6 bg-slate-900 border-emerald-900/60 space-y-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Template &quot;{importResult.name}&quot; Imported Successfully!
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registered under key <code className="text-emerald-400">{importResult.templateKey}</code> in the database.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFile(null);
                    setTemplateName('');
                    setTemplateKey('');
                  }}
                >
                  Import Another
                </Button>
                <Link href="/templates" target="_blank">
                  <Button variant="primary" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                    Open Showcase
                  </Button>
                </Link>
              </div>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Palette className="h-4 w-4 text-primary-400" />
                  Primary Accent Color
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-md border border-slate-700"
                    style={{ backgroundColor: importResult.definition?.defaultConfig?.primaryColor || '#0070C0' }}
                  />
                  <span className="font-mono text-xs text-white">
                    {importResult.definition?.defaultConfig?.primaryColor || '#0070C0'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Type className="h-4 w-4 text-primary-400" />
                  Detected Typography
                </div>
                <div className="text-xs font-medium text-white">
                  {importResult.definition?.defaultConfig?.fontFamily || 'Times New Roman'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Layers className="h-4 w-4 text-primary-400" />
                  Layout Columns
                </div>
                <div className="text-xs font-medium text-white">
                  {importResult.definition?.layoutHints?.columns === 1 ? '1 Column (ATS Classic)' : '2 Columns with Sidebar'}
                </div>
              </div>
            </div>

            {/* Live Preview Frame */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Live Generated Sample Preview:
                </span>
                <span className="text-[11px] text-slate-500">
                  Strictly 1 Single A4 Page (No blank page)
                </span>
              </div>
              <div className="relative aspect-[3/4] max-h-[700px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex justify-center">
                <iframe
                  src={`/api/templates/${importResult.templateKey}/sample-preview`}
                  title={importResult.name}
                  className="w-[794px] h-[1123px] origin-top scale-[0.6] bg-white rounded-lg shadow-2xl"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link href="/admin/templates">
                <Button variant="outline">Back to All Templates</Button>
              </Link>
              <Link href="/templates">
                <Button variant="primary">Use This Template to Build CV</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
