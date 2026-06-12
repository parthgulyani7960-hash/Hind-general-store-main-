export const logServerError = async (err: any, context: string, req?: any, firestoreLogger?: (err: any, context: string, req?: any) => Promise<void>) => {
  const errorDetails = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      path: req?.path,
      userId: req?.session?.userId,
      userAgent: req?.headers?.['user-agent'],
      ipAddress: req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress,
      headers: req?.headers ? { ...req.headers } : undefined,
      timestamp: new Date().toISOString()
  };

  console.error(`[SERVER_ERROR][${context}] MESSAGE: ${errorDetails.message}`);
  if (errorDetails.stack) {
      console.error(`[SERVER_ERROR][${context}] STACK TRACE:`, errorDetails.stack);
  }
  console.error(`[SERVER_ERROR][${context}] CONTEXT:`, {
      path: errorDetails.path,
      userId: errorDetails.userId,
      timestamp: errorDetails.timestamp
  });

  if (firestoreLogger) {
    try {
        await firestoreLogger(err, context, req);
    } catch (logErr) {
        console.error(`[SERVER_ERROR][${context}] FAILED TO LOG TO FIRESTORE`, logErr);
    }
  }
};
