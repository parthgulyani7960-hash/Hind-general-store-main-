import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hgs_token');
  const isValidToken = token && token !== 'null' && token !== 'undefined' && token.trim() !== '' && token.split('.').length === 3;
  return {
    'Content-Type': 'application/json',
    ...(isValidToken ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

export function amountToWords(amount: number): string {
  let num = Math.floor(amount);
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numToString = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  };

  const convertLessThanOneThousand = (n: number): string => {
    let temp = '';
    if (n >= 100) {
      temp += a[Math.floor(n / 100)] + ' Hundred';
      n %= 100;
      if (n > 0) temp += ' and ';
    }
    temp += numToString(n);
    return temp;
  };

  if (num === 0) return 'Zero';

  const lakh = 100000;
  const crore = 10000000;
  const thousand = 1000;

  let words = '';

  if (num >= crore) {
    words += convertLessThanOneThousand(Math.floor(num / crore)) + ' Crore ';
    num %= crore;
  }

  if (num >= lakh) {
    words += convertLessThanOneThousand(Math.floor(num / lakh)) + ' Lakh ';
    num %= lakh;
  }

  if (num >= thousand) {
    const th = Math.floor(num / thousand);
    if (th > 0) {
      words += convertLessThanOneThousand(th) + ' Thousand ';
    }
    num %= thousand;
  }

  if (num > 0) {
    words += convertLessThanOneThousand(num);
  }

  return words.trim() + ' Rupees Only';
}

export function calculateBulkDiscount(product: any, quantity: number, bulkDiscounts: any[]) {
  if (!bulkDiscounts || bulkDiscounts.length === 0) return 0;

  // Filter relevant discounts
  const relevantDiscounts = bulkDiscounts.filter(bd => 
    bd.active && (
      (bd.entity_type === 'product' && bd.entity_id === product.id) ||
      (bd.entity_type === 'category' && bd.entity_name === product.category)
    )
  ).sort((a, b) => b.min_qty - a.min_qty); // Highest quantity first

  // Find the first discount that matches the quantity
  const applicableDiscount = relevantDiscounts.find(bd => quantity >= bd.min_qty);

  if (!applicableDiscount) return 0;

  const basePrice = product.discount_price || product.price;

  if (applicableDiscount.discount_type === 'percentage') {
    return (basePrice * applicableDiscount.discount_value) / 100;
  } else {
    return applicableDiscount.discount_value;
  }
}
