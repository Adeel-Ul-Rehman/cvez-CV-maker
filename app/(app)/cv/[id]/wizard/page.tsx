'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { ImproveBulletsModal } from '@/components/features/ai/improve-bullets-modal';
import { ImproveSummaryModal } from '@/components/features/ai/improve-summary-modal';
import { ImproveSkillsModal } from '@/components/features/ai/improve-skills-modal';
import { SuggestStrengthsModal } from '@/components/features/ai/suggest-strengths-modal';
import { toastError, toastSuccess } from '@/components/ui/toast';
import { apiClient } from '@/lib/api-client';
import { CvPreviewFrame } from '@/components/features/cv/cv-preview-frame';
import { compressImageTo100KB } from '@/lib/image-compressor';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Target,
  FolderGit2,
  Award,
  Globe2,
  Heart,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  Edit3,
  ExternalLink,
  Camera,
  UploadCloud,
  Eye,
  FileEdit,
  Download,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Personal Basics', icon: User },
  { id: 2, name: 'Work Experience', icon: Briefcase },
  { id: 3, name: 'Education', icon: GraduationCap },
  { id: 4, name: 'Skills & Tools', icon: Sparkles },
  { id: 5, name: 'Strengths & Highlights', icon: Target, optional: true },
  { id: 6, name: 'Projects', icon: FolderGit2, optional: true },
  { id: 7, name: 'Certifications', icon: Award, optional: true },
  { id: 8, name: 'Languages', icon: Globe2, optional: true },
  { id: 9, name: 'Interests & Activities', icon: Heart, optional: true },
  { id: 10, name: 'Review & Finalize', icon: CheckCircle2 },
];

export default function CvWizardPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepQuery = searchParams.get('step');
  const cvId = params.id as string;

  const authUser = useAppSelector((state) => state.auth.user);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewTimestamp, setPreviewTimestamp] = useState<number>(Date.now());
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleWizardExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      await saveProgress();
      const blob = await apiClient.downloadBlob(`/api/cv/${cvId}/export/pdf`, 'POST');
      const filename = `${(cvTitle || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toastSuccess('Download complete', 'Your PDF resume has been downloaded.');
    } catch (err: any) {
      toastError('Download failed', err?.message || 'Could not export PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Photo upload handler: accepts up to 600 KB and auto-compresses to < 100 KB
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    try {
      const { file: compressedFile, dataUrl, originalSizeKB, compressedSizeKB } =
        await compressImageTo100KB(rawFile);

      setBasics((prev) => ({ ...prev, photoUrl: dataUrl }));
      toastSuccess(
        'Profile picture added',
        originalSizeKB > 95
          ? `Optimized from ${originalSizeKB} KB to ${compressedSizeKB} KB`
          : undefined
      );

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
            setBasics((prev) => ({ ...prev, photoUrl: json.data.photoUrl }));
          }
        }
      } catch {
        // Base64 dataUrl is safely set as fallback
      }
    } catch (err: any) {
      toastError('Photo upload failed', err.message || 'Please select an image under 600 KB.');
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // CV Data State
  const [cvTitle, setCvTitle] = useState('');
  const [basics, setBasics] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    summary: '',
    photoUrl: '',
  });

  const [experience, setExperience] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [strengths, setStrengths] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [customSections, setCustomSections] = useState<any[]>([]);

  // AI Modals state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [bulletsModalOpen, setBulletsModalOpen] = useState(false);
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [strengthsModalOpen, setStrengthsModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');

  // Fetch CV initial data
  useEffect(() => {
    async function loadCv() {
      try {
        const res = await apiClient.get<{ cv: any }>(`/api/cv/${cvId}`);
        if (res.data?.cv) {
          const cv = res.data.cv;
          setCvTitle(cv.title || 'My CV');
          if (cv.data?.basics) {
            setBasics((prev) => ({ ...prev, ...cv.data.basics }));
          }
          if (cv.data?.sections) {
            const expSec = cv.data.sections.find((s: any) => s.type === 'experience');
            if (expSec) setExperience(expSec.items || []);

            const eduSec = cv.data.sections.find((s: any) => s.type === 'education');
            if (eduSec) setEducation(eduSec.items || []);

            const skillSec = cv.data.sections.find((s: any) => s.type === 'skills');
            if (skillSec) setSkills(skillSec.items || []);

            const strSec = cv.data.sections.find((s: any) => s.type === 'strengths' || (s.type === 'custom' && s.title?.toLowerCase().includes('strength')));
            if (strSec) setStrengths(strSec.items || []);

            const projSec = cv.data.sections.find((s: any) => s.type === 'projects');
            if (projSec) setProjects(projSec.items || []);

            const certSec = cv.data.sections.find((s: any) => s.type === 'certifications');
            if (certSec) setCertifications(certSec.items || []);

            const langSec = cv.data.sections.find((s: any) => s.type === 'languages');
            if (langSec) setLanguages(langSec.items || []);

            const intSec = cv.data.sections.find((s: any) => s.type === 'interests' || (s.type === 'custom' && s.title?.toLowerCase().includes('interest')));
            if (intSec) setInterests(intSec.items || []);

            const custom = cv.data.sections.filter((s: any) => s.type === 'custom' && !s.title?.toLowerCase().includes('strength') && !s.title?.toLowerCase().includes('interest'));
            if (custom.length > 0) setCustomSections(custom);
          }

          // Restore exact step if specified via URL or saved progress
          const parsedQuery = stepQuery ? parseInt(stepQuery, 10) : null;
          const targetStep =
            parsedQuery && parsedQuery >= 1 && parsedQuery <= 10
              ? parsedQuery
              : cv.config?.wizardStep || cv.data?.meta?.wizardStep || 1;

          if (targetStep >= 1 && targetStep <= 10) {
            setCurrentStep(targetStep);
          }
        }
      } catch (err: any) {
        toastError('Failed to load CV', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCv();
  }, [cvId, stepQuery]);

  // Construct current sections array for saving
  const constructSectionsPayload = () => {
    const list: any[] = [];
    if (experience.length > 0) {
      list.push({
        id: 'experience-sec',
        type: 'experience',
        title: 'Work Experience',
        visible: true,
        items: experience,
      });
    }
    if (education.length > 0) {
      list.push({
        id: 'education-sec',
        type: 'education',
        title: 'Education',
        visible: true,
        items: education,
      });
    }
    if (skills.length > 0) {
      list.push({
        id: 'skills-sec',
        type: 'skills',
        title: 'Skills & Proficiencies',
        visible: true,
        items: skills,
      });
    }
    if (strengths.length > 0) {
      list.push({
        id: 'strengths-sec',
        type: 'strengths',
        title: 'Key Strengths & Highlights',
        visible: true,
        items: strengths,
      });
    }
    if (projects.length > 0) {
      list.push({
        id: 'projects-sec',
        type: 'projects',
        title: 'Projects & Initiatives',
        visible: true,
        items: projects,
      });
    }
    if (certifications.length > 0) {
      list.push({
        id: 'certifications-sec',
        type: 'certifications',
        title: 'Certifications',
        visible: true,
        items: certifications,
      });
    }
    if (languages.length > 0) {
      list.push({
        id: 'languages-sec',
        type: 'languages',
        title: 'Languages',
        visible: true,
        items: languages,
      });
    }
    if (interests.length > 0) {
      list.push({
        id: 'interests-sec',
        type: 'interests',
        title: 'Interests & Activities',
        visible: true,
        items: interests,
      });
    }
    customSections.forEach((cs, i) => {
      list.push({
        id: cs.id || `custom-${i}`,
        type: 'custom',
        title: cs.title || 'Additional Information',
        visible: true,
        items: cs.items || [],
      });
    });
    return list;
  };

  const saveProgress = async (targetStep?: number, markCompleted?: boolean) => {
    setSaving(true);
    setSavedStatus('saving');
    const stepToSave = targetStep || currentStep;
    const isCompleted = markCompleted !== undefined ? markCompleted : stepToSave === 10;

    try {
      await apiClient.patch(`/api/cv/${cvId}`, {
        data: {
          basics,
          sections: constructSectionsPayload(),
          meta: {
            wizardStep: stepToSave,
            wizardCompleted: isCompleted,
          },
        },
        config: {
          wizardStep: stepToSave,
          wizardCompleted: isCompleted,
        },
      });
      setSavedStatus('saved');
      setTimeout(() => setSavedStatus('idle'), 2500);
      return true;
    } catch (err: any) {
      toastError('Save failed', err.message);
      setSavedStatus('idle');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && !basics.fullName.trim()) {
      toastError('Full name is required');
      return;
    }

    if (currentStep < STEPS.length) {
      const nextStep = currentStep + 1;
      const saved = await saveProgress(nextStep, false);
      if (saved) {
        setCurrentStep(nextStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Step 10 reached: Mark wizard as complete and open editor
      const saved = await saveProgress(10, true);
      if (saved) {
        toastSuccess('CV Setup Completed!', 'Opening full studio editor.');
        router.push(`/cv/${cvId}/editor`);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-sm font-medium text-slate-500">Loading CV Wizard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Top Header & Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-primary-600 dark:text-primary-400">
            Step-by-Step Setup
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
            {cvTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {savedStatus === 'saving' && (
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Spinner size="sm" /> Auto-saving...
            </span>
          )}
          {savedStatus === 'saved' && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="h-3.5 w-3.5 stroke-[3]" /> All changes saved
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await saveProgress(currentStep, true);
              router.push(`/cv/${cvId}/editor`);
            }}
          >
            <span className="hidden sm:inline">Skip to Full Editor</span>
            <span className="sm:hidden">Full Editor</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </span>
          <span>{Math.round((currentStep / STEPS.length) * 100)}% Completed</span>
        </div>
        <Progress value={(currentStep / STEPS.length) * 100} />
      </div>

      {/* Mobile Tab Toggle: Edit Form vs Live Preview */}
      <div className="flex lg:hidden p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 sticky top-16 z-20 backdrop-blur-md shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'form'
              ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <FileEdit className="h-4 w-4" />
          <span>Edit Step ({currentStep}/8)</span>
        </button>

        <button
          type="button"
          onClick={async () => {
            await saveProgress();
            setPreviewTimestamp(Date.now());
            setMobileTab('preview');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'preview'
              ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Live Preview</span>
        </button>
      </div>

      {/* Mobile Live Preview Viewport */}
      {mobileTab === 'preview' ? (
        <div className="lg:hidden space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileTab('form')}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="text-xs"
            >
              Back to Form
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleWizardExportPdf}
              loading={downloadingPdf}
              leftIcon={<Download className="h-4 w-4" />}
              className="text-xs"
            >
              Download PDF
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
            <div className="relative aspect-[1/1.414] w-full bg-white rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <CvPreviewFrame cvId={cvId} timestamp={previewTimestamp} title="CV Live Preview" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Horizontal Step Stepper */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={async () => {
                    await saveProgress();
                    setCurrentStep(step.id);
                    setMobileTab('form');
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isCurrent
                      ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : <span>{step.id}.</span>}
                  <span>{step.name}</span>
                </button>
              );
            })}
          </div>

          {/* Main Wizard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Indicator Sidebar (Desktop only) */}
            <div className="hidden lg:block lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={async () => {
                      await saveProgress();
                      setCurrentStep(step.id);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium text-left transition-all ${
                      isCurrent
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold border-l-4 border-primary-600'
                        : isCompleted
                        ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600'
                          : isCurrent
                          ? 'bg-primary-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <Icon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{step.name}</span>
                      {step.optional && <span className="text-[10px] text-slate-400">Optional</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Form Content */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {/* STEP 1: BASICS */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Personal Details & Contact
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ensure your contact information is accurate for prospective recruiters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Alex Morgan"
                  value={basics.fullName}
                  onChange={(e) => setBasics({ ...basics, fullName: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="alex.morgan@example.com"
                  value={basics.email || ''}
                  onChange={(e) => setBasics({ ...basics, email: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={basics.phone || ''}
                  onChange={(e) => setBasics({ ...basics, phone: e.target.value })}
                />
                <Input
                  label="Location (City, Country)"
                  placeholder="New York, NY, USA"
                  value={basics.location || ''}
                  onChange={(e) => setBasics({ ...basics, location: e.target.value })}
                />
                <Input
                  label="Portfolio / Website URL"
                  placeholder="https://alexmorgan.dev"
                  value={basics.website || ''}
                  onChange={(e) => setBasics({ ...basics, website: e.target.value })}
                />
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/alexmorgan"
                  value={basics.linkedin || ''}
                  onChange={(e) => setBasics({ ...basics, linkedin: e.target.value })}
                />
              </div>

              {/* Profile Photo (Optional - Skip or Upload) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Profile Picture (Optional)
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    Up to 600 KB (Auto-optimized to &lt; 100 KB) · Optional
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview / Placeholder */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                      {basics.photoUrl ? (
                        <img
                          src={basics.photoUrl}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    {basics.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setBasics({ ...basics, photoUrl: '' })}
                        title="Remove picture"
                        className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full hover:bg-rose-600 shadow-sm transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
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
                        leftIcon={<UploadCloud className="h-3.5 w-3.5 text-primary-600" />}
                        className="text-xs"
                      >
                        {basics.photoUrl ? 'Change Picture' : 'Upload Picture'}
                      </Button>

                      {authUser?.avatarUrl && authUser.avatarUrl !== basics.photoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBasics({ ...basics, photoUrl: authUser.avatarUrl || '' });
                            toastSuccess('Applied account avatar to CV');
                          }}
                          className="text-xs text-slate-600 dark:text-slate-400"
                        >
                          Use Account Avatar
                        </Button>
                      )}

                      {basics.photoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBasics({ ...basics, photoUrl: '' })}
                          className="text-xs text-rose-600 dark:text-rose-400"
                        >
                          Remove Picture
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add a professional headshot (up to 600 KB, auto-compressed to &lt; 100 KB) or skip this option if your template doesn&apos;t require it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Professional Summary
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSummaryModalOpen(true)}
                    leftIcon={<Sparkles className="h-3.5 w-3.5 text-primary-600" />}
                  >
                    AI Suggest Summary
                  </Button>
                </div>
                <Textarea
                  placeholder="Summarize your professional background, core accomplishments, and career focus..."
                  rows={4}
                  value={basics.summary || ''}
                  onChange={(e) => setBasics({ ...basics, summary: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Work Experience
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    List relevant roles, responsibilities, and quantified milestones.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExperience([
                      ...experience,
                      {
                        company: '',
                        role: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        location: '',
                        description: '',
                      },
                    ])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Position
                </Button>
              </div>

              {experience.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No work experience entries added yet.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setExperience([
                        {
                          company: '',
                          role: '',
                          startDate: '',
                          endDate: '',
                          current: false,
                          location: '',
                          description: '',
                        },
                      ])
                    }
                  >
                    Add First Position
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Position #{idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Company / Employer *"
                          placeholder="Acme Corp"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].company = e.target.value;
                            setExperience(updated);
                          }}
                        />
                        <Input
                          label="Job Title / Role *"
                          placeholder="Senior Software Engineer"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].role = e.target.value;
                            setExperience(updated);
                          }}
                        />
                        <Input
                          label="Start Date *"
                          placeholder="e.g. Jan 2021"
                          value={exp.startDate}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].startDate = e.target.value;
                            setExperience(updated);
                          }}
                        />
                        <Input
                          label="End Date"
                          placeholder={exp.current ? 'Present' : 'e.g. Dec 2023'}
                          disabled={exp.current}
                          value={exp.current ? '' : exp.endDate || ''}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].endDate = e.target.value;
                            setExperience(updated);
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`current-job-${idx}`}
                          checked={exp.current || false}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].current = e.target.checked;
                            if (e.target.checked) updated[idx].endDate = null;
                            setExperience(updated);
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4"
                        />
                        <label htmlFor={`current-job-${idx}`} className="text-xs text-slate-700 dark:text-slate-300">
                          I currently work here
                        </label>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            Key Responsibilities & Achievements
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setActiveExpIndex(idx);
                              setBulletsModalOpen(true);
                            }}
                            leftIcon={<Sparkles className="h-3.5 w-3.5 text-primary-600" />}
                          >
                            AI Suggest Bullets
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Describe your impact, tools used, and measurable results..."
                          rows={3}
                          value={exp.description || ''}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[idx].description = e.target.value;
                            setExperience(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: EDUCATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Education & Degrees
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Universities, colleges, or formal diplomas.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEducation([
                      ...education,
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
                    ])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Education
                </Button>
              </div>

              {education.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <GraduationCap className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No education records added.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setEducation([
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
                      ])
                    }
                  >
                    Add Degree
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Degree #{idx + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label="Institution / University *"
                          placeholder="e.g. Stanford University"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].institution = e.target.value;
                            setEducation(updated);
                          }}
                        />
                        <Input
                          label="Degree / Qualification *"
                          placeholder="e.g. Bachelor of Science"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].degree = e.target.value;
                            setEducation(updated);
                          }}
                        />
                        <Input
                          label="Field of Study"
                          placeholder="e.g. Computer Science"
                          value={edu.field || ''}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].field = e.target.value;
                            setEducation(updated);
                          }}
                        />
                        <Input
                          label="Graduation Year / Dates *"
                          placeholder="e.g. 2018 - 2022"
                          value={edu.startDate}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].startDate = e.target.value;
                            setEducation(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SKILLS */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Skills & Competencies
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Highlight technical proficiencies, frameworks, tools, and domain abilities.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSkillsModalOpen(true)}
                  leftIcon={<Sparkles className="h-4 w-4 text-primary-600" />}
                >
                  AI Gap Analysis
                </Button>
              </div>

              {/* Add New Skill Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type a skill (e.g. TypeScript, React, Docker)..."
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newSkillName.trim()) {
                        setSkills([...skills, { name: newSkillName.trim(), level: 'intermediate' }]);
                        setNewSkillName('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    if (newSkillName.trim()) {
                      setSkills([...skills, { name: newSkillName.trim(), level: 'intermediate' }]);
                      setNewSkillName('');
                    }
                  }}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>

              {/* Skills Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: STRENGTHS & HIGHLIGHTS (OPTIONAL) */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary-600" />
                    Key Strengths & Competencies
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Highlight core strengths, problem-solving skills, and leadership capabilities.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStrengthsModalOpen(true)}
                    leftIcon={<Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />}
                    className="border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-semibold"
                  >
                    <span className="hidden sm:inline">AI Strengths Assistant</span>
                    <span className="sm:hidden">AI Strengths</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setStrengths([
                        ...strengths,
                        { title: '', description: '' },
                      ])
                    }
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Quick suggestion chips */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Quick-add recommended strengths:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { title: 'Critical Problem Solving', description: 'Methodical troubleshooting and algorithmic optimization under strict timelines.' },
                    { title: 'Technical Leadership', description: 'Mentoring engineering teams, setting architectural standards, and driving agile sprints.' },
                    { title: 'Strategic Execution', description: 'Translating complex high-level business requirements into scalable, robust code.' },
                    { title: 'Cross-functional Collaboration', description: 'Bridging technical architecture seamlessly with UX designers and product leaders.' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!strengths.some((s) => s.title === preset.title)) {
                          setStrengths([...strengths, preset]);
                        }
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    >
                      + {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {strengths.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Target className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No strengths added yet. (Optional)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <Input
                          placeholder="Strength / Competency Title (e.g. Critical Problem Solving) *"
                          value={str.title || ''}
                          onChange={(e) => {
                            const updated = [...strengths];
                            updated[idx].title = e.target.value;
                            setStrengths(updated);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStrengths(strengths.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Brief description or evidence of this strength..."
                        rows={2}
                        value={str.description || ''}
                        onChange={(e) => {
                          const updated = [...strengths];
                          updated[idx].description = e.target.value;
                          setStrengths(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PROJECTS (OPTIONAL) */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Projects & Key Initiatives
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Showcase open-source, commercial, or academic projects.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProjects([
                      ...projects,
                      { name: '', url: '', description: '', startDate: '', endDate: '' },
                    ])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Project
                </Button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <FolderGit2 className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No projects added yet. (Optional)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((proj, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <Input
                          placeholder="Project Name *"
                          value={proj.name}
                          onChange={(e) => {
                            const updated = [...projects];
                            updated[idx].name = e.target.value;
                            setProjects(updated);
                          }}
                          className="font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Live URL or GitHub repository"
                        value={proj.url || ''}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].url = e.target.value;
                          setProjects(updated);
                        }}
                      />
                      <Textarea
                        placeholder="Project overview and tech stack used..."
                        rows={2}
                        value={proj.description || ''}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].description = e.target.value;
                          setProjects(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: CERTIFICATIONS (OPTIONAL) */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Certifications & Licenses
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Industry credentials (AWS, Google Cloud, PMP, Cisco, etc.)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCertifications([
                      ...certifications,
                      { name: '', issuer: '', date: '', url: '' },
                    ])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Certification
                </Button>
              </div>

              {certifications.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Award className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No certifications added. (Optional)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <Input
                          placeholder="Certification Name *"
                          value={cert.name}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[idx].name = e.target.value;
                            setCertifications(updated);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Issuing Organization (e.g. AWS)"
                          value={cert.issuer || ''}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[idx].issuer = e.target.value;
                            setCertifications(updated);
                          }}
                        />
                        <Input
                          placeholder="Date Awarded (e.g. 2023)"
                          value={cert.date || ''}
                          onChange={(e) => {
                            const updated = [...certifications];
                            updated[idx].date = e.target.value;
                            setCertifications(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 8: LANGUAGES (OPTIONAL) */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Languages
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Spoken and written language proficiencies.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLanguages([...languages, { name: '', proficiency: 'fluent' }])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Language
                </Button>
              </div>

              {languages.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Globe2 className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No languages added. (Optional)
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {languages.map((lang, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <Input
                        placeholder="Language (e.g. English, French)"
                        value={lang.name}
                        onChange={(e) => {
                          const updated = [...languages];
                          updated[idx].name = e.target.value;
                          setLanguages(updated);
                        }}
                      />
                      <Select
                        value={lang.proficiency || 'fluent'}
                        onChange={(e) => {
                          const updated = [...languages];
                          updated[idx].proficiency = e.target.value;
                          setLanguages(updated);
                        }}
                        options={[
                          { label: 'Basic', value: 'basic' },
                          { label: 'Conversational', value: 'conversational' },
                          { label: 'Fluent', value: 'fluent' },
                          { label: 'Native', value: 'native' },
                        ]}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 9: INTERESTS & ACTIVITIES (OPTIONAL) */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Interests & Activities
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Add hobbies, community contributions, and creative pursuits that round out your profile.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setInterests([
                      ...interests,
                      { name: '', description: '' },
                    ])
                  }
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Interest
                </Button>
              </div>

              {/* Quick suggestion chips */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Quick-add recommended interests:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Artificial Intelligence & Deep Learning',
                    'Open Source Software Contributing',
                    'Technical Writing & Blogging',
                    'Competitive Programming',
                    'Marathon Running & Fitness',
                    'Cinema & Digital Photography',
                  ].map((name, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!interests.some((it) => it.name === name)) {
                          setInterests([...interests, { name, description: '' }]);
                        }
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-primary-500 hover:text-primary-600 transition-colors"
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>

              {interests.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <Heart className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    No interests added yet. (Optional)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {interests.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <Input
                          placeholder="Interest or Activity Name (e.g. Open Source Contributing) *"
                          value={it.name || ''}
                          onChange={(e) => {
                            const updated = [...interests];
                            updated[idx].name = e.target.value;
                            setInterests(updated);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInterests(interests.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Brief detail or achievement (optional)"
                        value={it.description || ''}
                        onChange={(e) => {
                          const updated = [...interests];
                          updated[idx].description = e.target.value;
                          setInterests(updated);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 10: REVIEW & FINALIZE */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    Review & Verify Your Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Please verify your entered data below before opening the live CV editor. Click &quot;Edit&quot; on any section to adjust details.
                  </p>
                </div>
              </div>

              {/* 1. Personal Basics Section */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Personal Basics
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Basics
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  {basics.photoUrl && (
                    <div className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={basics.photoUrl}
                        alt={basics.fullName || 'Candidate Photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {basics.fullName || 'Candidate Name'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {[basics.email, basics.phone, basics.location].filter(Boolean).join(' • ')}
                    </p>
                    {(basics.website || basics.linkedin) && (
                      <div className="flex flex-wrap gap-3 text-xs text-primary-600 dark:text-primary-400 pt-1">
                        {basics.website && <span>{basics.website}</span>}
                        {basics.linkedin && <span>{basics.linkedin}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase text-slate-500">
                      Professional Summary:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSummaryModalOpen(true)}
                      className="h-6 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 px-2 gap-1 font-semibold"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{basics.summary ? 'Refine with Full CV Context' : 'Generate Summary with AI'}</span>
                    </Button>
                  </div>
                  {basics.summary ? (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      &quot;{basics.summary}&quot;
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No summary provided yet. Click &quot;Generate Summary with AI&quot; to synthesize your work history into an executive summary.
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Work Experience */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Work Experience
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                      {experience.length} {experience.length === 1 ? 'Role' : 'Roles'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                    className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Experience
                  </Button>
                </div>

                {experience.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No work experience added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {experience.map((exp: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {exp.role || 'Role'} <span className="text-primary-600 dark:text-primary-400 font-normal">at {exp.company || 'Company'}</span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {[exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' — ')}
                            {exp.location && ` • ${exp.location}`}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Education */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Education
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                      {education.length} {education.length === 1 ? 'Degree' : 'Degrees'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(3)}
                    className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Education
                  </Button>
                </div>

                {education.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No education added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {education.map((edu: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ') || 'Degree'}
                            {edu.institution && (
                              <span className="text-slate-500 font-normal">, {edu.institution}</span>
                            )}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {[edu.startDate, edu.endDate].filter(Boolean).join(' — ')}
                            {edu.gpa && ` • GPA: ${edu.gpa}`}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Skills & Tools */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Skills & Proficiencies
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                      {skills.length} {skills.length === 1 ? 'Skill' : 'Skills'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(4)}
                    className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Skills
                  </Button>
                </div>

                {skills.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No skills added yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {skills.map((skill: any, idx: number) => {
                      const name = typeof skill === 'string' ? skill : skill.name;
                      const level = typeof skill === 'object' ? skill.level : null;
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm"
                        >
                          {name}
                          {level && <span className="text-[10px] text-slate-400">({level})</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Strengths Review Card */}
              {strengths.length > 0 && (
                <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Key Strengths & Competencies
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                        {strengths.length} {strengths.length === 1 ? 'Strength' : 'Strengths'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentStep(5)}
                      className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit Strengths
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {strengths.map((str: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1"
                      >
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {str.title || 'Strength'}
                        </h4>
                        {str.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {str.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Optional Additions: Projects, Certs, Languages, Interests */}
              {(projects.length > 0 || certifications.length > 0 || languages.length > 0 || interests.length > 0) && (
                <div className="space-y-4">
                  {/* Projects */}
                  {projects.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderGit2 className="h-4 w-4 text-primary-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Projects
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                            {projects.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(6)}
                          className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Projects
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {projects.map((p: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {p.name || 'Project'} {p.role && <span className="text-slate-500 font-normal">({p.role})</span>}
                              </h4>
                              {p.url && (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary-600 hover:underline inline-flex items-center gap-0.5"
                                >
                                  Link <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                                {p.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Certifications
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                            {certifications.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(7)}
                          className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Certifications
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {certifications.map((c: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80"
                          >
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {c.name || 'Certification'}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {[c.issuer, c.issueDate].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-primary-600" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Languages
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                            {languages.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(8)}
                          className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Languages
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((l: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm"
                          >
                            {l.language}
                            {l.proficiency && (
                              <span className="text-[10px] text-slate-400 capitalize">({l.proficiency})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests */}
                  {interests.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Interests & Activities
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                            {interests.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentStep(9)}
                          className="h-7 text-xs gap-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/50"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Edit Interests
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((it: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm"
                          >
                            {it.name}
                            {it.description && (
                              <span className="text-[10px] text-slate-400">({it.description})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            {/* Mobile Layout: 2-row layout so Next Step NEVER overflows */}
            <div className="sm:hidden space-y-2.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 1 || saving}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  className="flex-1 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  loading={saving}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="flex-1 text-xs font-bold"
                >
                  {currentStep === 10 ? 'Finish & Open' : 'Next Step'}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={async () => {
                    await saveProgress();
                    setPreviewTimestamp(Date.now());
                    setMobileTab('preview');
                  }}
                  className="text-xs text-primary-600 dark:text-primary-400 h-8 px-2"
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Quick Preview
                </Button>

                {STEPS[currentStep - 1].optional && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await saveProgress();
                      setCurrentStep((s) => s + 1);
                    }}
                    className="text-xs text-slate-500 h-8 px-2"
                  >
                    Skip for now →
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Layout: Clean single-row */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1 || saving}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {STEPS[currentStep - 1].optional && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await saveProgress();
                      setCurrentStep((s) => s + 1);
                    }}
                  >
                    Skip for now
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNext}
                  loading={saving}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {currentStep === 10 ? 'Finish & Open Editor' : 'Next Step'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* AI Modals with Full CV Context */}
      <ImproveSummaryModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        currentSummary={basics.summary || ''}
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || experience[0]?.role || '',
          summary: basics.summary,
          experiences: experience.map((e) => ({
            role: e.role,
            company: e.company,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
          })),
          education: education.map((ed) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
            graduationDate: ed.endDate,
          })),
          skills: skills.map((s) => s.name),
          strengths: strengths.map((st) => st.name || st.title || st),
          certifications: certifications.map((c) => c.name || c.title || c),
        }}
        onApply={(text) => setBasics({ ...basics, summary: text })}
      />

      <ImproveBulletsModal
        isOpen={bulletsModalOpen}
        onClose={() => {
          setBulletsModalOpen(false);
          setActiveExpIndex(null);
        }}
        currentDescription={activeExpIndex !== null ? experience[activeExpIndex]?.description || '' : ''}
        role={activeExpIndex !== null ? experience[activeExpIndex]?.role : ''}
        company={activeExpIndex !== null ? experience[activeExpIndex]?.company : ''}
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || experience[0]?.role || '',
          skills: skills.map((s) => s.name),
          strengths: strengths.map((st) => st.name || st.title || st),
        }}
        onApply={(bullet) => {
          if (activeExpIndex !== null) {
            const updated = [...experience];
            const currentDesc = updated[activeExpIndex].description || '';
            updated[activeExpIndex].description = currentDesc ? `${currentDesc}\n• ${bullet}` : `• ${bullet}`;
            setExperience(updated);
          }
        }}
      />

      <ImproveSkillsModal
        isOpen={skillsModalOpen}
        onClose={() => setSkillsModalOpen(false)}
        currentSkills={skills.map((s) => s.name)}
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || experience[0]?.role || '',
          experiences: experience.map((e) => ({
            role: e.role,
            company: e.company,
            description: e.description,
          })),
          education: education.map((ed) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
          })),
          skills: skills.map((s) => s.name),
        }}
        onAddSkill={(skill) => {
          if (!skills.some((s) => s.name.toLowerCase() === skill.name.toLowerCase())) {
            setSkills([...skills, { name: skill.name, level: skill.level || 'intermediate' }]);
          }
        }}
      />

      <SuggestStrengthsModal
        isOpen={strengthsModalOpen}
        onClose={() => setStrengthsModalOpen(false)}
        currentStrengths={strengths.map((s) => s.title || s.name || '')}
        cvContext={{
          fullName: basics.fullName,
          headline: (basics as any).headline || experience[0]?.role || '',
          experiences: experience.map((e) => ({
            role: e.role,
            company: e.company,
            description: e.description,
          })),
          education: education.map((ed) => ({
            degree: ed.degree,
            institution: ed.institution,
            field: ed.field,
          })),
          skills: skills.map((s) => s.name),
        }}
        onAddStrength={(item) => {
          if (!strengths.some((s) => (s.title || s.name) === item.title)) {
            setStrengths([...strengths, item]);
          }
        }}
      />
    </div>
  );
}
