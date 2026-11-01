/**
 * Plain-language fix guidance for Lighthouse audit rules.
 *
 * Audience: site owners with no accessibility or web-performance background.
 * Every string is written for that reader: no unexplained jargon, concrete
 * steps, and a note on who on their team usually makes the change.
 */

export type AuditCategory = 'accessibility' | 'best-practices' | 'seo' | 'performance';

export type WcagLevel = 'A' | 'AA' | 'AAA';

/** Who usually makes the change. Shown as "Usually fixed by". */
export type FixOwner = 'content' | 'developer' | 'designer' | 'hosting';

/** Rough size of the change. Shown as "Effort". */
export type FixEffort = 'quick' | 'moderate' | 'involved';

export interface CodeExample {
  language: 'html' | 'css' | 'js' | 'http' | 'text';
  /** The problem pattern. Omit when there is no meaningful "before". */
  before?: string;
  after: string;
  note?: string;
}

/** Curated content for one rule (or a family of rules that share a fix). */
export interface FixGuide {
  /** One sentence: what is wrong, in plain words. */
  summary: string;
  /** Why it matters to people and to the business (legal risk, sales, search). */
  whyItMatters: string;
  /** Concrete groups of people affected. */
  whoIsAffected: string[];
  /** Ordered steps a non-expert can follow or hand to their developer. */
  steps: string[];
  example?: CodeExample;
  /** WCAG 2.2 success criteria ids, e.g. `1.4.3`. Empty for best-practice-only rules. */
  wcag?: string[];
  owner: FixOwner;
  effort: FixEffort;
}

export interface StandardRef {
  id: string;
  name: string;
  level: WcagLevel;
  url: string;
}

export interface AuditInstance {
  kind: 'element' | 'resource' | 'message';
  text: string;
  /** Plain-language reading of this specific instance, when we can tell. */
  diagnosis?: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

/** Everything the UI and the PDF report need for one violation. Pure data. */
export interface FixGuidance {
  ruleId: string;
  category: AuditCategory;
  categoryLabel: string;
  /** False when no curated guide exists and the content is a category fallback. */
  curated: boolean;
  summary: string;
  whyItMatters?: string;
  whoIsAffected: string[];
  fixedBy?: string;
  effort?: string;
  steps: string[];
  example?: CodeExample;
  standards: StandardRef[];
  instances: AuditInstance[];
  resources: ResourceLink[];
}
