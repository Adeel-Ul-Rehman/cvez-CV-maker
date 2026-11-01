'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImproveSummaryModal } from '@/components/features/ai/improve-summary-modal';
import { ImproveBulletsModal } from '@/components/features/ai/improve-bullets-modal';
import { ImproveSkillsModal } from '@/components/features/ai/improve-skills-modal';
import { SuggestStrengthsModal } from '@/components/features/ai/suggest-strengths-modal';
import { AtsCheckModal } from '@/components/features/ai/ats-check-modal';
import { TemplateRecommendModal } from '@/components/features/ai/template-recommend-modal';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient, triggerBlobDownload } from '@/lib/api-client';
import { compressImageTo100KB } from '@/lib/image-compressor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Download,
  Share2,
  Sparkles,
  History,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
  Plus,
  Palette,
  FileText,
  Copy,
  ExternalLink,
  Check,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Save,
  Camera,
  UploadCloud,
  User,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

interface CvConfig {
  fontFamily: string;
  fontSizePt: number;
  primaryColor: string;
  spacingScale: number;
  showPhoto: boolean;
  photoPosition?: 'left' | 'center' | 'right';
  photoShape?: 'square' | 'rounded' | 'circle';
  lineHeight?: number;
  headingStyle?: 'uppercase' | 'capitalize' | 'underlined' | 'bordered';
  pageSize: 'A4' | 'LETTER';
}

// Draggable Sortable Item Component for Sections
function SortableSectionItem({
  section,
  children,
  onToggleVisible,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: any;
  children: React.ReactNode;
  onToggleVisible: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [expanded, setExpanded] = useState(true);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border transition-all bg-white dark:bg-slate-900 overflow-hidden ${
        section.visible === false
          ? 'border-dashed border-slate-300 dark:border-slate-800 opacity-60'
          : 'border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className={`p-1 rounded shrink-0 transition-colors ${
                canMoveUp
                  ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
              }`}
              title="Move section up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className={`p-1 rounded shrink-0 transition-colors ${
                canMoveDown
                  ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
              }`}
              title="Move section down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-left font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 hover:text-primary-600 flex items-center gap-1.5 truncate"
          >
            <span className="truncate">{section.title}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onToggleVisible}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
            title={section.visible === false ? 'Hidden from CV' : 'Visible on CV'}
          >
            {section.visible === false ? (
              <EyeOff className="h-4 w-4 text-amber-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-500 rounded"
            title="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && <div className="p-4 sm:p-5">{children}</div>}
    </div>
  );
}

export default function CvEditorPage() {
  const params = useParams();
  const router = useRouter();
  const cvId = params.id as string;
  const authUser = useAppSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [savingAndExiting, setSavingAndExiting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content');
  const [mobileMode, setMobileMode] = useState<'edit' | 'preview'>('edit');
  const [previewTimestamp, setPreviewTimestamp] = useState(Date.now());

  // Zoom & Preview scaling state
  const [zoomMode, setZoomMode] = useState<'fit-page' | 'fit-width' | 'custom'>('fit-page');
  const [scale, setScale] = useState<number>(0.65);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const updateZoomScale = useCallback(() => {
    const el = previewScrollRef.current;
    if (!el) return;

    const availableWidth = el.clientWidth - 48;
    const availableHeight = el.clientHeight - 48;
    if (availableWidth <= 0 || availableHeight <= 0) return;

    const A4_WIDTH = 794;
    const A4_HEIGHT = 1123;

    if (zoomMode === 'fit-page') {
      const fitScale = Math.min(availableWidth / A4_WIDTH, availableHeight / A4_HEIGHT);
      setScale(Math.max(0.35, Math.min(1.25, Number(fitScale.toFixed(3)))));
    } else if (zoomMode === 'fit-width') {
      const fitScale = availableWidth / A4_WIDTH;
      setScale(Math.max(0.35, Math.min(1.5, Number(fitScale.toFixed(3)))));
    }
  }, [zoomMode]);

  useEffect(() => {
    updateZoomScale();
    const el = previewScrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      updateZoomScale();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateZoomScale]);

  const handleZoomIn = () => {
    setZoomMode('custom');
    setScale((prev) => Math.min(1.75, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setScale((prev) => Math.max(0.35, Number((prev - 0.1).toFixed(2))));
  };

  const handleSetFitPage = () => {
    setZoomMode('fit-page');
  };

  const handleSetFitWidth = () => {
    setZoomMode('fit-width');
  };

  const handleSet100 = () => {
    setZoomMode('custom');
    setScale(1.0);
  };

  // Core CV document state
  const [title, setTitle] = useState('');
  const [templateKey, setTemplateKey] = useState('jobhire-chronological');
  const [isPublic, setIsPublic] = useState(false);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const [basics, setBasics] = useState<any>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    summary: '',
    photoUrl: '',
  });

  const [sections, setSections] = useState<any[]>([]);

  const [config, setConfig] = useState<CvConfig>({
    fontFamily: 'Inter',
    fontSizePt: 10,
    primaryColor: '#2563EB',
    spacingScale: 1.0,
    showPhoto: true,
    pageSize: 'A4',
  });

  // Modals state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [exportingFmt, setExportingFmt] = useState<string | null>(null);

  // AI Feature Modals
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [bulletsModalOpen, setBulletsModalOpen] = useState(false);
  const [activeBulletTarget, setActiveBulletTarget] = useState<{
    sectionId: string;
    itemIndex: number;
    role?: string;
    company?: string;
    description: string;
  } | null>(null);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [strengthsModalOpen, setStrengthsModalOpen] = useState(false);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Confirm delete section dialog
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  // Drag and Drop sensor setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Save Debounce Timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load CV Data
  useEffect(() => {
    async function loadCv() {
      try {
        const res = await apiClient.get<{ cv: any }>(`/api/cv/${cvId}`);
        if (res.data?.cv) {
          const cv = res.data.cv;
          setTitle(cv.title || 'Untitled CV');
          setTemplateKey(cv.template_key);
          setIsPublic(Boolean(cv.is_public));
          setPublicSlug(cv.public_slug || null);

          if (cv.data?.basics) setBasics(cv.data.basics);
          if (cv.data?.sections) setSections(cv.data.sections);
          if (cv.config) setConfig(cv.config);

          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 500);
        }
      } catch (err: any) {
        toastError('Failed to load CV', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCv();
  }, [cvId]);

  // Autosave function
  const triggerAutosave = useCallback(
    (newTitle?: string, newTemplate?: string, newBasics?: any, newSections?: any[], newConfig?: any) => {
      if (isInitialLoadRef.current) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');

      saveTimerRef.current = setTimeout(async () => {
        try {
          await apiClient.patch(`/api/cv/${cvId}`, {
            title: newTitle !== undefined ? newTitle : title,
            templateKey: newTemplate !== undefined ? newTemplate : templateKey,
            data: {
              basics: newBasics || basics,
              sections: newSections || sections,
            },
            config: newConfig || config,
          });

          setSaveStatus('saved');
          setPreviewTimestamp(Date.now());
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err: any) {
          toastError('Auto-save error', err.message);
          setSaveStatus('idle');
        }
      }, 500);
    },
    [cvId, title, templateKey, basics, sections, config]
  );

  // Update handlers
  const handleBasicsChange = (field: string, val: any) => {
    const updated = { ...basics, [field]: val };
    setBasics(updated);
    triggerAutosave(undefined, undefined, updated, undefined, undefined);
  };

  const handleConfigChange = (field: keyof CvConfig, val: any) => {
    const updated = { ...config, [field]: val };
    setConfig(updated);
    triggerAutosave(undefined, undefined, undefined, undefined, updated);
  };

  // Section reorder via Dnd
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(sections, oldIndex, newIndex);
      setSections(reordered);
      triggerAutosave(undefined, undefined, undefined, reordered, undefined);
    }
  };

  // 1-Click Move Section Up / Down (Mobile & Desktop Friendly)
  const handleMoveSection = (secIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(secIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
  };

  // 1-Click Move Item Up / Down within any section
  const handleMoveItem = (secIdx: number, itemIdx: number, direction: 'up' | 'down') => {
    const items = [...(sections[secIdx].items || [])];
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const [moved] = items.splice(itemIdx, 1);
    items.splice(targetIdx, 0, moved);
    const updated = [...sections];
    updated[secIdx] = { ...updated[secIdx], items };
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
  };

  // 1-Click Duplicate Item within any section
  const handleDuplicateItem = (secIdx: number, itemIdx: number) => {
    const items = [...(sections[secIdx].items || [])];
    const itemToClone = items[itemIdx];
    if (!itemToClone) return;
    const cloned = JSON.parse(JSON.stringify(itemToClone));
    items.splice(itemIdx + 1, 0, cloned);
    const updated = [...sections];
    updated[secIdx] = { ...updated[secIdx], items };
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
    toastSuccess('Item duplicated');
  };

  // Toggle Section Visibility
  const toggleSectionVisibility = (secId: string) => {
    const updated = sections.map((s) =>
      s.id === secId ? { ...s, visible: s.visible === false ? true : false } : s
    );
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
  };

  // Delete Section
  const confirmDeleteSection = () => {
    if (!sectionToDelete) return;
    const updated = sections.filter((s) => s.id !== sectionToDelete);
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
    setSectionToDelete(null);
    toastSuccess('Section removed');
  };

  // Add Section
  const handleAddSection = (type: string) => {
    const newId = `sec-${Date.now()}`;
    let newSec: any = {
      id: newId,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      visible: true,
      items: [],
    };

    if (type === 'experience') {
      newSec.title = 'Work Experience';
      newSec.items = [
        {
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          current: false,
          location: '',
          description: '',
        },
      ];
    } else if (type === 'education') {
      newSec.title = 'Education';
      newSec.items = [
        {
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          current: false,
          location: '',
          description: '',
        },
      ];
    } else if (type === 'skills') {
      newSec.title = 'Skills';
      newSec.items = [{ name: 'New Skill', level: 'intermediate' }];
    } else if (type === 'strengths') {
      newSec.title = 'Strengths';
      newSec.items = [{ title: 'Problem Solving & Architecture', description: 'Methodical troubleshooting and scalable systems design.' }];
    } else if (type === 'projects') {
      newSec.title = 'Projects';
      newSec.items = [{ name: 'Project 1', url: '', description: '' }];
    } else if (type === 'certifications') {
      newSec.title = 'Certifications';
      newSec.items = [{ name: 'Certification Name', issuer: '', date: '' }];
    } else if (type === 'languages') {
      newSec.title = 'Languages';
      newSec.items = [{ name: 'Language', proficiency: 'fluent' }];
    } else if (type === 'interests') {
      newSec.title = 'Interests';
      newSec.items = [{ name: 'Artificial Intelligence & Robotics', description: '' }];
    } else if (type === 'references') {
      newSec.title = 'References';
      newSec.items = [{ name: 'Reference Name', relationship: 'Former Manager', company: 'Tech Inc', email: 'ref@example.com', phone: '+1 555-0199' }];
    } else if (type === 'awards') {
      newSec.title = 'Honors & Awards';
      newSec.items = [{ title: 'Best Innovator Award', issuer: 'Enterprise Summit', date: '2023', description: '' }];
    } else if (type === 'custom') {
      newSec.title = 'Custom Section';
      newSec.items = [{ title: 'Item Title', description: '' }];
    }

    const updated = [...sections, newSec];
    setSections(updated);
    triggerAutosave(undefined, undefined, undefined, updated, undefined);
    toastSuccess(`Added ${newSec.title}`);
  };

  // Export Download Trigger
  const handleExport = async (fmt: string) => {
    setExportingFmt(fmt);
    setExportDropdownOpen(false);
    try {
      const blob = await apiClient.downloadBlob(`/api/cv/${cvId}/export/${fmt}`, 'POST');
      triggerBlobDownload(
        blob,
        `${(title || 'resume').toLowerCase().replace(/[^a-z0-9_-]/gi, '_')}.${fmt}`
      );
      toastSuccess(`Exported ${fmt.toUpperCase()} successfully`);
    } catch (err: any) {
      toastError(`Failed to export ${fmt.toUpperCase()}`, err.message);
    } finally {
      setExportingFmt(null);
    }
  };

  // Public Sharing Toggle
  const handleToggleShare = async () => {
    try {
      const nextPublic = !isPublic;
      const res = await apiClient.patch<{ cv: any }>(`/api/cv/${cvId}`, {
        is_public: nextPublic,
      });
      if (res.data?.cv) {
        setIsPublic(Boolean(res.data.cv.is_public));
        setPublicSlug(res.data.cv.public_slug || null);
        toastSuccess(nextPublic ? 'Public sharing enabled' : 'Public sharing disabled');
      }
    } catch (err: any) {
      toastError('Failed to toggle sharing', err.message);
    }
  };

  // Photo upload handler: accepts up to 600 KB and auto-compresses to < 100 KB
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    try {
      // Auto-compress and scale to strictly < 100 KB
      const { file: compressedFile, dataUrl, originalSizeKB, compressedSizeKB } =
        await compressImageTo100KB(rawFile);

      const updatedBasics = { ...basics, photoUrl: dataUrl };
      const updatedConfig = { ...config, showPhoto: true };
      setBasics(updatedBasics);
      setConfig(updatedConfig);
      triggerAutosave(undefined, undefined, updatedBasics, undefined, updatedConfig);
      toastSuccess(
        'Profile photo updated',
        originalSizeKB > 95
          ? `Optimized from ${originalSizeKB} KB to ${compressedSizeKB} KB`
          : undefined
      );

      // Upload to Cloudinary/storage in background
      try {
        const formData = new FormData();
        formData.append('file', compressedFile);
        const res = await fetch('/api/upload/photo', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.photoUrl) {
            const cdnBasics = { ...basics, photoUrl: json.data.photoUrl };
            setBasics(cdnBasics);
            triggerAutosave(undefined, undefined, cdnBasics, undefined, undefined);
          }
        }
      } catch {
        // Local base64 dataUrl is already safely saved in state and DB
      }
    } catch (err: any) {
      toastError('Photo upload failed', err.message || 'Please select an image under 600 KB.');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    const updatedBasics = { ...basics, photoUrl: '' };
    setBasics(updatedBasics);
    triggerAutosave(undefined, undefined, updatedBasics, undefined, undefined);
    toastSuccess('Photo removed from CV');
  };

  // Save and Exit (redirect to My CVs / dashboard)
  const handleSaveAndExit = async () => {
    try {
      setSavingAndExiting(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      await apiClient.patch(`/api/cv/${cvId}`, {
        title,
        templateKey,
        data: {
          basics,
          sections,
        },
        config,
      });
      setSaveStatus('saved');
      toastSuccess('CV Saved', 'Your CV was saved successfully.');
      router.push('/dashboard');
    } catch (err: any) {
      toastError('Failed to save CV', err.message);
      setSavingAndExiting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading CV Studio...</p>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' && publicSlug
    ? `${window.location.origin}/cv/public/${publicSlug}`
    : '';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Editor Top Navigation Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Editable Document Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              triggerAutosave(e.target.value, undefined, undefined, undefined, undefined);
            }}
            placeholder="CV Title..."
            className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-primary-500 focus:outline-none px-1 py-0.5 max-w-[200px] sm:max-w-xs truncate"
          />

          {/* Save Status Indicator */}
          {saveStatus === 'saving' && (
            <span className="hidden sm:flex text-xs text-slate-400 items-center gap-1 font-medium">
              <Spinner size="sm" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="hidden sm:flex text-xs text-emerald-600 dark:text-emerald-400 items-center gap-1 font-medium">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> Saved
            </span>
          )}
        </div>

        {/* Topbar Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Edit/Preview Tabs */}
          <div className="flex lg:hidden bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg mr-1 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMobileMode('edit')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                mobileMode === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMode('preview');
                handleSetFitPage();
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all ${
                mobileMode === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
          </div>

          {/* Step Wizard Shortcut */}
          <Link href={`/cv/${cvId}/wizard`}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
              className="text-xs font-semibold text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/40"
              title="Open guided step-by-step wizard"
            >
              <span className="hidden sm:inline">Step Wizard</span>
              <span className="sm:hidden">Wizard</span>
            </Button>
          </Link>

          {/* Version History Link */}
          <Link href={`/cv/${cvId}/versions`}>
            <Button variant="ghost" size="sm" leftIcon={<History className="h-4 w-4" />}>
              <span className="hidden md:inline">History</span>
            </Button>
          </Link>

          {/* AI Tools Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              leftIcon={<Sparkles className="h-4 w-4 text-primary-600" />}
              rightIcon={<ChevronDown className="h-3 w-3" />}
            >
              <span className="hidden sm:inline">AI Tools</span>
            </Button>

            {aiMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs"
                onClick={() => setAiMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSummaryModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  <span>Improve Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSkillsModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  <span>Recommend Skills</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrengthsModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  <span>Suggest Strengths</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAtsModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  <span>Run ATS Check</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  <span>Recommend Template</span>
                </button>
              </div>
            )}
          </div>

          {/* Share Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareModalOpen(true)}
            leftIcon={<Share2 className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              loading={Boolean(exportingFmt)}
              leftIcon={<Download className="h-4 w-4" />}
              rightIcon={<ChevronDown className="h-3 w-3" />}
            >
              Export
            </Button>

            {exportDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs font-medium"
                onClick={() => setExportDropdownOpen(false)}
              >
                {['pdf', 'docx', 'png', 'jpg'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleExport(fmt)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300 uppercase"
                  >
                    <span>Download {fmt}</span>
                    <span className="text-[10px] text-slate-400">.{fmt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save & Exit to My CVs Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndExit}
            loading={savingAndExiting}
            leftIcon={<Save className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
            className="font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 whitespace-nowrap"
            title="Save changes and return to My CVs"
          >
            <span className="hidden sm:inline">Save &amp; Close</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </header>

      {/* Editor Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Editor Panel (45% on desktop) */}
        <div
          className={`w-full lg:w-[45%] h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${
            mobileMode === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Editor Tabs: Content vs Styling */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'content'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Content & Sections</span>
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'style'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>Design & Style</span>
            </button>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === 'content' ? (
              <div className="space-y-6">
                {/* Personal Basics Card */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Contact & Header Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Full Name"
                      value={basics.fullName || ''}
                      onChange={(e) => handleBasicsChange('fullName', e.target.value)}
                    />
                    <Input
                      label="Email"
                      value={basics.email || ''}
                      onChange={(e) => handleBasicsChange('email', e.target.value)}
                    />
                    <Input
                      label="Phone"
                      value={basics.phone || ''}
                      onChange={(e) => handleBasicsChange('phone', e.target.value)}
                    />
                    <Input
                      label="Location"
                      value={basics.location || ''}
                      onChange={(e) => handleBasicsChange('location', e.target.value)}
                    />
                    <Input
                      label="Website / Portfolio"
                      value={basics.website || ''}
                      onChange={(e) => handleBasicsChange('website', e.target.value)}
                    />
                    <Input
                      label="LinkedIn Profile"
                      value={basics.linkedin || ''}
                      onChange={(e) => handleBasicsChange('linkedin', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Professional Summary
                      </label>
                      <button
                        type="button"
                        onClick={() => setSummaryModalOpen(true)}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
                      >
                        <Sparkles className="h-3 w-3" /> AI Improve
                      </button>
                    </div>
                    <Textarea
                      rows={3}
                      value={basics.summary || ''}
                      onChange={(e) => handleBasicsChange('summary', e.target.value)}
                    />
                  </div>
                </div>

                {/* Profile Photo Upload & Positioning Card */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Profile Photo (Optional)
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Max 100 KB
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Photo Thumbnail */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-20 h-20 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center ${
                          (config.photoShape || 'rounded') === 'circle'
                            ? 'rounded-full'
                            : (config.photoShape || 'rounded') === 'square'
                            ? 'rounded-none'
                            : 'rounded-xl'
                        }`}
                      >
                        {basics.photoUrl ? (
                          <img
                            src={basics.photoUrl}
                            alt="Candidate Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>

                      {basics.photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          title="Remove photo"
                          className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => photoInputRef.current?.click()}
                          leftIcon={<UploadCloud className="h-4 w-4 text-primary-600" />}
                          className="text-xs"
                        >
                          {basics.photoUrl ? 'Change Photo' : 'Upload Photo'}
                        </Button>

                        {authUser?.avatarUrl && authUser.avatarUrl !== basics.photoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleBasicsChange('photoUrl', authUser.avatarUrl);
                              handleConfigChange('showPhoto', true);
                              toastSuccess('Applied account avatar to CV');
                            }}
                            className="text-xs text-slate-600 dark:text-slate-400"
                          >
                            Use Account Avatar
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        PNG, JPEG, or WebP up to 600 KB (auto-compressed to &lt; 100 KB). Photo automatically adjusts to your chosen position.
                      </p>
                    </div>
                  </div>

                  {/* Positioning & Shape Controls */}
                  {basics.photoUrl && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Photo Position on CV
                        </span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          {(['left', 'center', 'right'] as const).map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => handleConfigChange('photoPosition', pos)}
                              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                                (config.photoPosition || 'right') === pos
                                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs font-semibold'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Photo Shape
                        </span>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          {(['circle', 'rounded', 'square'] as const).map((shp) => (
                            <button
                              key={shp}
                              type="button"
                              onClick={() => handleConfigChange('photoShape', shp)}
                              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                                (config.photoShape || 'rounded') === shp
                                  ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-xs font-semibold'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              {shp}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          Display photo on CV
                        </span>
                        <Switch
                          checked={config.showPhoto}
                          onChange={(checked) => handleConfigChange('showPhoto', checked)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Draggable Sections */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sections.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sections.map((section, secIdx) => (
                        <SortableSectionItem
                          key={section.id}
                          section={section}
                          onToggleVisible={() => toggleSectionVisibility(section.id)}
                          onDelete={() => setSectionToDelete(section.id)}
                          onMoveUp={() => handleMoveSection(secIdx, 'up')}
                          onMoveDown={() => handleMoveSection(secIdx, 'down')}
                          canMoveUp={secIdx > 0}
                          canMoveDown={secIdx < sections.length - 1}
                        >
                          {/* Experience Section Body */}
                          {section.type === 'experience' && (
                            <div className="space-y-4">
                              {(section.items || []).map((item: any, itemIdx: number) => (
                                <div
                                  key={itemIdx}
                                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                                      #{itemIdx + 1} {item.role ? `• ${item.role}` : ''}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(secIdx, itemIdx, 'up')}
                                        disabled={itemIdx === 0}
                                        className={`p-1 rounded transition-colors ${
                                          itemIdx > 0
                                            ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                        }`}
                                        title="Move up"
                                      >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(secIdx, itemIdx, 'down')}
                                        disabled={itemIdx === (section.items || []).length - 1}
                                        className={`p-1 rounded transition-colors ${
                                          itemIdx < (section.items || []).length - 1
                                            ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                        }`}
                                        title="Move down"
                                      >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateItem(secIdx, itemIdx)}
                                        className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                        title="Duplicate role"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedSecs = [...sections];
                                          updatedSecs[secIdx].items = updatedSecs[secIdx].items.filter(
                                            (_: any, i: number) => i !== itemIdx
                                          );
                                          setSections(updatedSecs);
                                          triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        title="Delete role"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Company"
                                      value={item.company || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].company = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                    <Input
                                      placeholder="Role / Title"
                                      value={item.role || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].role = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                    <Input
                                      placeholder="Start Date"
                                      value={item.startDate || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].startDate = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                    <Input
                                      placeholder="End Date"
                                      value={item.endDate || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].endDate = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[11px] font-semibold text-slate-500">
                                        Achievements
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveBulletTarget({
                                            sectionId: section.id,
                                            itemIndex: itemIdx,
                                            role: item.role,
                                            company: item.company,
                                            description: item.description || '',
                                          });
                                          setBulletsModalOpen(true);
                                        }}
                                        className="text-[11px] text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 hover:underline"
                                      >
                                        <Sparkles className="h-3 w-3" /> Suggest Bullets
                                      </button>
                                    </div>
                                    <Textarea
                                      rows={2}
                                      value={item.description || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].description = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}

                              <Button
                                size="sm"
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                  const updatedSecs = [...sections];
                                  updatedSecs[secIdx].items.push({
                                    company: '',
                                    role: '',
                                    startDate: '',
                                    endDate: '',
                                    current: false,
                                    location: '',
                                    description: '',
                                  });
                                  setSections(updatedSecs);
                                  triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                }}
                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                              >
                                Add Position
                              </Button>
                            </div>
                          )}

                          {/* Education Section Body */}
                          {section.type === 'education' && (
                            <div className="space-y-3">
                              {(section.items || []).map((item: any, itemIdx: number) => (
                                <div
                                  key={itemIdx}
                                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 truncate max-w-[200px]">
                                      #{itemIdx + 1} {item.degree ? `• ${item.degree}` : ''}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(secIdx, itemIdx, 'up')}
                                        disabled={itemIdx === 0}
                                        className={`p-1 rounded transition-colors ${
                                          itemIdx > 0
                                            ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                        }`}
                                        title="Move up"
                                      >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveItem(secIdx, itemIdx, 'down')}
                                        disabled={itemIdx === (section.items || []).length - 1}
                                        className={`p-1 rounded transition-colors ${
                                          itemIdx < (section.items || []).length - 1
                                            ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                        }`}
                                        title="Move down"
                                      >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDuplicateItem(secIdx, itemIdx)}
                                        className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                        title="Duplicate education"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedSecs = [...sections];
                                          updatedSecs[secIdx].items = updatedSecs[secIdx].items.filter(
                                            (_: any, i: number) => i !== itemIdx
                                          );
                                          setSections(updatedSecs);
                                          triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        title="Delete education"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Institution / School"
                                      value={item.institution || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].institution = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                    <Input
                                      placeholder="Degree"
                                      value={item.degree || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].degree = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Field of Study"
                                      value={item.field || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].field = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                    <Input
                                      placeholder="Graduation Year"
                                      value={item.startDate || ''}
                                      onChange={(e) => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items[itemIdx].startDate = e.target.value;
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                  const updatedSecs = [...sections];
                                  updatedSecs[secIdx].items.push({
                                    institution: '',
                                    degree: '',
                                    field: '',
                                    startDate: '',
                                  });
                                  setSections(updatedSecs);
                                  triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                }}
                                leftIcon={<Plus className="h-3.5 w-3.5" />}
                              >
                                Add Degree
                              </Button>
                            </div>
                          )}

                          {/* Skills Section Body */}
                          {section.type === 'skills' && (
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {(section.items || []).map((skill: any, itemIdx: number) => (
                                  <span
                                    key={itemIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                  >
                                    <span>{skill.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedSecs = [...sections];
                                        updatedSecs[secIdx].items = updatedSecs[secIdx].items.filter(
                                          (_: any, i: number) => i !== itemIdx
                                        );
                                        setSections(updatedSecs);
                                        triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                      }}
                                      className="text-slate-400 hover:text-rose-500"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSkillsModalOpen(true)}
                                leftIcon={<Sparkles className="h-3.5 w-3.5 text-primary-600" />}
                              >
                                Recommend Skills via AI
                              </Button>
                            </div>
                          )}

                          {/* Other Sections (Strengths, Projects, Certifications, Languages, Interests, References, Awards, Custom) */}
                          {section.type !== 'experience' &&
                            section.type !== 'education' &&
                            section.type !== 'skills' && (
                              <div className="space-y-3">
                                {(section.items || []).map((item: any, itemIdx: number) => (
                                  <div
                                    key={itemIdx}
                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] font-bold uppercase text-slate-500">
                                        Item #{itemIdx + 1}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleMoveItem(secIdx, itemIdx, 'up')}
                                          disabled={itemIdx === 0}
                                          className={`p-1 rounded transition-colors ${
                                            itemIdx > 0
                                              ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                              : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                          }`}
                                          title="Move up"
                                        >
                                          <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMoveItem(secIdx, itemIdx, 'down')}
                                          disabled={itemIdx === (section.items || []).length - 1}
                                          className={`p-1 rounded transition-colors ${
                                            itemIdx < (section.items || []).length - 1
                                              ? 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                              : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'
                                          }`}
                                          title="Move down"
                                        >
                                          <ArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDuplicateItem(secIdx, itemIdx)}
                                          className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                          title="Duplicate item"
                                        >
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedSecs = [...sections];
                                            updatedSecs[secIdx].items = updatedSecs[secIdx].items.filter(
                                              (_: any, i: number) => i !== itemIdx
                                            );
                                            setSections(updatedSecs);
                                            triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                          }}
                                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                          title="Delete item"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Strengths Item Editor */}
                                    {section.type === 'strengths' && (
                                      <div className="space-y-2">
                                        <Input
                                          placeholder="Strength / Competency Title"
                                          value={item.title || ''}
                                          onChange={(e) => {
                                            const updatedSecs = [...sections];
                                            updatedSecs[secIdx].items[itemIdx].title = e.target.value;
                                            setSections(updatedSecs);
                                            triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                          }}
                                        />
                                        <Textarea
                                          placeholder="Description or context..."
                                          rows={2}
                                          value={item.description || ''}
                                          onChange={(e) => {
                                            const updatedSecs = [...sections];
                                            updatedSecs[secIdx].items[itemIdx].description = e.target.value;
                                            setSections(updatedSecs);
                                            triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* Interests Item Editor */}
                                    {section.type === 'interests' && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Input
                                          placeholder="Interest / Activity"
                                          value={item.name || ''}
                                          onChange={(e) => {
                                            const updatedSecs = [...sections];
                                            updatedSecs[secIdx].items[itemIdx].name = e.target.value;
                                            setSections(updatedSecs);
                                            triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                          }}
                                        />
                                        <Input
                                          placeholder="Detail / Achievement (optional)"
                                          value={item.description || ''}
                                          onChange={(e) => {
                                            const updatedSecs = [...sections];
                                            updatedSecs[secIdx].items[itemIdx].description = e.target.value;
                                            setSections(updatedSecs);
                                            triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* References Item Editor */}
                                    {section.type === 'references' && (
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input
                                            placeholder="Reference Name"
                                            value={item.name || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              updatedSecs[secIdx].items[itemIdx].name = e.target.value;
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                          <Input
                                            placeholder="Relationship / Role"
                                            value={item.relationship || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              updatedSecs[secIdx].items[itemIdx].relationship = e.target.value;
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <Input
                                            placeholder="Company"
                                            value={item.company || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              updatedSecs[secIdx].items[itemIdx].company = e.target.value;
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                          <Input
                                            placeholder="Email"
                                            value={item.email || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              updatedSecs[secIdx].items[itemIdx].email = e.target.value;
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                          <Input
                                            placeholder="Phone"
                                            value={item.phone || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              updatedSecs[secIdx].items[itemIdx].phone = e.target.value;
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {/* Default / Projects / Certs / Languages / Custom Editor */}
                                    {section.type !== 'strengths' &&
                                      section.type !== 'interests' &&
                                      section.type !== 'references' && (
                                        <div className="space-y-2">
                                          <Input
                                            placeholder="Title / Name"
                                            value={item.name || item.title || ''}
                                            onChange={(e) => {
                                              const updatedSecs = [...sections];
                                              if (item.name !== undefined) {
                                                updatedSecs[secIdx].items[itemIdx].name = e.target.value;
                                              } else {
                                                updatedSecs[secIdx].items[itemIdx].title = e.target.value;
                                              }
                                              setSections(updatedSecs);
                                              triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                            }}
                                          />
                                          {(item.description !== undefined || section.type === 'custom' || section.type === 'projects') && (
                                            <Textarea
                                              placeholder="Description or details..."
                                              rows={2}
                                              value={item.description || ''}
                                              onChange={(e) => {
                                                const updatedSecs = [...sections];
                                                updatedSecs[secIdx].items[itemIdx].description = e.target.value;
                                                setSections(updatedSecs);
                                                triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                              }}
                                            />
                                          )}
                                        </div>
                                      )}
                                  </div>
                                ))}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    fullWidth
                                    onClick={() => {
                                      const updatedSecs = [...sections];
                                      const blankItem =
                                        section.type === 'strengths'
                                          ? { title: 'New Strength', description: '' }
                                          : section.type === 'interests'
                                          ? { name: 'New Interest', description: '' }
                                          : section.type === 'references'
                                          ? { name: 'Reference Name', relationship: '', company: '', email: '', phone: '' }
                                          : { name: 'New Item', description: '' };
                                      updatedSecs[secIdx].items.push(blankItem);
                                      setSections(updatedSecs);
                                      triggerAutosave(undefined, undefined, undefined, updatedSecs, undefined);
                                    }}
                                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                                  >
                                    Add Item
                                  </Button>
                                  {section.type === 'strengths' && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setStrengthsModalOpen(true)}
                                      leftIcon={<Sparkles className="h-3.5 w-3.5 text-primary-600" />}
                                    >
                                      AI Suggest
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                        </SortableSectionItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Add Section Buttons Bar */}
                <div className="pt-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Insert Additional Section:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'experience',
                      'education',
                      'skills',
                      'strengths',
                      'projects',
                      'certifications',
                      'languages',
                      'interests',
                      'references',
                      'awards',
                      'custom',
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleAddSection(type)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors capitalize"
                      >
                        + {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* STYLE TAB CONTENT */
              <div className="space-y-6">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Typography & Layout Styles
                  </h3>

                  {/* Font Family (14 Professional Fonts) */}
                  <Select
                    label="Font Family"
                    value={config.fontFamily}
                    onChange={(e) => handleConfigChange('fontFamily', e.target.value)}
                    options={[
                      { label: 'Inter (Modern Minimalist)', value: 'Inter' },
                      { label: 'Roboto (Clean Modern)', value: 'Roboto' },
                      { label: 'Open Sans (Clear & Neutral)', value: 'Open Sans' },
                      { label: 'Lato (Warm & Corporate)', value: 'Lato' },
                      { label: 'Montserrat (Contemporary Bold)', value: 'Montserrat' },
                      { label: 'Poppins (Geometric Modern)', value: 'Poppins' },
                      { label: 'Arial (Universal Standard)', value: 'Arial' },
                      { label: 'Calibri (Corporate Standard)', value: 'Calibri' },
                      { label: 'Trebuchet MS (Dynamic Sans)', value: 'Trebuchet MS' },
                      { label: 'Verdana (Legible Screen)', value: 'Verdana' },
                      { label: 'Georgia (Refined Serif)', value: 'Georgia' },
                      { label: 'Merriweather (Executive Editorial Serif)', value: 'Merriweather' },
                      { label: 'Garamond (Traditional Elegant Serif)', value: 'Garamond' },
                      { label: 'Times New Roman (Academic Classic)', value: 'Times New Roman' },
                    ]}
                  />

                  {/* Font Size Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Base Font Size</span>
                      <span className="text-primary-600 font-bold">{config.fontSizePt} pt</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="14"
                      step="0.5"
                      value={config.fontSizePt}
                      onChange={(e) => handleConfigChange('fontSizePt', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>

                  {/* Primary Color Picker & Swatches */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                      Primary Accent Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                        placeholder="#2563EB"
                        className="font-mono text-xs flex-1"
                      />
                    </div>
                    {/* Color Swatch Presets */}
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {[
                        { label: 'Navy', hex: '#0B3D91' },
                        { label: 'Royal Blue', hex: '#2563EB' },
                        { label: 'Slate', hex: '#334155' },
                        { label: 'Emerald', hex: '#059669' },
                        { label: 'Violet', hex: '#7C3AED' },
                        { label: 'Teal', hex: '#0D9488' },
                        { label: 'Crimson', hex: '#BE123C' },
                        { label: 'Amber', hex: '#B45309' },
                        { label: 'Graphite', hex: '#111827' },
                        { label: 'Indigo', hex: '#4F46E5' },
                      ].map((swatch) => (
                        <button
                          key={swatch.hex}
                          type="button"
                          onClick={() => handleConfigChange('primaryColor', swatch.hex)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                            config.primaryColor.toLowerCase() === swatch.hex.toLowerCase()
                              ? 'border-slate-900 dark:border-white ring-2 ring-primary-500 scale-105'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={swatch.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Document Spacing Scale */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Document Spacing Scale</span>
                      <span className="text-primary-600 font-bold">{config.spacingScale}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.2"
                      step="0.05"
                      value={config.spacingScale}
                      onChange={(e) => handleConfigChange('spacingScale', parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>

                  {/* Line Height / Text Density */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                      Text Line Spacing
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Compact', val: 1.3 },
                        { label: 'Standard', val: 1.45 },
                        { label: 'Relaxed', val: 1.65 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleConfigChange('lineHeight', item.val)}
                          className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                            ((config as any).lineHeight || 1.45) === item.val
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Photo Styling Controls */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                          Profile Photo Display
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Toggle and adjust photo position &amp; shape on document
                        </span>
                      </div>
                      <Switch
                        checked={config.showPhoto}
                        onChange={(checked) => handleConfigChange('showPhoto', checked)}
                      />
                    </div>

                    {config.showPhoto && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                            Position
                          </label>
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {(['left', 'center', 'right'] as const).map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => handleConfigChange('photoPosition', pos)}
                                className={`flex-1 py-1 text-xs font-medium rounded capitalize ${
                                  (config.photoPosition || 'right') === pos
                                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold'
                                    : 'text-slate-500'
                                }`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">
                            Shape
                          </label>
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            {(['circle', 'rounded', 'square'] as const).map((shp) => (
                              <button
                                key={shp}
                                type="button"
                                onClick={() => handleConfigChange('photoShape', shp)}
                                className={`flex-1 py-1 text-xs font-medium rounded capitalize ${
                                  (config.photoShape || 'rounded') === shp
                                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold'
                                    : 'text-slate-500'
                                }`}
                              >
                                {shp}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page Size Radio */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                      Export Page Format
                    </label>
                    <div className="flex gap-4">
                      {['A4', 'LETTER'].map((sz) => (
                        <label key={sz} className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="pageSize"
                            value={sz}
                            checked={config.pageSize === sz}
                            onChange={() => handleConfigChange('pageSize', sz as any)}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span>{sz} Standard</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview Panel (55% on desktop) */}
        <div
          className={`w-full lg:w-[55%] h-full flex flex-col bg-slate-200/80 dark:bg-slate-950/80 overflow-hidden ${
            mobileMode === 'edit' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Preview Toolbar */}
          <div className="h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 select-none z-10">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <FileText className="h-4 w-4 text-primary-600" />
              <span className="hidden sm:inline">Preview:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {zoomMode === 'fit-page'
                  ? 'Fit Page'
                  : zoomMode === 'fit-width'
                  ? 'Fit Width'
                  : `${Math.round(scale * 100)}%`}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleSetFitPage}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  zoomMode === 'fit-page'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Fit whole page in view"
              >
                Fit Page
              </button>

              <button
                type="button"
                onClick={handleSetFitWidth}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  zoomMode === 'fit-width'
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Fit to pane width"
              >
                Fit Width
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.35}
                  className="p-1.5 sm:px-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleSet100}
                  className="px-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-x border-slate-200 dark:border-slate-800"
                  title="Reset to 100%"
                >
                  {Math.round(scale * 100)}%
                </button>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 1.75}
                  className="p-1.5 sm:px-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndExit}
                loading={savingAndExiting}
                leftIcon={<Save className="h-3.5 w-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs h-7 px-2.5 sm:px-3"
                title="Save CV and return to My CVs"
              >
                Save CV
              </Button>
            </div>
          </div>

          {/* Interactive Document Viewport */}
          <div
            ref={previewScrollRef}
            className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start relative scroll-smooth"
          >
            <div
              className="relative shadow-2xl rounded-sm overflow-hidden bg-white shrink-0 transition-[width,height] duration-150"
              style={{
                width: `${Math.round(794 * scale)}px`,
                height: `${Math.round(1123 * scale)}px`,
              }}
            >
              <iframe
                key={previewTimestamp}
                src={`/api/cv/${cvId}/preview?embed=1&t=${previewTimestamp}`}
                title="Live Document Preview"
                tabIndex={-1}
                scrolling={scale > 0.8 ? 'auto' : 'no'}
                className="border-0 bg-white absolute top-0 left-0 origin-top-left transition-transform duration-150"
                style={{
                  width: '794px',
                  height: '1123px',
                  transform: `scale(${scale})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Your CV"
        description="Enable a unique, secure public link to share your resume with employers or clients."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Public Web Link
              </p>
              <p className="text-xs text-slate-500">
                Anyone with this URL can view your read-only CV.
              </p>
            </div>
            <Switch checked={isPublic} onChange={handleToggleShare} />
          </div>

          {isPublic && publicSlug && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="font-mono text-xs select-all" />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toastSuccess('Link copied to clipboard');
                  }}
                  leftIcon={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <Button variant="ghost" leftIcon={<ExternalLink className="h-4 w-4" />}>
                    Open
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Delete Section Dialog */}
      <ConfirmDialog
        isOpen={Boolean(sectionToDelete)}
        onClose={() => setSectionToDelete(null)}
        onConfirm={confirmDeleteSection}
        title="Delete this section?"
        description="Are you sure you want to remove this entire section and its entries from your CV?"
        confirmLabel="Delete Section"
        variant="danger"
      />

      {/* AI Modals with Full CV Context */}
      <ImproveSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        currentSummary={basics.summary || ''}
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || (sections.find((s) => s.type === 'experience')?.items?.[0]?.role) || '',
          summary: basics.summary,
          experiences: (sections.find((s) => s.type === 'experience')?.items || []).map((e: any) => ({
            role: e.role,
            company: e.company,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
          })),
          education: (sections.find((s) => s.type === 'education')?.items || []).map((ed: any) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
            graduationDate: ed.endDate,
          })),
          skills: (sections.find((s) => s.type === 'skills')?.items || []).map((s: any) => s.name || s),
          strengths: (sections.find((s) => s.type === 'strengths')?.items || []).map((st: any) => st.name || st.title || st),
          certifications: (sections.find((s) => s.type === 'certifications')?.items || []).map((c: any) => c.name || c.title || c),
        }}
        onApply={(text) => handleBasicsChange('summary', text)}
      />

      {activeBulletTarget && (
        <ImproveBulletsModal
          isOpen={bulletsModalOpen}
          onClose={() => {
            setBulletsModalOpen(false);
            setActiveBulletTarget(null);
          }}
          currentDescription={activeBulletTarget.description}
          role={activeBulletTarget.role}
          company={activeBulletTarget.company}
          cvContext={{
            fullName: basics.fullName,
            headline: (basics as any).headline || activeBulletTarget.role || '',
            skills: (sections.find((s) => s.type === 'skills')?.items || []).map((s: any) => s.name || s),
            strengths: (sections.find((s) => s.type === 'strengths')?.items || []).map((st: any) => st.name || st.title || st),
          }}
          onApply={(bullet) => {
            const { sectionId, itemIndex } = activeBulletTarget;
            const updated = [...sections];
            const sec = updated.find((s) => s.id === sectionId);
            if (sec && sec.items[itemIndex]) {
              const cur = sec.items[itemIndex].description || '';
              sec.items[itemIndex].description = cur ? `${cur}\n• ${bullet}` : `• ${bullet}`;
              setSections(updated);
              triggerAutosave(undefined, undefined, undefined, updated, undefined);
            }
          }}
        />
      )}

      <ImproveSkillsModal
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        currentSkills={
          sections.find((s) => s.type === 'skills')?.items?.map((it: any) => it.name) || []
        }
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || (sections.find((s) => s.type === 'experience')?.items?.[0]?.role) || '',
          experiences: (sections.find((s) => s.type === 'experience')?.items || []).map((e: any) => ({
            role: e.role,
            company: e.company,
            description: e.description,
          })),
          education: (sections.find((s) => s.type === 'education')?.items || []).map((ed: any) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
          })),
          skills: (sections.find((s) => s.type === 'skills')?.items || []).map((s: any) => s.name || s),
        }}
        onAddSkill={(skill) => {
          const updated = [...sections];
          let skillSec = updated.find((s) => s.type === 'skills');
          if (!skillSec) {
            skillSec = {
              id: `skills-${Date.now()}`,
              type: 'skills',
              title: 'Skills',
              visible: true,
              items: [],
            };
            updated.push(skillSec);
          }
          if (!skillSec.items.some((i: any) => i.name.toLowerCase() === skill.name.toLowerCase())) {
            skillSec.items.push(skill);
            setSections(updated);
            triggerAutosave(undefined, undefined, undefined, updated, undefined);
          }
        }}
      />

      <SuggestStrengthsModal
        isOpen={strengthsModalOpen}
        onClose={() => setStrengthsModalOpen(false)}
        currentStrengths={
          sections.find((s) => s.type === 'strengths')?.items?.map((st: any) => st.title || st.name) || []
        }
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || (sections.find((s) => s.type === 'experience')?.items?.[0]?.role) || '',
          summary: basics.summary,
          experiences: (sections.find((s) => s.type === 'experience')?.items || []).map((e: any) => ({
            role: e.role,
            company: e.company,
            description: e.description,
          })),
          education: (sections.find((s) => s.type === 'education')?.items || []).map((ed: any) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
          })),
          skills: (sections.find((s) => s.type === 'skills')?.items || []).map((s: any) => s.name || s),
          strengths: (sections.find((s) => s.type === 'strengths')?.items || []).map((st: any) => st.title || st.name || st),
        }}
        onAddStrength={(strength) => {
          const updated = [...sections];
          let strSec = updated.find((s) => s.type === 'strengths');
          if (!strSec) {
            strSec = {
              id: `strengths-${Date.now()}`,
              type: 'strengths',
              title: 'Strengths & Highlights',
              visible: true,
              items: [],
            };
            updated.push(strSec);
          }
          if (!strSec.items.some((i: any) => (i.title || i.name || '').toLowerCase() === strength.title.toLowerCase())) {
            strSec.items.push(strength);
            setSections(updated);
            triggerAutosave(undefined, undefined, undefined, updated, undefined);
          }
        }}
      />

      <AtsCheckModal
        isOpen={atsModalOpen}
        onClose={() => setAtsModalOpen(false)}
        cvId={cvId}
      />

      <TemplateRecommendModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={(key) => {
          setTemplateKey(key);
          triggerAutosave(undefined, key, undefined, undefined, undefined);
          toastSuccess(`Switched to template: ${key}`);
        }}
      />
    </div>
  );
}
