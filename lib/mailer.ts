import nodemailer from 'nodemailer';

export function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(`Email config missing — GMAIL_USER: ${!!user}, GMAIL_APP_PASSWORD: ${!!pass}`);
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass: pass.replace(/\s+/g, ''),
    },
  });
}

export const FROM = `Studio Cherry <${process.env.GMAIL_USER}>`;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || '';
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-5.vercel.app';
