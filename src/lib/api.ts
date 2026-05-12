import toast from 'react-hot-toast';

export const fetchWithHandling = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T | null> => {
  const token = localStorage.getItem('hgs_token');
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
        let errorMessage = `Error: ${res.status}`;
        try {
            const data = await res.json();
            errorMessage = data.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
    }
    
    return await res.json();
  } catch (err: any) {
    console.error(`API Error [${url}]:`, err);
    toast.error(err.message || 'Something went wrong');
    return null;
  }
};
