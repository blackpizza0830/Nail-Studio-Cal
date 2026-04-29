// Firestore 데이터 일괄 삭제 스크립트
// 사용법: node scripts/clear-firestore.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// firebase-applet-config.json에서 데이터베이스 ID 읽기
const config = JSON.parse(
  readFileSync(resolve(__dirname, '../firebase-applet-config.json'), 'utf8')
);

// 서비스 계정 키 파일 경로
const serviceAccountPath = resolve(
  __dirname,
  '../gen-lang-client-0443469499-firebase-adminsdk-fbsvc-9c1dc91065.json'
);
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app, config.firestoreDatabaseId);

const COLLECTIONS_TO_CLEAR = ['bookings', 'customers'];

async function clearCollection(collectionName) {
  console.log(`\n→ Clearing collection: ${collectionName}`);
  const snap = await db.collection(collectionName).get();

  if (snap.empty) {
    console.log(`  (already empty)`);
    return 0;
  }

  console.log(`  Found ${snap.size} documents — deleting in batches of 500…`);

  let deleted = 0;
  while (true) {
    const batchSnap = await db.collection(collectionName).limit(500).get();
    if (batchSnap.empty) break;

    const batch = db.batch();
    batchSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    deleted += batchSnap.size;
    console.log(`  Deleted ${deleted}/${snap.size}…`);
  }

  console.log(`  ✓ ${collectionName}: ${deleted} documents removed`);
  return deleted;
}

async function main() {
  console.log(`Database: ${config.firestoreDatabaseId}`);
  console.log(`Project:  ${config.projectId}`);

  let total = 0;
  for (const name of COLLECTIONS_TO_CLEAR) {
    total += await clearCollection(name);
  }

  console.log(`\n✅ Done — ${total} documents deleted total.`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
