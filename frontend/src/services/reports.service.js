import { apiRequest, downloadRequest } from './api';

/** Vista previa del reporte diario, en JSON. */
export function getDailySalesReport(date) {
  return apiRequest(`/reports/daily-sales?date=${date}`);
}

/** Devuelve `{ blob, filename }`; quien llama decide qué hacer con ellos. */
export function downloadDailySalesReportPdf(date) {
  return downloadRequest(`/reports/daily-sales?date=${date}&format=pdf`);
}

export function downloadDailySalesReportExcel(date) {
  return downloadRequest(`/reports/daily-sales?date=${date}&format=xlsx`);
}

export default { getDailySalesReport, downloadDailySalesReportPdf, downloadDailySalesReportExcel };
