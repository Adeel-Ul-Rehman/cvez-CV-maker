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
  convertMillimetersToTwip,
  BorderStyle,
} from 'docx';
import type { DocxRenderContext } from './types';
import {
  cleanHex,
  formatDateRange,
  formatSingleDate,
  heading,
  chunkBullets,
  NO_TABLE_BORDERS,
} from './common';

export async function generateJobhireChronologicalDocx(
  ctx: DocxRenderContext
): Promise<Buffer> {
  const { data, config } = ctx;
  const { basics, sections } = data;
  const primaryHex = cleanHex(config.primaryColor, '111827');
  const fontFamily = config.fontFamily || 'Calibri';

  const docChildren: any[] = [];

  // ===================== CENTERED HEADER (NO PHOTO) =====================
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: basics.fullName.toUpperCase(),
          bold: true,
          font: fontFamily,
          size: 36, // 18pt
          color: primaryHex,
        }),
      ],
    })
  );

  const contactParts: string[] = [
    basics.location,
    basics.phone,
    basics.email,
    basics.linkedin,
    basics.website,
  ].filter(Boolean) as string[];

  if (contactParts.length > 0) {
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: contactParts.map(
          (part, idx) =>
            new TextRun({
              text: idx < contactParts.length - 1 ? `${part}   ·   ` : part,
              font: fontFamily,
              size: 19, // 9.5pt
              color: '4B5563',
            })
        ),
      })
    );
  }

  // Header bottom border
  docChildren.push(
    new Paragraph({
      spacing: { after: 180 },
      border: {
        bottom: {
          color: primaryHex,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 10,
        },
      },
    })
  );

  // ===================== SUMMARY =====================
  if (basics.summary) {
    docChildren.push(heading('Professional Summary', 1, config));
    docChildren.push(
      new Paragraph({
        spacing: { before: 60, after: 160 },
        children: [
          new TextRun({
            text: basics.summary,
            font: fontFamily,
            size: 20, // 10pt
            color: '374151',
          }),
        ],
      })
    );
  }

  // ===================== SECTIONS =====================
  const visibleSections = (sections || []).filter(
    (s) => s.visible !== false && Array.isArray(s.items) && s.items.length > 0
  );

  for (const section of visibleSections) {
    docChildren.push(heading(section.title, 1, config));

    if (section.type === 'experience') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
        const roleText = item.role;
        const companyText = item.company ? ` — ${item.company}` : '';
        const locText = item.location ? ` (${item.location})` : '';

        const entryTable = new Table({
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
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: roleText,
                          bold: true,
                          font: fontFamily,
                          size: 20,
                          color: '111827',
                        }),
                        new TextRun({
                          text: companyText,
                          font: fontFamily,
                          size: 20,
                          color: '374151',
                        }),
                        new TextRun({
                          text: locText,
                          italics: true,
                          font: fontFamily,
                          size: 18,
                          color: '6B7280',
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
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: dateRange,
                          font: fontFamily,
                          size: 18,
                          color: '4B5563',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(entryTable);

        // Bullets from description
        const bullets = chunkBullets(item.description);
        for (const bullet of bullets) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '374151',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'education') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
        const degreeText = item.degree;
        const fieldText = item.field ? ` in ${item.field}` : '';
        const instText = item.institution ? ` — ${item.institution}` : '';

        const entryTable = new Table({
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
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: degreeText,
                          bold: true,
                          font: fontFamily,
                          size: 20,
                          color: '111827',
                        }),
                        new TextRun({
                          text: fieldText,
                          font: fontFamily,
                          size: 20,
                          color: '374151',
                        }),
                        new TextRun({
                          text: instText,
                          font: fontFamily,
                          size: 20,
                          color: '374151',
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
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: dateRange,
                          font: fontFamily,
                          size: 18,
                          color: '4B5563',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(entryTable);

        const bullets = chunkBullets(item.description);
        for (const bullet of bullets) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '374151',
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
            color: '111827',
          })
        );
        if (item.level) {
          skillRuns.push(
            new TextRun({
              text: ` (${item.level})`,
              font: fontFamily,
              size: 18,
              color: '4B5563',
            })
          );
        }
        if (idx < items.length - 1) {
          skillRuns.push(
            new TextRun({
              text: '   ·   ',
              font: fontFamily,
              size: 18,
              color: '9CA3AF',
            })
          );
        }
      });
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 140 },
          children: skillRuns,
        })
      );
    } else if (section.type === 'projects') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate);
        const nameRuns = [
          new TextRun({
            text: item.name,
            bold: true,
            font: fontFamily,
            size: 20,
            color: '111827',
          }),
        ];
        if (item.url) {
          nameRuns.push(
            new TextRun({
              text: ` (${item.url})`,
              font: fontFamily,
              size: 17,
              color: '4B5563',
            })
          );
        }

        const projectTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [new Paragraph({ spacing: { before: 60, after: 20 }, children: nameRuns })],
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
                          size: 18,
                          color: '4B5563',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        docChildren.push(projectTable);

        const bullets = chunkBullets(item.description);
        for (const bullet of bullets) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '374151',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'certifications') {
      for (const item of section.items as any[]) {
        const certRuns = [
          new TextRun({
            text: `•  ${item.name}`,
            bold: true,
            font: fontFamily,
            size: 19,
            color: '111827',
          }),
        ];
        if (item.issuer) {
          certRuns.push(
            new TextRun({
              text: ` — ${item.issuer}`,
              font: fontFamily,
              size: 19,
              color: '4B5563',
            })
          );
        }
        if (item.date) {
          certRuns.push(
            new TextRun({
              text: ` (${formatSingleDate(item.date)})`,
              font: fontFamily,
              size: 18,
              color: '6B7280',
            })
          );
        }
        docChildren.push(
          new Paragraph({
            spacing: { before: 30, after: 30 },
            children: certRuns,
          })
        );
      }
    } else if (section.type === 'languages') {
      const langRuns: TextRun[] = [];
      const items = section.items as any[];
      items.forEach((item, idx) => {
        const prof = item.proficiency
          ? item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)
          : '';
        langRuns.push(
          new TextRun({
            text: item.name,
            bold: true,
            font: fontFamily,
            size: 19,
            color: '111827',
          })
        );
        if (prof) {
          langRuns.push(
            new TextRun({
              text: ` (${prof})`,
              font: fontFamily,
              size: 18,
              color: '4B5563',
            })
          );
        }
        if (idx < items.length - 1) {
          langRuns.push(
            new TextRun({
              text: '   ·   ',
              font: fontFamily,
              size: 18,
              color: '9CA3AF',
            })
          );
        }
      });
      docChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 140 },
          children: langRuns,
        })
      );
    } else if (section.type === 'custom') {
      for (const item of section.items as any[]) {
        docChildren.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: item.title,
                bold: true,
                font: fontFamily,
                size: 20,
                color: '111827',
              }),
            ],
          })
        );
        const bullets = chunkBullets(item.description);
        for (const bullet of bullets) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              indent: { left: convertMillimetersToTwip(4) },
              children: [
                new TextRun({
                  text: `•  ${bullet}`,
                  font: fontFamily,
                  size: 19,
                  color: '374151',
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
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(20),
              right: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(20),
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
