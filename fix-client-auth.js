const fs = require('fs');
let content = fs.readFileSync('src/firebase.ts', 'utf8');

const updatedSignIn = `
export const signInWithGoogle = async () => {
  if (validConfig.projectId === 'mock-project' || validConfig.apiKey.includes('mock')) {
    console.warn('Simulating Google Login for Mock Environment');
    return { 
      user: {
        uid: 'mock-user-123',
        email: 'mockadmin@example.com', 
        displayName: 'Mock Admin',
        photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
        getIdToken: async () => 'mock-id-token'
      },
      token: 'mock-id-token'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    return { user: result.user, token };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(\`Domain not authorized. Please go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add: \${window.location.hostname}\`);
    } else {
      throw new Error(\`Sign-in failed (\${error.code || 'internal-error'}). Please check that Google Auth is ENABLED in your Firebase Console.\`);
    }
  }
};
`;

content = content.replace(/export const signInWithGoogle = async \(\) => \{[\s\S]*?\};/, updatedSignIn.trim());

fs.writeFileSync('src/firebase.ts', content);
console.log('Fixed client mock auth');
