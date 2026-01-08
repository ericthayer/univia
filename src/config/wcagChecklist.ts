export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  wcagCriteria: string;
  level: 'A' | 'AA' | 'AAA';
  resources?: string[];
}

export interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  items: ChecklistItem[];
}

export const WCAG_CHECKLIST: ChecklistCategory[] = [
  {
    id: 'content',
    name: 'Content',
    description: 'Ensure all content is clear, understandable, and properly structured',
    items: [
      {
        id: 'content-1',
        title: 'Use plain language and avoid figures of speech',
        description: 'Write content that is easy to understand for all users',
        wcagCriteria: '3.1.5 Reading Level (AAA)',
        level: 'AAA',
      },
      {
        id: 'content-2',
        title: 'Make link text clear and descriptive',
        description: 'Link text should make sense out of context',
        wcagCriteria: '2.4.4 Link Purpose (In Context) (A)',
        level: 'A',
      },
      {
        id: 'content-3',
        title: 'Use left-aligned text for left-to-right languages',
        description: 'Avoid center or justified text alignment',
        wcagCriteria: '1.4.8 Visual Presentation (AAA)',
        level: 'AAA',
      },
    ],
  },
  {
    id: 'global-code',
    name: 'Global Code',
    description: 'Fundamental HTML and page structure requirements',
    items: [
      {
        id: 'global-1',
        title: 'Validate HTML markup',
        description: 'Ensure HTML is properly formed and valid',
        wcagCriteria: '4.1.1 Parsing (A)',
        level: 'A',
      },
      {
        id: 'global-2',
        title: 'Declare a language attribute on the html element',
        description: 'Use lang attribute to specify the page language',
        wcagCriteria: '3.1.1 Language of Page (A)',
        level: 'A',
      },
      {
        id: 'global-3',
        title: 'Provide a unique title for each page',
        description: 'Each page should have a descriptive, unique title',
        wcagCriteria: '2.4.2 Page Titled (A)',
        level: 'A',
      },
      {
        id: 'global-4',
        title: 'Ensure viewport zoom is not disabled',
        description: 'Allow users to zoom the page',
        wcagCriteria: '1.4.4 Resize Text (AA)',
        level: 'AA',
      },
      {
        id: 'global-5',
        title: 'Use landmark elements to indicate important content regions',
        description: 'Use semantic HTML5 elements like header, nav, main, footer',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    description: 'Ensure all functionality is accessible via keyboard',
    items: [
      {
        id: 'keyboard-1',
        title: 'Make sure visible focus styles are present',
        description: 'Users should always see which element has keyboard focus',
        wcagCriteria: '2.4.7 Focus Visible (AA)',
        level: 'AA',
      },
      {
        id: 'keyboard-2',
        title: 'Check keyboard focus order matches visual layout',
        description: 'Tab order should follow a logical sequence',
        wcagCriteria: '2.4.3 Focus Order (A)',
        level: 'A',
      },
      {
        id: 'keyboard-3',
        title: 'Remove invisible focusable elements',
        description: 'Hidden elements should not be keyboard accessible',
        wcagCriteria: '2.1.1 Keyboard (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'images',
    name: 'Images',
    description: 'Provide appropriate alternative text for images',
    items: [
      {
        id: 'images-1',
        title: 'All img elements have an alt attribute',
        description: 'Every image must have alt text, even if empty',
        wcagCriteria: '1.1.1 Non-text Content (A)',
        level: 'A',
      },
      {
        id: 'images-2',
        title: 'Use empty alt for decorative images',
        description: 'Decorative images should have alt=""',
        wcagCriteria: '1.1.1 Non-text Content (A)',
        level: 'A',
      },
      {
        id: 'images-3',
        title: 'Provide alternative text or descriptions for complex images',
        description: 'Charts, graphs, and diagrams need detailed descriptions',
        wcagCriteria: '1.1.1 Non-text Content (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'headings',
    name: 'Headings',
    description: 'Structure content with proper heading hierarchy',
    items: [
      {
        id: 'headings-1',
        title: 'Use heading elements to introduce content',
        description: 'Mark up headings with h1-h6 elements',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'headings-2',
        title: 'Use only one h1 element per page',
        description: 'The page should have a single main heading',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'headings-3',
        title: 'Heading elements should be in a logical order',
        description: 'Don\'t skip heading levels',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'lists',
    name: 'Lists',
    description: 'Use semantic list markup appropriately',
    items: [
      {
        id: 'lists-1',
        title: 'Use list elements for list content',
        description: 'Use ul, ol, and li elements for lists',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'controls',
    name: 'Controls',
    description: 'Ensure interactive elements are accessible',
    items: [
      {
        id: 'controls-1',
        title: 'Use a button element for buttons',
        description: 'Don\'t use divs or spans as buttons',
        wcagCriteria: '4.1.2 Name, Role, Value (A)',
        level: 'A',
      },
      {
        id: 'controls-2',
        title: 'Ensure links are recognizable',
        description: 'Links should be visually distinct from surrounding text',
        wcagCriteria: '1.4.1 Use of Color (A)',
        level: 'A',
      },
      {
        id: 'controls-3',
        title: 'Identify links that open in a new tab or window',
        description: 'Warn users when links open new windows',
        wcagCriteria: '3.2.5 Change on Request (AAA)',
        level: 'AAA',
      },
      {
        id: 'controls-4',
        title: 'Provide a skip link',
        description: 'Allow keyboard users to skip to main content',
        wcagCriteria: '2.4.1 Bypass Blocks (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'tables',
    name: 'Tables',
    description: 'Structure data tables properly',
    items: [
      {
        id: 'tables-1',
        title: 'Use table elements for tabular data',
        description: 'Don\'t use tables for layout',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'tables-2',
        title: 'Use th elements for table headers',
        description: 'Mark up header cells with scope attribute',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'tables-3',
        title: 'Use caption element to describe tables',
        description: 'Provide a summary or title for data tables',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Make forms accessible and usable',
    items: [
      {
        id: 'forms-1',
        title: 'Associate labels with form controls',
        description: 'Every input should have a proper label',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'forms-2',
        title: 'Use fieldset and legend for related inputs',
        description: 'Group related form controls together',
        wcagCriteria: '1.3.1 Info and Relationships (A)',
        level: 'A',
      },
      {
        id: 'forms-3',
        title: 'Make sure autocomplete attributes are used correctly',
        description: 'Help users fill forms with autocomplete',
        wcagCriteria: '1.3.5 Identify Input Purpose (AA)',
        level: 'AA',
      },
      {
        id: 'forms-4',
        title: 'Provide clear error messages',
        description: 'Error messages should be helpful and specific',
        wcagCriteria: '3.3.1 Error Identification (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'media',
    name: 'Media',
    description: 'Handle audio and video content accessibly',
    items: [
      {
        id: 'media-1',
        title: 'Don\'t autoplay audio or video',
        description: 'Give users control over media playback',
        wcagCriteria: '1.4.2 Audio Control (A)',
        level: 'A',
      },
      {
        id: 'media-2',
        title: 'Ensure media controls are keyboard accessible',
        description: 'All play, pause, and volume controls should work via keyboard',
        wcagCriteria: '2.1.1 Keyboard (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Provide alternatives for video content',
    items: [
      {
        id: 'video-1',
        title: 'Provide captions for video',
        description: 'All video content needs synchronized captions',
        wcagCriteria: '1.2.2 Captions (Prerecorded) (A)',
        level: 'A',
      },
      {
        id: 'video-2',
        title: 'Remove seizure triggers',
        description: 'Avoid flashing content more than 3 times per second',
        wcagCriteria: '2.3.1 Three Flashes or Below Threshold (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Provide alternatives for audio content',
    items: [
      {
        id: 'audio-1',
        title: 'Provide transcripts for audio',
        description: 'Audio-only content needs text transcripts',
        wcagCriteria: '1.2.1 Audio-only and Video-only (Prerecorded) (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'appearance',
    name: 'Appearance',
    description: 'Ensure visual design is accessible',
    items: [
      {
        id: 'appearance-1',
        title: 'Check high contrast mode compatibility',
        description: 'Content should remain visible in high contrast mode',
        wcagCriteria: '1.4.1 Use of Color (A)',
        level: 'A',
      },
      {
        id: 'appearance-2',
        title: 'Ensure text can be resized to 200%',
        description: 'Text should remain readable when zoomed',
        wcagCriteria: '1.4.4 Resize Text (AA)',
        level: 'AA',
      },
      {
        id: 'appearance-3',
        title: 'Don\'t use color alone to convey information',
        description: 'Use multiple visual cues, not just color',
        wcagCriteria: '1.4.1 Use of Color (A)',
        level: 'A',
      },
    ],
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Implement motion and animation safely',
    items: [
      {
        id: 'animation-1',
        title: 'Use animation subtly',
        description: 'Avoid excessive or distracting animations',
        wcagCriteria: '2.2.2 Pause, Stop, Hide (A)',
        level: 'A',
      },
      {
        id: 'animation-2',
        title: 'Respect prefers-reduced-motion',
        description: 'Reduce or remove animations when user prefers',
        wcagCriteria: '2.3.3 Animation from Interactions (AAA)',
        level: 'AAA',
      },
    ],
  },
  {
    id: 'color-contrast',
    name: 'Color Contrast',
    description: 'Ensure sufficient color contrast',
    items: [
      {
        id: 'contrast-1',
        title: 'Text has contrast ratio of at least 4.5:1',
        description: 'Normal text needs 4.5:1 contrast',
        wcagCriteria: '1.4.3 Contrast (Minimum) (AA)',
        level: 'AA',
      },
      {
        id: 'contrast-2',
        title: 'Large text has contrast ratio of at least 3:1',
        description: 'Large text (18pt+) needs 3:1 contrast',
        wcagCriteria: '1.4.3 Contrast (Minimum) (AA)',
        level: 'AA',
      },
      {
        id: 'contrast-3',
        title: 'UI components have contrast ratio of at least 3:1',
        description: 'Interactive elements need 3:1 contrast',
        wcagCriteria: '1.4.11 Non-text Contrast (AA)',
        level: 'AA',
      },
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile and Touch',
    description: 'Ensure mobile accessibility',
    items: [
      {
        id: 'mobile-1',
        title: 'Support both landscape and portrait orientation',
        description: 'Don\'t lock orientation',
        wcagCriteria: '1.3.4 Orientation (AA)',
        level: 'AA',
      },
      {
        id: 'mobile-2',
        title: 'Avoid horizontal scrolling',
        description: 'Content should fit within viewport width',
        wcagCriteria: '1.4.10 Reflow (AA)',
        level: 'AA',
      },
      {
        id: 'mobile-3',
        title: 'Ensure touch targets are at least 44x44 pixels',
        description: 'Make interactive elements large enough to tap',
        wcagCriteria: '2.5.5 Target Size (AAA)',
        level: 'AAA',
      },
    ],
  },
];
