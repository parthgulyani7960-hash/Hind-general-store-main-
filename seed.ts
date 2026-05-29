import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// Initialize with ADC fallback since we have projectId
admin.initializeApp({ projectId: config.projectId });

const dbIdToUse = config.firestoreDatabaseId || '(default)';
const db = getFirestore(admin.app(), dbIdToUse);

async function seed() {
  const dummyProducts = [
    { name: 'Premium Whole Wheat Atta', description: 'Freshly milled, high-fiber whole wheat flour.', price: 450, wholesale_price: 400, retail_price: 430, discount: 5, stock: 100, category: 'Grains & Flours', image_url: 'https://images.unsplash.com/photo-1596649320297-c7ba8dbca160', is_listed: true, avg_rating: 4.8, review_count: 120 },
    { name: 'Organic Turmeric Powder', description: 'Pure, organic, unadulterated turmeric with high curcumin.', price: 120, wholesale_price: 90, retail_price: 110, discount: 10, stock: 200, category: 'Spices', image_url: 'https://images.unsplash.com/photo-1615486171430-b18341656fde', is_listed: true, avg_rating: 4.6, review_count: 85 },
    { name: 'Basmati Rice (Long Grain)', description: 'Aromatic, aged basmati rice for perfect biryanis.', price: 850, wholesale_price: 750, retail_price: 800, discount: 0, stock: 50, category: 'Grains & Flours', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac', is_listed: true, avg_rating: 4.9, review_count: 310 },
  ];
  
  const snap = await db.collection('products').get();
  if (snap.empty) {
    console.log('Seeding...');
    const batch = db.batch();
    for (const dp of dummyProducts) {
      const ref = db.collection('products').doc();
      batch.set(ref, { ...dp, created_at: new Date().toISOString() });
    }
    await batch.commit();
    console.log('Done!');
  } else {
    console.log('Already seeded. Size: ' + snap.size);
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
