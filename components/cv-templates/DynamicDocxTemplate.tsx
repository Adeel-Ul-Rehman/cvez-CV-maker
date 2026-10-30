import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange } from '@/lib/renderer/styles';

/**
 * Universal Dynamic Template Renderer for any Word-imported (.docx) CV template.
 * Adapts automatically to 1-column or 2-column layouts, renders candidate data
 * with extracted colors & typography, and strictly locks height to 1 single A4 page.
 */
export const DynamicDocxTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#0070C0';
  const fontFamily = config.fontFamily || "'Times New Roman', Times, Georgia, serif";
  const showPhoto = config.showPhoto !== false;
  const photoUrl = basics.photoUrl || '';

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
  const strengthsSection =
    getSection('strengths') || getSection('custom', 'strength');
  const interestsSection =
    getSection('interests') || getSection('custom', 'interest');
  const referencesSection =
    getSection('references') || getSection('custom', 'reference');
  const awardsSection =
    getSection('awards') || getSection('custom', 'award');

  const candidateTitle =
    (basics as any).title ||
    (experienceSection?.items?.[0] as any)?.role ||
    'Professional';

  // Section Heading Component with custom accent styling
  const SectionHeader = ({ title }: { title: string }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '6px 0 4px 0',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '11pt',
          fontWeight: 700,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: primaryColor,
          fontFamily,
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: primaryColor,
          opacity: 0.85,
        }}
      />
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
        padding: '8mm 12mm 6mm 12mm',
        backgroundColor: '#ffffff',
        fontFamily,
        color: '#1a1a1a',
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
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '6px',
        }}
      >
        {/* Left: Name, Title, Contact details */}
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h1
            style={{
              margin: '0 0 2px 0',
              fontSize: '22pt',
              fontWeight: 700,
              lineHeight: 1.1,
              fontFamily,
              color: '#0D0D0D',
              letterSpacing: '-0.3px',
            }}
          >
            {basics.fullName || 'Candidate Name'}
          </h1>

          <div
            style={{
              fontSize: '11pt',
              fontWeight: 600,
              color: primaryColor,
              marginBottom: '4px',
              fontFamily,
            }}
          >
            {candidateTitle}
          </div>

          {/* Contact row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '8.5pt',
              color: '#444444',
            }}
          >
            {basics.phone && <span>📞 {basics.phone}</span>}
            {basics.email && <span>✉️ {basics.email}</span>}
            {basics.location && <span>📍 {basics.location}</span>}
            {basics.linkedin && (
              <span>🔗 {basics.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {basics.website && (
              <span>🌐 {basics.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
          </div>
        </div>

        {/* Right: Profile Photo (if available & enabled) */}
        {showPhoto && photoUrl && (
          <div
            style={{
              width: '26mm',
              height: '32mm',
              overflow: 'hidden',
              borderRadius: '4px',
              border: `2px solid ${primaryColor}`,
              backgroundColor: '#f1f5f9',
              flexShrink: 0,
            }}
          >
            <img
              src={photoUrl}
              alt={basics.fullName || 'Photo'}
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
          <SectionHeader title="Professional Summary" />
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '9pt',
              lineHeight: 1.35,
              color: '#262626',
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
          gridTemplateColumns: '62% 38%',
          gap: '14px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* LEFT COLUMN: Experience, Education, Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Work Experience */}
          {experienceSection && (
            <div>
              <SectionHeader title={experienceSection.title || 'Experience'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {experienceSection.items.slice(0, 3).map((exp: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.8pt' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0D0D0D' }}>
                        {exp.role || 'Role'}
                      </span>
                      <span style={{ fontSize: '8pt', color: '#666666', fontWeight: 500 }}>
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        fontSize: '8.2pt',
                        color: primaryColor,
                        fontWeight: 600,
                        marginBottom: '2px',
                      }}
                    >
                      <span>{exp.company}</span>
                      {exp.location && (
                        <span style={{ color: '#777777', fontWeight: 400 }}>{exp.location}</span>
                      )}
                    </div>

                    {exp.description && (
                      <div
                        style={{
                          fontSize: '8.2pt',
                          lineHeight: 1.3,
                          color: '#333333',
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

          {/* Education */}
          {educationSection && (
            <div>
              <SectionHeader title={educationSection.title || 'Education'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {educationSection.items.slice(0, 2).map((edu: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.8pt' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0D0D0D' }}>
                        {[edu.degree, edu.field].filter(Boolean).join(' in ') || edu.degree}
                      </span>
                      <span style={{ fontSize: '8pt', color: '#666666' }}>
                        {formatDateRange(edu.startDate, edu.endDate, edu.current)}
                      </span>
                    </div>
                    <div style={{ fontSize: '8.2pt', color: primaryColor, fontWeight: 600 }}>
                      {edu.institution}
                      {edu.location && (
                        <span style={{ color: '#777777', fontWeight: 400 }}> • {edu.location}</span>
                      )}
                    </div>
                    {edu.description && (
                      <p style={{ margin: '1px 0 0 0', fontSize: '8pt', color: '#555555' }}>
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projectsSection && (
            <div>
              <SectionHeader title={projectsSection.title || 'Key Projects'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {projectsSection.items.slice(0, 2).map((p: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.5pt' }}>
                    <div style={{ fontWeight: 700, color: '#0D0D0D' }}>
                      {p.name}
                      {p.url && (
                        <span style={{ fontWeight: 400, color: primaryColor, fontSize: '8pt' }}>
                          {' '}
                          ({p.url.replace(/^https?:\/\/(www\.)?/, '')})
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <div style={{ fontSize: '8pt', lineHeight: 1.25, color: '#444444' }}>
                        {p.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {referencesSection && (
            <div>
              <SectionHeader title={referencesSection.title || 'References'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {referencesSection.items.slice(0, 2).map((ref: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.2pt' }}>
                    <span style={{ fontWeight: 700, color: '#0D0D0D' }}>{ref.name}</span>
                    {ref.relationship && (
                      <span style={{ color: '#666666' }}> ({ref.relationship})</span>
                    )}
                    {ref.company && <span style={{ color: primaryColor }}> - {ref.company}</span>}
                    <div style={{ color: '#555555', fontSize: '7.8pt' }}>
                      {[ref.email, ref.phone].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Strengths, Skills, Certifications, Languages, Interests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Strengths / Core Competencies */}
          {strengthsSection && (
            <div>
              <SectionHeader title={strengthsSection.title || 'Key Strengths'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {strengthsSection.items.map((st: any, i: number) => (
                  <div key={i} style={{ fontSize: '8.2pt' }}>
                    <div style={{ fontWeight: 700, color: '#0D0D0D' }}>
                      • {st.title || st.name}
                    </div>
                    {st.description && (
                      <div
                        style={{
                          fontSize: '7.8pt',
                          lineHeight: 1.2,
                          color: '#555555',
                          paddingLeft: '8px',
                        }}
                      >
                        {st.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Proficiencies */}
          {skillsSection && (
            <div>
              <SectionHeader title={skillsSection.title || 'Technical Skills'} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingTop: '2px' }}>
                {skillsSection.items.map((sk: any, i: number) => {
                  const name = typeof sk === 'string' ? sk : sk.name;
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: '7.8pt',
                        fontWeight: 600,
                        backgroundColor: '#f1f5f9',
                        color: '#1e293b',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certificationsSection && (
            <div>
              <SectionHeader title={certificationsSection.title || 'Certifications'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {certificationsSection.items.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} style={{ fontSize: '8pt' }}>
                    <div style={{ fontWeight: 600, color: '#0D0D0D' }}>{c.name}</div>
                    <div style={{ fontSize: '7.5pt', color: '#666666' }}>
                      {[c.issuer, c.date].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languagesSection && (
            <div>
              <SectionHeader title={languagesSection.title || 'Languages'} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {languagesSection.items.map((l: any, i: number) => (
                  <span key={i} style={{ fontSize: '8pt', color: '#333333' }}>
                    <strong>{l.name || l.language}</strong>
                    {l.proficiency && (
                      <span style={{ color: '#777777' }}> ({l.proficiency})</span>
                    )}
                    {i < languagesSection.items.length - 1 && ' •'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests & Hobbies */}
          {interestsSection && (
            <div>
              <SectionHeader title={interestsSection.title || 'Interests'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {interestsSection.items.map((item: any, i: number) => (
                  <div key={i} style={{ fontSize: '8pt', color: '#444444' }}>
                    • <strong>{item.name || item.title}</strong>
                    {item.description && <span>: {item.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {awardsSection && (
            <div>
              <SectionHeader title={awardsSection.title || 'Honors & Awards'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {awardsSection.items.slice(0, 2).map((aw: any, i: number) => (
                  <div key={i} style={{ fontSize: '8pt' }}>
                    <div style={{ fontWeight: 600, color: '#0D0D0D' }}>{aw.title}</div>
                    <div style={{ fontSize: '7.5pt', color: '#666666' }}>
                      {[aw.issuer, aw.date].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
