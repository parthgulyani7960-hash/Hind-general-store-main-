import * as fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("import session from 'express-session';", "import cookieSession from 'cookie-session';");
content = content.replace(/app\.use\(session\(\{([\s\S]*?)cookie: \{([\s\S]*?)\}\n\s*\}\)\);/, `app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'hind-store-secret-2024'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}));`);

// Replace req.session.destroy
content = content.replace(/req\.session\.destroy\(\(err\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\n\s*\}\);/g, "req.session = null;\n      res.json({ success: true });");
content = content.replace(/req\.session\.destroy\(\(err\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ success: false, message: 'Logout failed' \}\);\n\s*\}\);/g, "req.session = null;\n      res.json({ success: true });");

// Replace req.session.save(...)
content = content.replace(/req\.session\.save\(\(err\) => \{[\s\S]*?res\.json\(\{ success: true, user, isNewUser: !user\.phone \}\);\n\s*\}\);/g, "res.json({ success: true, user, isNewUser: !user.phone });");

// another form
content = content.replace(/req\.session\.save\(\(err\) => \{[\s\S]*?res\.json\(\{ success: true, message: 'Logged in successfully', user: userWithoutPassword \}\);\n\s*\}\);/g, "res.json({ success: true, message: 'Logged in successfully', user: userWithoutPassword });");

fs.writeFileSync('server.ts', content);
console.log('Session replaced');
