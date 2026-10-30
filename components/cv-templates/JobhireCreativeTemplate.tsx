import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange, formatSingleDate } from '@/lib/renderer/styles';

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const JobhireCreativeTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#8B5CF6';
  const spacing = config.spacingScale || 1.0;
  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);

  const sidebarBg = hexToRgba(primaryColor, 0.08);

  // Partition sections into sidebar and main column
  const sidebarSectionTypes = new Set(['skills', 'languages', 'certifications']);
  const sidebarSections = (sections || []).filter(
    (s) => s.visible !== false && sidebarSectionTypes.has(s.type) && s.items?.length > 0
  );
  const mainSections = (sections || []).filter(
    (s) => s.visible !== false && !sidebarSectionTypes.has(s.type) && s.items?.length > 0
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ===================== SIDEBAR (Left ~30%) ===================== */}
      <div
        style={{
          width: '32%',
          backgroundColor: sidebarBg,
          padding: `${16 * spacing}px ${14 * spacing}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: `${16 * spacing}px`,
          borderRight: `1px solid ${hexToRgba(primaryColor, 0.15)}`,
        }}
      >
        {/* Photo in Sidebar */}
        {showPhoto && (
          <div
            style={{
              width: '100%',
              maxWidth: '38mm',
              aspectRatio: '1',
              margin: '0 auto',
              borderRadius:
                (config as any).photoShape === 'square'
                  ? '0px'
                  : (config as any).photoShape === 'rounded'
                  ? '12px'
                  : '50%',
              overflow: 'hidden',
              border: `3px solid ${primaryColor}`,
            }}
          >
            <img
              src={basics.photoUrl!}
              alt={basics.fullName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        )}

        {/* Contact Block in Sidebar */}
        <div>
          <div
            style={{
              fontSize: '10pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: primaryColor,
              marginBottom: '8px',
              borderBottom: `1.5px solid ${primaryColor}`,
              paddingBottom: '2px',
            }}
          >
            Contact
          </div>
          <div style={{ fontSize: '9pt', color: '#374151', lineHeight: 1.6, wordBreak: 'break-word' }}>
            {basics.location && <div>📍 {basics.location}</div>}
            {basics.phone && <div>📞 {basics.phone}</div>}
            {basics.email && <div>✉ {basics.email}</div>}
            {basics.website && <div>🌐 {basics.website}</div>}
            {basics.linkedin && <div>💼 {basics.linkedin}</div>}
          </div>
        </div>

        {/* Sidebar Sections (Skills, Languages, Certifications) */}
        {sidebarSections.map((section) => (
          <div key={section.id}>
            <div
              style={{
                fontSize: '10pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: primaryColor,
                marginBottom: '8px',
                borderBottom: `1.5px solid ${primaryColor}`,
                paddingBottom: '2px',
              }}
            >
              {section.title}
            </div>

            {section.type === 'skills' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {section.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '9pt', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.level && (
                      <div style={{ fontSize: '8pt', color: '#6b7280', textTransform: 'capitalize' }}>
                        {item.level}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section.type === 'languages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {section.items.map((item: any, idx: number) => {
                  const prof = item.proficiency
                    ? item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)
                    : '';
                  return (
                    <div key={idx} style={{ fontSize: '9pt', color: '#1f2937' }}>
                      <strong style={{ color: '#111827' }}>{item.name}</strong>
                      {prof && <span style={{ color: '#6b7280' }}> — {prof}</span>}
                    </div>
                  );
                })}
              </div>
            )}

            {section.type === 'certifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {section.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '8.5pt', color: '#1f2937' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.issuer && <div style={{ color: '#6b7280' }}>{item.issuer}</div>}
                    {item.date && <div style={{ color: '#9ca3af' }}>{formatSingleDate(item.date)}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===================== MAIN COLUMN (Right ~70%) ===================== */}
      <div
        style={{
          width: '68%',
          padding: `${16 * spacing}px ${20 * spacing}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: `${16 * spacing}px`,
        }}
      >
        {/* Main Column Header (Full Name) */}
        <div>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '24pt',
              fontWeight: 'bold',
              color: primaryColor,
              letterSpacing: '0.02em',
            }}
          >
            {basics.fullName}
          </h1>

          {basics.summary && (
            <div
              style={{
                fontSize: '9.5pt',
                lineHeight: 1.5,
                color: '#4b5563',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {basics.summary}
            </div>
          )}
        </div>

        {/* Main Column Sections (Experience, Education, Projects, Custom) */}
        {mainSections.map((section) => (
          <div key={section.id}>
            {/* Section Heading with 2px underline */}
            <div
              style={{
                fontSize: '11pt',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: primaryColor,
                borderBottom: `2px solid ${primaryColor}`,
                paddingBottom: '3px',
                marginBottom: `${10 * spacing}px`,
              }}
            >
              {section.title}
            </div>

            {section.type === 'experience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * spacing}px` }}>
                {section.items.map((item: any, idx: number) => {
                  const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#111827' }}>
                          {item.role}
                          {item.company && <span style={{ color: primaryColor }}> @ {item.company}</span>}
                        </span>
                        {dateRange && (
                          <span style={{ fontSize: '8.5pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {dateRange}
                          </span>
                        )}
                      </div>
                      {item.location && (
                        <div style={{ fontSize: '8.5pt', color: '#6b7280', fontStyle: 'italic', marginBottom: '2px' }}>
                          {item.location}
                        </div>
                      )}
                      {item.description && (
                        <div style={{ fontSize: '9pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {section.type === 'education' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * spacing}px` }}>
                {section.items.map((item: any, idx: number) => {
                  const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#111827' }}>
                          {item.degree}
                          {item.field && ` in ${item.field}`}
                          {item.institution && <span style={{ color: primaryColor }}> — {item.institution}</span>}
                        </span>
                        {dateRange && (
                          <span style={{ fontSize: '8.5pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {dateRange}
                          </span>
                        )}
                      </div>
                      {item.location && (
                        <div style={{ fontSize: '8.5pt', color: '#6b7280', fontStyle: 'italic', marginBottom: '2px' }}>
                          {item.location}
                        </div>
                      )}
                      {item.description && (
                        <div style={{ fontSize: '9pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {section.type === 'projects' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * spacing}px` }}>
                {section.items.map((item: any, idx: number) => {
                  const dateRange = formatDateRange(item.startDate, item.endDate);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#111827' }}>
                          {item.name}
                          {item.url && (
                            <span style={{ fontWeight: 'normal', fontSize: '8.5pt', color: '#6b7280', marginLeft: '6px' }}>
                              ({item.url})
                            </span>
                          )}
                        </span>
                        {dateRange && (
                          <span style={{ fontSize: '8.5pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {dateRange}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '9pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {section.type === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * spacing}px` }}>
                {section.items.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#111827' }}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '9pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
