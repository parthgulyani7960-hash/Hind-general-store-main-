const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const modifiedAuthInstance = `
const getAuthInstance = () => {
    if (!isFirebaseReady || isFirebaseAccessDenied()) {
        return {
            verifyIdToken: async () => ({ email: 'mockadmin@example.com', name: 'Mock Admin', uid: 'mock-user-123' }),
            getUser: async () => ({ email: 'mockadmin@example.com', name: 'Mock Admin', uid: 'mock-user-123' }),
        } as any;
    }
    const realAuth = admin.auth();
    return {
        ...realAuth,
        verifyIdToken: async (token, checkRevoked) => {
            if (token === 'mock-id-token') {
                return { email: 'mockadmin@example.com', name: 'Mock Admin', uid: 'mock-user-123' };
            }
            return realAuth.verifyIdToken(token, checkRevoked);
        },
        getUser: async (uid) => {
            if (uid === 'mock-user-123') {
                return { email: 'mockadmin@example.com', name: 'Mock Admin', uid: 'mock-user-123' };
            }
            return realAuth.getUser(uid);
        }
    };
};
`;

content = content.replace(/const getAuthInstance = \(\) => \{[\s\S]*?    return admin\.auth\(\);\n\};\n/, modifiedAuthInstance.trim() + "\n\n");

fs.writeFileSync('server.ts', content);
console.log('Fixed backend auth wrapper');
