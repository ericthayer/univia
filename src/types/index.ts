export interface Business {
  id: string;
  name: string;
  website_url: string;
  industry?: string;
  size?: string;
  contact_email: string;
  contact_phone?: string;
  created_at: string;
}

export interface AccessibilityAudit {
  id: string;
  business_id: string;
  url_scanned: string;
  lighthouse_score?: number;
  performance_score?: number;
  accessibility_score?: number;
  best_practices_score?: number;
  seo_score?: number;
  screenshot_url?: string;
  audit_data?: Record<string, unknown>;
  device_type: 'mobile' | 'desktop';
  audit_session_id?: string;
  created_at: string;
}

export interface Violation {
  id: string;
  audit_id: string;
  wcag_guideline: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  title: string;
  description?: string;
  affected_selector?: string;
  remediation_steps?: string[];
  compliance_level?: 'A' | 'AA' | 'AAA';
  element_screenshot_url?: string;
  impact?: string;
  created_at: string;
}

export interface DemandLetter {
  id: string;
  business_id?: string;
  user_id?: string;
  file_name: string;
  file_size?: number;
  upload_date: string;
  plaintiff_name?: string;
  attorney_name?: string;
  attorney_firm?: string;
  response_deadline?: string;
  violations_cited?: Record<string, unknown>;
  settlement_amount?: number;
  extracted_text?: string;
  analysis_summary?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'reviewed' | 'responded' | 'resolved';
  confidence_scores?: Record<string, number>;
  processing_status?: 'queued' | 'processing' | 'completed' | 'failed';
  ai_model_version?: string;
  extracted_entities?: Record<string, unknown>;
  file_storage_path?: string;
  anonymous_session_id?: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  business_id: string;
  related_audit_id?: string;
  related_letter_id?: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in_progress' | 'completed';
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

export interface ProfessionalResource {
  id: string;
  name: string;
  type: 'lawyer' | 'developer' | 'consultant' | 'auditor';
  specializations?: string[];
  location?: string;
  state?: string;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  contact_email?: string;
  phone?: string;
  website?: string;
  rating?: number;
  pro_bono?: boolean;
  verified?: boolean;
  description?: string;
  created_at: string;
}

export interface CustomChecklist {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  assigned_to?: string;
  compliance_standards?: string[];
  notes?: string;
  completed: boolean;
  order_index: number;
}
