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
  fetchImageBuffer,
  detectImageType,
  NO_TABLE_BORDERS,
} from './common';

export async function generateJobhireCreativeDocx(
  ctx: DocxRenderContext
): Promise<Buffer> {
  const { data, config } = ctx;
  const { basics, sections } = data;
  const primaryHex = cleanHex(config.primaryColor, '8B5CF6');
  const sidebarBgHex = tintColorHex(config.primaryColor, 0.08);
  const fontFamily = config.fontFamily || 'Arial';
  const showPhoto = config.showPhoto && Boolean(basics.photoUrl);

  // Partition sections into sidebar (skills, languages, certifications) and main (experience, education, projects, custom)
  const sidebarSectionTypes = new Set(['skills', 'languages', 'certifications']);
  const sidebarSections = (sections || []).filter(
    (s) => s.visible !== false && sidebarSectionTypes.has(s.type) && Array.isArray(s.items) && s.items.length > 0
  );
  const mainSections = (sections || []).filter(
    (s) => s.visible !== false && !sidebarSectionTypes.has(s.type) && Array.isArray(s.items) && s.items.length > 0
  );

  // ===================== SIDEBAR CONTENT =====================
  const sidebarChildren: Paragraph[] = [];

  // Photo
  if (showPhoto) {
    const photoBuffer = await fetchImageBuffer(basics.photoUrl);
    if (photoBuffer) {
      sidebarChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 140 },
          children: [
            new ImageRun({
              type: detectImageType(photoBuffer),
              data: photoBuffer,
              transformation: {
                width: 100,
                height: 100,
              },
            }),
          ],
        })
      );
    }
  }

  // Sidebar: Contact Block
  sidebarChildren.push(
    new Paragraph({
      spacing: { before: 80, after: 60 },
      border: {
        bottom: {
          color: primaryHex,
          space: 2,
          style: BorderStyle.SINGLE,
          size: 8,
        },
      },
      children: [
        new TextRun({
          text: 'CONTACT',
          bold: true,
          font: fontFamily,
          size: 20, // 10pt
          color: primaryHex,
        }),
      ],
    })
  );

  const contactLines = [
    basics.location ? `📍  ${basics.location}` : '',
    basics.phone ? `📞  ${basics.phone}` : '',
    basics.email ? `✉  ${basics.email}` : '',
    basics.website ? `🌐  ${basics.website}` : '',
    basics.linkedin ? `💼  ${basics.linkedin}` : '',
  ].filter(Boolean);

  for (const line of contactLines) {
    sidebarChildren.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: line,
            font: fontFamily,
            size: 18, // 9pt
            color: '374151',
          }),
        ],
      })
    );
  }

  // Sidebar Sections (Skills, Languages, Certifications)
  for (const section of sidebarSections) {
    sidebarChildren.push(
      new Paragraph({
        spacing: { before: 140, after: 60 },
        border: {
          bottom: {
            color: primaryHex,
            space: 2,
            style: BorderStyle.SINGLE,
            size: 8,
          },
        },
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            font: fontFamily,
            size: 20,
            color: primaryHex,
          }),
        ],
      })
    );

    if (section.type === 'skills') {
      for (const item of section.items as any[]) {
        sidebarChildren.push(
          new Paragraph({
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: item.name,
                bold: true,
                font: fontFamily,
                size: 18,
                color: '1F2937',
              }),
              ...(item.level
                ? [
                    new TextRun({
                      text: ` (${item.level})`,
                      font: fontFamily,
                      size: 16,
                      color: '6B7280',
                    }),
                  ]
                : []),
            ],
          })
        );
      }
    } else if (section.type === 'languages') {
      for (const item of section.items as any[]) {
        const prof = item.proficiency
          ? item.proficiency.charAt(0).toUpperCase() + item.proficiency.slice(1)
          : '';
        sidebarChildren.push(
          new Paragraph({
            spacing: { after: 20 },
            children: [
              new TextRun({
                text: item.name,
                bold: true,
                font: fontFamily,
                size: 18,
                color: '1F2937',
              }),
              ...(prof
                ? [
                    new TextRun({
                      text: ` — ${prof}`,
                      font: fontFamily,
                      size: 17,
                      color: '6B7280',
                    }),
                  ]
                : []),
            ],
          })
        );
      }
    } else if (section.type === 'certifications') {
      for (const item of section.items as any[]) {
        sidebarChildren.push(
          new Paragraph({
            spacing: { after: 10 },
            children: [
              new TextRun({
                text: item.name,
                bold: true,
                font: fontFamily,
                size: 17,
                color: '1F2937',
              }),
            ],
          })
        );
        if (item.issuer || item.date) {
          const detail = [item.issuer, item.date ? formatSingleDate(item.date) : ''].filter(Boolean).join(' • ');
          sidebarChildren.push(
            new Paragraph({
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: detail,
                  font: fontFamily,
                  size: 16,
                  color: '6B7280',
                }),
              ],
            })
          );
        }
      }
    }
  }

  // ===================== MAIN COLUMN CONTENT =====================
  const mainChildren: any[] = [];

  // Name & Summary
  mainChildren.push(
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        new TextRun({
          text: basics.fullName,
          bold: true,
          font: fontFamily,
          size: 44, // 22pt
          color: primaryHex,
        }),
      ],
    })
  );

  if (basics.summary) {
    mainChildren.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: basics.summary,
            font: fontFamily,
            size: 19, // 9.5pt
            color: '4B5563',
          }),
        ],
      })
    );
  }

  // Main Sections
  for (const section of mainSections) {
    mainChildren.push(
      new Paragraph({
        spacing: { before: 140, after: 80 },
        border: {
          bottom: {
            color: primaryHex,
            space: 3,
            style: BorderStyle.SINGLE,
            size: 12, // 1.5pt underline
          },
        },
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            font: fontFamily,
            size: 22, // 11pt
            color: primaryHex,
          }),
        ],
      })
    );

    if (section.type === 'experience') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate, item.current);
        const roleRuns = [
          new TextRun({
            text: item.role,
            bold: true,
            font: fontFamily,
            size: 20,
            color: '111827',
          }),
        ];
        if (item.company) {
          roleRuns.push(
            new TextRun({
              text: ` @ ${item.company}`,
              bold: true,
              font: fontFamily,
              size: 20,
              color: primaryHex,
            })
          );
        }

        const entryTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [new Paragraph({ spacing: { before: 60, after: 20 }, children: roleRuns })],
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
                          size: 17,
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
        mainChildren.push(entryTable);

        if (item.location) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [
                new TextRun({
                  text: item.location,
                  italics: true,
                  font: fontFamily,
                  size: 17,
                  color: '6B7280',
                }),
              ],
            })
          );
        }

        if (item.description) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
                  font: fontFamily,
                  size: 18, // 9pt
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
        const eduRuns = [
          new TextRun({
            text: item.degree,
            bold: true,
            font: fontFamily,
            size: 20,
            color: '111827',
          }),
        ];
        if (item.field) {
          eduRuns.push(
            new TextRun({
              text: ` in ${item.field}`,
              font: fontFamily,
              size: 20,
              color: '374151',
            })
          );
        }
        if (item.institution) {
          eduRuns.push(
            new TextRun({
              text: ` — ${item.institution}`,
              font: fontFamily,
              size: 20,
              color: primaryHex,
            })
          );
        }

        const entryTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: NO_TABLE_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: NO_TABLE_BORDERS,
                  children: [new Paragraph({ spacing: { before: 60, after: 20 }, children: eduRuns })],
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
                          size: 17,
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
        mainChildren.push(entryTable);

        if (item.location) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [
                new TextRun({
                  text: item.location,
                  italics: true,
                  font: fontFamily,
                  size: 17,
                  color: '6B7280',
                }),
              ],
            })
          );
        }

        if (item.description) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
                  font: fontFamily,
                  size: 18,
                  color: '374151',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'projects') {
      for (const item of section.items as any[]) {
        const dateRange = formatDateRange(item.startDate, item.endDate);
        const nameRuns = [
          new TextRun({
            text: item.name,
            bold: true,
            font: fontFamily,
            size: 19,
            color: '111827',
          }),
        ];
        if (item.url) {
          nameRuns.push(
            new TextRun({
              text: ` (${item.url})`,
              font: fontFamily,
              size: 17,
              color: '6B7280',
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
                          size: 17,
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
        mainChildren.push(projectTable);

        if (item.description) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
                  font: fontFamily,
                  size: 18,
                  color: '374151',
                }),
              ],
            })
          );
        }
      }
    } else if (section.type === 'custom') {
      for (const item of section.items as any[]) {
        mainChildren.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: item.title,
                bold: true,
                font: fontFamily,
                size: 19,
                color: '111827',
              }),
            ],
          })
        );
        if (item.description) {
          mainChildren.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [
                new TextRun({
                  text: item.description,
                  font: fontFamily,
                  size: 18,
                  color: '374151',
                }),
              ],
            })
          );
        }
      }
    }
  }

  // Two-column layout via borderless table (sidebar 32%, main 68%)
  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: NO_TABLE_BORDERS,
            shading: {
              fill: sidebarBgHex,
              type: ShadingType.CLEAR,
            },
            margins: {
              top: convertMillimetersToTwip(4),
              bottom: convertMillimetersToTwip(4),
              left: convertMillimetersToTwip(4),
              right: convertMillimetersToTwip(4),
            },
            children: sidebarChildren,
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            borders: NO_TABLE_BORDERS,
            margins: {
              top: convertMillimetersToTwip(4),
              bottom: convertMillimetersToTwip(4),
              left: convertMillimetersToTwip(6),
              right: convertMillimetersToTwip(2),
            },
            children: mainChildren,
          }),
        ],
      }),
    ],
  });

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
              top: convertMillimetersToTwip(15),
              right: convertMillimetersToTwip(15),
              bottom: convertMillimetersToTwip(15),
              left: convertMillimetersToTwip(15),
            },
          },
        },
        children: [layoutTable],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
