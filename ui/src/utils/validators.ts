export const validate_isbn = (isbn: string): boolean => {
  // Remove hyphens and spaces
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  // Check if it's 10 or 13 digits
  if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
    return false;
  }

  // Basic format validation
  return /^\d+$/.test(cleanISBN);
};

export const validate_phone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validate_required = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validate_min_length = (
  value: string,
  minLength: number
): boolean => {
  return value.length >= minLength;
};

export const validate_max_length = (
  value: string,
  maxLength: number
): boolean => {
  return value.length <= maxLength;
};

export const validate_year = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year > 0 && year <= currentYear;
};
