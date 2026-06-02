// @ts-nocheck
console.log("[BOOT] api/index.ts loaded");
console.log("[API HANDLER LOADED]");

import handler from '../dist/server.cjs';

console.log("[BOOT] api/index.ts executed");

export default async function apiEntryPoint(req: any, res: any) {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.url}`);
  
  // Robustness check for CJS default export
  const actualHandler = (handler as any).default || handler;
  
  if (typeof actualHandler !== 'function') {
    console.error("[CRITICAL] Exported handler is not a function:", typeof actualHandler);
    return res.status(500).json({ 
      error: 'Backend Entry Point Error', 
      details: 'Exported handler is not a function. Check dist/server.cjs bundling.' 
    });
  }

  try {
    return await actualHandler(req, res);
  } catch (err: any) {
    console.error("[FATAL] API Entry Point Crash:", err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error (apiEntryPoint)', details: err.message });
    }
  }
}

