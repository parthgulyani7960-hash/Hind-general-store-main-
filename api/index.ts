// @ts-nocheck
console.log("[BOOT] api/index.ts module loading starting...");

// Global crash interception for Vercel
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception in api/index.ts:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection in api/index.ts at:', promise, 'reason:', reason);
});

export default async function apiEntryPoint(req: any, res: any) {
  const reqId = Math.random().toString(36).substring(7);
  console.log(`[BOOT][REQ ${reqId}] ${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log(`[BOOT][ENV] NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${process.env.VERCEL}`);
  
  // Minimal diagnostic route before any module loading
  if (req.url === '/ping') {
    console.log(`[PING ${reqId}] Immediate pong`);
    return res.status(200).json({ success: true, message: "server alive", requestId: reqId });
  }

  let handler;
  try {
    console.log(`[BOOT ${reqId}] Dynamically importing ../dist/server.cjs...`);
    const module = await import('../dist/server.cjs');
    handler = module.default || module;
    console.log(`[BOOT ${reqId}] Import success, type:`, typeof handler);
  } catch (importErr: any) {
    console.error(`[CRITICAL ${reqId}] Failed to import ../dist/server.cjs:`, importErr.message);
    console.error(importErr.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        success: false,
        bootPhase: 'IMPORT', 
        error: importErr.message,
        stack: importErr.stack,
        requestId: reqId
      });
    }
    return;
  }
  
  if (typeof handler !== 'function') {
    console.error(`[CRITICAL ${reqId}] Exported handler is not a function:`, typeof handler);
    return res.status(500).json({ 
      success: false,
      bootPhase: 'EXPORT_CHECK',
      error: 'Backend Entry Point Error', 
      details: 'Exported handler is not a function. Check dist/server.cjs bundling.',
      requestId: reqId
    });
  }

  try {
    return await handler(req, res);
  } catch (err: any) {
    console.error(`[FATAL ${reqId}] API Entry Point Crash:`, err.message);
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        bootPhase: 'HANDLER_EXECUTION',
        error: err.message, 
        stack: err.stack,
        requestId: reqId
      });
    }
  }
}

