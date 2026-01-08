# Input Validation & Sanitization Guide

This guide explains the comprehensive input validation and sanitization system implemented in the Accessibility Audit application.

## System Architecture

The validation system is built on three core components:

1. **Validation Utilities** (`src/utils/validation.ts`) - Sanitizers and validators for all input types
2. **Validation Hook** (`src/hooks/useFormValidation.ts`) - React hook for managing form validation state
3. **Feedback Component** (`src/components/validation/ValidationFeedback.tsx`) - UI component for real-time validation feedback

## Overview of Features

### 1. Input Sanitization

Sanitization removes unwanted characters and normalizes input before validation.

#### Available Sanitizers

```typescript
import { Sanitizers } from '../utils/validation';

// Text sanitization
const cleanText = Sanitizers.text(userInput, {
  lowercase: false,
  trim: true,
  maxLength: 1000,
});

// URL sanitization
const cleanUrl = Sanitizers.url('  HTTPS://Example.COM  ');
// Returns: 'https://example.com'

// Email sanitization
const cleanEmail = Sanitizers.email('  USER@EXAMPLE.COM  ');
// Returns: 'user@example.com'

// Phone number sanitization (digits only)
const cleanPhone = Sanitizers.phone('(555) 123-4567');
// Returns: '5551234567'

// Alphanumeric sanitization
const cleanAlpha = Sanitizers.alphanumeric('Hello@World#123');
// Returns: 'HelloWorld123'

// Numeric sanitization
const cleanNumeric = Sanitizers.numeric('Price: $123.45');
// Returns: '12345'
```

### 2. Input Validation

Validation checks that input meets defined rules and returns specific error messages.

#### Available Validators

```typescript
import { Validators } from '../utils/validation';

// URL validation
const urlError = Validators.url('invalid url');
// Returns: { field: 'url', message: 'Please enter a valid URL...', severity: 'error' }

// Email validation
const emailError = Validators.email('invalid@');
// Returns: { field: 'email', message: 'Please enter a valid email address', severity: 'error' }

// Phone validation (10-15 digits)
const phoneError = Validators.phone('123');
// Returns: { field: 'phone', message: 'Phone number is too short...', severity: 'error' }

// Text validation with length constraints
const textError = Validators.text('hi', 3, 100);
// Returns: { field: 'text', message: 'Text must be at least 3 characters', severity: 'error' }

// Alphanumeric validation
const alphaError = Validators.alphanumeric('a', 2, 100);
// Returns: { field: 'alphanumeric', message: 'Input must be at least 2 characters', severity: 'error' }

// Required field validation
const requiredError = Validators.required('', 'URL');
// Returns: { field: 'required', message: 'URL is required', severity: 'error' }
```

### 3. Validation Rules

#### URL Validation Rules
- **Length**: 3-2048 characters
- **Format**: Must be valid URL format (with or without protocol)
- **Pattern**: Alphanumeric, hyphens, dots, slashes, query parameters allowed
- **Restrictions**: Cannot use reserved domains (localhost, 127.0.0.1, etc.)
- **XSS Prevention**: Detects and rejects malicious patterns

#### Email Validation Rules
- **Length**: Maximum 254 characters (RFC 5321)
- **Local Part**: Maximum 64 characters
- **Format**: Must contain @ symbol and valid domain
- **Domain**: Cannot start or end with dot

#### Phone Validation Rules
- **Length**: 10-15 digits
- **Format**: Digits only (other characters are stripped during sanitization)
- **International**: Supports international phone numbers

#### Text Validation Rules
- **Configurable Length**: Set minimum and maximum length
- **XSS Prevention**: Rejects HTML tags
- **Whitespace**: Trimmed by default
- **Unicode**: Supports international characters

### 4. Using the Validation Hook

The `useFormValidation` hook manages form state with built-in validation.

```typescript
import { useFormValidation } from '../hooks/useFormValidation';

function MyComponent() {
  const {
    getFieldState,
    setFieldValue,
    validateField,
    validateFieldDebounced,
    resetField,
    isFormValid,
  } = useFormValidation();

  const urlField = getFieldState('url');

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue('url', e.target.value);

    // Validate with debounce (300ms delay)
    validateFieldDebounced('url', e.target.value, 'url');
  };

  return (
    <>
      <TextField
        value={urlField.value}
        onChange={handleUrlChange}
        error={Boolean(urlField.error) && urlField.isDirty}
      />
      {/* Field state includes: value, error, isDirty, isTouched */}
    </>
  );
}
```

#### Hook API

**`getFieldState(fieldName)`**
- Returns the current state of a field
- State includes: `value`, `error`, `isDirty`, `isTouched`

**`setFieldValue(fieldName, value)`**
- Updates the field value and marks as dirty
- Triggers re-render with new value

**`validateField(fieldName, value, validationType, options)`**
- Immediately validates the field
- Synchronous validation
- Options: `minLength`, `maxLength`, `fieldName`, `onValidationChange`

**`validateFieldDebounced(fieldName, value, validationType, options)`**
- Validates with debounce delay (default 300ms)
- Prevents excessive validation calls while typing
- Clears previous timeout before setting new one

**`resetField(fieldName)`**
- Clears field value and resets validation state

**`resetAllFields()`**
- Clears all fields and validation state

**`isFormValid()`**
- Returns true if all fields are valid and have content

### 5. Validation Feedback Component

The `ValidationFeedback` component displays real-time validation feedback.

```typescript
import ValidationFeedback from '../components/validation/ValidationFeedback';

function MyForm() {
  const { getFieldState } = useFormValidation();
  const urlField = getFieldState('url');

  return (
    <>
      <TextField value={urlField.value} /* ... */ />
      <ValidationFeedback
        error={urlField.error}
        isValid={!urlField.error}
        isDirty={urlField.isDirty}
        isTouched={urlField.isTouched}
        characterCount={urlField.value.length}
        maxLength={2048}
        showCharacterCount={true}
        label="URL"
      />
    </>
  );
}
```

#### Features
- **Error Display**: Shows error message with error icon (red)
- **Success Display**: Shows success message with checkmark (green)
- **Character Count**: Shows current/max character count with visual progress bar
- **Color Coding**:
  - Green (0-75%): Normal
  - Orange (75-90%): Warning
  - Red (90-100%): Critical
- **Smart Display**: Only shows feedback when field is dirty or touched

### 6. Implementation Examples

#### Example 1: URL Input (AccessibilityAudit)

```typescript
import { useFormValidation } from '../hooks/useFormValidation';
import ValidationFeedback from '../components/validation/ValidationFeedback';

export default function AccessibilityAudit() {
  const { getFieldState, setFieldValue, validateFieldDebounced } = useFormValidation();
  const urlField = getFieldState('url');
  const MAX_URL_LENGTH = 2048;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlField.error) {
      return; // Prevent submission if field has errors
    }
    // Submit form with urlField.value
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Website URL"
          placeholder="https://example.com"
          value={urlField.value}
          onChange={(e) => {
            setFieldValue('url', e.target.value);
            validateFieldDebounced('url', e.target.value, 'url');
          }}
          error={Boolean(urlField.error) && urlField.isDirty}
        />
        <ValidationFeedback
          error={urlField.error}
          isValid={!urlField.error}
          isDirty={urlField.isDirty}
          isTouched={urlField.isTouched}
          characterCount={urlField.value.length}
          maxLength={MAX_URL_LENGTH}
          showCharacterCount={true}
          label="URL"
        />
      </Box>
      <Button
        type="submit"
        disabled={Boolean(urlField.error) || !urlField.value.trim()}
      >
        Start Audit
      </Button>
    </form>
  );
}
```

#### Example 2: Using ValidationProcessor Directly

```typescript
import { ValidationProcessor, Sanitizers } from '../utils/validation';

// Validate a URL
const result = ValidationProcessor.validateURL(userInput);
if (result.isValid) {
  console.log('Valid URL:', result.sanitized);
} else {
  console.log('Error:', result.error?.message);
}

// Sanitize before displaying
const sanitizedEmail = Sanitizers.email(userInput);
```

#### Example 3: Custom Validation Function

```typescript
import { ValidationError } from '../utils/validation';

function validateCustomField(input: string): ValidationError | null {
  const sanitized = input.trim().toLowerCase();

  if (!sanitized) {
    return {
      field: 'custom',
      message: 'This field is required',
      severity: 'error',
    };
  }

  if (sanitized.includes('forbidden')) {
    return {
      field: 'custom',
      message: 'Input contains forbidden words',
      severity: 'error',
    };
  }

  return null;
}
```

## Input Type Reference

### URL Input
- **Sanitization**: Trim, lowercase, remove spaces
- **Validation**: Format check, length (3-2048), reserved domain check
- **Use Case**: Website URLs for audits
- **Example**: `example.com` → `https://example.com`

### Email Input
- **Sanitization**: Trim, lowercase
- **Validation**: Format check, length limits, domain validation
- **Use Case**: Contact information
- **Example**: `USER@EXAMPLE.COM` → `user@example.com`

### Phone Input
- **Sanitization**: Remove non-digits
- **Validation**: Length (10-15 digits)
- **Use Case**: Contact phone numbers
- **Example**: `(555) 123-4567` → `5551234567`

### Text Input
- **Sanitization**: Trim, optional lowercase, max length
- **Validation**: Custom length, XSS prevention
- **Use Case**: Descriptions, titles, names
- **Example**: `  Hello World  ` → `Hello World`

### Alphanumeric Input
- **Sanitization**: Remove special characters
- **Validation**: Custom length, format
- **Use Case**: IDs, codes, handles
- **Example**: `Hello@World#123` → `HelloWorld123`

## Error Messages Reference

### URL Errors
- `URL cannot be empty` - No input provided
- `URL is too long (maximum 2048 characters)` - Exceeds max length
- `URL is too short` - Less than 3 characters
- `Please enter a valid URL` - Invalid format
- `URL contains invalid patterns` - Double dots or slashes
- `Cannot audit reserved or local addresses` - Local/reserved domain

### Email Errors
- `Email cannot be empty` - No input provided
- `Email is too long` - Exceeds 254 characters
- `Please enter a valid email address` - Invalid format
- `Email local part is too long` - Part before @ exceeds 64 chars
- `Invalid email domain format` - Domain starts/ends with dot

### Phone Errors
- `Phone number cannot be empty` - No input provided
- `Phone number is too short` - Less than 10 digits
- `Phone number is too long` - More than 15 digits

### Text Errors
- `Text must be at least X characters` - Below minimum
- `Text cannot exceed X characters` - Above maximum
- `HTML tags are not allowed` - Contains HTML

## Best Practices

1. **Always Sanitize First**: Sanitize input before validation
2. **Use Debouncing**: Use `validateFieldDebounced` for real-time validation while typing
3. **Show Feedback**: Always display validation feedback to users
4. **Disable on Error**: Disable submit buttons when validation errors exist
5. **Handle Edge Cases**: Check for empty strings, null, and undefined
6. **Protect Against XSS**: Use provided sanitizers to prevent injection attacks
7. **Consistent UI**: Use ValidationFeedback component for consistent error display
8. **Clear Messages**: Provide specific, actionable error messages
9. **Progressive Enhancement**: Show success feedback for valid inputs
10. **Accessibility**: Ensure error messages are associated with form fields

## Adding Validation to New Fields

To add validation to a new input field:

1. **Import the hook and component**:
```typescript
import { useFormValidation } from '../hooks/useFormValidation';
import ValidationFeedback from '../components/validation/ValidationFeedback';
```

2. **Get field state**:
```typescript
const myField = getFieldState('myFieldName');
```

3. **Handle changes and validation**:
```typescript
onChange={(e) => {
  setFieldValue('myFieldName', e.target.value);
  validateFieldDebounced('myFieldName', e.target.value, 'email');
}}
```

4. **Add validation feedback**:
```typescript
<ValidationFeedback
  error={myField.error}
  isValid={!myField.error}
  isDirty={myField.isDirty}
  isTouched={myField.isTouched}
  label="Field Name"
/>
```

5. **Disable submit if invalid**:
```typescript
<Button
  type="submit"
  disabled={Boolean(myField.error) || !myField.value.trim()}
>
  Submit
</Button>
```

## Testing Validation

### Example Test Inputs

**URL Field**:
- Valid: `example.com`, `https://example.com/path`, `sub.example.com`
- Invalid: `invalid url`, `http://`, `localhost`, `../../../etc/passwd`

**Email Field**:
- Valid: `user@example.com`, `name.surname@example.co.uk`
- Invalid: `invalid@`, `@example.com`, `user@.com`

**Phone Field**:
- Valid: `5551234567`, `(555) 123-4567`, `+1-555-123-4567`
- Invalid: `123`, `CALL-ME-NOW`

## Performance Considerations

1. **Debouncing**: Validation is debounced at 300ms intervals to avoid excessive re-renders
2. **Memoization**: Hook uses `useCallback` to prevent unnecessary re-renders
3. **Lazy Validation**: Validation only triggers on user input, not on mount
4. **Optimized Regex**: Patterns are compiled inline for performance

## Security Considerations

1. **XSS Prevention**: Text sanitizers remove HTML tags
2. **URL Validation**: Prevents reserved and local addresses
3. **Email Validation**: Follows RFC 5321 standards
4. **Input Normalization**: Consistent handling of special characters
5. **Client-Side Only**: Server-side validation should still be implemented

## Future Enhancements

Potential improvements to the validation system:

1. **Async Validation**: Add server-side validation (e.g., email verification)
2. **Custom Rules**: Allow field-specific custom validation rules
3. **Multi-field Validation**: Cross-field validation logic
4. **Conditional Validation**: Show/hide fields based on values
5. **Localization**: Support multiple languages for error messages
6. **Pattern Library**: Predefined patterns for common fields
7. **Performance Metrics**: Track validation performance

## Questions & Support

For questions about the validation system, refer to:
- `src/utils/validation.ts` - Core validation logic
- `src/hooks/useFormValidation.ts` - Hook implementation
- `src/components/validation/ValidationFeedback.tsx` - UI component
- `src/pages/AccessibilityAudit.tsx` - Usage example
