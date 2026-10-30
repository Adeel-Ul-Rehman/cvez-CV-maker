import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Navy Executive Sidebar Template
 * Cloned from Navy_Sidebar_CV_Template.docx.
 * Distinctive executive format with a solid deep navy (#003060) sidebar,
 * crisp white sidebar typography, and prominent right content area with Century Gothic styling.
 * Strictly optimized to fit 1 single A4 page.
 */
export const NavyExecutiveSidebarTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#003060';
  const fontFamily = config.fontFamily || "'Century Gothic', 'Montserrat', Arial, sans-serif";

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
  const strengthsSection = getSection('strengths');
  const languagesSection = getSection('languages');

  // Split full name into first and last name if possible
  const fullNameParts = (basics.fullName || 'FIRST NAME LAST NAME').trim().split(/\s+/);
  const firstName = fullNameParts.length > 1 ? fullNameParts.slice(0, -1).join(' ') : fullNameParts[0];
  const lastName = fullNameParts.length > 1 ? fullNameParts[fullNameParts.length - 1] : '';

  const candidateTitle =
    (basics as any).title ||
    'YOUR JOB TITLE';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '210mm',
        height: '297mm',
        maxHeight: '297mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        fontFamily,
        color: '#1a1a1a',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* ===================== NAVY LEFT SIDEBAR (34%) ===================== */}
      <div
        style={{
          width: '34%',
          minWidth: '34%',
          maxWidth: '34%',
          backgroundColor: primaryColor,
          color: '#ffffff',
          boxSizing: 'border-box',
          padding: '14mm 10mm 12mm 12mm',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* OBJECTIVE */}
        {basics.summary && (
          <div>
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '6px',
                fontFamily,
              }}
            >
              OBJECTIVE
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '8.8pt',
                lineHeight: 1.45,
                color: '#e2e8f0',
                textAlign: 'left',
              }}
            >
              {basics.summary}
            </p>
          </div>
        )}

        {/* CONTACT */}
        <div>
          <div
            style={{
              fontSize: '10pt',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#ffffff',
              marginBottom: '6px',
              fontFamily,
            }}
          >
            CONTACT
          </div>
          <div style={{ fontSize: '8.8pt', lineHeight: 1.5, color: '#e2e8f0' }}>
            {basics.email && (
              <div style={{ wordBreak: 'break-all', marginBottom: '3px' }}>
                {basics.email}
              </div>
            )}
            {basics.phone && <div style={{ marginBottom: '3px' }}>{basics.phone}</div>}
            {basics.location && (
              <div style={{ marginBottom: '3px' }}>{basics.location}</div>
            )}
            {basics.website && (
              <div style={{ wordBreak: 'break-all', marginBottom: '3px' }}>
                {basics.website}
              </div>
            )}
            {basics.linkedin && (
              <div style={{ wordBreak: 'break-all' }}>{basics.linkedin}</div>
            )}
          </div>
        </div>

        {/* EDUCATION (in sidebar as per Navy_Sidebar_CV_Template.docx) */}
        {educationSection && (
          <div>
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '6px',
                fontFamily,
              }}
            >
              EDUCATION
            </div>
            <div style={{ fontSize: '8.8pt', lineHeight: 1.45, color: '#e2e8f0' }}>
              {educationSection.items.map((edu: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>
                    {edu.institution}
                    {edu.location ? `, ${edu.location}` : ''}
                  </div>
                  <div style={{ color: '#cbd5e1' }}>{edu.degree || edu.field}</div>
                  {(edu.startDate || edu.endDate) && (
                    <div style={{ fontSize: '8.2pt', color: '#94a3b8', marginTop: '1px' }}>
                      {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILLS */}
        {skillsSection && (
          <div>
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '6px',
                fontFamily,
              }}
            >
              SKILLS
            </div>
            <div style={{ fontSize: '8.8pt', lineHeight: 1.5, color: '#e2e8f0' }}>
              {skillsSection.items.map((skill: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '3px' }}>
                  • {skill.name}
                  {skill.level ? ` (${skill.level})` : ''}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LANGUAGES */}
        {languagesSection && (
          <div>
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#ffffff',
                marginBottom: '6px',
                fontFamily,
              }}
            >
              LANGUAGES
            </div>
            <div style={{ fontSize: '8.8pt', lineHeight: 1.45, color: '#e2e8f0' }}>
              {languagesSection.items.map((lang: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  • {lang.name || lang.language}
                  {lang.level ? ` (${lang.level})` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================== RIGHT MAIN CONTENT (66%) ===================== */}
      <div
        style={{
          width: '66%',
          boxSizing: 'border-box',
          padding: '14mm 14mm 12mm 14mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        {/* Large Name Header */}
        <div style={{ marginBottom: '10px' }}>
          <h1
            style={{
              margin: '0',
              fontSize: '30pt',
              fontWeight: 800,
              lineHeight: 1.05,
              textTransform: 'uppercase',
              color: '#111827',
              letterSpacing: '1px',
              fontFamily,
            }}
          >
            {firstName}
          </h1>
          {lastName && (
            <h1
              style={{
                margin: '0',
                fontSize: '30pt',
                fontWeight: 800,
                lineHeight: 1.05,
                textTransform: 'uppercase',
                color: '#111827',
                letterSpacing: '1px',
                fontFamily,
              }}
            >
              {lastName}
            </h1>
          )}

          <div
            style={{
              fontSize: '12pt',
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: primaryColor,
              marginTop: '6px',
              fontFamily,
            }}
          >
            {candidateTitle}
          </div>
        </div>

        {/* EXPERIENCE */}
        {experienceSection && (
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                fontSize: '11pt',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#111827',
                paddingBottom: '3px',
                borderBottom: `2px solid ${primaryColor}`,
                marginBottom: '8px',
                fontFamily,
              }}
            >
              EXPERIENCE
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {experienceSection.items.map((exp: any, idx: number) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '9.8pt',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#111827',
                        }}
                      >
                        {exp.role || exp.title}
                      </span>
                      {exp.company && (
                        <span style={{ fontSize: '9.5pt', color: '#374151', marginLeft: '6px' }}>
                          {exp.company}
                          {exp.location ? `, ${exp.location}` : ''}
                        </span>
                      )}
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <span
                        style={{
                          fontSize: '8.8pt',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    )}
                  </div>

                  {exp.description && (
                    <div
                      style={{
                        fontSize: '9pt',
                        lineHeight: 1.45,
                        color: '#374151',
                        marginTop: '3px',
                        whiteSpace: 'pre-line',
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

        {/* PROJECTS */}
        {projectsSection && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '11pt',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#111827',
                paddingBottom: '3px',
                borderBottom: `2px solid ${primaryColor}`,
                marginBottom: '8px',
                fontFamily,
              }}
            >
              PROJECTS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {projectsSection.items.slice(0, 3).map((proj: any, idx: number) => (
                <div key={idx} style={{ fontSize: '9pt' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>
                    {proj.name || proj.title}
                  </span>
                  {proj.description && (
                    <span style={{ color: '#4b5563' }}> – {proj.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STRENGTHS */}
        {strengthsSection && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                fontSize: '11pt',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: '#111827',
                paddingBottom: '3px',
                borderBottom: `2px solid ${primaryColor}`,
                marginBottom: '6px',
                fontFamily,
              }}
            >
              KEY STRENGTHS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 14px', fontSize: '8.8pt' }}>
              {strengthsSection.items.slice(0, 4).map((s: any, idx: number) => (
                <div key={idx} style={{ color: '#374151' }}>
                  <strong>{s.title || s.name}</strong>
                  {s.description ? `: ${s.description}` : ''}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
