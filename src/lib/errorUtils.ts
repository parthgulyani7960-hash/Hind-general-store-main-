import { toast } from 'react-hot-toast';

export const handleAppError = (error: any, userFriendlyMessage: string, context?: string) => {
  console.error(`[AppError][${context || 'General'}]:`, error);
  
  // Only show the specific error if it's a known user-facing error type
  if (error?.isUserFacing) {
      toast.error(error.message || userFriendlyMessage);
  } else {
      toast.error(userFriendlyMessage);
  }
};
