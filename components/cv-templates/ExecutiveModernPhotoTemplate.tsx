import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Executive Modern Photo Template
 * Two-column layout with photo, cobalt blue accents (#0070C0), and Times New Roman typography.
 * Strictly formatted for a single A4 page.
 */
export const ExecutiveModernPhotoTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#0070C0';
  const showPhoto = config.showPhoto !== false;
  const photoUrl = basics.photoUrl || '/photo-test.jpg';

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
  const strengthsSection =
    getSection('strengths') ||
    getSection('custom', 'strength') ||
    getSection('certifications', 'strength');
  const interestsSection =
    getSection('interests') ||
    getSection('custom', 'interest') ||
    getSection('languages', 'interest');

  const handledIds = new Set(
    [
      experienceSection?.id,
      educationSection?.id,
      skillsSection?.id,
      projectsSection?.id,
      strengthsSection?.id,
      interestsSection?.id,
    ].filter(Boolean)
  );

  const remainingSections = visibleSections.filter((s: any) => !handledIds.has(s.id));

  const candidateTitle =
    (basics as any).title ||
    (experienceSection?.items?.[0] as any)?.role ||
    'Senior Software Engineer';

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
        fontFamily: "'Times New Roman', Times, Georgia, serif",
        color: '#0D0D0D',
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '6px',
        }}
      >
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h1
            style={{
              margin: '0 0 2px 0',
              fontSize: '22pt',
              fontWeight: 700,
              lineHeight: 1.1,
              fontFamily: "'Times New Roman', Times, serif",
              color: '#000000',
              letterSpacing: '-0.3px',
            }}
          >
            {basics.fullName || 'Alex Morgan'}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '3px',
            }}
          >
            <span
              style={{
                fontSize: '11pt',
                fontWeight: 600,
                color: '#1a1a1a',
                fontFamily: "'Times New Roman', Times, serif",
              }}
            >
              {candidateTitle}
            </span>
            {basics.location && (
              <span
                style={{
                  fontSize: '9.5pt',
                  color: '#4a4a4a',
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {basics.location}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: '8.5pt',
              color: '#333333',
              lineHeight: 1.35,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            {basics.email && (
              <span>
                <strong>Email:</strong> {basics.email}
              </span>
            )}
            {basics.phone && (
              <span>
                <strong>Phone:</strong> {basics.phone}
              </span>
            )}
            {basics.linkedin && (
              <span>
                <strong>LinkedIn:</strong> {basics.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
              </span>
            )}
          </div>
        </div>

        {showPhoto && (
          <div
            style={{
              width: '28mm',
              height: '35mm',
              overflow: 'hidden',
              borderRadius: '2px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f3f4f6',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
        )}
      </div>

      {/* ===================== SUMMARY ===================== */}
      {basics.summary && (
        <div style={{ marginBottom: '6px' }}>
          <h2
            style={{
              margin: '0 0 2px 0',
              fontSize: '10.5pt',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              color: primaryColor,
              fontFamily: "'Times New Roman', Times, serif",
            }}
          >
            PROFESSIONAL SUMMARY
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '8.5pt',
              lineHeight: 1.3,
              color: '#1a1a1a',
              textAlign: 'justify',
            }}
          >
            {basics.summary}
          </p>
        </div>
      )}

      {/* ===================== TWO-COLUMN BODY ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '50% 50%',
          gap: '14px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* LEFT COLUMN: Experience, Education */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {experienceSection && (
            <div>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {experienceSection.title || 'EXPERIENCE'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {experienceSection.items.slice(0, 3).map((exp: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.5pt' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#000000' }}>
                        {exp.company}
                        {exp.location ? `, ${exp.location}` : ''}
                      </span>
                      <span style={{ fontSize: '8pt', color: '#555555' }}>
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontStyle: 'italic',
                        color: '#2b2b2b',
                        marginBottom: '1px',
                        fontSize: '8.2pt',
                      }}
                    >
                      {exp.role}
                    </div>

                    {exp.description && (
                      <div
                        style={{
                          fontSize: '8pt',
                          lineHeight: 1.25,
                          color: '#262626',
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

          {educationSection && (
            <div style={{ marginTop: '2px' }}>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {educationSection.title || 'EDUCATION'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {educationSection.items.slice(0, 2).map((edu: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.5pt' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#000000' }}>
                        {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.degree}
                      </span>
                      <span style={{ fontSize: '8pt', color: '#555555' }}>
                        {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                      </span>
                    </div>
                    <div style={{ color: '#2b2b2b', fontSize: '8.2pt' }}>
                      {edu.institution}
                      {edu.location ? `, ${edu.location}` : ''}
                    </div>
                    {edu.description && (
                      <div style={{ fontSize: '7.8pt', color: '#555555', fontStyle: 'italic' }}>
                        {edu.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Strengths, Skills, Projects, Interests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {strengthsSection && (
            <div>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {strengthsSection.title || 'STRENGTHS'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {strengthsSection.items.map((st: any, i: number) => {
                  const title = st.title || st.name || '';
                  const desc = st.description || '';
                  return (
                    <div key={i} style={{ fontSize: '8.2pt', lineHeight: 1.25 }}>
                      <span style={{ fontWeight: 700, color: '#000000' }}>• {title}</span>
                      {desc && (
                        <span style={{ color: '#2b2b2b' }}>
                          {': '}
                          {desc}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {skillsSection && (
            <div>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {skillsSection.title || 'SKILLS'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {skillsSection.items.map((sk: any, i: number) => {
                  const name = typeof sk === 'string' ? sk : sk.name;
                  return (
                    <div
                      key={i}
                      style={{ fontSize: '8.2pt', lineHeight: 1.25, color: '#1a1a1a' }}
                    >
                      • {name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {projectsSection && (
            <div>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {projectsSection.title || 'PROJECTS'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {projectsSection.items.slice(0, 2).map((p: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.2pt' }}>
                    <div style={{ fontWeight: 700, color: '#000000' }}>
                      • {p.name}
                      {p.url && (
                        <span style={{ fontWeight: 400, color: primaryColor, fontSize: '7.8pt' }}>
                          {' '}
                          ({p.url.replace(/^https?:\/\/(www\.)?/, '')})
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <div
                        style={{
                          fontSize: '7.8pt',
                          lineHeight: 1.25,
                          color: '#333333',
                          paddingLeft: '8px',
                        }}
                      >
                        {p.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {interestsSection && (
            <div>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {interestsSection.title || 'INTERESTS'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {interestsSection.items.map((it: any, i: number) => (
                  <div
                    key={i}
                    style={{ fontSize: '8.2pt', lineHeight: 1.25, color: '#2b2b2b' }}
                  >
                    • {it.name || it.title}
                    {it.description ? ` (${it.description})` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {remainingSections.map((sec: any) => (
            <div key={sec.id}>
              <h2
                style={{
                  margin: '0 0 3px 0',
                  fontSize: '10.5pt',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: primaryColor,
                  fontFamily: "'Times New Roman', Times, serif",
                }}
              >
                {sec.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((it: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.2pt', lineHeight: 1.25, color: '#2b2b2b' }}>
                    • {it.title || it.name}
                    {it.description ? `: ${it.description}` : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
