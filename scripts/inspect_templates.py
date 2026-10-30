import zipfile
import re
import os
import pypdf

files = [
    'downloaded_templates/Ham.docx',
    'downloaded_templates/Muhammad Aneeb Ulaah.docx',
    'downloaded_templates/Navy_Sidebar_CV_Template.docx',
    'downloaded_templates/Adeel_Ul_Rehman_CV.docx',
]

for f in files:
    print('='*70)
    print('FILE:', f)
    if not os.path.exists(f):
        print('NOT FOUND')
        continue
    with zipfile.ZipFile(f, 'r') as z:
        doc_xml = z.read('word/document.xml').decode('utf-8', errors='ignore')
        
        # Find fonts
        fonts = set(re.findall(r'w:ascii="([^"]+)"', doc_xml))
        print('Fonts:', fonts)
        
        # Find colors
        colors = set(re.findall(r'w:color w:val="([^"]+)"', doc_xml))
        hex_colors = [c for c in colors if re.match(r'^[0-9a-fA-F]{6}$', c)]
        print('Hex Colors:', hex_colors)
        
        # Find shading/fill
        shd = set(re.findall(r'w:fill="([^"]+)"', doc_xml))
        print('Fills:', [s for s in shd if re.match(r'^[0-9a-fA-F]{6}$', s)])
        
        print('Has Table:', '<w:tbl' in doc_xml)
        print('Media:', [m for m in z.namelist() if m.startswith('word/media/')])

print('\n' + '='*70)
print('CHECKING PDF TEXT:')
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
        print('Text sample (first 800 chars):')
        print(reader.pages[0].extract_text()[:800])
