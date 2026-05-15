import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Professional Color Palette
const COLORS = {
  PRIMARY: [22, 163, 74] as [number, number, number],    // Emerald-600
  SECONDARY: [15, 23, 42] as [number, number, number],   // Slate-900
  ACCENT: [245, 158, 11] as [number, number, number],    // Amber-500
  MUTED: [100, 116, 139] as [number, number, number],    // Slate-500
  BORDER: [226, 232, 240] as [number, number, number]   // Slate-200
};

/**
 * Enhanced PDF Logistics Engine
 * Provides enterprise-grade document formatting with grid-alignment and vector branding
 */

/**
 * Professional Order Invoice Generator
 */
export const generateOrderInvoicePDF = (order: any, config: any[]) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const storeName = config.find(c => c.key === 'store_name')?.value || 'Hind General Store';
  const storePhone = config.find(c => c.key === 'store_phone')?.value || '+91 99882-27755';
  const storeAddr = config.find(c => c.key === 'store_address')?.value || 'Shop No. 5, Main Market, Nayagaon';

  // --- BRANDING HEADER ---
  // Accent Bar
  doc.setFillColor(COLORS.PRIMARY[0], COLORS.PRIMARY[1], COLORS.PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Store Identity
  doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName.toUpperCase(), margin, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.MUTED[0], COLORS.MUTED[1], COLORS.MUTED[2]);
  doc.text([storeAddr, `Contact: ${storePhone}`], margin, 32);

  // Document Title
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BORDER[0], COLORS.BORDER[1], COLORS.BORDER[2]);
  doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' });

  // --- ORDER METADATA ---
  doc.setDrawColor(COLORS.BORDER[0], COLORS.BORDER[1], COLORS.BORDER[2]);
  doc.line(margin, 45, pageWidth - margin, 45);

  // Billing Details
  doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin, 55);

  let customerAddr: any = {};
  try {
    customerAddr = typeof order.address === 'string' ? JSON.parse(order.address) : order.address;
  } catch (e) {
    customerAddr = { name: order.user_name || 'Customer', address: order.address };
  }

  doc.setFont('helvetica', 'normal');
  doc.text([
    customerAddr.name || 'N/A',
    customerAddr.phone || 'N/A',
    customerAddr.address || 'N/A',
    customerAddr.city ? `${customerAddr.city}, ${customerAddr.state}` : ''
  ].filter(Boolean), margin, 60);

  // Invoice Metadata
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS:', pageWidth - 80, 55);
  doc.setFont('helvetica', 'normal');
  doc.text([
    `Invoice ID: #INV-${order.id}`,
    `Order Date: ${format(new Date(order.created_at), 'dd MMM yyyy')}`,
    `Payment: ${String(order.payment_method).toUpperCase()}`,
    `Status: ${String(order.status).toUpperCase()}`
  ], pageWidth - 80, 60);

  // --- ITEMIZATION TABLE ---
  (doc as any).autoTable({
    startY: 85,
    margin: { left: margin, right: margin },
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total']],
    body: order.items.map((item: any, i: number) => [
      i + 1,
      item.product_name || item.name,
      item.quantity,
      `₹${item.price}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.SECONDARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.SECONDARY
    },
    columnStyles: {
      0: { halign: 'center', width: 10 },
      1: { halign: 'left' },
      2: { halign: 'center', width: 20 },
      3: { halign: 'right', width: 30 },
      4: { halign: 'right', width: 30, fontStyle: 'bold' }
    }
  });

  // --- SUMMARY SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - margin - 60;
  let currentSummaryY = finalY;

  const summaryLine = (label: string, value: string, isTotal = false) => {
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 12 : 9);
    doc.setTextColor(isTotal ? COLORS.PRIMARY[0] : COLORS.SECONDARY[0], isTotal ? COLORS.PRIMARY[1] : COLORS.SECONDARY[1], isTotal ? COLORS.PRIMARY[2] : COLORS.SECONDARY[2]);
    doc.text(label, summaryX, currentSummaryY);
    doc.text(value, pageWidth - margin, currentSummaryY, { align: 'right' });
  };

  summaryLine('Subtotal:', `₹${order.subtotal || order.total}`);
  currentSummaryY += 6;
  if (order.discount > 0) {
    summaryLine('Discount:', `-₹${order.discount}`);
    currentSummaryY += 6;
  }
  summaryLine('Delivery Fee:', `₹${order.delivery_fee || 0}`);
  currentSummaryY += 10;
  summaryLine('TOTAL AMOUNT:', `₹${order.total}`, true);

  // --- FOOTER & SIGNATURE ---
  const footerY = pageHeight - 40;
  doc.setDrawColor(COLORS.BORDER[0], COLORS.BORDER[1], COLORS.BORDER[2]);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.MUTED[0], COLORS.MUTED[1], COLORS.MUTED[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS:', margin, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text([
    '1. Items once sold can only be returned within 24 hours if damaged or expired.',
    '2. This is a computer-generated document and does not require a physical signature.',
    '3. For any support, please contact us at ' + storePhone
  ], margin, footerY + 5, { maxWidth: pageWidth - margin * 2 });

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.MUTED[0], COLORS.MUTED[1], COLORS.MUTED[2]);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`Invoice_#ORD-${order.id}.pdf`);
};

/**
 * Professional User Data Dossier
 */
export const generateUserExportPDF = (data: any) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const header = (title: string) => {
    doc.setFillColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATA ARCHIVE FOR: ${String(data.user?.name || 'USER').toUpperCase()}`, margin, 30);
    doc.text(`EXPORTED ON: ${format(new Date(), 'dd MMMM yyyy, HH:mm')}`, pageWidth - margin, 30, { align: 'right' });
  };

  header('ACCOUNT DATA EXPORT');

  // Profile Overview Section
  doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. PROFILE INFRASTRUCTURE', margin, 55);

  (doc as any).autoTable({
    startY: 60,
    margin: { left: margin, right: margin },
    head: [['Attribute', 'Data Point']],
    body: [
      ['Full Legal Name', data.user?.name || 'UNKNOWN'],
      ['Primary Contact', data.user?.phone || 'UNKNOWN'],
      ['Email Address', data.user?.email || 'NOT REGISTERED'],
      ['Account Status', (data.user?.status || 'ACTIVE').toUpperCase()],
      ['Wallet Liquidity', `₹${data.user?.wallet_balance || 0}`],
      ['Khata Eligibility', data.user?.khata_enabled ? 'AUTHORIZED' : 'RESTRICTED'],
      ['Primary Node (Address)', data.user?.address || 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: COLORS.SECONDARY },
    columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
  });

  // Order History
  if (data.orders && data.orders.length > 0) {
    doc.addPage();
    header('ORDER HISTORY ARCHIVE');
    doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. COMMERCIAL TRANSACTIONS', margin, 55);

    (doc as any).autoTable({
      startY: 60,
      margin: { left: margin, right: margin },
      head: [['ID', 'Date', 'Value', 'Method', 'Status', 'Protocol ID']],
      body: data.orders.map((o: any) => [
        `#ORD-${o.id}`,
        format(new Date(o.created_at), 'dd/MM/yy'),
        `₹${o.total}`,
        o.payment_method?.toUpperCase(),
        o.status?.toUpperCase(),
        o.payment_id || o.payment_utr || 'N/A'
      ]),
      headStyles: { fillColor: COLORS.PRIMARY },
      styles: { fontSize: 8 }
    });
  }

  // Wallet
  if (data.wallet && data.wallet.length > 0) {
    doc.addPage();
    header('FINANCIAL LEDGER');
    doc.setTextColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. WALLET OPERATIONS', margin, 55);

    (doc as any).autoTable({
      startY: 60,
      margin: { left: margin, right: margin },
      head: [['Execution Date', 'Type', 'Value', 'Reference / Description']],
      body: data.wallet.map((w: any) => [
        format(new Date(w.created_at), 'dd/MM HH:mm'),
        w.type === 'credit' ? 'INFLOW' : 'OUTFLOW',
        `₹${w.amount}`,
        w.description || 'N/A'
      ]),
      headStyles: { fillColor: COLORS.ACCENT },
      styles: { fontSize: 8 }
    });
  }

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(COLORS.MUTED[0], COLORS.MUTED[1], COLORS.MUTED[2]);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  doc.save(`HindStore_Export_${(data.user?.name || 'User').replace(/\s+/g, '_')}.pdf`);
};

/**
 * Enterprise Admin Report PDF Generator
 */
export const generateAdminReportPDF = (
  title: string,
  data: any[],
  columns: { header: string; dataKey: string; halign?: 'left' | 'center' | 'right' }[]
) => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header Bar
  doc.setFillColor(COLORS.SECONDARY[0], COLORS.SECONDARY[1], COLORS.SECONDARY[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), margin, 15);
  doc.setFontSize(8);
  doc.text(`GENERATED: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - margin, 15, { align: 'right' });

  (doc as any).autoTable({
    startY: 35,
    margin: { left: margin, right: margin },
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => item[c.dataKey])),
    theme: 'striped',
    headStyles: { fillColor: COLORS.PRIMARY, fontSize: 8 },
    styles: { 
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: columns.reduce((acc: any, c, idx) => {
      if (c.halign) acc[idx] = { halign: c.halign };
      return acc;
    }, {}),
    didDrawPage: (data: any) => {
      const totalPages = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(COLORS.MUTED[0], COLORS.MUTED[1], COLORS.MUTED[2]);
      doc.text(
        `Page ${data.pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: 'center' }
      );
    }
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
