import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Enterprise Export Service
 * Supports CSV, Excel, and JSON with safe compression/formatting
 */
export const exportData = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  formatType: 'csv' | 'xlsx' | 'json',
  fileNamePrefix: string
) => {
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm');
  const fileName = `${fileNamePrefix}_${timestamp}`;

  if (formatType === 'json') {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.json`;
    link.click();
    return;
  }

  // Pre-process data for spreadsheet formats (flattening if needed)
  const preparedData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      row[col.header] = item[col.dataKey] ?? 'N/A';
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(preparedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  if (formatType === 'csv') {
    XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
  } else if (formatType === 'xlsx') {
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }
};

/**
 * Process Large Datasets in Background (Async)
 * Prevents UI hanging for 10,000+ records
 */
export const asyncExportData = async (
  fetchDataFn: () => Promise<any[]>,
  columns: { header: string; dataKey: string }[],
  formatType: 'csv' | 'xlsx' | 'json' | 'pdf',
  fileNamePrefix: string,
  onProgress: (progress: number) => void,
  pdfOptions?: { title: string; orientation?: 'p' | 'l' }
) => {
  onProgress(10);
  const data = await fetchDataFn();
  onProgress(50);

  if (formatType === 'pdf') {
     const { generateAdminReportPDF } = await import('./pdfService');
     generateAdminReportPDF(
       pdfOptions?.title || fileNamePrefix,
       data,
       columns as any
     );
  } else {
    exportData(data, columns, formatType as any, fileNamePrefix);
  }
  
  onProgress(100);
};
