import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange, formatSingleDate } from '@/lib/renderer/styles';

export const JobhireChronologicalTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#111827';
  const spacing = config.spacingScale || 1.0;

  const visibleSections = (sections || []).filter(
    (s) => s.visible !== false && Array.isArray(s.items) && s.items.length > 0
  );

  // Contact items filtered to present ones
  const contactParts: string[] = [];
  if (basics.location) contactParts.push(basics.location);
  if (basics.phone) contactParts.push(basics.phone);
  if (basics.email) contactParts.push(basics.email);
  if (basics.linkedin) contactParts.push(basics.linkedin);
  if (basics.website) contactParts.push(basics.website);

  // Helper to split multi-line description into ATS bullet points
  const renderBulletList = (desc?: string | null) => {
    if (!desc || !desc.trim()) return null;
    const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean);
    return (
      <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', listStyleType: 'disc' }}>
        {lines.map((line, idx) => (
          <li
            key={idx}
            style={{
              fontSize: '9.5pt',
              lineHeight: 1.45,
              color: '#374151',
              marginBottom: '2px',
            }}
          >
            {line.startsWith('•') || line.startsWith('-') ? line.replace(/^[•\-]\s*/, '') : line}
          </li>
        ))}
      </ul>
    );
  };

  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);
  const photoPosition = (config as any).photoPosition || 'center';
  const photoShape = (config as any).photoShape || 'circle';
  const borderRadius =
    photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '8px' : '0px';

  const photoElement = showPhoto && (
    <div
      style={{
        width: '36mm',
        height: '36mm',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius,
        border: `2px solid ${primaryColor}`,
        backgroundColor: '#f8fafc',
        margin:
          photoPosition === 'center'
            ? '0 auto 10px auto'
            : photoPosition === 'left'
            ? '0 15mm 0 0'
            : '0 0 0 15mm',
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
  );

  return (
    <div style={{ width: '100%' }}>
      {/* ----------------- Header ----------------- */}
      <div
        style={{
          display: 'flex',
          flexDirection: photoPosition === 'center' ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: photoPosition === 'center' ? 'center' : 'space-between',
          textAlign: photoPosition === 'center' ? 'center' : 'left',
          paddingBottom: `${12 * spacing}px`,
          marginBottom: `${16 * spacing}px`,
          borderBottom: `1.5px solid ${primaryColor}`,
        }}
      >
        {photoPosition === 'left' && photoElement}
        {photoPosition === 'center' && photoElement}

        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: '0 0 6px 0',
              fontSize: '22pt',
              fontWeight: 'bold',
              color: primaryColor,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {basics.fullName}
          </h1>

        {contactParts.length > 0 && (
          <div
            style={{
              fontSize: '9.5pt',
              color: '#4b5563',
              lineHeight: 1.4,
            }}
          >
            {contactParts.map((part, idx) => (
              <span key={idx}>
                {part}
                {idx < contactParts.length - 1 && '  ·  '}
              </span>
            ))}
          </div>
        )}
        </div>
        {photoPosition === 'right' && photoElement}
      </div>

      {/* Summary */}
      {basics.summary && (
        <div style={{ marginBottom: `${16 * spacing}px` }}>
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: primaryColor,
              borderBottom: `1px solid #d1d5db`,
              paddingBottom: '2px',
              marginBottom: `${6 * spacing}px`,
            }}
          >
            Professional Summary
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '9.5pt',
              lineHeight: 1.5,
              color: '#374151',
              whiteSpace: 'pre-wrap',
            }}
          >
            {basics.summary}
          </p>
        </div>
      )}

      {/* ----------------- Sections ----------------- */}
      {visibleSections.map((section) => (
        <div key={section.id} style={{ marginBottom: `${16 * spacing}px` }}>
          {/* Section Heading: Bold, uppercase, left-aligned with subtle border */}
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: primaryColor,
              borderBottom: `1px solid #d1d5db`,
              paddingBottom: '2px',
              marginBottom: `${8 * spacing}px`,
            }}
          >
            {section.title}
          </div>

          {/* Experience */}
          {section.type === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => {
                const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <strong style={{ fontSize: '10pt', color: '#111827' }}>{item.role}</strong>
                        {item.company && (
                          <span style={{ fontSize: '10pt', color: '#374151' }}> — {item.company}</span>
                        )}
                        {item.location && (
                          <span style={{ fontSize: '9pt', color: '#6b7280', fontStyle: 'italic' }}>
                            {' '}({item.location})
                          </span>
                        )}
                      </div>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#4b5563', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {renderBulletList(item.description)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Education */}
          {section.type === 'education' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => {
                const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <strong style={{ fontSize: '10pt', color: '#111827' }}>{item.degree}</strong>
                        {item.field && <span> in {item.field}</span>}
                        {item.institution && <span> — {item.institution}</span>}
                      </div>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#4b5563', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {item.location && (
                      <div style={{ fontSize: '9pt', color: '#6b7280', fontStyle: 'italic' }}>
                        {item.location}
                      </div>
                    )}
                    {renderBulletList(item.description)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Skills (Inline chips with bullets / separators) */}
          {section.type === 'skills' && (
            <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: 1.6 }}>
              {section.items.map((item: any, idx: number) => (
                <span key={idx}>
                  <strong style={{ color: '#111827' }}>{item.name}</strong>
                  {item.level && ` (${item.level})`}
                  {idx < section.items.length - 1 && '  ·  '}
                </span>
              ))}
            </div>
          )}

          {/* Projects */}
          {section.type === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <strong style={{ fontSize: '10pt', color: '#111827' }}>{item.name}</strong>
                        {item.url && (
                          <span style={{ fontSize: '8.5pt', color: '#4b5563', marginLeft: '6px' }}>
                            ({item.url})
                          </span>
                        )}
                      </div>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#4b5563', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {renderBulletList(item.description)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Certifications */}
          {section.type === 'certifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => (
                <div key={idx} style={{ fontSize: '9.5pt', color: '#374151' }}>
                  • <strong style={{ color: '#111827' }}>{item.name}</strong>
                  {item.issuer && ` — ${item.issuer}`}
                  {item.date && ` (${formatSingleDate(item.date)})`}
                </div>
              ))}
            </div>
          )}

          {/* Languages */}
          {section.type === 'languages' && (
            <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: 1.6 }}>
              {section.items.map((item: any, idx: number) => {
                const prof = item.proficiency
                  ? item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)
                  : '';
                return (
                  <span key={idx}>
                    <strong style={{ color: '#111827' }}>{item.name}</strong>
                    {prof && ` (${prof})`}
                    {idx < section.items.length - 1 && '  ·  '}
                  </span>
                );
              })}
            </div>
          )}

          {/* Custom Section */}
          {section.type === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => (
                <div key={idx}>
                  <div style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#111827' }}>
                    {item.title}
                  </div>
                  {renderBulletList(item.description)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
