export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: Date | string | number): string {
  if (!date) return '';
  
  // Garantir que a data é um objeto Date
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  // Ajustar o fuso horário para evitar problemas com datas ISO
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  return localDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getProgressBarColor(percentage: number): string {
  if (percentage <= 50) return 'bg-success';
  if (percentage <= 80) return 'bg-warning';
  return 'bg-danger';
}
