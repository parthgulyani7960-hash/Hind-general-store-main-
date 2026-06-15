/**
 * Utility for generating consistent Order IDs
 * Format: HGS-YYYYMMDD-XXXX
 */
export const generateOrderId = (timestamp: number, sequentialId: number): string => {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const xxxx = String(sequentialId).padStart(4, '0');
  
  return `HGS-${yyyy}${mm}${dd}-${xxxx}`;
};
