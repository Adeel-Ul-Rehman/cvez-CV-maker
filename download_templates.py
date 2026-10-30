#!/usr/bin/env python3
"""
download_templates.py

Downloads free, legally usable resume/CV templates (DOCX & PDF)
across 10 target categories from legitimate free sources:
- jobhire-ai/jobhireai-resume-templates (MIT License)
- HICV-CN/hicv-word-resume-templates (Free redistribute / attribution)
- jobs.ac.uk (Free academic & ATS CV template)
- FileConvy (Free for personal and commercial use)

Saves all downloaded files into ./downloaded_templates/
and writes ./downloaded_templates/manifest.json.
"""

import os
import sys
import json
import zipfile
import io
import requests

# Ensure console supports UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

DEST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloaded_templates")
MANIFEST_PATH = os.path.join(DEST_DIR, "manifest.json")

# User agent for standard web servers
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# Template definitions across all 10 target categories
TEMPLATES_TO_DOWNLOAD = [
    # ---------------- 1. ATS-Friendly ----------------
    {
        "filename": "jobsacuk_ats_cv.docx",
        "source_url": "https://career-advice.jobs.ac.uk/wp-content/uploads/Free_ATS_Compliant_CV-jobs.ac_.uk_-1.docx",
        "license": "Free for personal and job application use (jobs.ac.uk)",
        "category_suggestion": "ATS-Friendly",
        "file_format": "docx",
    },
    {
        "filename": "jobsacuk_ats_cv.pdf",
        "source_url": "https://career-advice.jobs.ac.uk/wp-content/uploads/Free_ATS_Compliant_CV-jobs.ac_.uk_.pdf",
        "license": "Free for personal and job application use (jobs.ac.uk)",
        "category_suggestion": "ATS-Friendly",
        "file_format": "pdf",
    },
    {
        "filename": "hicv_ats_english_single_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "ATS-Friendly",
        "file_format": "docx",
    },
    {
        "filename": "hicv_ats_english_single_02.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B502.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "ATS-Friendly",
        "file_format": "docx",
    },

    # ---------------- 2. Modern ----------------
    {
        "filename": "jobhire_modern_resume.docx",
        "source_url": "https://raw.githubusercontent.com/jobhire-ai/jobhireai-resume-templates/main/templates/Modern%20Resume.docx",
        "license": "MIT (jobhire-ai)",
        "category_suggestion": "Modern",
        "file_format": "docx",
    },
    {
        "filename": "jobhire_two_column_resume.docx",
        "source_url": "https://raw.githubusercontent.com/jobhire-ai/jobhireai-resume-templates/main/templates/Two-Column%20Resume.docx",
        "license": "MIT (jobhire-ai)",
        "category_suggestion": "Modern",
        "file_format": "docx",
    },
    {
        "filename": "hicv_modern_english_single_03.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B503.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Modern",
        "file_format": "docx",
    },
    {
        "filename": "hicv_modern_english_single_04.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B504.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Modern",
        "file_format": "docx",
    },

    # ---------------- 3. Classic ----------------
    {
        "filename": "jobhire_chronological_resume.docx",
        "source_url": "https://raw.githubusercontent.com/jobhire-ai/jobhireai-resume-templates/main/templates/Chronological%20resume%20template.docx",
        "license": "MIT (jobhire-ai)",
        "category_suggestion": "Classic",
        "file_format": "docx",
    },
    {
        "filename": "hicv_classic_executive_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/07_%E7%A8%B3%E9%87%8D%E5%A4%A7%E6%B0%94/%E7%A8%B3%E9%87%8D%E5%8D%95%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Classic",
        "file_format": "docx",
    },
    {
        "filename": "hicv_classic_executive_02.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/07_%E7%A8%B3%E9%87%8D%E5%A4%A7%E6%B0%94/%E7%A8%B3%E9%87%8D%E5%8D%95%E9%A1%B502.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Classic",
        "file_format": "docx",
    },
    {
        "filename": "hicv_classic_english_three_page_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E4%B8%89%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Classic",
        "file_format": "docx",
    },

    # ---------------- 4. Euro (EU) ----------------
    {
        "filename": "europass_cv_template.docx",
        "source_url": "https://www.fileconvy.com/templates/europass-cv/europass-cv-template.docx",
        "license": "Free for personal and commercial use (FileConvy / Europass format)",
        "category_suggestion": "Euro (EU)",
        "file_format": "docx",
    },
    {
        "filename": "europass_cv_template.pdf",
        "source_url": "https://www.fileconvy.com/templates/europass-cv/europass-cv-template.pdf",
        "license": "Free for personal and commercial use (FileConvy / Europass format)",
        "category_suggestion": "Euro (EU)",
        "file_format": "pdf",
    },
    {
        "filename": "fileconvy_german_cv.docx",
        "source_url": "https://www.fileconvy.com/templates/german-cv/german-cv-template.docx",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "Euro (EU)",
        "file_format": "docx",
    },
    {
        "filename": "fileconvy_french_cv.docx",
        "source_url": "https://www.fileconvy.com/templates/french-cv/french-cv-template.docx",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "Euro (EU)",
        "file_format": "docx",
    },

    # ---------------- 5. UK ----------------
    {
        "filename": "fileconvy_uk_cv.docx",
        "source_url": "https://www.fileconvy.com/templates/uk-cv/uk-cv-template.docx",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "UK",
        "file_format": "docx",
    },
    {
        "filename": "fileconvy_uk_cv.pdf",
        "source_url": "https://www.fileconvy.com/templates/uk-cv/uk-cv-template.pdf",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "UK",
        "file_format": "pdf",
    },
    {
        "filename": "jobsacuk_cv_template.docx",
        "source_url": "https://career-advice.jobs.ac.uk/wp-content/uploads/Free_ATS_Compliant_CV-jobs.ac_.uk_-1.docx",
        "license": "Free for personal and job application use (jobs.ac.uk)",
        "category_suggestion": "UK",
        "file_format": "docx",
    },

    # ---------------- 6. USA ----------------
    {
        "filename": "fileconvy_us_resume.docx",
        "source_url": "https://www.fileconvy.com/templates/us-resume/us-resume-template.docx",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "USA",
        "file_format": "docx",
    },
    {
        "filename": "fileconvy_us_resume.pdf",
        "source_url": "https://www.fileconvy.com/templates/us-resume/us-resume-template.pdf",
        "license": "Free for personal and commercial use (FileConvy)",
        "category_suggestion": "USA",
        "file_format": "pdf",
    },
    {
        "filename": "jobhire_harvard_resume.docx",
        "source_url": "https://raw.githubusercontent.com/jobhire-ai/jobhireai-resume-templates/main/templates/Harvard%20resume%20template.docx",
        "license": "MIT (jobhire-ai)",
        "category_suggestion": "USA",
        "file_format": "docx",
    },

    # ---------------- 7. Asian ----------------
    {
        "filename": "hicv_asian_table_single_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/01_%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86/%E5%8D%95%E9%A1%B5/%E5%8D%95%E9%A1%B5%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86%2001.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Asian",
        "file_format": "docx",
    },
    {
        "filename": "hicv_asian_table_single_02.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/01_%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86/%E5%8D%95%E9%A1%B5/%E5%8D%95%E9%A1%B5%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86%2002.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Asian",
        "file_format": "docx",
    },
    {
        "filename": "hicv_asian_table_single_03.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/01_%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86/%E5%8D%95%E9%A1%B5/%E5%8D%95%E9%A1%B5%E8%A1%A8%E6%A0%BC%E7%AE%80%E5%8E%86%2003.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Asian",
        "file_format": "docx",
    },
    {
        "filename": "hicv_asian_english_single_07.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B507.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Asian",
        "file_format": "docx",
    },

    # ---------------- 8. Creative ----------------
    {
        "filename": "jobhire_creative_resume.docx",
        "source_url": "https://raw.githubusercontent.com/jobhire-ai/jobhireai-resume-templates/main/templates/%D0%A1reative%20resume%20template.docx",
        "license": "MIT (jobhire-ai)",
        "category_suggestion": "Creative",
        "file_format": "docx",
    },
    {
        "filename": "hicv_creative_vibrant_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/04_%E6%B4%BB%E6%B3%BC%E6%98%8E%E6%9C%97/%E6%B4%BB%E6%B3%BC%E5%8D%95%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Creative",
        "file_format": "docx",
    },
    {
        "filename": "hicv_creative_vibrant_02.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/04_%E6%B4%BB%E6%B3%BC%E6%98%8E%E6%9C%97/%E6%B4%BB%E6%B3%BC%E5%8D%95%E9%A1%B502.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Creative",
        "file_format": "docx",
    },
    {
        "filename": "hicv_creative_artsy_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/06_%E6%96%87%E8%89%BA%E6%B8%85%E6%96%B0/%E6%96%87%E8%89%BA%E5%8D%95%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Creative",
        "file_format": "docx",
    },

    # ---------------- 9. Minimal ----------------
    {
        "filename": "hicv_minimal_elegant_01.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/05_%E7%AE%80%E7%BA%A6%E4%BC%98%E9%9B%85/%E7%AE%80%E7%BA%A6%E5%8D%95%E9%A1%B501.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Minimal",
        "file_format": "docx",
    },
    {
        "filename": "hicv_minimal_elegant_02.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/05_%E7%AE%80%E7%BA%A6%E4%BC%98%E9%9B%85/%E7%AE%80%E7%BA%A6%E5%8D%95%E9%A1%B502.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Minimal",
        "file_format": "docx",
    },
    {
        "filename": "hicv_minimal_english_single_05.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B505.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Minimal",
        "file_format": "docx",
    },
    {
        "filename": "hicv_minimal_english_single_06.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/11_%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86/%E8%8B%B1%E6%96%87%E7%AE%80%E5%8E%86-%E5%8D%95%E9%A1%B506.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Minimal",
        "file_format": "docx",
    },

    # ---------------- 10. Academic ----------------
    {
        "filename": "hicv_academic_graduate_001.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/12_%E7%A0%94%E7%A9%B6%E7%94%9F%E5%A4%8D%E8%AF%95/%E5%A4%8D%E8%AF%95%E5%8D%95%E9%A1%B5001.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Academic",
        "file_format": "docx",
    },
    {
        "filename": "hicv_academic_graduate_002.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/12_%E7%A0%94%E7%A9%B6%E7%94%9F%E5%A4%8D%E8%AF%95/%E5%A4%8D%E8%AF%95%E5%8D%95%E9%A1%B5002.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Academic",
        "file_format": "docx",
    },
    {
        "filename": "hicv_academic_graduate_003.docx",
        "source_url": "https://raw.githubusercontent.com/HICV-CN/hicv-word-resume-templates/main/templates/12_%E7%A0%94%E7%A9%B6%E7%94%9F%E5%A4%8D%E8%AF%95/%E5%A4%8D%E8%AF%95%E5%8D%95%E9%A1%B5003.docx",
        "license": "Free to use and redistribute with source attribution (HICV-CN)",
        "category_suggestion": "Academic",
        "file_format": "docx",
    },
]


def validate_file(file_path: str, expected_format: str) -> tuple[bool, str]:
    """
    Validates downloaded file:
    - File size > 5 KB (5120 bytes)
    - DOCX: Valid ZIP archive (starts with PK magic bytes)
    - PDF: Starts with %PDF magic bytes
    """
    if not os.path.exists(file_path):
        return False, "File does not exist on disk"

    size = os.path.getsize(file_path)
    if size < 5120:
        return False, f"File too small ({size} bytes, minimum 5120 required)"

    with open(file_path, "rb") as f:
        header = f.read(1024)

    if expected_format == "docx":
        if not header.startswith(b"PK"):
            return False, "Invalid DOCX: missing PK zip header"
        try:
            with zipfile.ZipFile(file_path, "r") as zf:
                # Check for standard Word docx package content
                namelist = zf.namelist()
                if not any("word/" in name or "[Content_Types].xml" in name for name in namelist):
                    return False, "ZIP does not appear to be a valid Word document"
        except zipfile.BadZipFile:
            return False, "Invalid DOCX: corrupted ZIP container"

    elif expected_format == "pdf":
        if not header.startswith(b"%PDF"):
            return False, "Invalid PDF: missing %PDF header"

    return True, "Valid"


def main():
    os.makedirs(DEST_DIR, exist_ok=True)
    manifest = []
    successful = []
    failed = []

    print("============================================================", flush=True)
    print("STARTING TEMPLATE DOWNLOADS", flush=True)
    print(f"Destination: {DEST_DIR}", flush=True)
    print(f"Total to attempt: {len(TEMPLATES_TO_DOWNLOAD)}", flush=True)
    print("============================================================\n", flush=True)

    session = requests.Session()
    session.headers.update(HEADERS)

    for idx, item in enumerate(TEMPLATES_TO_DOWNLOAD, 1):
        filename = item["filename"]
        url = item["source_url"]
        category = item["category_suggestion"]
        fmt = item["file_format"]
        lic = item["license"]

        target_path = os.path.join(DEST_DIR, filename)
        print(f"[{idx}/{len(TEMPLATES_TO_DOWNLOAD)}] {filename} ({category}) ...", end=" ", flush=True)

        record = {
            "filename": filename,
            "source_url": url,
            "license": lic,
            "category_suggestion": category,
            "file_format": fmt,
            "file_size_bytes": 0,
            "validated": False,
            "notes": "",
        }

        # Check if already downloaded and valid
        if os.path.exists(target_path):
            is_valid, reason = validate_file(target_path, fmt)
            if is_valid:
                size = os.path.getsize(target_path)
                record["file_size_bytes"] = size
                record["validated"] = True
                record["notes"] = "Validated existing file on disk."
                successful.append(filename)
                print(f"ALREADY DOWNLOADED & VERIFIED ({size:,} bytes)", flush=True)
                manifest.append(record)
                continue

        try:
            resp = session.get(url, timeout=(10, 45))
            if resp.status_code == 200:
                with open(target_path, "wb") as f:
                    f.write(resp.content)

                file_size = len(resp.content)
                record["file_size_bytes"] = file_size

                is_valid, reason = validate_file(target_path, fmt)
                if is_valid:
                    record["validated"] = True
                    record["notes"] = "Successfully downloaded and verified."
                    successful.append(filename)
                    print(f"OK ({file_size:,} bytes)", flush=True)
                else:
                    record["validated"] = False
                    record["notes"] = f"Validation failed: {reason}"
                    failed.append((filename, reason))
                    print(f"FAILED: {reason}", flush=True)
            else:
                record["validated"] = False
                record["notes"] = f"HTTP Error {resp.status_code}"
                failed.append((filename, f"HTTP {resp.status_code}"))
                print(f"HTTP ERROR {resp.status_code}", flush=True)

        except Exception as e:
            record["validated"] = False
            record["notes"] = f"Exception: {str(e)}"
            failed.append((filename, str(e)))
            print(f"ERROR: {e}", flush=True)

        manifest.append(record)

    # Save manifest.json
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("\n============================================================")
    print("DOWNLOAD SUMMARY")
    print("============================================================")
    print(f"Total attempted:   {len(TEMPLATES_TO_DOWNLOAD)}")
    print(f"Total successful:  {len(successful)}")
    print(f"Total failed:      {len(failed)}")
    print(f"Manifest written:  {MANIFEST_PATH}")
    print("\nCategory Breakdown:")
    categories_count = {}
    for entry in manifest:
        if entry["validated"]:
            c = entry["category_suggestion"]
            categories_count[c] = categories_count.get(c, 0) + 1
    for cat, count in sorted(categories_count.items()):
        print(f"  - {cat:15}: {count} templates")

    if failed:
        print("\nFailed Downloads:")
        for name, reason in failed:
            print(f"  - {name}: {reason}")

    print("\nSuccessfully Saved Files:")
    for name in successful:
        print(f"  - {name}")
    print("============================================================")


if __name__ == "__main__":
    main()
