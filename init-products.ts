
import { db } from './src/firebase';
import { collection, addDoc } from 'firebase/firestore';
async function initProducts() {
    const products = [
        { name: 'Tomato', price: 40, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
        { name: 'Onion', price: 30, category: 'Vegetables', image_url: 'https://images.unsplash.com/photo-1580651245785-5c91b5c40049' }
    ];                

    for (const p of products) {
        await addDoc(collection(db, 'products'), p);
    }
    console.log('Products added!');                
}                

initProducts().catch(console.error);
