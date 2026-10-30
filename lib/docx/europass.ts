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
} from 'docx';
import type { DocxRenderContext } from './types';
import {
  cleanHex,
  formatDateRange,
  formatSingleDate,
  heading,
  fetchImageBuffer,
  detectImageType,
  NO_TABLE_BORDERS,
} from './common';

export async function generateEuropassDocx(ctx: DocxRenderContext): Promise<Buffer> {
  const { data, config } = ctx;
  const { basics, sections } = data;
  const primaryHex = cleanHex(config.primaryColor, '0B3D91');
  const fontFamily = config.fontFamily || 'Arial';
  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);

  const docChildren: any[] = [];

  // ===================== HEADER =====================
  let photoBuffer: Buffer | null = null;
  if (showPhoto) {
    photoBuffer = await fetchImageBuffer(basics.photoUrl);
  }

  const contactParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: basics.fullName,
          bold: true,
          font: fontFamily,
          size: 40, // 20pt
          color: primaryHex,
        }),
      ],
    }),
  ];

  const contactLines = [
    basics.location,
    basics.phone,
    basics.email,
    basics.website,
    basics.linkedin,
  ].filter(Boolean) as string[];

  for (const line of contactLines) {
    contactParagraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: line,
            font: fontFamily,
            size: 19, // 9.5pt
            color: '374151',
          }),
        ],
      })
    );
  }

  if (photoBuffer) {
    // 2-column header table with photo on the right
    const headerTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: NO_TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 75, type: WidthType.PERCENTAGE },
              borders: NO_TABLE_BORDERS,
              children: contactParagraphs,
            }),
            new TableCell({
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: NO_TABLE_BORDERS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new ImageRun({
                      type: detectImageType(photoBuffer),
                      data: photoBuffer,
                      transformation: {
                        width: 120,
                        height: 120,
                      },
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
  } else {
    docChildren.push(...contactParagraphs);
  }

  // Header bottom border
  docChildren.push(
    new Paragraph({
      spacing: { before: 80, after: 180 },
      border: {
        bottom: {
          color: primaryHex,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 12, // 1.5pt
        },
      },
    })
  );

  // ===================== PERSONAL STATEMENT =====================
  if (basics.summary) {
    docChildren.push(heading('Personal Statement', 1, config));
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
        const roleCompany = `${item.role}${item.company ? ` — ${item.company}` : ''}`;

        const entryTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: roleCompany,
                          bold: true,
                          font: fontFamily,
                          size: 21, // 10.5pt
                          color: '111827',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.RIGHT,
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: dateRange,
                          font: fontFamily,
                          size: 18, // 9pt
                          color: '6B7280',
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

        if (item.location) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: item.location,
                  italics: true,
                  font: fontFamily,
                  size: 18,
                  color: '6B7280',
                }),
              ],
            })
          );
        }

        if (item.description) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: item.description,
                  font: fontFamily,
                  size: 19, // 9.5pt
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
        const degreeInfo = `${item.degree}${item.field ? `, ${item.field}` : ''}${
          item.institution ? ` — ${item.institution}` : ''
        }`;

        const entryTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({
                          text: degreeInfo,
                          bold: true,
                          font: fontFamily,
                          size: 21,
                          color: '111827',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
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
                          color: '6B7280',
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

        if (item.location) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: item.location,
                  italics: true,
                  font: fontFamily,
                  size: 18,
                  color: '6B7280',
                }),
              ],
            })
          );
        }

        if (item.description) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: item.description,
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
            size: 20,
            color: '111827',
          })
        );
        if (item.level) {
          skillRuns.push(
            new TextRun({
              text: ` (${item.level})`,
              font: fontFamily,
              size: 19,
              color: '4B5563',
            })
          );
        }
        if (idx < items.length - 1) {
          skillRuns.push(
            new TextRun({
              text: '   ·   ',
              font: fontFamily,
              size: 19,
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
            size: 20,
            color: '111827',
          })
        );
        if (prof) {
          langRuns.push(
            new TextRun({
              text: ` — ${prof}`,
              font: fontFamily,
              size: 19,
              color: '4B5563',
            })
          );
        }
        if (idx < items.length - 1) {
          langRuns.push(
            new TextRun({
              text: '   ·   ',
              font: fontFamily,
              size: 19,
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
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [new Paragraph({ spacing: { before: 60, after: 20 }, children: nameRuns })],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
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
                          color: '6B7280',
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

        if (item.description) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
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
            text: item.name,
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
            spacing: { before: 40, after: 40 },
            children: certRuns,
          })
        );
      }
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
        if (item.description) {
          docChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
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
