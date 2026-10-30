import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Creative Profile Two-Column Template
 * Inspired by Ham.docx & Hamza Resume.pdf.
 * Features an emerald green accent (#00B050), photo sidebar, diamond bullet points (❖),
 * and clean two-column layout strictly formatted for a single A4 page.
 */
export const CreativeProfileTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#00B050';
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
  const interestsSection = getSection('interests', 'interest');
  const customSection = getSection('custom', 'hobbies');
  const languagesSection = getSection('languages');
  const strengthsSection = getSection('strengths');
  const projectsSection = getSection('projects');

  // Candidate photo fallback
  const photoUrl =
    basics.photoUrl ||
    (config.showPhoto !== false ? '/samples/creative-profile-photo.jpg' : null);

  const SectionHeader = ({ title }: { title: string }) => (
    <div
      style={{
        fontSize: '10pt',
        fontWeight: 700,
        color: primaryColor,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: '4px',
        marginTop: '8px',
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
        padding: '10mm 12mm 8mm 12mm',
        backgroundColor: '#ffffff',
        fontFamily,
        color: '#1a1a1a',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        gap: '16mm',
      }}
    >
      {/* ===================== LEFT SIDEBAR (~33%) ===================== */}
      <div
        style={{
          width: '33%',
          minWidth: '33%',
          maxWidth: '33%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e5e7eb',
          paddingRight: '12mm',
        }}
      >
        {/* Photo */}
        {config.showPhoto !== false && photoUrl && (
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto',
                border: `3px solid ${primaryColor}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: '#f3f4f6',
              }}
            >
              <img
                src={photoUrl}
                alt={basics.fullName || 'Candidate Photo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        )}

        {/* PROFILE / SUMMARY */}
        {basics.summary && (
          <div>
            <SectionHeader title="PROFILE:" />
            <p
              style={{
                margin: '0 0 6px 0',
                fontSize: '8.8pt',
                lineHeight: 1.45,
                color: '#333333',
                textAlign: 'left',
              }}
            >
              {basics.summary}
            </p>
          </div>
        )}

        {/* CONTACT */}
        <div>
          <SectionHeader title="CONTACT:" />
          <div style={{ fontSize: '8.8pt', lineHeight: 1.5, color: '#111111' }}>
            {basics.phone && (
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                {basics.phone}
              </div>
            )}
            {basics.email && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: primaryColor, fontWeight: 700, fontSize: '8.5pt', display: 'block' }}>
                  EMAIL:
                </span>
                <span style={{ wordBreak: 'break-all', fontWeight: 600 }}>{basics.email}</span>
              </div>
            )}
            {basics.location && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: primaryColor, fontWeight: 700, fontSize: '8.5pt', display: 'block' }}>
                  ADDRESS:
                </span>
                <span style={{ color: '#444444' }}>{basics.location}</span>
              </div>
            )}
            {basics.website && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ color: primaryColor, fontWeight: 700, fontSize: '8.5pt', display: 'block' }}>
                  WEBSITE:
                </span>
                <span style={{ color: '#444444', wordBreak: 'break-all' }}>{basics.website}</span>
              </div>
            )}
          </div>
        </div>

        {/* HOBBIES / STRENGTHS in Left Column */}
        {strengthsSection && (
          <div style={{ marginTop: '4px' }}>
            <SectionHeader title="STRENGTHS:" />
            <div style={{ fontSize: '8.5pt', lineHeight: 1.45, color: '#222222' }}>
              {strengthsSection.items.slice(0, 4).map((s: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '3px', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: primaryColor, marginRight: '5px', fontSize: '9pt', lineHeight: 1 }}>
                    ❖
                  </span>
                  <span>
                    <strong>{s.title || s.name}</strong>
                    {s.description ? ` – ${s.description}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LANGUAGES */}
        {languagesSection && (
          <div style={{ marginTop: '4px' }}>
            <SectionHeader title="LANGUAGES:" />
            <div style={{ fontSize: '8.8pt', lineHeight: 1.5, color: '#222222' }}>
              {languagesSection.items.map((l: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ color: primaryColor, marginRight: '5px', fontSize: '9pt' }}>
                    ❖
                  </span>
                  <span>
                    <strong>{l.name || l.language}</strong>
                    {l.level ? ` (${l.level})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===================== RIGHT COLUMN (~67%) ===================== */}
      <div
        style={{
          width: '67%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Full Name */}
        <div style={{ marginBottom: '6px' }}>
          <h1
            style={{
              margin: '0',
              fontSize: '22pt',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#0d0d0d',
              fontFamily,
            }}
          >
            {basics.fullName || 'Candidate Name'}
          </h1>
          {(basics as any).title && (
            <div
              style={{
                fontSize: '10.5pt',
                fontWeight: 600,
                color: primaryColor,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginTop: '3px',
              }}
            >
              {(basics as any).title}
            </div>
          )}
        </div>

        {/* EDUCATION */}
        {educationSection && (
          <div>
            <SectionHeader title="EDUCATION" />
            <div style={{ fontSize: '9pt', lineHeight: 1.45 }}>
              {educationSection.items.map((edu: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt', marginTop: '1px' }}>
                    ❖
                  </span>
                  <div>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      {edu.degree || edu.field}
                    </span>
                    {(edu.startDate || edu.endDate) && (
                      <span style={{ color: '#555555' }}>
                        {' '}({formatDateRange(edu.startDate, edu.endDate, edu.current)})
                      </span>
                    )}
                    {edu.institution && (
                      <span style={{ color: '#333333' }}>
                        {' '}from {edu.institution}
                      </span>
                    )}
                    {edu.location && (
                      <span style={{ color: '#666666' }}>, {edu.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPERIENCE */}
        {experienceSection && (
          <div>
            <SectionHeader title="EXPERIENCE" />
            <div style={{ fontSize: '9pt', lineHeight: 1.45 }}>
              {experienceSection.items.map((exp: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt', marginTop: '1px' }}>
                      ❖
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, color: '#111111' }}>
                        {exp.role || exp.title}
                      </span>
                      {exp.company && (
                        <span style={{ color: '#333333', fontWeight: 600 }}>
                          {' '}– {exp.company}
                        </span>
                      )}
                      {(exp.startDate || exp.endDate) && (
                        <span style={{ color: '#666666', fontSize: '8.5pt', marginLeft: '6px' }}>
                          ({formatDateRange(exp.startDate, exp.endDate, exp.current)})
                        </span>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <div
                      style={{
                        paddingLeft: '16px',
                        fontSize: '8.5pt',
                        color: '#444444',
                        marginTop: '2px',
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

        {/* SKILLS */}
        {skillsSection && (
          <div>
            <SectionHeader title="SKILLS" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', fontSize: '9pt' }}>
              {skillsSection.items.map((skill: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt' }}>
                    ❖
                  </span>
                  <span style={{ color: '#222222', fontWeight: 600 }}>
                    {skill.name}
                    {skill.level ? ` (${skill.level})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERESTS */}
        {interestsSection && (
          <div>
            <SectionHeader title="INTERESTS" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', fontSize: '9pt' }}>
              {interestsSection.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt' }}>
                    ❖
                  </span>
                  <span style={{ color: '#333333' }}>
                    {item.name || item.title || item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS */}
        {projectsSection && (
          <div>
            <SectionHeader title="PROJECTS" />
            <div style={{ fontSize: '9pt', lineHeight: 1.45 }}>
              {projectsSection.items.slice(0, 3).map((proj: any, idx: number) => (
                <div key={idx} style={{ marginBottom: '4px', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt', marginTop: '1px' }}>
                    ❖
                  </span>
                  <div>
                    <span style={{ fontWeight: 700, color: '#111111' }}>
                      {proj.name || proj.title}
                    </span>
                    {proj.description && (
                      <span style={{ color: '#444444', fontSize: '8.5pt' }}>
                        {' '}: {proj.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOBBIES (if custom section has hobbies) */}
        {customSection && (
          <div>
            <SectionHeader title={customSection.title || 'HOBBIES'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', fontSize: '9pt' }}>
              {customSection.items.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: primaryColor, marginRight: '6px', fontSize: '9pt' }}>
                    ❖
                  </span>
                  <span style={{ color: '#333333' }}>
                    {item.title || item.name || item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
