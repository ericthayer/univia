# Gemini AI Document Analysis Setup Guide

This guide explains how to set up and test the Gemini AI integration for intelligent document analysis.

## Overview

The document analyzer uses Google's Gemini AI to extract structured information from legal documents, PDFs, and images. It provides:

- **Multi-format support**: PDF, image (PNG, JPG, WebP), and text documents
- **Advanced PDF handling**: Text extraction for text-based PDFs, vision analysis for image-based/scanned PDFs
- **Intelligent text extraction** from legal demand letters
- **Structured data extraction**: plaintiff names, attorney details, deadlines, settlement amounts, WCAG violations, legal analysis
- **Confidence scores** for each extracted field
- **Model selection**: Choose between Gemini 2.5 Flash (fast) or Gemini 2.5 Pro (detailed)
- **Analysis depth**: Standard or detailed analysis modes
- **Automatic fallback** to regex-based analysis if Gemini is unavailable

## Current Capabilities

### PDF Support
PDFs are **fully supported** with intelligent handling:
- **Text-based PDFs**: Automatic text extraction and analysis
- **Image-based/Scanned PDFs**: Direct vision analysis via Gemini API
- **Hybrid approach**: Falls back to regex analysis if text extraction is successful but Gemini is unavailable

### Image Support
Images (PNG, JPG, WebP) are **fully supported** via Gemini's vision capabilities:
- **Requires Gemini API** to be configured
- Without Gemini API, image analysis will return a clear error message
- Supports OCR and intelligent content extraction from scanned documents

### Model Selection
Two Gemini models available:
- **gemini-2.5-flash** (default): Faster, cost-effective for standard analysis
- **gemini-2.5-pro**: More detailed analysis with enhanced accuracy

### Analysis Modes
- **Standard**: Quick extraction of key information
- **Detailed**: Comprehensive legal analysis including risk assessment, potential defenses, and credibility markers

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

- **Analysis Method**: 
  - `gemini-vision` for images
  - `gemini-text` for text documents
  - `regex-pdf` for PDFs analyzed without Gemini
  - `regex` for fallback text analysis
- **AI Model**: 
  - `gemini-2.5-flash` (default, faster)
  - `gemini-2.5-pro` (more detailed analysis)
- **Has Gemini Key**: Shows `true` if API key is configured
- **File Type**: Confirms the MIME type being analyzed
- **Model Preference**: Shows selected model (flash or pro)
- **Analysis Depth**: Shows analysis mode (standard or detailed)

### Console Logs

Watch for these log messages:

**Success (Image):**
```
[DEBUG] Processing test.jpg (image/jpeg)
[GEMINI] Using model: gemini-2.5-flash
[GEMINI] Analysis depth: standard
[GEMINI] Analyzing image with vision model
[DEBUG] Gemini raw response length: 1234
[SUCCESS] Parsed Gemini response successfully
[SUCCESS] Gemini vision analysis completed
```

**Success (PDF with text extraction):**
```
[PDF] Extracted 1523 characters from PDF
[GEMINI] Using model: gemini-2.5-flash
[GEMINI] Analyzing PDF with 1523 characters of extracted text
[SUCCESS] Gemini text analysis completed
```

**API Key Not Configured:**
```
[GEMINI] API key not configured, falling back to regex analysis
[INFO] Using regex analysis (Gemini not available)
```

**Image without API Key:**
```
[ERROR] No Gemini API key configured - cannot analyze images
Response: {"error": "Image analysis requires AI configuration..."}
```

**API Error:**
```
[ERROR] Gemini API call failed: <error details>
[ERROR] Error message: <specific message>
```

## Troubleshooting

### Error: "Image analysis requires AI configuration"

**Cause**: The `GEMINI_API_KEY` environment variable is not set in Supabase.

**Solution**: Follow Step 2 above to configure the API key in your Supabase project settings.

### Error: "Analysis failed" or Gemini API errors

**Possible causes**:
1. Invalid API key
2. API quota exceeded
3. Gemini API service issue
4. File is too large (>20MB)
5. Unsupported file format

**Solutions**:
- Verify your API key is correct in Supabase Edge Function secrets
- Check your [Google AI Studio quota](https://makersuite.google.com/app/apikey)
- Try a smaller file or compress the image/PDF
- Check console logs for specific error messages
- Verify file format is supported (PDF, PNG, JPG, WebP, TXT)

### PDFs Return Regex Results Instead of Gemini

**Cause**: Either Gemini API key is not configured, or the PDF text extraction was successful and Gemini fallback occurred.

**Solution**:
1. Check console logs - if you see `[GEMINI]` logs, Gemini is working
2. If you see `[INFO] Using regex analysis`, verify API key is set
3. Text-based PDFs may successfully extract text and use regex as fallback if Gemini fails
4. For image-based PDFs, Gemini is required - ensure API key is configured

### Images Return Error Instead of Processing

**Cause**: Gemini API key is not configured (images require AI processing).

**Solution**:
1. Verify `GEMINI_API_KEY` is set in Supabase Edge Functions secrets
2. Check that there are no extra spaces or characters in the key
3. Confirm the key is active in Google AI Studio
4. Try regenerating the API key if needed

## API Costs

Gemini API pricing (as of 2024):

- **Free tier**: 15 requests per minute, 1500 requests per day
- **Rate limits**: Sufficient for testing and moderate production use
- **Paid tiers**: Available for higher volume

Monitor your usage at [Google AI Studio](https://makersuite.google.com/app/apikey).

## Feature Capabilities

### What Gemini Extracts

For legal demand letters and documents:
- **Core Information**:
  - Document type (Legal Demand Letter, Complaint, Settlement Offer, etc.)
  - Document summary (3-4 sentence overview)
  - Plaintiff/claimant name
  - Attorney name and law firm
  - Case number and court name (if applicable)
  - Filing date
  
- **Critical Dates & Amounts**:
  - Response deadlines (auto-calculated if "within X days")
  - Settlement/damages amounts
  
- **Legal Details**:
  - WCAG/ADA/Section 508 violations cited
  - Urgency level (critical/high/medium/low)
  - Key findings (4-8 specific points)
  - Recommended actions (4-6 prioritized items)
  
- **Advanced Legal Analysis** (detailed mode):
  - Claim type classification
  - Jurisdiction information
  - Statute of limitations
  - Potential legal defenses
  - Risk assessment with reasoning

### Confidence Scores

Each extracted field includes a confidence score (0.0-1.0) indicating:
- **0.9-1.0**: Very confident (clear, explicit information)
- **0.7-0.9**: Confident (reasonable inference)
- **0.5-0.7**: Moderately confident (ambiguous or partial info)
- **<0.5**: Low confidence, manual review recommended

### Extracted Entities

Additional entities automatically extracted:
- **Persons**: All individual names found
- **Organizations**: Companies, law firms, courts
- **Dates**: All dates mentioned in original format
- **Amounts**: All monetary values cited
- **Legal Citations**: Statutes, regulations, case references (42 USC, WCAG, ADA Title III, etc.)

### Model Comparison

| Feature | Gemini 2.5 Flash | Gemini 2.5 Pro |
|---------|------------------|----------------|
| Speed | Fast (~2-3s) | Slower (~5-8s) |
| Accuracy | High | Very High |
| Cost | Lower | Higher |
| Best For | Standard analysis, high volume | Detailed analysis, complex documents |
| Token Limit | 1M tokens | 2M tokens |

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
