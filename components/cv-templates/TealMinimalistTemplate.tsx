import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Teal Minimalist Professional Template
 * Cloned from Muhammad Aneeb Ulaah.docx & Muhammad Aneeb Ulaah.pdf.
 * Modern UK/EU-inspired layout with petrol blue accents (#156082),
 * prominent structured contact header, timeline work history, and crisp single-page hierarchy.
 */
export const TealMinimalistTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#156082';
  const fontFamily = config.fontFamily || 'Calibri, Arial, sans-serif';

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
  const customSection = getSection('custom');

  const SectionHeading = ({ title }: { title: string }) => (
    <div
      style={{
        fontSize: '13pt',
        fontWeight: 700,
        color: primaryColor,
        letterSpacing: '0.3px',
        margin: '10px 0 4px 0',
        paddingBottom: '2px',
        borderBottom: `1.5px solid ${primaryColor}22`,
        fontFamily,
      }}
    >
      {title}
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
        padding: '12mm 18mm 10mm 18mm',
        backgroundColor: '#ffffff',
        fontFamily,
        color: '#222222',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ===================== HEADER ===================== */}
      <div style={{ marginBottom: '10px' }}>
        <h1
          style={{
            margin: '0 0 6px 0',
            fontSize: '24pt',
            fontWeight: 700,
            lineHeight: 1.15,
            color: primaryColor,
            fontFamily,
          }}
        >
          {basics.fullName || 'Candidate Name'}
        </h1>

        {/* Contact info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '3px 20px',
            fontSize: '9.2pt',
            color: '#333333',
            marginTop: '4px',
          }}
        >
          {basics.location && (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: primaryColor, fontWeight: 700, minWidth: '65px' }}>
                Address
              </span>
              <span>{basics.location}</span>
            </div>
          )}
          {basics.phone && (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: primaryColor, fontWeight: 700, minWidth: '65px' }}>
                Phone
              </span>
              <span>{basics.phone}</span>
            </div>
          )}
          {basics.email && (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: primaryColor, fontWeight: 700, minWidth: '65px' }}>
                Email
              </span>
              <span style={{ wordBreak: 'break-all' }}>{basics.email}</span>
            </div>
          )}
          {basics.website && (
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ color: primaryColor, fontWeight: 700, minWidth: '65px' }}>
                Website
              </span>
              <span style={{ wordBreak: 'break-all' }}>{basics.website}</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== SUMMARY ===================== */}
      {basics.summary && (
        <div style={{ marginBottom: '6px' }}>
          <p
            style={{
              margin: '0',
              fontSize: '9.2pt',
              lineHeight: 1.5,
              color: '#333333',
              textAlign: 'justify',
            }}
          >
            {basics.summary}
          </p>
        </div>
      )}

      {/* ===================== SKILLS ===================== */}
      {skillsSection && (
        <div>
          <SectionHeading title={skillsSection.title || 'Skills'} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px 24px',
              fontSize: '9.2pt',
              color: '#1a1a1a',
              marginTop: '4px',
            }}
          >
            {skillsSection.items.map((skill: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: primaryColor,
                    marginRight: '8px',
                  }}
                />
                <span style={{ fontWeight: 600 }}>
                  {skill.name}
                  {skill.level ? ` (${skill.level})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== WORK HISTORY ===================== */}
      {experienceSection && (
        <div>
          <SectionHeading title={experienceSection.title || 'Work History'} />
          <div style={{ marginTop: '4px' }}>
            {experienceSection.items.map((exp: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '8px' }}>
                {/* Header row: date on left, title & company on right */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <div
                    style={{
                      width: '120px',
                      minWidth: '120px',
                      fontSize: '9pt',
                      fontWeight: 600,
                      color: '#444444',
                    }}
                  >
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                  <div style={{ flex: 1, fontSize: '9.5pt' }}>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      {exp.role || exp.title}
                    </span>
                    {exp.company && (
                      <span style={{ color: '#444444', marginLeft: '12px' }}>
                        {exp.company}
                        {exp.location ? `, ${exp.location}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bullets or description */}
                {exp.description && (
                  <div
                    style={{
                      paddingLeft: '136px',
                      fontSize: '8.8pt',
                      lineHeight: 1.45,
                      color: '#333333',
                      marginTop: '3px',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {exp.description.split('\n').map((line: string, lIdx: number) => {
                      const trimmed = line.trim();
                      if (!trimmed) return null;
                      const hasBullet = trimmed.startsWith('•') || trimmed.startsWith('-');
                      const text = hasBullet ? trimmed.replace(/^[•\-]\s*/, '') : trimmed;
                      return (
                        <div key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2px' }}>
                          <span style={{ color: primaryColor, marginRight: '6px', fontSize: '10pt', lineHeight: 1 }}>
                            •
                          </span>
                          <span>{text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== EDUCATION ===================== */}
      {educationSection && (
        <div>
          <SectionHeading title={educationSection.title || 'Education'} />
          <div style={{ marginTop: '4px' }}>
            {educationSection.items.map((edu: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '16px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    width: '120px',
                    minWidth: '120px',
                    fontSize: '9pt',
                    fontWeight: 600,
                    color: '#444444',
                  }}
                >
                  {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                </div>
                <div style={{ flex: 1, fontSize: '9.5pt' }}>
                  <div style={{ fontWeight: 700, color: '#111111' }}>
                    {edu.degree || edu.field}
                  </div>
                  {edu.institution && (
                    <div style={{ color: '#444444', fontSize: '9pt' }}>
                      {edu.institution}
                      {edu.location ? `, ${edu.location}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== PROJECTS (if present) ===================== */}
      {projectsSection && (
        <div>
          <SectionHeading title={projectsSection.title || 'Projects'} />
          <div style={{ marginTop: '4px' }}>
            {projectsSection.items.slice(0, 2).map((proj: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '4px', fontSize: '9pt' }}>
                <span style={{ fontWeight: 700, color: '#111111' }}>{proj.name || proj.title}</span>
                {proj.description && (
                  <span style={{ color: '#444444' }}> – {proj.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== STRENGTHS / LANGUAGES (if present) ===================== */}
      {(strengthsSection || languagesSection) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '4px' }}>
          {strengthsSection && (
            <div>
              <SectionHeading title="Strengths" />
              <div style={{ fontSize: '8.8pt', color: '#333333' }}>
                {strengthsSection.items.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>
                    • <strong>{item.title || item.name}</strong>
                    {item.description ? `: ${item.description}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
          {languagesSection && (
            <div>
              <SectionHeading title="Languages" />
              <div style={{ fontSize: '8.8pt', color: '#333333' }}>
                {languagesSection.items.map((lang: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>
                    • <strong>{lang.name || lang.language}</strong>
                    {lang.level ? ` (${lang.level})` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
