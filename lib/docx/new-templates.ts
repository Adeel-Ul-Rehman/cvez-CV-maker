import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  convertMillimetersToTwip,
  BorderStyle,
  ShadingType,
} from 'docx';
import type { DocxRenderContext } from './types';
import {
  cleanHex,
  tintColorHex,
  formatDateRange,
  formatSingleDate,
  heading,
  chunkBullets,
  fetchImageBuffer,
  detectImageType,
  NO_TABLE_BORDERS,
} from './common';

// ============================================================================
// 1. ADEEL UL REHMAN SIGNATURE TEMPLATE DOCX
// ============================================================================
export async function generateAdeelSignatureDocx(
  ctx: DocxRenderContext
): Promise<Buffer> {
  const { data, config } = ctx;
  const { basics, sections } = data;
  const primaryHex = cleanHex(config.primaryColor, '0F172A');
  const fontFamily = config.fontFamily || 'Inter';
  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);

  const docChildren: any[] = [];

  // Header Table or Block
  let photoBuffer: Buffer | null = null;
  if (showPhoto) {
    photoBuffer = await fetchImageBuffer(basics.photoUrl);
  }

  const nameParagraph = new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({
        text: basics.fullName.toUpperCase(),
        bold: true,
        font: fontFamily,
        size: 38, // 19pt
        color: primaryHex,
      }),
    ],
  });

  const contactParts: string[] = [
    basics.location,
    basics.phone,
    basics.email,
    basics.linkedin,
    basics.website,
  ].filter(Boolean) as string[];

  const contactParagraph = new Paragraph({
    spacing: { after: 120 },
    children: contactParts.map((part, idx) =>
      new TextRun({
        text: idx < contactParts.length - 1 ? `${part}   •   ` : part,
        font: fontFamily,
        size: 19, // 9.5pt
        color: '475569',
      })
    ),
  });

  if (photoBuffer) {
    const photoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              borders: NO_TABLE_BORDERS,
              children: [nameParagraph, contactParagraph],
            }),
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: NO_TABLE_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new ImageRun({
                      type: detectImageType(photoBuffer),
                      data: photoBuffer,
                      transformation: { width: 90, height: 90 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    docChildren.push(photoTable);
  } else {
    docChildren.push(nameParagraph);
    docChildren.push(contactParagraph);
  }

  // Header separator bar
  docChildren.push(
    new Paragraph({
      spacing: { after: 140 },
      border: {
        bottom: {
          color: primaryHex,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 14,
        },
      },
    })
  );

  // Professional Summary
  if (basics.summary) {
    docChildren.push(heading('Professional Summary', 1, config));
    docChildren.push(
      new Paragraph({
        spacing: { before: 60, after: 140 },
        children: [
          new TextRun({
            text: basics.summary,
            font: fontFamily,
            size: 20,
            color: '334155',
          }),
        ],
      })
    );
  }

  // Sections
  const visibleSections = (sections || []).filter(
    (s) => s.visible !== false && Array.isArray(s.items) && s.items.length > 0
  );

  for (const section of visibleSections) {
    docChildren.push(heading(section.title, 1, config));

    if (section.type === 'experience') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
        const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: item.role,
                          bold: true,
                          font: fontFamily,
                          size: 21,
                          color: '0F172A',
                        }),
                        new TextRun({
                          text: item.company ? ` — ${item.company}` : '',
                          font: fontFamily,
                          size: 20,
                          color: '334155',
                        }),
                        new TextRun({
                          text: item.location ? ` (${item.location})` : '',
                          italics: true,
                          font: fontFamily,
                          size: 18,
                          color: '64748B',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: dateRange,
                          font: fontFamily,
                          size: 19,
                          color: '475569',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(headerTable);

        for (const bullet of chunkBullets(item.description)) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '334155',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'education') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
        const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: item.degree,
                          bold: true,
                          font: fontFamily,
                          size: 21,
                          color: '0F172A',
                        }),
                        new TextRun({
                          text: item.field ? ` in ${item.field}` : '',
                          font: fontFamily,
                          size: 20,
                          color: '334155',
                        }),
                        new TextRun({
                          text: item.institution ? ` — ${item.institution}` : '',
                          font: fontFamily,
                          size: 20,
                          color: '334155',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: dateRange,
                          font: fontFamily,
                          size: 19,
                          color: '475569',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(headerTable);

        for (const bullet of chunkBullets(item.description)) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '334155',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'skills') {
      const skillRuns: TextRun[] = [];
      const items = section.items as any[];
      items.forEach((item, idx) => {
        skillRuns.push(
          new TextRun({
            text: item.name,
            bold: true,
            font: fontFamily,
            size: 19,
            color: '0F172A',
          })
        );
        if (idx < items.length - 1) {
          skillRuns.push(
            new TextRun({
              text: '   •   ',
              font: fontFamily,
              size: 19,
              color: '94A3B8',
            })
          );
        }
      });
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 120 },
          children: skillRuns,
        })
      );
    } else if (section.type === 'projects') {
      for (const item of section.items as any[]) {
        const headerTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: item.name,
                          bold: true,
                          font: fontFamily,
                          size: 21,
                          color: '0F172A',
                        }),
                        new TextRun({
                          text: item.url ? ` (${item.url})` : '',
                          font: fontFamily,
                          size: 18,
                          color: primaryHex,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 60, after: 20 },
                      children: [
                        new TextRun({
                          text: item.startDate || '',
                          font: fontFamily,
                          size: 19,
                          color: '475569',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(headerTable);

        for (const bullet of chunkBullets(item.description)) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '334155',
                }),
              ],
            })
          );
        }
      }
    } else {
      for (const item of section.items as any[]) {
        const titleText = item.name || item.title || item.language || '';
        docChildren.push(
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({
                text: titleText,
                bold: true,
                font: fontFamily,
                size: 20,
                color: '0F172A',
              }),
            ],
          })
        );
        for (const bullet of chunkBullets(item.description)) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '334155',
                }),
              ],
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(16),
              bottom: convertMillimetersToTwip(16),
              left: convertMillimetersToTwip(18),
              right: convertMillimetersToTwip(18),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
