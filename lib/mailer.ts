import nodemailer from 'nodemailer';

export function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export const FROM = `Studio Cherry <${process.env.GMAIL_USER}>`;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || '';
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://nail-studio-5.vercel.app';
