import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalysisRequest {
  fileContent: string;
  fileName: string;
  fileType: string;
  business_id?: string;
  user_id?: string | null;
  modelPreference?: 'flash' | 'pro';
  analysisDepth?: 'standard' | 'detailed';
}

interface DocumentAnalysis {
  documentSummary: string;
  documentType: string;
  keyPoints: string[];
  recommendedActions: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  additionalResources: string[];
  extractedData: {
    plaintiffName?: string;
    attorneyName?: string;
    attorneyFirm?: string;
    responseDeadline?: string;
    settlementAmount?: number;
    violationsCited?: string[];
    caseNumber?: string;
    courtName?: string;
    filingDate?: string;
  };
  confidenceScores?: Record<string, number>;
  extractedEntities?: {
    persons: string[];
    organizations: string[];
    dates: string[];
    amounts: string[];
    legalCitations: string[];
  };
  legalAnalysis?: {
    claimType: string;
    jurisdiction?: string;
    statuteOfLimitations?: string;
    potentialDefenses: string[];
    riskAssessment: string;
  };
}

const GEMINI_MODELS = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
} as const;

function buildAnalysisPrompt(documentType: string, analysisDepth: 'standard' | 'detailed'): string {
  const basePrompt = `You are an expert legal document analyzer specializing in ADA compliance, accessibility law, and demand letter analysis. Your role is to provide accurate, actionable insights for legal professionals and business owners.

ANALYSIS INSTRUCTIONS:
1. Carefully read and analyze every part of the document
2. Extract ALL relevant information with high precision
3. Identify legal implications and time-sensitive matters
4. Provide confidence scores based on clarity of information in the document
5. Focus on accessibility-related legal matters (ADA, WCAG, Section 508)

OUTPUT FORMAT - Return ONLY valid JSON with this exact structure:
{
  "documentType": "string (Legal Demand Letter, Settlement Offer, Court Filing, Cease and Desist, Legal Notice, Complaint, etc.)",
  "documentSummary": "string (comprehensive 3-4 sentence overview including key parties, claims, and required actions)",
  "plaintiffName": "string or null (full legal name of plaintiff/claimant)",
  "attorneyName": "string or null (full name of representing attorney)",
  "attorneyFirm": "string or null (complete law firm name)",
  "caseNumber": "string or null (case/matter number if referenced)",
  "courtName": "string or null (court name if litigation is filed)",
  "filingDate": "string or null (date document was filed/sent in YYYY-MM-DD format)",
  "responseDeadline": "string or null (response deadline in YYYY-MM-DD format, calculate from document date if given as 'within X days')",
  "settlementAmount": "number or null (settlement/damages amount as integer, no currency symbols)",
  "violationsCited": ["array of specific violations cited (WCAG 2.1 AA, ADA Title III, Section 508, etc.)"],
  "urgencyLevel": "critical|high|medium|low (based on deadline proximity and claim severity)",
  "keyPoints": ["array of 4-8 most important findings, be specific"],
  "recommendedActions": ["array of 4-6 prioritized, specific action items with timeframes"],
  "additionalResources": ["array of relevant resources (ADA.gov, W3C WCAG, legal aid, etc.)"],
  "confidenceScores": {
    "plaintiffName": 0.0-1.0,
    "attorneyName": 0.0-1.0,
    "attorneyFirm": 0.0-1.0,
    "responseDeadline": 0.0-1.0,
    "settlementAmount": 0.0-1.0,
    "documentType": 0.0-1.0
  },
  "extractedEntities": {
    "persons": ["all person names found"],
    "organizations": ["all organization/company names"],
    "dates": ["all dates mentioned in original format"],
    "amounts": ["all monetary amounts mentioned"],
    "legalCitations": ["all legal citations, statutes, and case references"]
  },
  "legalAnalysis": {
    "claimType": "string (ADA Website Accessibility, Physical Accessibility, Employment ADA, etc.)",
    "jurisdiction": "string or null (federal/state court, specific district)",
    "statuteOfLimitations": "string or null (relevant limitations period if applicable)",
    "potentialDefenses": ["array of potential legal defenses to consider"],
    "riskAssessment": "string (1-2 sentence assessment of legal risk level and reasoning)"
  }
}`;

  const detailedAddition = analysisDepth === 'detailed' ? `

DETAILED ANALYSIS REQUIREMENTS:
- Analyze legal language for potential ambiguities or weaknesses
- Identify all specific WCAG success criteria mentioned or implied
- Note any procedural defects in the demand
- Assess credibility markers in the document
- Flag any unusual or aggressive language patterns
- Compare demands against typical settlement ranges
- Identify serial litigant indicators if present` : '';

  return basePrompt + detailedAddition;
}

async function extractTextFromPDF(base64Content: string): Promise<string> {
  try {
    const binaryContent = atob(base64Content);
    const bytes = new Uint8Array(binaryContent.length);
    for (let i = 0; i < binaryContent.length; i++) {
      bytes[i] = binaryContent.charCodeAt(i);
    }

    let extractedText = '';
    const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    const streamMatches = pdfString.matchAll(/stream\s*([\s\S]*?)\s*endstream/gi);
    for (const match of streamMatches) {
      const streamContent = match[1];
      const textMatches = streamContent.matchAll(/\(([^)]+)\)/g);
      for (const textMatch of textMatches) {
        const text = textMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        extractedText += text + ' ';
      }
    }

    const tjMatches = pdfString.matchAll(/\[(.*?)\]\s*TJ/gi);
    for (const match of tjMatches) {
      const content = match[1];
      const textParts = content.matchAll(/\(([^)]*)\)/g);
      for (const part of textParts) {
        extractedText += part[1];
      }
      extractedText += ' ';
    }

    extractedText = extractedText
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (extractedText.length < 100) {
      console.log('[PDF] Minimal text extracted, PDF may be image-based or encrypted');
      return '';
    }

    console.log(`[PDF] Extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  } catch (error) {
    console.error('[PDF] Error extracting text from PDF:', error);
    return '';
  }
}

async function analyzeWithGemini(
  content: string,
  fileType: string,
  fileName: string,
  modelPreference: 'flash' | 'pro' = 'flash',
  analysisDepth: 'standard' | 'detailed' = 'standard'
): Promise<DocumentAnalysis | null> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    console.log('[GEMINI] API key not configured, falling back to regex analysis');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const selectedModel = GEMINI_MODELS[modelPreference];
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });

    const prompt = buildAnalysisPrompt(fileType, analysisDepth);
    console.log(`[GEMINI] Using model: ${selectedModel}`);
    console.log(`[GEMINI] Analysis depth: ${analysisDepth}`);

    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    let result;

    if (isImage) {
      console.log('[GEMINI] Analyzing image with vision model');
      result = await model.generateContent([
        prompt + '\n\nAnalyze the document shown in this image:',
        {
          inlineData: {
            mimeType: fileType,
            data: content
          }
        }
      ]);
    } else if (isPDF) {
      const extractedText = await extractTextFromPDF(content);

      if (extractedText.length > 100) {
        console.log(`[GEMINI] Analyzing PDF with ${extractedText.length} characters of extracted text`);
        result = await model.generateContent(
          `${prompt}\n\nDocument: ${fileName}\nExtracted Text Content:\n${extractedText.substring(0, 50000)}`
        );
      } else {
        console.log('[GEMINI] Sending PDF directly to Gemini for vision analysis');
        result = await model.generateContent([
          prompt + '\n\nAnalyze this PDF document:',
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: content
            }
          }
        ]);
      }
    } else {
      const textContent = extractTextFromContent(content);
      console.log('[GEMINI] Analyzing text document');
      result = await model.generateContent(
        `${prompt}\n\nDocument: ${fileName}\nContent:\n${textContent.substring(0, 50000)}`
      );
    }

    const response = await result.response;
    const generatedText = response.text();

    console.log('[DEBUG] Gemini raw response length:', generatedText.length);

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ERROR] Could not extract JSON from Gemini response');
      console.error('[ERROR] Response text:', generatedText.substring(0, 500));
      return null;
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    console.log('[SUCCESS] Parsed Gemini response successfully');

    return {
      documentSummary: parsedData.documentSummary || 'Document analyzed successfully',
      documentType: parsedData.documentType || 'General Document',
      keyPoints: parsedData.keyPoints || [],
      recommendedActions: parsedData.recommendedActions || ['Review document contents carefully', 'Determine if any action is required'],
      urgencyLevel: parsedData.urgencyLevel || 'medium',
      additionalResources: parsedData.additionalResources || ['Help Center', 'Professional Resources Directory'],
      extractedData: {
        plaintiffName: parsedData.plaintiffName || undefined,
        attorneyName: parsedData.attorneyName || undefined,
        attorneyFirm: parsedData.attorneyFirm || undefined,
        responseDeadline: parsedData.responseDeadline || undefined,
        settlementAmount: parsedData.settlementAmount || undefined,
        violationsCited: parsedData.violationsCited?.length > 0 ? parsedData.violationsCited : undefined,
        caseNumber: parsedData.caseNumber || undefined,
        courtName: parsedData.courtName || undefined,
        filingDate: parsedData.filingDate || undefined,
      },
      confidenceScores: parsedData.confidenceScores || {},
      extractedEntities: {
        persons: parsedData.extractedEntities?.persons || [],
        organizations: parsedData.extractedEntities?.organizations || [],
        dates: parsedData.extractedEntities?.dates || [],
        amounts: parsedData.extractedEntities?.amounts || [],
        legalCitations: parsedData.extractedEntities?.legalCitations || [],
      },
      legalAnalysis: parsedData.legalAnalysis ? {
        claimType: parsedData.legalAnalysis.claimType || 'Unknown',
        jurisdiction: parsedData.legalAnalysis.jurisdiction,
        statuteOfLimitations: parsedData.legalAnalysis.statuteOfLimitations,
        potentialDefenses: parsedData.legalAnalysis.potentialDefenses || [],
        riskAssessment: parsedData.legalAnalysis.riskAssessment || 'Risk assessment not available',
      } : undefined,
    };
  } catch (error) {
    console.error('[ERROR] Gemini API call failed:', error);
    if (error instanceof Error) {
      console.error('[ERROR] Error message:', error.message);
      console.error('[ERROR] Error stack:', error.stack);
    }
    return null;
  }
}

function extractTextFromContent(content: string): string {
  try {
    const decoded = atob(content);
    const textContent = decoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textContent;
  } catch {
    return content;
  }
}

function calculateConfidence(pattern: RegExp, text: string, matchFound: boolean): number {
  if (!matchFound) return 0;

  const contextWords = text.toLowerCase().split(/\s+/);
  const patternStr = pattern.source.toLowerCase();

  let confidence = 0.7;

  if (patternStr.includes('plaintiff') || patternStr.includes('attorney')) {
    const relevantContext = contextWords.some(word =>
      ['plaintiff', 'attorney', 'counsel', 'esq', 'firm'].includes(word)
    );
    if (relevantContext) confidence += 0.2;
  }

  if (patternStr.includes('\\d')) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

function extractEntities(text: string): {
  persons: string[];
  organizations: string[];
  dates: string[];
  amounts: string[];
  legalCitations: string[];
} {
  const entities = {
    persons: [] as string[],
    organizations: [] as string[],
    dates: [] as string[],
    amounts: [] as string[],
    legalCitations: [] as string[],
  };

  const personPatterns = [
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g,
  ];

  const orgPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Law|Legal|LLP|LLC|P\.?C\.?|PLLC|Inc\.|Corp\.|Corporation))\b/g,
  ];

  const datePatterns = [
    /\b([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/g,
    /\b(\d{1,2}[\\/\-]\d{1,2}[\\/\-]\d{2,4})\b/g,
  ];

  const amountPatterns = [
    /\$\s?([\d,]+(?:\.\d{2})?)/g,
  ];

  const legalCitationPatterns = [
    /\b(42\s*U\.?S\.?C\.?\s*[^\s,;]+)/gi,
    /\b(28\s*C\.?F\.?R\.?\s*[^\s,;]+)/gi,
    /\b(WCAG\s*[\d.]+\s*[A-Z]*)/gi,
    /\b(Section\s*508)/gi,
    /\b(ADA\s*Title\s*(?:I{1,3}|\d+))/gi,
  ];

  personPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const person = match[1];
      if (!entities.persons.includes(person) && person.split(' ').length <= 3) {
        entities.persons.push(person);
      }
    });
  });

  orgPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const org = match[1];
      if (!entities.organizations.includes(org)) {
        entities.organizations.push(org);
      }
    });
  });

  datePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const date = match[1];
      if (!entities.dates.includes(date)) {
        entities.dates.push(date);
      }
    });
  });

  amountPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const amount = match[1];
      if (!entities.amounts.includes(amount)) {
        entities.amounts.push(amount);
      }
    });
  });

  legalCitationPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      const citation = match[1];
      if (!entities.legalCitations.includes(citation)) {
        entities.legalCitations.push(citation);
      }
    });
  });

  return entities;
}

function analyzeDocumentWithRegex(text: string, fileName: string): DocumentAnalysis {
  const lowerText = text.toLowerCase();
  const confidenceScores: Record<string, number> = {};
  const extractedEntities = extractEntities(text);

  const isLegalDocument = lowerText.includes('attorney') ||
    lowerText.includes('law firm') ||
    lowerText.includes('plaintiff') ||
    lowerText.includes('defendant') ||
    lowerText.includes('demand') ||
    lowerText.includes('settlement') ||
    lowerText.includes('compliance') ||
    lowerText.includes('ada') ||
    lowerText.includes('americans with disabilities');

  const isMedicalDocument = lowerText.includes('patient') ||
    lowerText.includes('diagnosis') ||
    lowerText.includes('prescription') ||
    lowerText.includes('medical');

  const isFinancialDocument = lowerText.includes('invoice') ||
    lowerText.includes('balance due') ||
    lowerText.includes('payment') ||
    lowerText.includes('account');

  let documentType = 'General Document';
  if (isLegalDocument) {
    if (lowerText.includes('demand')) {
      documentType = 'Legal Demand Letter';
    } else if (lowerText.includes('complaint')) {
      documentType = 'Legal Complaint';
    } else if (lowerText.includes('settlement')) {
      documentType = 'Settlement Agreement';
    } else {
      documentType = 'Legal Notice';
    }
  } else if (isMedicalDocument) {
    documentType = 'Medical Document';
  } else if (isFinancialDocument) {
    documentType = 'Financial Document';
  }

  const namePatterns = [
    /plaintiff[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /on behalf of[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /claimant[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  ];

  let plaintiffName: string | undefined;
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      plaintiffName = match[1];
      confidenceScores.plaintiffName = calculateConfidence(pattern, text, true);
      break;
    }
  }

  const attorneyPatterns = [
    /attorney[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /counsel[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /esq\.?[,\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
  ];

  let attorneyName: string | undefined;
  for (const pattern of attorneyPatterns) {
    const match = text.match(pattern);
    if (match) {
      attorneyName = match[1];
      confidenceScores.attorneyName = calculateConfidence(pattern, text, true);
      break;
    }
  }

  const firmPatterns = [
    /([A-Z][a-z]+(?:\s+&\s+[A-Z][a-z]+|\s+[A-Z][a-z]+)*\s+(?:Law|Legal|LLP|LLC|P\.?C\.?|PLLC))/,
    /law\s+firm[:\s]+([A-Za-z\s&,]+)/i,
  ];

  let attorneyFirm: string | undefined;
  for (const pattern of firmPatterns) {
    const match = text.match(pattern);
    if (match) {
      attorneyFirm = match[1].trim();
      confidenceScores.attorneyFirm = calculateConfidence(pattern, text, true);
      break;
    }
  }

  const datePatterns = [
    /respond\s+(?:by|before|within)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /deadline[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2})[\\/\-](\d{1,2})[\\/\-](\d{2,4})/,
    /within\s+(\d+)\s+days/i,
  ];

  let responseDeadline: string | undefined;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2] && match[3]) {
        const year = match[3].length === 2 ? '20' + match[3] : match[3];
        responseDeadline = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      } else if (match[1].includes('days')) {
        const days = parseInt(match[1]);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + days);
        responseDeadline = deadline.toISOString().split('T')[0];
      } else {
        responseDeadline = match[1];
      }
      confidenceScores.responseDeadline = calculateConfidence(pattern, text, true);
      break;
    }
  }

  const amountPatterns = [
    /\$([\d,]+(?:\.\d{2})?)/,
    /settlement[:\s]+(?:of\s+)?\$?([\d,]+)/i,
    /damages[:\s]+(?:of\s+)?\$?([\d,]+)/i,
  ];

  let settlementAmount: number | undefined;
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      settlementAmount = parseFloat(match[1].replace(/,/g, ''));
      confidenceScores.settlementAmount = calculateConfidence(pattern, text, true);
      break;
    }
  }

  const violationsCited: string[] = [];
  const wcagPatterns = [
    /WCAG\s*([\d.]+)/gi,
    /Section\s*508/gi,
    /ADA\s*Title\s*(I{1,3}|\d+)/gi,
    /(alt\s+text|color\s+contrast|keyboard\s+navigation|screen\s+reader)/gi,
  ];

  for (const pattern of wcagPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      violationsCited.push(...matches.map(m => m.trim()));
    }
  }

  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (responseDeadline) {
    const deadline = new Date(responseDeadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 7) urgencyLevel = 'critical';
    else if (daysUntil <= 14) urgencyLevel = 'high';
    else if (daysUntil <= 30) urgencyLevel = 'medium';
    else urgencyLevel = 'low';
  } else if (settlementAmount && settlementAmount > 10000) {
    urgencyLevel = 'high';
  } else if (isLegalDocument) {
    urgencyLevel = 'medium';
  } else {
    urgencyLevel = 'low';
  }

  const keyPoints: string[] = [];
  if (documentType !== 'General Document') {
    keyPoints.push(`Document Type: ${documentType}`);
  }
  if (plaintiffName) {
    keyPoints.push(`Plaintiff/Claimant: ${plaintiffName}`);
  }
  if (attorneyName || attorneyFirm) {
    keyPoints.push(`Legal Representation: ${attorneyName || ''} ${attorneyFirm ? `(${attorneyFirm})` : ''}`.trim());
  }
  if (responseDeadline) {
    keyPoints.push(`Response Deadline: ${responseDeadline}`);
  }
  if (settlementAmount) {
    keyPoints.push(`Settlement/Damages Amount: $${settlementAmount.toLocaleString()}`);
  }
  if (violationsCited.length > 0) {
    keyPoints.push(`Violations Cited: ${[...new Set(violationsCited)].join(', ')}`);
  }

  if (keyPoints.length === 0) {
    keyPoints.push('Document uploaded successfully');
    keyPoints.push('Manual review recommended for detailed analysis');
  }

  const recommendedActions: string[] = [];
  if (isLegalDocument) {
    recommendedActions.push('Consult with an ADA compliance attorney immediately');
    if (responseDeadline) {
      recommendedActions.push(`Calendar the response deadline: ${responseDeadline}`);
    }
    recommendedActions.push('Gather documentation of your website accessibility efforts');
    recommendedActions.push('Run an accessibility audit on your website');
    if (settlementAmount) {
      recommendedActions.push('Review your insurance coverage for ADA claims');
    }
  } else if (isMedicalDocument) {
    recommendedActions.push('File document with relevant medical records');
    recommendedActions.push('Follow up with healthcare provider if needed');
  } else if (isFinancialDocument) {
    recommendedActions.push('Review payment terms and deadlines');
    recommendedActions.push('Verify accuracy of charges');
  } else {
    recommendedActions.push('Review document contents carefully');
    recommendedActions.push('Determine if any action is required');
  }

  const additionalResources: string[] = [];
  if (isLegalDocument) {
    additionalResources.push('ADA Compliance Attorneys in your area');
    additionalResources.push('Web Accessibility Guidelines (WCAG 2.1)');
    additionalResources.push('ADA Title III Technical Assistance');
    additionalResources.push('Professional Accessibility Auditors');
  } else {
    additionalResources.push('Help Center');
    additionalResources.push('Professional Resources Directory');
  }

  let documentSummary = '';
  if (isLegalDocument) {
    documentSummary = `This appears to be a ${documentType.toLowerCase()} `;
    if (plaintiffName) {
      documentSummary += `from ${plaintiffName} `;
    }
    if (attorneyFirm || attorneyName) {
      documentSummary += `represented by ${attorneyName || attorneyFirm} `;
    }
    documentSummary += 'regarding potential ADA accessibility violations. ';
    if (settlementAmount) {
      documentSummary += `The document references a potential settlement amount of $${settlementAmount.toLocaleString()}. `;
    }
    if (responseDeadline) {
      documentSummary += `A response is requested by ${responseDeadline}. `;
    }
    documentSummary += 'Immediate legal consultation is recommended.';
  } else {
    documentSummary = `This document (${fileName}) has been uploaded for analysis. `;
    documentSummary += `It appears to be a ${documentType.toLowerCase()}. `;
    documentSummary += 'Please review the extracted information and take appropriate action.';
  }

  return {
    documentSummary: documentSummary.trim(),
    documentType,
    keyPoints,
    recommendedActions,
    urgencyLevel,
    additionalResources,
    extractedData: {
      plaintiffName,
      attorneyName,
      attorneyFirm,
      responseDeadline,
      settlementAmount,
      violationsCited: violationsCited.length > 0 ? [...new Set(violationsCited)] : undefined,
    },
    confidenceScores,
    extractedEntities,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      fileContent,
      fileName,
      fileType,
      business_id,
      user_id,
      modelPreference = 'flash',
      analysisDepth = 'standard'
    }: AnalysisRequest = await req.json();

    if (!fileContent || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File content and file name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isPDF = fileType === 'application/pdf';
    const isImage = fileType.startsWith('image/');

    let analysis: DocumentAnalysis;
    let aiModel = 'regex-enhanced-v2';
    let analysisMethod = 'regex';

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const hasGeminiKey = geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here';

    console.log(`[DEBUG] Processing ${fileName} (${fileType})`);
    console.log(`[DEBUG] Gemini API Key configured: ${hasGeminiKey ? 'Yes' : 'No'}`);
    console.log(`[DEBUG] Model preference: ${modelPreference}`);
    console.log(`[DEBUG] Analysis depth: ${analysisDepth}`);
    console.log(`[DEBUG] File content length: ${fileContent.length}`);

    if (isImage || isPDF) {
      if (hasGeminiKey) {
        console.log(`[DEBUG] Attempting Gemini analysis for ${isPDF ? 'PDF' : 'image'}...`);
        const geminiResult = await analyzeWithGemini(
          fileContent,
          fileType,
          fileName,
          modelPreference,
          analysisDepth
        );

        if (geminiResult) {
          analysis = geminiResult;
          aiModel = GEMINI_MODELS[modelPreference];
          analysisMethod = isPDF ? 'gemini-pdf' : 'gemini-vision';
          console.log('[SUCCESS] Gemini analysis completed');
        } else {
          console.log('[WARN] Gemini analysis failed');

          if (isPDF) {
            const extractedText = await extractTextFromPDF(fileContent);
            if (extractedText.length > 100) {
              console.log('[INFO] Falling back to regex analysis for PDF text');
              analysis = analyzeDocumentWithRegex(extractedText, fileName);
              analysisMethod = 'regex-pdf';
            } else {
              return new Response(
                JSON.stringify({
                  error: 'PDF analysis failed. The PDF may be image-based or encrypted.',
                  errorType: 'AI_ANALYSIS_FAILED',
                  hint: 'Try converting the PDF to an image (PNG/JPG) for better results, or ensure the PDF contains searchable text.'
                }),
                {
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }
          } else {
            return new Response(
              JSON.stringify({
                error: 'Image analysis failed. Gemini API may be unavailable. Please try again.',
                errorType: 'AI_ANALYSIS_FAILED',
                retryable: true,
                hint: 'Check if your Gemini API key is valid and has proper permissions'
              }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        }
      } else {
        if (isPDF) {
          const extractedText = await extractTextFromPDF(fileContent);
          if (extractedText.length > 100) {
            console.log('[INFO] Using regex analysis for PDF (no Gemini key)');
            analysis = analyzeDocumentWithRegex(extractedText, fileName);
            analysisMethod = 'regex-pdf';
          } else {
            return new Response(
              JSON.stringify({
                error: 'PDF analysis requires AI configuration for image-based PDFs. Please contact your administrator or convert the PDF to an image.',
                errorType: 'AI_NOT_CONFIGURED'
              }),
              {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
        } else {
          console.log('[ERROR] No Gemini API key configured - cannot analyze images');
          return new Response(
            JSON.stringify({
              error: 'Image analysis requires AI configuration. Please contact your administrator to enable this feature.',
              errorType: 'AI_NOT_CONFIGURED'
            }),
            {
              status: 503,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } else {
      const geminiResult = await analyzeWithGemini(
        fileContent,
        fileType,
        fileName,
        modelPreference,
        analysisDepth
      );

      if (geminiResult) {
        analysis = geminiResult;
        aiModel = GEMINI_MODELS[modelPreference];
        analysisMethod = 'gemini-text';
        console.log('[SUCCESS] Gemini text analysis completed');
      } else {
        const extractedText = extractTextFromContent(fileContent);
        analysis = analyzeDocumentWithRegex(extractedText, fileName);
        analysisMethod = 'regex';
        console.log('[INFO] Using regex analysis (Gemini not available)');
      }
    }

    const riskLevelMap: Record<string, string> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low',
    };

    const { data: letterData, error: letterError } = await supabase
      .from('demand_letters')
      .insert({
        business_id: business_id || null,
        user_id: user_id || null,
        file_name: fileName,
        file_size: Math.round(fileContent.length * 0.75),
        upload_date: new Date().toISOString(),
        plaintiff_name: analysis.extractedData.plaintiffName || null,
        attorney_name: analysis.extractedData.attorneyName || null,
        attorney_firm: analysis.extractedData.attorneyFirm || null,
        response_deadline: analysis.extractedData.responseDeadline || null,
        settlement_amount: analysis.extractedData.settlementAmount || null,
        violations_cited: analysis.extractedData.violationsCited ? { items: analysis.extractedData.violationsCited } : null,
        extracted_text: fileType.startsWith('image/') ? 'Image document - text extracted by AI' : extractTextFromContent(fileContent).substring(0, 50000),
        analysis_summary: analysis.documentSummary,
        risk_level: riskLevelMap[analysis.urgencyLevel] || 'medium',
        status: 'pending',
        confidence_scores: analysis.confidenceScores || {},
        extracted_entities: analysis.extractedEntities || {},
        ai_model_version: aiModel,
        processing_status: 'completed',
      })
      .select()
      .single();

    if (letterError) {
      console.error('Error saving letter:', letterError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        letter_id: letterData?.id,
        analysis,
        debug: {
          analysisMethod,
          aiModel,
          hasGeminiKey,
          fileType,
          modelPreference,
          analysisDepth,
          timestamp: new Date().toISOString(),
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        errorType: 'INTERNAL_ERROR',
        retryable: true
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});