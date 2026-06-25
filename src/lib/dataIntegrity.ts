import admin from 'firebase-admin';

export async function diagnoseFirestoreIntegrity(db: admin.firestore.Firestore) {
  const report: any = {
    timestamp: new Date().toISOString(),
    findings: [],
    stats: {
      users: 0,
      orders: 0,
      inventory: 0,
      orphans: 0
    }
  };

  try {
    // 1. Check Users
    const usersSnap = await db.collection('users').get();
    report.stats.users = usersSnap.size;
    
    // 2. Check Orders & References
    const ordersSnap = await db.collection('orders').get();
    report.stats.orders = ordersSnap.size;
    
    // Process only first 500 orders for performance in check
    const orderDocs = ordersSnap.docs.slice(0, 500);
    
    for (const doc of orderDocs) {
      const order = doc.data();
      if (order.userId) {
        const userRef = db.collection('users').doc(String(order.userId));
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          report.findings.push({
            type: 'ORPHAN_ORDER',
            id: doc.id,
            message: `Order #${doc.id} references non-existent user ID: ${order.userId}`,
            severity: 'HIGH'
          });
          report.stats.orphans++;
        }
      }
    }

    // 3. Check Inventory vs Products
    const productsSnap = await db.collection('products').get();
    report.stats.inventory = productsSnap.size;
    
    for (const doc of productsSnap.docs.slice(0, 200)) {
      const p = doc.data();
      if (p.stock < 0) {
        report.findings.push({
          type: 'NEGATIVE_STOCK',
          id: doc.id,
          message: `Product "${p.name}" has negative stock: ${p.stock}`,
          severity: 'MEDIUM'
        });
      }
    }

  } catch (err: any) {
    report.error = err.message;
  }

  return report;
}
