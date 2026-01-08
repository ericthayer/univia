export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SanitizationOptions {
  lowercase?: boolean;
  trim?: boolean;
  stripSpecialChars?: boolean;
  maxLength?: number;
}

export const Sanitizers = {
  text: (input: string, options: SanitizationOptions = {}): string => {
    let result = input;

    if (options.trim !== false) {
      result = result.trim();
    }

    if (options.lowercase) {
      result = result.toLowerCase();
    }

    if (options.maxLength) {
      result = result.substring(0, options.maxLength);
    }

    return result;
  },

  url: (input: string): string => {
    let result = input.trim();
    result = result.replace(/\s+/g, '');
    result = result.toLowerCase();

    result = result.replace(/^(https?:\/\/)/, '');

    result = result.replace(/\/+$/, '');

    return result;
  },

  email: (input: string): string => {
    let result = input.trim();
    result = result.toLowerCase();
    return result;
  },

  phone: (input: string): string => {
    return input.replace(/\D/g, '');
  },

  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  },

  numeric: (input: string): string => {
    return input.replace(/\D/g, '');
  },
};

export const Validators = {
  url: (input: string): ValidationError | null => {
    const sanitized = Sanitizers.url(input);

    if (!sanitized) {
      return {
        field: 'url',
        message: 'URL cannot be empty',
        severity: 'error',
      };
    }

    if (sanitized.length > 2048) {
      return {
        field: 'url',
        message: 'URL is too long (maximum 2048 characters)',
        severity: 'error',
      };
    }

    if (sanitized.length < 3) {
      return {
        field: 'url',
        message: 'URL is too short',
        severity: 'error',
      };
    }

    const urlPattern = /^([\da-z.-]+)\.([a-z.]{2,6})([/\w\-._~:?#[\]@!$&'()*+,;=%]*)*$/i;
    if (!urlPattern.test(sanitized)) {
      return {
        field: 'url',
        message: 'Please enter a valid URL (e.g., example.com or https://example.com)',
        severity: 'error',
      };
    }

    if (sanitized.includes('..')) {
      return {
        field: 'url',
        message: 'URL contains invalid patterns',
        severity: 'error',
      };
    }

    const reservedDomains = ['localhost', '127.0.0.1', '0.0.0.0', '255.255.255.255'];
    if (reservedDomains.some(domain => sanitized.includes(domain))) {
      return {
        field: 'url',
        message: 'Cannot audit reserved or local addresses',
        severity: 'error',
      };
    }

    return null;
  },

  email: (input: string): ValidationError | null => {
    const sanitized = Sanitizers.email(input);

    if (!sanitized) {
      return {
        field: 'email',
        message: 'Email cannot be empty',
        severity: 'error',
      };
    }

    if (sanitized.length > 254) {
      return {
        field: 'email',
        message: 'Email is too long',
        severity: 'error',
      };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(sanitized)) {
      return {
        field: 'email',
        message: 'Please enter a valid email address',
        severity: 'error',
      };
    }

    const [localPart, domain] = sanitized.split('@');
    if (localPart.length > 64) {
      return {
        field: 'email',
        message: 'Email local part is too long',
        severity: 'error',
      };
    }

    if (domain.startsWith('.') || domain.endsWith('.')) {
      return {
        field: 'email',
        message: 'Invalid email domain format',
        severity: 'error',
      };
    }

    return null;
  },

  phone: (input: string): ValidationError | null => {
    const sanitized = Sanitizers.phone(input);

    if (!sanitized) {
      return {
        field: 'phone',
        message: 'Phone number cannot be empty',
        severity: 'error',
      };
    }

    if (sanitized.length < 10) {
      return {
        field: 'phone',
        message: 'Phone number is too short (minimum 10 digits)',
        severity: 'error',
      };
    }

    if (sanitized.length > 15) {
      return {
        field: 'phone',
        message: 'Phone number is too long (maximum 15 digits)',
        severity: 'error',
      };
    }

    return null;
  },

  text: (input: string, minLength: number = 1, maxLength: number = 1000): ValidationError | null => {
    const sanitized = Sanitizers.text(input, { trim: true });

    if (sanitized.length < minLength) {
      return {
        field: 'text',
        message: `Text must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`,
        severity: 'error',
      };
    }

    if (sanitized.length > maxLength) {
      return {
        field: 'text',
        message: `Text cannot exceed ${maxLength} characters`,
        severity: 'error',
      };
    }

    if (/<[^>]*>/g.test(sanitized)) {
      return {
        field: 'text',
        message: 'HTML tags are not allowed',
        severity: 'error',
      };
    }

    return null;
  },

  alphanumeric: (input: string, minLength: number = 1, maxLength: number = 100): ValidationError | null => {
    const sanitized = Sanitizers.alphanumeric(input);

    if (sanitized.length < minLength) {
      return {
        field: 'alphanumeric',
        message: `Input must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`,
        severity: 'error',
      };
    }

    if (sanitized.length > maxLength) {
      return {
        field: 'alphanumeric',
        message: `Input cannot exceed ${maxLength} characters`,
        severity: 'error',
      };
    }

    return null;
  },

  required: (input: string, fieldName: string = 'Field'): ValidationError | null => {
    if (!input || input.trim().length === 0) {
      return {
        field: 'required',
        message: `${fieldName} is required`,
        severity: 'error',
      };
    }
    return null;
  },
};

export const ValidationHelpers = {
  getCharacterCount: (input: string): number => {
    return input.length;
  },

  getRemainingCharacters: (input: string, maxLength: number): number => {
    return Math.max(0, maxLength - input.length);
  },

  formatErrorMessage: (error: ValidationError | null): string => {
    return error?.message || '';
  },

  hasError: (error: ValidationError | null): boolean => {
    return error !== null;
  },

  isFieldValid: (error: ValidationError | null): boolean => {
    return error === null;
  },
};

export interface ValidationResult {
  isValid: boolean;
  error: ValidationError | null;
  sanitized: string;
}

export const ValidationProcessor = {
  validateURL: (input: string): ValidationResult => {
    const sanitized = Sanitizers.url(input);
    const error = Validators.url(sanitized);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },

  validateEmail: (input: string): ValidationResult => {
    const sanitized = Sanitizers.email(input);
    const error = Validators.email(sanitized);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },

  validatePhone: (input: string): ValidationResult => {
    const sanitized = Sanitizers.phone(input);
    const error = Validators.phone(sanitized);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },

  validateText: (input: string, minLength: number = 1, maxLength: number = 1000): ValidationResult => {
    const sanitized = Sanitizers.text(input, { trim: true, maxLength });
    const error = Validators.text(sanitized, minLength, maxLength);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },

  validateAlphanumeric: (input: string, minLength: number = 1, maxLength: number = 100): ValidationResult => {
    const sanitized = Sanitizers.alphanumeric(input);
    const error = Validators.alphanumeric(sanitized, minLength, maxLength);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },

  validateRequired: (input: string, fieldName: string = 'Field'): ValidationResult => {
    const sanitized = input.trim();
    const error = Validators.required(sanitized, fieldName);

    return {
      isValid: error === null,
      error,
      sanitized,
    };
  },
};
