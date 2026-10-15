
// Historical exchange rates (USD to HNL) - you can update these or fetch from an API
const EXCHANGE_RATES: Record<string, number> = {
  '2024-01-15': 24.70,
  '2024-03-01': 24.75,
  '2024-06-04': 24.85, // Current approximate rate
  '2024-12-01': 24.92, // Updated rate
};

// EUR to HNL exchange rates (approximate)
const EUR_TO_HNL_RATES: Record<string, number> = {
  '2024-01-15': 27.15,
  '2024-03-01': 27.20,
  '2024-06-04': 27.30,
  '2024-12-01': 27.35,
};

export const getExchangeRate = (date: string): number => {
  // Try to get exact date first
  if (EXCHANGE_RATES[date]) {
    return EXCHANGE_RATES[date];
  }
  
  // If exact date not found, use a default rate (current approximate)
  return 24.92;
};

export const getEurToHnlRate = (date: string): number => {
  // Try to get exact date first
  if (EUR_TO_HNL_RATES[date]) {
    return EUR_TO_HNL_RATES[date];
  }
  
  // If exact date not found, use a default rate (current approximate)
  return 27.35;
};

export const getCurrentExchangeRates = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  return {
    usdToHnl: getExchangeRate(currentDate),
    eurToHnl: getEurToHnlRate(currentDate),
    lastUpdated: '2024-12-01'
  };
};

export const formatCurrency = (amount: number, currency: 'USD' | 'HNL' | 'EUR' = 'HNL'): string => {
  switch (currency) {
    case 'USD':
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'HNL':
      return `L ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'EUR':
      return `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default:
      return `L ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export const formatNumber = (amount: number): string => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const convertToLempiras = (usdAmount: number, exchangeRate: number): number => {
  return Math.round(usdAmount * exchangeRate);
};

export const convertToUSD = (hnlAmount: number, exchangeRate: number): number => {
  return Math.round((hnlAmount / exchangeRate) * 100) / 100;
};
