import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PRIMARY_COLOR = [22, 163, 74]; // Emerald-600
const SECONDARY_COLOR = [15, 23, 42]; // Slate-900
const ACCENT_COLOR = [245, 158, 11]; // Amber-500

export const generateOrderInvoicePDF = (order: any, storeConfig: any[]) => {
  const doc = new jsPDF();
  const storeName = storeConfig.find(c => c.key === 'store_name')?.value || 'Hind General Store';
  const storeAddress = storeConfig.find(c => c.key === 'store_address')?.value || 'Nayagaon, India';
  const storePhone = storeConfig.find(c => c.key === 'store_phone')?.value || '+91 98765 43210';
  const currency = 'INR';

  // Aesthetic Header Background
  doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.rect(0, 0, 210, 60, 'F');
  
  // Store Logo / Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(storeName.toUpperCase(), 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(storeAddress, 14, 35);
  doc.text(`Tel: ${storePhone}`, 14, 40);

  // Invoice Label
  doc.setFontSize(40);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text('INVOICE', 200, 35, { align: 'right' });
  
  // Order Stats on Header
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`ORDER ID: #ORD-${order.id}`, 200, 45, { align: 'right' });
  doc.text(`DATE: ${new Date(order.created_at).toLocaleDateString()}`, 200, 50, { align: 'right' });

  // Bill To & Payment sections
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 75);
  doc.text('PAYMENT INFO:', 120, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text([
    order.user_name,
    order.user_phone,
    order.address || 'N/A'
  ], 14, 82);

  doc.text([
    `METHOD: ${order.payment_method?.toUpperCase() || 'COD'}`,
    `PAY ID: ${order.payment_id || order.payment_utr || 'N/A'}`,
    `STATUS: ${order.status?.toUpperCase() || 'PAID'}`
  ], 120, 82);

  // Table
  (doc as any).autoTable({
    startY: 110,
    head: [['Product Description', 'Quantity', 'Rate', 'Total']],
    body: order.items.map((item: any) => [
      item.product_name,
      item.quantity,
      `₹${item.price}`,
      `₹${item.price * item.quantity}`
    ]),
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      lineColor: [240, 240, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 150, finalY);
  doc.text('Delivery:', 150, finalY + 7);
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.text('Total Amount:', 150, finalY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.text(`₹${order.total}`, 195, finalY, { align: 'right' });
  doc.text('FREE', 195, finalY + 7, { align: 'right' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`₹${order.total}`, 195, finalY + 16, { align: 'right' });

  // Footer Branding
  doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.rect(0, 277, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Thank you for choosing Hind General Store!', 105, 287, { align: 'center' });
  doc.setFontSize(8);
  doc.text('This is a computer-generated invoice. No physical signature is required.', 105, 292, { align: 'center' });

  doc.save(`Invoice_#ORD-${order.id}.pdf`);
};

export const generateUserExportPDF = (data: any) => {
  const doc = new jsPDF();
  
  const addHeader = (d: any, title: string) => {
    d.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
    d.rect(0, 0, 210, 40, 'F');
    d.setTextColor(255, 255, 255);
    d.setFontSize(22);
    d.setFont('helvetica', 'bold');
    d.text(title, 14, 20);
    d.setFontSize(10);
    d.setFont('helvetica', 'normal');
    d.text(`Member: ${data.user.name} | Data Exported: ${new Date().toLocaleString()}`, 14, 30);
    d.setTextColor(0, 0, 0);
  };

  addHeader(doc, 'ACCOUNT DATA DOSSIER');

  // Summary Cards (visualized as colored boxes)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 40, 3, 3, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE ANALYTICS', 20, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const totalSpent = (data.orders || []).reduce((acc: number, o: any) => acc + (parseFloat(o.total) || 0), 0);
  doc.text(`Total Lifetime Orders: ${data.orders?.length || 0}`, 20, 70);
  doc.text(`Total Order Value: ₹${totalSpent.toFixed(2)}`, 20, 76);
  doc.text(`Wallet Liquidity: ₹${data.user.wallet_balance || 0}`, 20, 82);

  // Tables
  (doc as any).autoTable({
    startY: 100,
    head: [['Entity', 'Details']],
    body: [
      ['Customer Identity', data.user.name],
      ['Primary Contact', data.user.phone],
      ['Verified Email', data.user.email || 'N/A'],
      ['Store Segment', data.user.segment || 'REGULAR'],
      ['Khata Facility', data.user.khata_enabled ? 'ACTIVE' : 'INACTIVE'],
      ['Default Address', data.user.address || 'N/A']
    ],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY_COLOR }
  });

  // Orders
  if (data.orders && data.orders.length > 0) {
    doc.addPage();
    addHeader(doc, 'ORDER ARCHIVE');
    (doc as any).autoTable({
      startY: 50,
      head: [['ID', 'Value', 'Method', 'ID Proof', 'Status', 'Timestamp']],
      body: data.orders.map((o: any) => [
        o.order_id || `#${o.id}`,
        `₹${o.total}`,
        o.payment_method,
        o.payment_id || 'N/A',
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ]),
      headStyles: { fillColor: SECONDARY_COLOR }
    });
  }

  // Transactions
  if (data.wallet && data.wallet.length > 0) {
    doc.addPage();
    addHeader(doc, 'FINANCIAL LEDGER');
    (doc as any).autoTable({
      startY: 50,
      head: [['Ref', 'Flow', 'Value', 'Context', 'Execution Date']],
      body: data.wallet.map((t: any) => [
        t.id.toString().slice(-6).toUpperCase(),
        t.type === 'credit' ? 'INFLOW' : 'OUTFLOW',
        `₹${t.amount}`,
        t.description || 'Generic Transfer',
        new Date(t.created_at).toLocaleDateString()
      ]),
      headStyles: { fillColor: ACCENT_COLOR }
    });
  }

  doc.save(`HindStore_Data_${data.user.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateAdminCustomerReportPDF = (users: any[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INTELLIGENCE REPORT', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Intelligence Pool: ${users.length} members | Generation Date: ${new Date().toLocaleString()}`, 14, 32);

  // Stats Summary
  const totalWallet = users.reduce((acc, u) => acc + (parseFloat(u.wallet_balance) || 0), 0);
  const totalKhata = users.reduce((acc, u) => acc + (parseFloat(u.khata_balance) || 0), 0);
  const totalSpent = users.reduce((acc, u) => acc + (parseFloat(u.total_spent) || 0), 0);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 55, 182, 35, 3, 3, 'F');
  doc.setTextColor(SECONDARY_COLOR[0], SECONDARY_COLOR[1], SECONDARY_COLOR[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('AGGREGATED COMMERCIAL METRICS', 20, 65);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Liquid Wallet Exposure: ₹${totalWallet.toLocaleString()}`, 20, 75);
  doc.text(`Total Credit (Khata) Utilization: ₹${totalKhata.toLocaleString()}`, 20, 81);
  doc.text(`Aggregated Lifetime Sales: ₹${totalSpent.toLocaleString()}`, 110, 75);

  // Table
  (doc as any).autoTable({
    startY: 100,
    head: [['Name', 'Phone', 'Segment', 'Wallet', 'Khata', 'Spent', 'Orders']],
    body: users.map((u: any) => [
      u.name,
      u.phone,
      u.computed_segment || u.segment || 'REGULAR',
      `₹${u.wallet_balance}`,
      `₹${u.khata_balance || 0}`,
      `₹${u.total_spent || 0}`,
      u.total_orders || 0
    ]),
    headStyles: { fillColor: PRIMARY_COLOR },
    styles: { fontSize: 8 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' }
    }
  });

  doc.save(`Customer_Intelligence_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

