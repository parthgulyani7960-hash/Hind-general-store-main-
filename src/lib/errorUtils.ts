import { toast } from 'react-hot-toast';

export const handleAppError = (error: any, userFriendlyMessage: string, context?: string, isAdmin: boolean = false) => {
  console.error(`[AppError][${context || 'General'}]:`, error);
  
  if (isAdmin) {
      toast.error(`${userFriendlyMessage}: ${error.message || 'Unknown error'}`);
  } else if (error?.isUserFacing) {
      toast.error(error.message || userFriendlyMessage);
  } else {
      toast.error(userFriendlyMessage);
  }
};
