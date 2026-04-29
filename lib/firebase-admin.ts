import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import config from '../firebase-applet-config.json';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 필요합니다. Firebase 콘솔에서 서비스 계정 키를 생성하세요.');
  }

  return initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    storageBucket: config.storageBucket,
  });
}

export function getAdminDb() {
  getAdminApp();
  return getFirestore(config.firestoreDatabaseId);
}

export function getAdminStorage() {
  const app = getAdminApp();
  return getStorage(app).bucket();
}
