export const logServerError = (err: any, context: string, req?: any) => {
  console.error(`[SERVER_ERROR][${context}]`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      path: req?.path,
      userId: req?.user?.uid,
      timestamp: new Date().toISOString()
  });
};
