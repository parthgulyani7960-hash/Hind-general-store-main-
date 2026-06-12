import { logErrorToFirestore } from '@/services/incidentLogger';

export const withErrorReporting = (
  fn: (...args: any[]) => Promise<void>,
  actionName: string
) => async (...args: any[]) => {
  try {
    await fn(...args);
  } catch (error) {
    console.error(`Error in ${actionName}:`, error);
    logErrorToFirestore(error, actionName);
    throw error; // Re-throw to allow component-level handling if needed
  }
};
