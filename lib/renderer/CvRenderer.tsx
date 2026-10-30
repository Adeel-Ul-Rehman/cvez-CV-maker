import React from 'react';
import type { RenderContext } from './types';
import { baseCvStyles } from './styles';
import { EuropassTemplate } from '@/components/cv-templates/EuropassTemplate';
import { JobhireChronologicalTemplate } from '@/components/cv-templates/JobhireChronologicalTemplate';
import { JobhireCreativeTemplate } from '@/components/cv-templates/JobhireCreativeTemplate';
import { AdeelSignatureTemplate } from '@/components/cv-templates/AdeelSignatureTemplate';
import { ExecutiveModernPhotoTemplate } from '@/components/cv-templates/ExecutiveModernPhotoTemplate';
import { CreativeProfileTemplate } from '@/components/cv-templates/CreativeProfileTemplate';
import { TealMinimalistTemplate } from '@/components/cv-templates/TealMinimalistTemplate';
import { NavyExecutiveSidebarTemplate } from '@/components/cv-templates/NavyExecutiveSidebarTemplate';
import { DynamicDocxTemplate } from '@/components/cv-templates/DynamicDocxTemplate';

/**
 * Self-contained CV Document Renderer.
 * Dispatches to the appropriate template component and applies strict print/preview styling.
 */
export const CvRenderer: React.FC<RenderContext> = (ctx) => {
  const { templateKey, data, config } = ctx;

  const renderTemplate = () => {
    switch (templateKey) {
      case 'adeel-signature':
        return <AdeelSignatureTemplate data={data} config={config} />;
      case 'executive-modern-photo':
        return <ExecutiveModernPhotoTemplate data={data} config={config} />;
      case 'creative-profile':
        return <CreativeProfileTemplate data={data} config={config} />;
      case 'teal-minimalist':
        return <TealMinimalistTemplate data={data} config={config} />;
      case 'navy-executive-sidebar':
        return <NavyExecutiveSidebarTemplate data={data} config={config} />;
      case 'jobhire-chronological':
        return <JobhireChronologicalTemplate data={data} config={config} />;
      case 'jobhire-creative':
        return <JobhireCreativeTemplate data={data} config={config} />;
      case 'europass':
        return <EuropassTemplate data={data} config={config} />;
      default:
        return <DynamicDocxTemplate data={data} config={config} />;
    }
  };

  return (
    <div style={baseCvStyles(ctx)} data-cv-root="true">
      {renderTemplate()}
    </div>
  );
};
