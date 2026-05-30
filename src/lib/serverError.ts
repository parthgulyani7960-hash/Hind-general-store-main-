export const logServerError = async (err: any, context: string, req?: any, firestoreLogger?: (err: any, context: string, req?: any) => Promise<void>) => {
  console.error(`[SERVER_ERROR][${context}]`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      path: req?.path,
      userId: req?.session?.userId,
      userAgent: req?.headers?.['user-agent'],
      ipAddress: req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress,
      headers: req?.headers ? { ...req.headers } : undefined,
      timestamp: new Date().toISOString()
  });

  if (firestoreLogger) {
    await firestoreLogger(err, context, req);
  }
};
