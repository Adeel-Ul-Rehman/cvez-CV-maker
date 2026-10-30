import os
import sys
import json
import zipfile
import shutil
import xml.etree.ElementTree as ET
import re
from PIL import Image

def clean_hex(color_str):
    if not color_str:
        return None
    c = color_str.replace('#', '').strip().upper()
    if len(c) == 3:
        c = ''.join([ch * 2 for ch in c])
    if len(c) == 6 and all(ch in '0123456789ABCDEF' for ch in c):
        return '#' + c
    return None

def extract_docx_template(docx_path, template_key, template_name, category='Modern', output_root='e:/Cv_maker'):
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File not found: {docx_path}")

    assets_dir = os.path.join(output_root, 'public', 'template-assets', template_key)
    thumbnails_dir = os.path.join(output_root, 'public', 'template-thumbnails')
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(thumbnails_dir, exist_ok=True)

    extracted_images = []
    photo_rel_url = None

    with zipfile.ZipFile(docx_path, 'r') as z:
        # 1. Extract embedded media
        for item in z.namelist():
            if item.startswith('word/media/'):
                img_name = os.path.basename(item)
                dest = os.path.join(assets_dir, img_name)
                with open(dest, 'wb') as f:
                    f.write(z.read(item))
                extracted_images.append(dest)

        # Look for photo candidate (e.g. square/portrait aspect ratio image)
        if extracted_images:
            primary_img = extracted_images[0]
            try:
                with Image.open(primary_img) as im:
                    w, h = im.size
                    # Check if approximately square or portrait
                    if 0.6 <= (w / h) <= 1.4:
                        dest_photo = os.path.join(assets_dir, 'profile.png')
                        shutil.copyfile(primary_img, dest_photo)
                        photo_rel_url = f'/template-assets/{template_key}/profile.png'
            except Exception:
                pass

        # 2. Parse document XML
        xml_content = z.read('word/document.xml')
        root = ET.fromstring(xml_content)

    # XML namespaces
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    }

    # Extract all text runs with fonts and colors
    fonts_found = []
    colors_found = []
    paragraphs_data = []

    has_left_anchor = False
    has_right_anchor = False

    for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
        p_text_parts = []
        p_font = None
        p_color = None
        p_size = None
        is_bold = False

        # Check drawing anchors for column indicators
        p_xml_str = ET.tostring(p, encoding='unicode')
        if 'left' in p_xml_str.lower():
            has_left_anchor = True
        if 'right' in p_xml_str.lower():
            has_right_anchor = True

        for r in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
            # Text
            for t in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if t.text:
                    p_text_parts.append(t.text)

            # Font & Color
            rPr = r.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rPr')
            if rPr is not None:
                rFonts = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
                if rFonts is not None:
                    ascii_font = rFonts.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ascii')
                    if ascii_font and ascii_font not in ['Calibri', 'Calibri Light']:
                        fonts_found.append(ascii_font)

                color_elem = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color')
                if color_elem is not None:
                    c_val = color_elem.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                    valid_c = clean_hex(c_val)
                    if valid_c and valid_c not in ['#000000', '#0D0D0D', '#FFFFFF', '#333333']:
                        colors_found.append(valid_c)

                if rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}b') is not None:
                    is_bold = True

        full_p_text = ''.join(p_text_parts).strip()
        if full_p_text:
            paragraphs_data.append({
                'text': full_p_text,
                'is_bold': is_bold,
                'raw_xml': p_xml_str[:300]
            })

    # Determine dominant font
    primary_font = 'Times New Roman'
    if fonts_found:
        primary_font = max(set(fonts_found), key=fonts_found.count)
    elif 'times' in str(xml_content).lower():
        primary_font = 'Times New Roman'
    elif 'georgia' in str(xml_content).lower():
        primary_font = 'Georgia'
    elif 'garamond' in str(xml_content).lower():
        primary_font = 'Garamond'
    elif 'arial' in str(xml_content).lower():
        primary_font = 'Arial'

    # Determine dominant primary accent color
    primary_color = '#0070C0'
    if colors_found:
        primary_color = max(set(colors_found), key=colors_found.count)

    # Determine columns layout
    # If left and right anchors or 2-column sections are present
    num_columns = 2 if (has_left_anchor and has_right_anchor) else 1

    # Section mapping
    known_section_keys = {
        'summary': 'summary',
        'professional summary': 'summary',
        'experience': 'experience',
        'work experience': 'experience',
        'employment': 'experience',
        'education': 'education',
        'skills': 'skills',
        'technical skills': 'skills',
        'projects': 'projects',
        'strengths': 'strengths',
        'core strengths': 'strengths',
        'interests': 'interests',
        'certifications': 'certifications',
        'languages': 'languages',
        'references': 'references',
        'address': 'address',
    }

    # Extract full text to parse sample data
    doc_text = '\n'.join([p['text'] for p in paragraphs_data])

    # Extract name (typically first prominent line)
    full_name = 'Candidate Name'
    candidate_title = 'Professional'
    candidate_email = ''
    candidate_phone = ''
    candidate_location = ''

    if paragraphs_data:
        # First non-empty paragraph is often candidate name
        first_line = paragraphs_data[0]['text']
        # Strip leading numbers or noise
        cleaned_name = re.sub(r'^[0-9\s]+', '', first_line).strip()
        if cleaned_name and len(cleaned_name) < 40:
            full_name = cleaned_name

    # Look for email, phone, location
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', doc_text)
    if email_match:
        candidate_email = email_match.group(0)

    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}', doc_text)
    if phone_match:
        candidate_phone = phone_match.group(0).strip()

    loc_match = re.search(r'([A-Za-z\s]+,\s*[A-Za-z\s]+)', doc_text)
    if loc_match:
        candidate_location = loc_match.group(0).strip()

    # Look for role / title
    for p in paragraphs_data[:5]:
        t = p['text']
        if any(role_word in t.lower() for role_word in ['developer', 'engineer', 'manager', 'specialist', 'designer', 'consultant', 'lead', 'analyst']):
            cleaned_role = re.sub(r'[\d]+', '', t)
            cleaned_role = re.sub(r'email:.*|contact:.*|location:.*', '', cleaned_role, flags=re.IGNORECASE).strip()
            if cleaned_role and len(cleaned_role) < 50:
                candidate_title = cleaned_role
                break

    # Build layout hints
    layout_hints = {
        'columns': num_columns,
        'columnRatio': '50/50' if num_columns == 2 else '100',
        'headerStyle': 'left',
        'hasPhoto': bool(photo_rel_url),
        'photoPath': photo_rel_url or '',
        'photoShape': 'circle',
        'fontFamily': primary_font,
        'primaryColor': primary_color,
        'leftSections': ['summary', 'experience', 'education', 'address'] if num_columns == 2 else ['all'],
        'rightSections': ['strengths', 'skills', 'projects', 'interests'] if num_columns == 2 else [],
    }

    template_def = {
        'key': template_key,
        'name': template_name,
        'description': f'Auto-imported from {os.path.basename(docx_path)}. Beautiful {num_columns}-column layout featuring {primary_font} typography and {primary_color} accents strictly on 1 page.',
        'category': category,
        'sourceFile': docx_path,
        'supportedSections': [
            'summary',
            'experience',
            'education',
            'skills',
            'projects',
            'strengths',
            'interests',
            'certifications',
            'languages',
            'references',
            'custom',
        ],
        'defaultConfig': {
            'fontFamily': primary_font,
            'fontSizePt': 10,
            'primaryColor': primary_color,
            'spacingScale': 1.0,
            'showPhoto': bool(photo_rel_url),
            'pageSize': 'A4',
        },
        'layoutHints': layout_hints,
    }

    # Build Sample CV Data
    sample_data = {
        'basics': {
            'fullName': full_name,
            'email': candidate_email or 'candidate@example.com',
            'phone': candidate_phone or '+1 (555) 000-0000',
            'location': candidate_location or 'New York, NY',
            'website': '',
            'linkedin': '',
            'summary': 'Accomplished professional with proven expertise in engineering clean, scalable solutions, leading cross-functional initiatives, and delivering high-impact business outcomes.',
            'photoUrl': photo_rel_url or '/photo-test.jpg',
        },
        'sections': [
            {
                'id': 'sec-exp',
                'type': 'experience',
                'title': 'EXPERIENCE',
                'visible': True,
                'items': [
                    {
                        'company': 'Tech Innovation Labs',
                        'role': candidate_title,
                        'location': candidate_location or 'San Francisco, CA',
                        'startDate': '2023-01',
                        'endDate': 'Present',
                        'current': True,
                        'description': '• Architected and shipped scalable, high-throughput digital platforms with modern microservices.\n• Led cross-functional sprint planning and improved automated delivery pipelines by 40%.\n• Mentored team members in software craftsmanship and agile best practices.',
                    },
                    {
                        'company': 'Enterprise Systems Inc',
                        'role': 'Associate Software Specialist',
                        'location': candidate_location or 'Austin, TX',
                        'startDate': '2021-06',
                        'endDate': '2022-12',
                        'current': False,
                        'description': '• Developed robust full-stack applications with responsive web interfaces and secure REST APIs.\n• Optimized database query latency by 32% across distributed PostgreSQL clusters.',
                    },
                ],
            },
            {
                'id': 'sec-edu',
                'type': 'education',
                'title': 'EDUCATION',
                'visible': True,
                'items': [
                    {
                        'institution': 'State University of Technology',
                        'degree': 'Bachelor of Science in Computer Science',
                        'field': 'Computer Science',
                        'location': candidate_location or 'Boston, MA',
                        'startDate': '2017',
                        'endDate': '2021',
                        'current': False,
                        'description': 'Graduated Magna Cum Laude • Dean’s Honor List',
                    },
                ],
            },
            {
                'id': 'sec-strengths',
                'type': 'strengths',
                'title': 'STRENGTHS',
                'visible': True,
                'items': [
                    {
                        'title': 'Creativity & Innovation',
                        'description': 'Skilled at developing clean, maintainable, and efficient solutions.',
                    },
                    {
                        'title': 'Strong Communication',
                        'description': 'Articulates technical concepts clearly to both technical and executive stakeholders.',
                    },
                    {
                        'title': 'Continuous Learning',
                        'description': 'Quick learner who adapts rapidly to new architectures and emerging frameworks.',
                    },
                    {
                        'title': 'Problem-Solving',
                        'description': 'Strong analytical thinking with a focus on root-cause diagnosis and resilient design.',
                    },
                ],
            },
            {
                'id': 'sec-skills',
                'type': 'skills',
                'title': 'SKILLS',
                'visible': True,
                'items': [
                    { 'name': 'Programming: TypeScript, JavaScript, Python, C++', 'level': 'expert' },
                    { 'name': 'Frameworks: Next.js, React, Node.js, Express, Tailwind CSS', 'level': 'expert' },
                    { 'name': 'Databases: PostgreSQL, Neon, Redis, MongoDB', 'level': 'advanced' },
                    { 'name': 'DevOps & Tools: Docker, Git, CI/CD, AWS Cloud', 'level': 'advanced' },
                ],
            },
            {
                'id': 'sec-proj',
                'type': 'projects',
                'title': 'PROJECTS',
                'visible': True,
                'items': [
                    {
                        'name': 'Cloud Platform Gateway',
                        'url': 'https://github.com/example/gateway',
                        'startDate': '2023',
                        'endDate': '2024',
                        'description': 'High-performance API gateway handling dynamic routing, authentication, and distributed rate limiting.',
                    },
                    {
                        'name': 'Intelligent Analytics Dashboard',
                        'url': 'https://github.com/example/analytics',
                        'startDate': '2022',
                        'endDate': '2023',
                        'description': 'Real-time telemetry and metrics visualization dashboard providing actionable operational insights.',
                    },
                ],
            },
            {
                'id': 'sec-interests',
                'type': 'interests',
                'title': 'INTERESTS',
                'visible': True,
                'items': [
                    {
                        'name': 'AI & Machine Learning, Cloud Architecture, Mobile App Development, Cinema & Creative Arts',
                        'description': '',
                    },
                ],
            },
        ],
    }

    result = {
        'template': template_def,
        'sampleData': sample_data,
        'photoUrl': photo_rel_url,
    }

    return result

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Extract layout and sample data from Word .docx')
    parser.add_argument('--docx', required=True, help='Path to docx file')
    parser.add_argument('--key', required=True, help='Template slug key')
    parser.add_argument('--name', required=True, help='Template display name')
    parser.add_argument('--category', default='Modern', help='Template category')
    parser.add_argument('--out-root', default='e:/Cv_maker', help='Project root directory')

    args = parser.parse_args()

    try:
        extracted = extract_docx_template(
            docx_path=args.docx,
            template_key=args.key,
            template_name=args.name,
            category=args.category,
            output_root=args.out_root
        )
        print(json.dumps(extracted, indent=2))
    except Exception as e:
        sys.stderr.write(f"ERROR: {str(e)}\n")
        sys.exit(1)
