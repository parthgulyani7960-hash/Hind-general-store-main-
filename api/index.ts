// @ts-nocheck
console.log("[BOOT] api/index.ts loaded (Dynamic Version)");

export default async function apiEntryPoint(req: any, res: any) {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.url}`);
  
  let handler;
  try {
    console.log("[BOOT] Dynamically importing ../dist/server.cjs...");
    const module = await import('../dist/server.cjs');
    handler = module.default || module;
  } catch (importErr) {
    console.error("[CRITICAL] Failed to import ../dist/server.cjs:", importErr.message);
    console.error(importErr.stack);
    return res.status(500).json({ 
      error: 'Backend Import Error', 
      details: importErr.message,
      stack: importErr.stack
    });
  }
  
  if (typeof handler !== 'function') {
    console.error("[CRITICAL] Exported handler is not a function:", typeof handler);
    return res.status(500).json({ 
      error: 'Backend Entry Point Error', 
      details: 'Exported handler is not a function. Check dist/server.cjs bundling.' 
    });
  }

  try {
    return await handler(req, res);
  } catch (err: any) {
    console.error("[FATAL] API Entry Point Crash:", err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error (apiEntryPoint)', details: err.message, stack: err.stack });
    }
  }
}

