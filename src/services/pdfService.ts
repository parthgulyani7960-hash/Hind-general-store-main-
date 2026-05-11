import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateUserExportPDF = (data: any) => {
  const doc = new jsPDF();
  const primaryColor = [220, 38, 38];
  const secondaryColor = [71, 85, 105];

  const addHeader = (d: any) => {
    d.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    d.rect(0, 0, 210, 35, 'F');
    d.setTextColor(255, 255, 255);
    d.setFontSize(22);
    d.text('Account Records', 14, 20);
    d.setFontSize(10);
    d.text(`Generated: ${new Date().toLocaleString()} | Source: Hind General Store`, 14, 28);
    d.text(`Auth ID: ${data.generatedAt.slice(0, 19).replace(/[-T:]/g, '')}-EXP`, 14, 32);
    d.setTextColor(0, 0, 0);
  };

  addHeader(doc);
  const formatValue = (val: any) => (val === null || val === undefined || val === '' ? 'N/A' : val);

  // 1. Summary
  doc.setFontSize(16);
  doc.text('1. Account Summary', 14, 45);
  const totalSpent = (data.orders || []).reduce((acc: number, o: any) => acc + (parseFloat(o.total) || 0), 0);
  (doc as any).autoTable({
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Orders', (data.orders || []).length],
      ['Total Amount Spent', `₹${totalSpent.toFixed(2)}`],
      ['Last Transaction', data.wallet && data.wallet.length > 0 ? new Date(data.wallet[0].created_at).toLocaleDateString() : 'N/A']
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor }
  });

  // 2. Customer Information
  doc.addPage();
  addHeader(doc);
  doc.setFontSize(16);
  doc.text('2. Customer Information', 14, 45);
  (doc as any).autoTable({
    startY: 50,
    head: [['Field', 'Details']],
    body: [
      ['Name', formatValue(data.user.name)],
      ['Email', formatValue(data.user.email)],
      ['Phone', formatValue(data.user.phone)],
      ['Wallet Balance', `₹${formatValue(data.user.wallet_balance)}`],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor }
  });

  // 3. Order History
  doc.addPage();
  addHeader(doc);
  doc.setFontSize(16);
  doc.text('3. Order History', 14, 45);
  (doc as any).autoTable({
    startY: 50,
    head: [['Order ID', 'Total', 'Method', 'Pay Ref', 'Status', 'Date']],
    body: (data.orders && data.orders.length > 0) ? data.orders.map((o: any) => [
      formatValue(o.order_id || `ORD-${o.id}`),
      `₹${formatValue(o.total)}`,
      formatValue(o.payment_method),
      formatValue(o.payment_id || o.payment_utr || 'N/A'),
      formatValue(o.status),
      new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })
    ]) : [['No records', 'null', 'null', 'null', 'null', 'null']],
    theme: 'grid',
    headStyles: { fillColor: secondaryColor }
  });

  // 4. Payment Transactions
  doc.addPage();
  addHeader(doc);
  doc.setFontSize(16);
  doc.text('4. Payment Transactions', 14, 45);
  (doc as any).autoTable({
    startY: 50,
    head: [['ID', 'Type', 'Amount', 'Description', 'Date']],
    body: (data.wallet && data.wallet.length > 0) ? data.wallet.map((t: any) => [
      formatValue(t.id),
      formatValue(t.type),
      `₹${formatValue(t.amount)}`,
      formatValue(t.description),
      new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', day: 'numeric' })
    ]) : [['No records', 'null', 'null', 'null', 'null']],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }
  });

  // 5. About Us
  doc.addPage();
  addHeader(doc);
  doc.setFontSize(16);
  doc.text('5. About Us', 14, 45);
  doc.setFontSize(10);
  doc.text('Hind General Store provides quality groceries.', 14, 55);

  doc.save(`Store_Export_${data.user.name.replace(/\s+/g, '_')}.pdf`);
};
