
import admin from 'firebase-admin';

async function check() {
  console.log('Apps count:', admin.apps.length);
  admin.apps.forEach(app => {
    console.log('App Name:', app?.name);
    console.log('Project ID:', app?.options.projectId);
  });
}

check();
