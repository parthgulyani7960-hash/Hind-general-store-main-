
import fs from 'fs';
const content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
const openComments = content.split('/*').length - 1;
const closeComments = content.split('*/').length - 1;
console.log('Open:', openComments, 'Close:', closeComments);
