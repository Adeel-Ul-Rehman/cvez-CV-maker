import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Adeel Ul Rehman Signature Template
 * Cloned pixel-perfect from Adeel_Ul_Rehman_CV.docx & Adeel_Ul_Rehman_CV.pdf.
 * Single-column high-density engineering & tech format with deep navy headings (#1F3864)
 * and horizontal accent rules (#2E5395), strictly locked to 1 single A4 page.
 */
export const AdeelSignatureTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#1F3864';
  const accentColor = '#2E5395';
  const fontFamily = config.fontFamily || 'Inter, Arial, sans-serif';

  const visibleSections = (sections || []).filter(
    (s: any) => s.visible !== false && Array.isArray(s.items) && s.items.length > 0
  );

  const getSection = (type: string, titleMatch?: string) => {
    return visibleSections.find(
      (s: any) =>
        s.type === type ||
        (titleMatch && s.title?.toLowerCase().includes(titleMatch.toLowerCase()))
    );
  };

  const experienceSection = getSection('experience');
  const educationSection = getSection('education');
  const skillsSection = getSection('skills');
  const projectsSection = getSection('projects');
  const certificationsSection = getSection('certifications');
  const languagesSection = getSection('languages');
  const strengthsSection = getSection('strengths');

  const handledIds = new Set(
    [
      experienceSection?.id,
      educationSection?.id,
      skillsSection?.id,
      projectsSection?.id,
      certificationsSection?.id,
      languagesSection?.id,
      strengthsSection?.id,
    ].filter(Boolean)
  );

  const remainingSections = visibleSections.filter((s: any) => !handledIds.has(s.id));

  const candidateTitle =
    (basics as any).title ||
    'Full Stack Developer | AI/ML & Automation Enthusiast';

  // Section Header Component with deep navy text and thin accent underline
  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ margin: '6px 0 3px 0' }}>
      <div
        style={{
          fontSize: '9.5pt',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: primaryColor,
          fontFamily,
          paddingBottom: '1px',
          borderBottom: `1px solid ${accentColor}`,
        }}
      >
        {title}
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '210mm',
        height: '297mm',
        maxHeight: '297mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '8mm 14mm 6mm 14mm',
        backgroundColor: '#ffffff',
        fontFamily,
        color: '#222222',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
    >
      {/* ===================== HEADER ===================== */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '5px',
        }}
      >
        <h1
          style={{
            margin: '0 0 1px 0',
            fontSize: '18pt',
            fontWeight: 800,
            lineHeight: 1.1,
            color: '#000000',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            fontFamily,
          }}
        >
          {basics.fullName || 'ADEEL UL REHMAN'}
        </h1>

        <div
          style={{
            fontSize: '9.2pt',
            fontWeight: 600,
            color: '#333333',
            marginBottom: '3px',
            fontFamily,
          }}
        >
          {candidateTitle}
        </div>

        {/* Contact info row */}
        <div
          style={{
            fontSize: '8.2pt',
            color: '#444444',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            lineHeight: 1.25,
          }}
        >
          {basics.location && <span>{basics.location}</span>}
          {basics.location && basics.email && <span>|</span>}
          {basics.email && (
            <a href={`mailto:${basics.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {basics.email}
            </a>
          )}
          {basics.email && basics.phone && <span>|</span>}
          {basics.phone && <span>{basics.phone}</span>}
        </div>

        {/* Links row */}
        {(basics.website || basics.linkedin) && (
          <div
            style={{
              fontSize: '8pt',
              color: primaryColor,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '1.5px',
            }}
          >
            {basics.website && (
              <span>{basics.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {basics.website && basics.linkedin && <span>|</span>}
            {basics.linkedin && (
              <span>{basics.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
          </div>
        )}
      </div>

      {/* ===================== PROFESSIONAL SUMMARY ===================== */}
      {basics.summary && (
        <div>
          <SectionHeader title="PROFESSIONAL SUMMARY" />
          <p
            style={{
              margin: 0,
              fontSize: '8.2pt',
              lineHeight: 1.3,
              color: '#222222',
              textAlign: 'justify',
            }}
          >
            {basics.summary}
          </p>
        </div>
      )}

      {/* ===================== TECHNICAL SKILLS ===================== */}
      {skillsSection && (
        <div>
          <SectionHeader title={skillsSection.title || 'TECHNICAL SKILLS'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '8.2pt', lineHeight: 1.3 }}>
            {skillsSection.items.map((sk: any, i: number) => {
              const name = typeof sk === 'string' ? sk : sk.name;
              // If skills are stored in categorized lines "Category: Item1, Item2"
              const parts = name.split(':');
              if (parts.length > 1) {
                return (
                  <div key={i}>
                    <strong style={{ color: '#000000' }}>{parts[0]}:</strong>
                    <span style={{ color: '#2b2b2b' }}>{parts.slice(1).join(':')}</span>
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: 'inline' }}>
                  <span style={{ color: '#2b2b2b' }}>• {name} </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== PROFESSIONAL EXPERIENCE ===================== */}
      {experienceSection && (
        <div>
          <SectionHeader title={experienceSection.title || 'PROFESSIONAL EXPERIENCE'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {experienceSection.items.slice(0, 4).map((exp: any, i: number) => (
              <div key={i} style={{ fontSize: '8.2pt' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    lineHeight: 1.25,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#000000' }}>{exp.role}</span>
                    <span style={{ color: '#444444' }}> — {exp.company}</span>
                    {exp.location && (
                      <span style={{ color: '#666666', fontStyle: 'italic' }}> ({exp.location})</span>
                    )}
                  </div>
                  <span style={{ fontSize: '7.8pt', color: '#555555', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </span>
                </div>

                {exp.description && (
                  <div
                    style={{
                      fontSize: '8pt',
                      lineHeight: 1.25,
                      color: '#222222',
                      whiteSpace: 'pre-line',
                      paddingLeft: '4px',
                      marginTop: '1px',
                    }}
                  >
                    {exp.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== KEY PROJECTS ===================== */}
      {projectsSection && (
        <div>
          <SectionHeader title={projectsSection.title || 'KEY PROJECTS'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {projectsSection.items.slice(0, 4).map((p: any, i: number) => (
              <div key={i} style={{ fontSize: '8.2pt', lineHeight: 1.25 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#000000' }}>• {p.name}</span>
                  {p.url && (
                    <span style={{ color: primaryColor, fontSize: '7.8pt' }}>
                      {' '}
                      ({p.url.replace(/^https?:\/\/(www\.)?/, '')})
                    </span>
                  )}
                  {p.description && (
                    <span style={{ color: '#2b2b2b' }}> — {p.description.replace(/^•\s*/, '')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== EDUCATION ===================== */}
      {educationSection && (
        <div>
          <SectionHeader title={educationSection.title || 'EDUCATION'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {educationSection.items.slice(0, 2).map((edu: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontSize: '8.2pt',
                  lineHeight: 1.25,
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#000000' }}>
                    {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.degree}
                  </span>
                  <div style={{ color: '#444444', fontSize: '8pt' }}>
                    {edu.institution}
                    {edu.location ? ` | ${edu.location}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: '7.8pt', color: '#555555', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                  {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining custom or other sections */}
      {remainingSections.map((sec: any) => (
        <div key={sec.id}>
          <SectionHeader title={sec.title} />
          <div style={{ fontSize: '8pt', lineHeight: 1.25 }}>
            {sec.items.map((it: any, i: number) => (
              <div key={i}>
                <strong>• {it.title || it.name}:</strong> {it.description}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
