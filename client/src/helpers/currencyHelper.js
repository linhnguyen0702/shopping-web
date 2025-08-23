/**
 * Helper functions for currency formatting
 * Mặc định sử dụng VND (Việt Nam Đồng)
 */

/**
 * Format amount to VND currency
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatVND = (amount, showSymbol = true) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 VND';
  }

  if (showSymbol) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' VND';
  }
};

/**
 * Format amount to compact VND (e.g., 1.2M, 500K)
 * @param {number} amount - Amount to format
 * @returns {string} Compact formatted currency string
 */
export const formatCompactVND = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 VND';
  }

  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    compactDisplay: 'short',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};

/**
 * Parse VND string back to number
 * @param {string} vndString - VND formatted string
 * @returns {number} Parsed number
 */
export const parseVND = (vndString) => {
  if (!vndString) return 0;
  
  // Remove VND, đ, and other currency symbols, then parse
  const cleanString = vndString.replace(/[^\d,.-]/g, '');
  const numberString = cleanString.replace(/,/g, '');
  
  return parseFloat(numberString) || 0;
};

/**
 * Check if amount is valid VND
 * @param {any} amount - Amount to validate
 * @returns {boolean} Whether amount is valid
 */
export const isValidVND = (amount) => {
  return typeof amount === 'number' && !isNaN(amount) && amount >= 0;
};

/**
 * Get VND symbol
 * @returns {string} VND symbol
 */
export const getVNDSymbol = () => 'VND';

/**
 * Get VND locale
 * @returns {string} VND locale
 */
export const getVNDLocale = () => 'vi-VN';
