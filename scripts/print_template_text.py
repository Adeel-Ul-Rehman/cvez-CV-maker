import pypdf
import os
import docx

def safe_print(text):
    print(text.encode('ascii', errors='backslashreplace').decode('ascii'))

pdf_files = [
    'downloaded_templates/Hamza Resume.pdf',
    'downloaded_templates/Muhammad Aneeb Ulaah.pdf',
    'downloaded_templates/Adeel_Ul_Rehman_CV.pdf',
]

for p in pdf_files:
    if os.path.exists(p):
        print('='*70)
        print('PDF:', p)
        reader = pypdf.PdfReader(p)
        print('Pages:', len(reader.pages))
        text = reader.pages[0].extract_text()
        safe_print(text[:1200])

print('\n' + '='*70)
print('DOCX NAVY SIDEBAR TEXT:')
doc_navy = docx.Document('downloaded_templates/Navy_Sidebar_CV_Template.docx')
for t in doc_navy.tables:
    for row in t.rows:
        for idx, cell in enumerate(row.cells):
            print(f'-- Cell #{idx} --')
            safe_print(cell.text[:600])

