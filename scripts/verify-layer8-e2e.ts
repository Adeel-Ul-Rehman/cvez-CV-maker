import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { sql } from '../lib/db';
import { env } from '../lib/env';

const BASE_URL = 'http://localhost:3000';

function findOtpFromHash(targetHash: string): string {
  for (let i = 100000; i <= 999999; i++) {
    const code = String(i);
    const h = crypto.createHash('sha256').update(code + env.JWT_SECRET).digest('hex');
    if (h === targetHash) return code;
  }
  throw new Error('Failed to resolve OTP from hash');
}

function parseCookies(res: Response): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieHeaders = res.headers.getSetCookie?.() || [];
  if (setCookieHeaders.length === 0) {
    const raw = res.headers.get('set-cookie');
    if (raw) setCookieHeaders.push(raw);
  }
  for (const str of setCookieHeaders) {
    const parts = str.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
  return cookies;
}

function buildCookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .filter(([_, v]) => v !== '' && v !== 'deleted')
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function testUserJourney(email: string, fullName: string, templateKey: string, clientIp: string) {
  console.log(`\n============================================================`);
  console.log(`TESTING USER JOURNEY: ${email} (IP: ${clientIp})`);
  console.log(`============================================================`);

  const password = 'Password123!Secure';

  // 1. Clean up user if already exists to ensure fresh registration flow
  await sql`DELETE FROM users WHERE email = ${email};`;

  // 2. Register
  console.log(`[Step 1] Registering account: ${email}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': clientIp,
    },
    body: JSON.stringify({ email, password, fullName }),
  });
  const regJson = await regRes.json();
  if (!regRes.ok || !regJson.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(regJson)}`);
  }
  // 3. Retrieve user ID & OTP from DB
  console.log(`[Step 2] Resolving OTP from DB hash for email: ${email}...`);
  const userRows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1;`;
  if (!userRows.length) throw new Error('User not found in DB after registration');
  const userId = userRows[0].id;

  const otpRows = await sql`
    SELECT code_hash FROM otp_codes
    WHERE user_id = ${userId} AND purpose = 'email_verify'
    ORDER BY created_at DESC LIMIT 1;
  `;
  if (!otpRows.length) throw new Error('No OTP code generated in DB');
  const code = findOtpFromHash(otpRows[0].code_hash);
  console.log(`✓ OTP found and decrypted: ${code}`);

  // 4. Verify OTP
  console.log(`[Step 3] Submitting OTP verification...`);
  const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': clientIp,
    },
    body: JSON.stringify({ email, code, purpose: 'email_verify' }),
  });
  const verifyJson = await verifyRes.json();
  if (!verifyRes.ok || !verifyJson.ok) {
    throw new Error(`OTP verification failed: ${JSON.stringify(verifyJson)}`);
  }
  console.log('✓ OTP verified.');

  // 5. Sign in to obtain session cookies
  console.log(`[Step 4] Signing in to establish session cookies...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': clientIp,
    },
    body: JSON.stringify({ email, password }),
  });
  const cookies = parseCookies(loginRes);
  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson.ok) throw new Error(`Sign in failed: ${JSON.stringify(loginJson)}`);
  console.log('✓ Signed in successfully. Cookies received:', Object.keys(cookies).join(', '));

  // 6. Check Auth Me
  console.log(`[Step 5] Checking /api/auth/me session...`);
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const meJson = await meRes.json();
  const userData = meJson.data?.user || meJson.data;
  console.log(`✓ Authenticated as ${userData.email} (Role: ${userData.role}, CV Count: ${userData.cvCount})`);

  // 6. Create CV Document
  console.log(`[Step 5] Creating new CV with template: ${templateKey}...`);
  const createRes = await fetch(`${BASE_URL}/api/cv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: buildCookieHeader(cookies),
    },
    body: JSON.stringify({
      title: `${fullName} - Master Resume`,
      templateKey,
    }),
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.ok) throw new Error(`Create CV failed: ${JSON.stringify(createJson)}`);
  const cvId = createJson.data.cv.id;
  console.log(`✓ Created CV with ID: ${cvId}`);

  // 7. Update CV Data (Wizard & Editor Simulation)
  console.log(`[Step 6] Updating CV sections & basics via PATCH /api/cv/${cvId}...`);
  const patchRes = await fetch(`${BASE_URL}/api/cv/${cvId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: buildCookieHeader(cookies),
    },
    body: JSON.stringify({
      title: `${fullName} - Senior Engineer`,
      data: {
        basics: {
          fullName,
          email,
          phone: '+1 555 0192',
          location: 'San Francisco, CA',
          website: 'https://portfolio.example.com',
          linkedin: 'https://linkedin.com/in/testuser',
          summary: 'Experienced systems engineer specialized in scalable web architectures and cloud microservices.',
        },
        sections: [
          {
            id: 'sec-exp',
            type: 'experience',
            title: 'Professional Experience',
            visible: true,
            items: [
              {
                company: 'TechCorp International',
                role: 'Senior Staff Engineer',
                location: 'Remote',
                startDate: '2021-01',
                endDate: null,
                current: true,
                description: '• Architected resilient real-time streaming pipelines.\n• Decreased cloud computing infrastructure costs by 28%.',
              },
            ],
          },
          {
            id: 'sec-edu',
            type: 'education',
            title: 'Education',
            visible: true,
            items: [
              {
                institution: 'State University',
                degree: 'B.S. Computer Science',
                field: 'Computer Engineering',
                startDate: '2016-09',
                endDate: '2020-05',
                current: false,
                description: 'Graduated with Honors.',
              },
            ],
          },
          {
            id: 'sec-skills',
            type: 'skills',
            title: 'Technical Skills',
            visible: true,
            items: [
              { name: 'TypeScript', level: 'expert' },
              { name: 'Next.js', level: 'advanced' },
              { name: 'PostgreSQL', level: 'expert' },
              { name: 'Docker', level: 'advanced' },
            ],
          },
        ],
      },
      config: {
        fontFamily: 'Inter',
        fontSizePt: 10,
        primaryColor: '#2563EB',
        spacingScale: 1.0,
        showPhoto: true,
        pageSize: 'A4',
      },
    }),
  });
  const patchJson = await patchRes.json();
  if (!patchRes.ok || !patchJson.ok) throw new Error(`Update CV failed: ${JSON.stringify(patchJson)}`);
  console.log(`✓ Updated CV successfully.`);

  // 8. Test Live Preview HTML
  console.log(`[Step 7] Checking live preview endpoint /api/cv/${cvId}/preview?raw=1...`);
  const previewRes = await fetch(`${BASE_URL}/api/cv/${cvId}/preview?raw=1`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const previewHtml = await previewRes.text();
  if (!previewRes.ok || !previewHtml.includes(fullName)) {
    throw new Error('Preview failed to render candidate name');
  }
  console.log(`✓ Live preview returned valid HTML (${previewHtml.length} bytes)`);

  // 9. Export PDF
  console.log(`[Step 8] Exporting PDF via /api/cv/${cvId}/export/pdf...`);
  const pdfRes = await fetch(`${BASE_URL}/api/cv/${cvId}/export/pdf`, {
    method: 'POST',
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  if (!pdfRes.ok) {
    const errText = await pdfRes.text();
    throw new Error(`PDF export failed (${pdfRes.status}): ${errText}`);
  }
  const pdfBuf = await pdfRes.arrayBuffer();
  console.log(`✓ PDF successfully generated (${pdfBuf.byteLength} bytes)`);

  // Verify PDF header %PDF-
  const pdfHeader = Buffer.from(pdfBuf.slice(0, 5)).toString();
  if (!pdfHeader.startsWith('%PDF')) throw new Error(`Invalid PDF header: ${pdfHeader}`);
  console.log(`✓ Valid PDF magic bytes verified.`);

  // 10. Export DOCX
  console.log(`[Step 9] Exporting DOCX via /api/cv/${cvId}/export/docx...`);
  const docxRes = await fetch(`${BASE_URL}/api/cv/${cvId}/export/docx`, {
    method: 'POST',
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  if (!docxRes.ok) throw new Error(`DOCX export failed: ${docxRes.status}`);
  const docxBuf = await docxRes.arrayBuffer();
  console.log(`✓ DOCX successfully generated (${docxBuf.byteLength} bytes)`);

  // 11. Test Public Sharing Toggle
  console.log(`[Step 10] Testing public sharing toggle...`);
  const shareOnRes = await fetch(`${BASE_URL}/api/cv/${cvId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: buildCookieHeader(cookies),
    },
    body: JSON.stringify({ is_public: true }),
  });
  const shareOnJson = await shareOnRes.json();
  const slug = shareOnJson.data.cv.public_slug;
  if (!slug) throw new Error('Missing public_slug after enabling share');
  console.log(`✓ Public sharing enabled. Slug: ${slug}`);

  // Fetch Public CV anonymously
  const pubRes = await fetch(`${BASE_URL}/api/cv/public/${slug}`);
  const pubJson = await pubRes.json();
  if (!pubRes.ok || !pubJson.ok || pubJson.data.cv.title !== `${fullName} - Senior Engineer`) {
    throw new Error('Public CV query failed');
  }
  console.log(`✓ Anonymous public CV fetch returned valid data: "${pubJson.data.cv.title}"`);

  // Toggle sharing off
  await fetch(`${BASE_URL}/api/cv/${cvId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: buildCookieHeader(cookies),
    },
    body: JSON.stringify({ is_public: false }),
  });
  const pubOffRes = await fetch(`${BASE_URL}/api/cv/public/${slug}`);
  if (pubOffRes.status !== 404) throw new Error(`Expected 404 after disabling share, got: ${pubOffRes.status}`);
  console.log(`✓ After disabling sharing, public URL correctly returned 404 Not Found.`);

  return { cvId, email };
}

async function testAdminFlow() {
  console.log(`\n============================================================`);
  console.log(`TESTING ADMIN CONTROL PLANE FLOW`);
  console.log(`============================================================`);

  // Admin login
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cvmaker.local';
  const adminPass = process.env.ADMIN_PASSWORD || 'X7#mP9$qK2!vL5*w';

  console.log(`[Admin Step 1] Logging in as ${adminEmail}...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': '198.51.100.254',
    },
    body: JSON.stringify({ email: adminEmail, password: adminPass }),
  });
  const cookies = parseCookies(loginRes);
  const loginJson = await loginRes.json();
  if (!loginRes.ok || !loginJson.ok) throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
  console.log(`✓ Admin logged in. Role: ${loginJson.data.user.role}`);

  // Check Overview Stats
  console.log(`[Admin Step 2] Fetching /api/admin/overview...`);
  const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const overviewJson = await overviewRes.json();
  if (!overviewRes.ok || !overviewJson.ok) throw new Error('Overview stats query failed');
  console.log(`✓ Overview stats: ${overviewJson.data.users.total} users, ${overviewJson.data.cvs.total} CVs, ${overviewJson.data.exports.estimatedToday} exports today.`);

  // Check Users Directory
  console.log(`[Admin Step 3] Fetching /api/admin/users...`);
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const usersJson = await usersRes.json();
  if (!usersRes.ok || !usersJson.ok) throw new Error('Admin users query failed');
  console.log(`✓ Admin users query returned ${usersJson.data.users.length} users.`);

  // Check Templates Catalog
  console.log(`[Admin Step 4] Fetching /api/admin/templates...`);
  const tplRes = await fetch(`${BASE_URL}/api/admin/templates`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const tplJson = await tplRes.json();
  if (!tplRes.ok || !tplJson.ok) throw new Error('Admin templates query failed');
  console.log(`✓ Admin templates catalog: ${tplJson.data.templates.map((t: any) => t.templateKey).join(', ')}`);

  // Check Audit Logs
  console.log(`[Admin Step 5] Fetching /api/admin/audit-logs...`);
  const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
    headers: { Cookie: buildCookieHeader(cookies) },
  });
  const auditJson = await auditRes.json();
  if (!auditRes.ok || !auditJson.ok) throw new Error('Admin audit logs query failed');
  console.log(`✓ Admin audit logs: ${auditJson.data.total} recorded events.`);
}

async function testPublicPages() {
  console.log(`\n============================================================`);
  console.log(`TESTING PUBLIC ROUTES & STATIC RENDERING`);
  console.log(`============================================================`);

  const routes = [
    '/',
    '/about',
    '/login',
    '/register',
    '/forgot-password',
    '/templates',
    '/templates/europass/preview',
    '/templates/jobhire-chronological/preview',
    '/templates/jobhire-creative/preview',
  ];

  for (const r of routes) {
    const res = await fetch(`${BASE_URL}${r}`);
    if (res.status !== 200) {
      throw new Error(`Route ${r} returned HTTP ${res.status}`);
    }
    console.log(`✓ Route ${r} returned 200 OK`);
  }
}

async function main() {
  try {
    await testPublicPages();

    // Acceptance Criterion 24: End-to-end journey for both test emails
    await testUserJourney('ajadeel229@gmail.com', 'Adeel J.', 'jobhire-chronological', '198.51.100.1');
    await testUserJourney('tmailing461@gmail.com', 'Test Mailing', 'europass', '198.51.100.2');

    await testAdminFlow();

    console.log(`\n============================================================`);
    console.log(`🎉 ALL ACCEPTANCE CRITERIA END-TO-END TESTS PASSED CLEANLY!`);
    console.log(`============================================================\n`);
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ VERIFICATION FAILED:`, err.message);
    process.exit(1);
  }
}

main();
