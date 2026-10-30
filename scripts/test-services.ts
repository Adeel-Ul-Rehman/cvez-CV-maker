import { v2 as cloudinary } from 'cloudinary';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function run() {
  console.log('--- 1. Testing Cloudinary ---');
  console.log('Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API key:', process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing');
  console.log('API secret:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const t0 = Date.now();
  try {
    const pingRes = await cloudinary.api.ping();
    console.log(`Cloudinary ping success in ${Date.now() - t0}ms:`, pingRes);
  } catch (err: any) {
    console.error(`Cloudinary ping failed in ${Date.now() - t0}ms:`, err.message || err);
    if (err.http_code) console.error('HTTP Code:', err.http_code);
  }

  console.log('\n--- 2. Testing SMTP ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.SMTP_FROM);

  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const t1 = Date.now();
  try {
    const verifyRes = await transporter.verify();
    console.log(`SMTP verify success in ${Date.now() - t1}ms:`, verifyRes);
  } catch (err: any) {
    console.error(`SMTP verify failed in ${Date.now() - t1}ms:`, err.message || err);
  }

  // Also test sending an actual email
  const testTo = 'davidbenjamin8990@gmail.com';
  console.log(`\n--- 3. Attempting to send test email to ${testTo} ---`);
  try {
    const fromAddr = process.env.SMTP_FROM || 'noreply@cvmaker.local';
    console.log(`Using From: "${fromAddr}"`);
    const sendRes = await transporter.sendMail({
      from: fromAddr,
      to: testTo,
      subject: 'CV Maker Verification Code',
      text: 'Your verification code is: 849201',
      html: '<h2>Your verification code is: <b>849201</b></h2>',
    });
    console.log('Email sent successfully! MessageId:', sendRes.messageId, 'Response:', sendRes.response);
  } catch (err: any) {
    console.error('Send mail failed:', err.message || err);
  }

  process.exit(0);
}

run();
