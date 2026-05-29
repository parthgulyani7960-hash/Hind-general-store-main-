
import { db } from '../src/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

async function seedData() {
    const products = [
        { name: 'Tomato', price: 40, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
        { name: 'Onion', price: 30, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1580651245785-5c91b5c40049' }
    ];

    const productsCollection = collection(db, 'products');
    
    for (const p of products) {
        const q = query(productsCollection, where('name', '==', p.name));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await addDoc(productsCollection, p);
            console.log(`Added ${p.name}`);
        } else {
            console.log(`${p.name} already exists`);
        }
    }
    process.exit(0);
}

seedData().catch(err => {
    console.error(err);
    process.exit(1);
});
