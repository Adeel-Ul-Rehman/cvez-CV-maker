import React from 'react';
import type { TemplateProps } from '@/lib/renderer/types';
import { formatDateRange, formatSingleDate } from '@/lib/renderer/styles';

export const EuropassTemplate: React.FC<TemplateProps> = ({ data, config }) => {
  const { basics, sections } = data;
  const primaryColor = config.primaryColor || '#0B3D91';
  const spacing = config.spacingScale || 1.0;
  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);
  const photoPosition = (config as any).photoPosition || 'right';
  const photoShape = (config as any).photoShape || 'square';
  const borderRadius =
    photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '8px' : '0px';

  const visibleSections = (sections || []).filter(
    (s: any) => s.visible !== false && Array.isArray(s.items) && s.items.length > 0
  );

  const photoElement = showPhoto && (
    <div
      style={{
        width: '42mm',
        height: '42mm',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius,
        border: `1px solid #cbd5e1`,
        backgroundColor: '#f8fafc',
        margin:
          photoPosition === 'center'
            ? '0 0 12px 0'
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
      {/* ----------------- Header Block ----------------- */}
      <div
        style={{
          display: 'flex',
          flexDirection: photoPosition === 'center' ? 'column' : 'row',
          justifyContent: photoPosition === 'center' ? 'center' : 'space-between',
          alignItems: photoPosition === 'center' ? 'center' : 'flex-start',
          textAlign: photoPosition === 'center' ? 'center' : 'left',
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: `${12 * spacing}px`,
          marginBottom: `${18 * spacing}px`,
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
              letterSpacing: '0.02em',
            }}
          >
            {basics.fullName}
          </h1>

          {/* Contact Details on separate lines */}
          <div
            style={{
              fontSize: '9.5pt',
              lineHeight: 1.45,
              color: '#374151',
            }}
          >
            {basics.location && <div>{basics.location}</div>}
            {basics.phone && <div>{basics.phone}</div>}
            {basics.email && <div>{basics.email}</div>}
            {basics.website && <div>{basics.website}</div>}
            {basics.linkedin && <div>{basics.linkedin}</div>}
          </div>
        </div>

        {photoPosition === 'right' && photoElement}
      </div>

      {/* Summary / Profile Statement */}
      {basics.summary && (
        <div style={{ marginBottom: `${16 * spacing}px` }}>
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: primaryColor,
              borderBottom: `1px solid ${primaryColor}4D`,
              paddingBottom: '3px',
              marginBottom: `${6 * spacing}px`,
            }}
          >
            Personal Statement
          </div>
          <div
            style={{
              fontSize: '10pt',
              lineHeight: 1.5,
              color: '#374151',
              whiteSpace: 'pre-wrap',
            }}
          >
            {basics.summary}
          </div>
        </div>
      )}

      {/* ----------------- Sections ----------------- */}
      {visibleSections.map((section) => (
        <div key={section.id} style={{ marginBottom: `${18 * spacing}px` }}>
          {/* Section Heading */}
          <div
            style={{
              fontSize: '11pt',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: primaryColor,
              borderBottom: `1px solid ${primaryColor}4D`,
              paddingBottom: '3px',
              marginBottom: `${10 * spacing}px`,
            }}
          >
            {section.title}
          </div>

          {/* Section Items by Type */}
          {section.type === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => {
                const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10.5pt', color: '#111827' }}>
                        {item.role}
                        {item.company ? ` — ${item.company}` : ''}
                      </span>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {item.location && (
                      <div style={{ fontSize: '9pt', color: '#6b7280', fontStyle: 'italic', marginBottom: '3px' }}>
                        {item.location}
                      </div>
                    )}
                    {item.description && (
                      <div style={{ fontSize: '9.5pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
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
                      <span style={{ fontWeight: 'bold', fontSize: '10.5pt', color: '#111827' }}>
                        {item.degree}
                        {item.field ? `, ${item.field}` : ''}
                        {item.institution ? ` — ${item.institution}` : ''}
                      </span>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {item.location && (
                      <div style={{ fontSize: '9pt', color: '#6b7280', fontStyle: 'italic', marginBottom: '3px' }}>
                        {item.location}
                      </div>
                    )}
                    {item.description && (
                      <div style={{ fontSize: '9.5pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {section.type === 'skills' && (
            <div style={{ fontSize: '10pt', color: '#374151', lineHeight: 1.6 }}>
              {section.items.map((item: any, idx: number) => (
                <span key={idx}>
                  <strong style={{ color: '#111827' }}>{item.name}</strong>
                  {item.level ? ` (${item.level})` : ''}
                  {idx < section.items.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}

          {section.type === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#111827' }}>
                        {item.name}
                        {item.url && (
                          <span style={{ fontWeight: 'normal', fontSize: '8.5pt', color: '#4b5563', marginLeft: '6px' }}>
                            ({item.url})
                          </span>
                        )}
                      </span>
                      {dateRange && (
                        <span style={{ fontSize: '9pt', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div style={{ fontSize: '9.5pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {section.type === 'certifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => (
                <div key={idx} style={{ fontSize: '9.5pt', color: '#374151' }}>
                  <strong style={{ color: '#111827' }}>{item.name}</strong>
                  {item.issuer ? ` — ${item.issuer}` : ''}
                  {item.date ? ` (${formatSingleDate(item.date)})` : ''}
                </div>
              ))}
            </div>
          )}

          {section.type === 'languages' && (
            <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: 1.6 }}>
              {section.items.map((item: any, idx: number) => {
                const prof = item.proficiency
                  ? item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)
                  : '';
                return (
                  <span key={idx}>
                    <strong style={{ color: '#111827' }}>{item.name}</strong>
                    {prof ? ` — ${prof}` : ''}
                    {idx < section.items.length - 1 ? ' · ' : ''}
                  </span>
                );
              })}
            </div>
          )}

          {section.type === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * spacing}px` }}>
              {section.items.map((item: any, idx: number) => (
                <div key={idx}>
                  <div style={{ fontWeight: 'bold', fontSize: '10pt', color: '#111827' }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '9.5pt', lineHeight: 1.45, color: '#374151', whiteSpace: 'pre-wrap' }}>
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
  );
};
