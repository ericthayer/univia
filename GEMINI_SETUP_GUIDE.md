# Gemini AI Document Analysis Setup Guide

This guide explains how to set up and test the Gemini AI integration for intelligent document analysis.

## Overview

The document analyzer uses Google's Gemini AI to extract structured information from legal documents and images. It provides:

- **OCR capabilities** for image documents (PNG, JPG, WebP)
- **Intelligent text extraction** from legal demand letters
- **Structured data extraction**: plaintiff names, attorney details, deadlines, settlement amounts, WCAG violations
- **Confidence scores** for each extracted field
- **Automatic fallback** to regex-based analysis if Gemini is unavailable

## Current Limitations

### PDF Support
PDFs are **not currently supported** due to API limitations. To analyze a PDF document:
1. Convert it to an image format (PNG or JPG)
2. Take a screenshot of the PDF
3. Use a PDF-to-image converter tool

### Image Support
Images **require Gemini API** to be configured. Without Gemini, image analysis will fail with a clear error message.

## Setup Instructions

### Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy the API key

### Step 2: Configure the API Key in Supabase

You need to add the `GEMINI_API_KEY` environment variable to your Supabase project:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - Name: `GEMINI_API_KEY`
   - Value: (paste your API key from Step 1)
5. Click "Save"

**Important**: Environment variables are automatically available to edge functions. You don't need to manually configure them in the function code.

## Testing the Integration

### Using the Test Page

1. Navigate to `/admin/test-analysis` in your application
2. Open browser DevTools (F12) and go to the Console tab
3. Upload a test image (PNG or JPG)
4. Click "Run Test"
5. Watch the console output and review the debug information

### What to Look For

The debug information panel will show:

- **Analysis Method**: Should be `gemini-vision` for images or `gemini-text` for text
- **AI Model**: Should be `gemini-1.5-flash` when Gemini is working
- **Gemini API Key**: Should show "Configured" if the key is set correctly
- **File Type**: Confirms the type of file being analyzed

### Console Logs

Watch for these log messages:

**Success:**
```
[DEBUG] Processing test.jpg (image/jpeg)
[DEBUG] Gemini API Key configured: Yes
[DEBUG] Attempting Gemini analysis for image...
[DEBUG] Gemini raw response length: 1234
[SUCCESS] Parsed Gemini response successfully
[SUCCESS] Gemini analysis completed
```

**API Key Not Configured:**
```
[DEBUG] Gemini API Key configured: No
[ERROR] No Gemini API key configured - cannot analyze images
```

**API Error:**
```
[ERROR] Gemini API error: 400
[ERROR] Response: {"error": {"message": "API key not valid..."}}
```

## Troubleshooting

### Error: "Image analysis requires AI configuration"

**Cause**: The `GEMINI_API_KEY` environment variable is not set in Supabase.

**Solution**: Follow Step 2 above to configure the API key in your Supabase project settings.

### Error: "Image analysis failed. Gemini API may be having issues"

**Possible causes**:
1. Invalid API key
2. API quota exceeded
3. Gemini API service issue
4. Image file is too large or corrupted

**Solutions**:
- Verify your API key is correct
- Check your [Google AI Studio quota](https://makersuite.google.com/app/apikey)
- Try a different, smaller image
- Check console logs for specific error messages

### Error: "PDF analysis is currently limited"

**Cause**: You're trying to upload a PDF file.

**Solution**: Convert the PDF to an image format first. You can:
- Take a screenshot of the PDF
- Use an online PDF-to-image converter
- Use a tool like Adobe Acrobat or Preview (Mac) to export as image

### Images Return Regex Results Instead of Gemini

**Cause**: Gemini API key is not properly configured or is invalid.

**Solution**:
1. Verify the key is correctly set in Supabase
2. Check that there are no extra spaces or characters
3. Confirm the key is active in Google AI Studio
4. Try regenerating the API key

## API Costs

Gemini API pricing (as of 2024):

- **Free tier**: 15 requests per minute, 1500 requests per day
- **Rate limits**: Sufficient for testing and moderate production use
- **Paid tiers**: Available for higher volume

Monitor your usage at [Google AI Studio](https://makersuite.google.com/app/apikey).

## Feature Capabilities

### What Gemini Extracts

For legal demand letters:
- Document type (Legal Demand Letter, Notice, etc.)
- Plaintiff/claimant name
- Attorney name and law firm
- Response deadlines
- Settlement amounts
- WCAG/ADA violations cited
- Urgency level
- Key findings and recommended actions

### Confidence Scores

Each extracted field includes a confidence score (0.0-1.0) indicating:
- **0.9-1.0**: Very confident
- **0.7-0.9**: Confident
- **0.5-0.7**: Moderately confident
- **<0.5**: Low confidence, manual review recommended

### Extracted Entities

Additional entities extracted from documents:
- Person names
- Organization names
- Dates mentioned
- Monetary amounts

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify your Gemini API key is active and has quota remaining
3. Test with the `/admin/test-analysis` page to get detailed debug information
4. Check Supabase function logs for server-side errors

## Next Steps

Once Gemini is working:

1. Test with various document types
2. Review confidence scores and adjust your workflows accordingly
3. Consider implementing user feedback mechanisms to improve accuracy
4. Monitor API usage and upgrade if needed
