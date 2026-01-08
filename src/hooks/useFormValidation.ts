import { useState, useCallback } from 'react';
import { ValidationResult, ValidationProcessor } from '../utils/validation';

interface FormFieldState {
  value: string;
  error: ValidationResult['error'];
  isDirty: boolean;
  isTouched: boolean;
}

interface UseFormValidationOptions {
  onValidationChange?: (field: string, isValid: boolean) => void;
  debounceMs?: number;
}

export function useFormValidation(options: UseFormValidationOptions = {}) {
  const { debounceMs = 300 } = options;
  const [fields, setFields] = useState<Record<string, FormFieldState>>({});
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const getFieldState = useCallback(
    (fieldName: string): FormFieldState => {
      return (
        fields[fieldName] || {
          value: '',
          error: null,
          isDirty: false,
          isTouched: false,
        }
      );
    },
    [fields]
  );

  const setFieldValue = useCallback(
    (fieldName: string, value: string) => {
      setFields((prev) => ({
        ...prev,
        [fieldName]: {
          ...getFieldState(fieldName),
          value,
          isDirty: true,
        },
      }));

      if (debounceTimers[fieldName]) {
        clearTimeout(debounceTimers[fieldName]);
      }
    },
    [getFieldState, debounceTimers]
  );

  const setFieldTouched = useCallback(
    (fieldName: string, isTouched: boolean = true) => {
      setFields((prev) => ({
        ...prev,
        [fieldName]: {
          ...getFieldState(fieldName),
          isTouched,
        },
      }));
    },
    [getFieldState]
  );

  const validateField = useCallback(
    (
      fieldName: string,
      value: string,
      validationType: 'url' | 'email' | 'phone' | 'text' | 'alphanumeric' | 'required',
      options?: Record<string, unknown>
    ) => {
      let result: ValidationResult;

      switch (validationType) {
        case 'url':
          result = ValidationProcessor.validateURL(value);
          break;
        case 'email':
          result = ValidationProcessor.validateEmail(value);
          break;
        case 'phone':
          result = ValidationProcessor.validatePhone(value);
          break;
        case 'text':
          result = ValidationProcessor.validateText(
            value,
            (options?.minLength as number) || 1,
            (options?.maxLength as number) || 1000
          );
          break;
        case 'alphanumeric':
          result = ValidationProcessor.validateAlphanumeric(
            value,
            (options?.minLength as number) || 1,
            (options?.maxLength as number) || 100
          );
          break;
        case 'required':
          result = ValidationProcessor.validateRequired(value, (options?.fieldName as string) || 'Field');
          break;
        default:
          result = { isValid: true, error: null, sanitized: value };
      }

      setFields((prev) => ({
        ...prev,
        [fieldName]: {
          ...getFieldState(fieldName),
          error: result.error,
          value: result.sanitized,
        },
      }));

      if (options?.onValidationChange) {
        (options.onValidationChange as (field: string, isValid: boolean) => void)(fieldName, result.isValid);
      }

      return result;
    },
    [getFieldState]
  );

  const validateFieldDebounced = useCallback(
    (
      fieldName: string,
      value: string,
      validationType: 'url' | 'email' | 'phone' | 'text' | 'alphanumeric' | 'required',
      options?: Record<string, unknown>
    ) => {
      if (debounceTimers[fieldName]) {
        clearTimeout(debounceTimers[fieldName]);
      }

      const timer = setTimeout(() => {
        validateField(fieldName, value, validationType, options);
      }, debounceMs);

      setDebounceTimers((prev) => ({
        ...prev,
        [fieldName]: timer,
      }));
    },
    [debounceMs, debounceTimers, validateField]
  );

  const resetField = useCallback((fieldName: string) => {
    setFields((prev) => ({
      ...prev,
      [fieldName]: {
        value: '',
        error: null,
        isDirty: false,
        isTouched: false,
      },
    }));

    if (debounceTimers[fieldName]) {
      clearTimeout(debounceTimers[fieldName]);
    }
  }, [debounceTimers]);

  const resetAllFields = useCallback(() => {
    Object.keys(debounceTimers).forEach((fieldName) => {
      clearTimeout(debounceTimers[fieldName]);
    });

    setFields({});
    setDebounceTimers({});
  }, [debounceTimers]);

  const isFormValid = useCallback((): boolean => {
    return Object.values(fields).every((field) => field.error === null && field.value.length > 0);
  }, [fields]);

  return {
    fields,
    getFieldState,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateFieldDebounced,
    resetField,
    resetAllFields,
    isFormValid,
  };
}
