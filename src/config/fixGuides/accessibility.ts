import type { FixGuide } from './types';

const SR = 'People using screen readers (blind and low-vision visitors)';
const KB = 'People who navigate with a keyboard or switch device instead of a mouse';
const VOICE = 'People who control their computer by voice';
const LOW_VISION = 'People with low vision or color blindness';
const OLDER = 'Older visitors and anyone on a phone in bright sunlight';

const imageAlt: FixGuide = {
  summary: 'Some images have no text description, so people who cannot see them get nothing (or just a file name).',
  whyItMatters:
    'Screen readers read the alt text in place of the image. Missing alt text on product photos, logos, or linked images is one of the most cited problems in ADA demand letters because it is easy to detect automatically.',
  whoIsAffected: [SR, 'People on slow connections where images fail to load'],
  steps: [
    'Open each image listed under "Where we found it".',
    'If the image shows information (a product, a chart, text in a picture), write a short alt description of what it shows, as you would describe it over the phone. Skip "image of".',
    'If the image is a link or button, describe where it goes or what it does ("Home", "Search"), not what it looks like.',
    'If the image is pure decoration (a divider, a background flourish), give it an empty alt: alt="". That tells screen readers to skip it.',
    'In a CMS such as WordPress, Shopify, or Squarespace, set this in the image settings field labeled "Alt text".',
  ],
  example: {
    language: 'html',
    before: '<img src="/img/team-2024.jpg">',
    after: '<img src="/img/team-2024.jpg" alt="Our five-person support team outside the Denver office">\n<img src="/img/divider.svg" alt="">',
  },
  wcag: ['1.1.1'],
  owner: 'content',
  effort: 'quick',
};

const contrast: FixGuide = {
  summary: 'Some text is too faint against its background to read comfortably.',
  whyItMatters:
    'Low-contrast text is the most common accessibility failure on the web. Light gray on white or white on a pale brand color is unreadable for many people, and it is easy for a plaintiff to measure.',
  whoIsAffected: [LOW_VISION, OLDER],
  steps: [
    'Find the text listed under "Where we found it" and note its text color and background color.',
    'Check the pair in a contrast checker (WebAIM Contrast Checker, linked below). Normal text needs at least 4.5:1. Large text (about 24px, or 19px bold) needs 3:1.',
    'Darken the text or lighten the background until it passes. Usually a small shift is enough; you rarely need to change the brand color itself.',
    'Update the color in your theme or stylesheet, not on each element, so every page gets the fix.',
    'Also check hover, focus, disabled-looking, and placeholder text, which are often the faintest.',
  ],
  example: {
    language: 'css',
    before: '.note { color: #999999; background: #ffffff; } /* 2.8:1, fails */',
    after: '.note { color: #595959; background: #ffffff; } /* 7:1, passes */',
  },
  wcag: ['1.4.3'],
  owner: 'designer',
  effort: 'quick',
};

const linkName: FixGuide = {
  summary: 'Some links have no readable name, so a screen reader announces only "link" with no idea where it goes.',
  whyItMatters:
    'Screen reader users often jump from link to link. An unnamed link, typically an icon or image link such as a social media icon or a logo, is a dead end for them.',
  whoIsAffected: [SR, VOICE],
  steps: [
    'Find each link listed under "Where we found it". These are usually icons, logos, or images wrapped in a link.',
    'If the link contains an image, give that image alt text describing the destination ("Univia home", "Follow us on Instagram").',
    'If the link contains only an icon (SVG or icon font), add an aria-label to the link with the destination.',
    'Avoid vague text such as "click here" or "more"; name the destination.',
  ],
  example: {
    language: 'html',
    before: '<a href="https://instagram.com/acme"><svg>…</svg></a>',
    after: '<a href="https://instagram.com/acme" aria-label="Acme on Instagram"><svg aria-hidden="true">…</svg></a>',
  },
  wcag: ['2.4.4', '4.1.2'],
  owner: 'developer',
  effort: 'quick',
};

const buttonName: FixGuide = {
  summary: 'Some buttons have no readable name, so people using assistive technology cannot tell what they do.',
  whyItMatters:
    'Icon-only buttons (menu, close, search, cart) are announced as just "button". Visitors cannot open the menu, close a pop-up, or check out.',
  whoIsAffected: [SR, VOICE],
  steps: [
    'Find each button listed under "Where we found it". Most are icon-only: hamburger menus, close (X), search, carousel arrows.',
    'Add an aria-label that says what the button does ("Open menu", "Close", "Next slide").',
    'Hide the icon itself from screen readers with aria-hidden="true" so it is not read twice.',
    'If you use a theme or page builder, check its settings for an "accessible label" field for the icon button.',
  ],
  example: {
    language: 'html',
    before: '<button class="menu-toggle"><svg>…</svg></button>',
    after: '<button class="menu-toggle" aria-label="Open menu"><svg aria-hidden="true">…</svg></button>',
  },
  wcag: ['4.1.2'],
  owner: 'developer',
  effort: 'quick',
};

const formLabel: FixGuide = {
  summary: 'Some form fields have no label, so people using screen readers hear "edit text" with no idea what to type.',
  whyItMatters:
    'Placeholder text is not a label: it disappears on typing and is often not announced. Unlabeled fields block people from signing up, checking out, or contacting you.',
  whoIsAffected: [SR, VOICE, 'People with memory or cognitive disabilities'],
  steps: [
    'Find each field listed under "Where we found it" (inputs, dropdowns, text areas).',
    'Give each one a visible <label> connected to it: the label\'s for attribute matches the field\'s id.',
    'If the design truly has no room for visible text (for example a single search box next to a "Search" button), add aria-label to the field.',
    'Keep placeholder text only as an example of the format ("name@example.com"), never as the only label.',
    'Each field should have exactly one label. Remove duplicates.',
  ],
  example: {
    language: 'html',
    before: '<input type="email" placeholder="Email">',
    after: '<label for="signup-email">Email address</label>\n<input id="signup-email" type="email" autocomplete="email">',
  },
  wcag: ['1.3.1', '4.1.2'],
  owner: 'developer',
  effort: 'quick',
};

const pageLang: FixGuide = {
  summary: 'The page does not declare its language (or declares an invalid one), so screen readers may read it with the wrong accent and pronunciation.',
  whyItMatters:
    'A screen reader set to Spanish reading an English page without a language tag sounds like gibberish. It is a one-line fix that also helps translation tools and search engines.',
  whoIsAffected: [SR, 'People using browser translation'],
  steps: [
    'Open your site\'s main template (the file that contains the <html> tag), or the language setting in your CMS.',
    'Add a lang attribute with a valid code: "en" for English, "es" for Spanish, "en-US" if you want to be specific.',
    'If a section is in a different language than the page, add lang to that section too.',
  ],
  example: { language: 'html', before: '<html>', after: '<html lang="en">' },
  wcag: ['3.1.1'],
  owner: 'developer',
  effort: 'quick',
};

const docTitle: FixGuide = {
  summary: 'The page has no title, which is the first thing a screen reader announces and the text shown in the browser tab.',
  whyItMatters:
    'Without a title, visitors with many tabs open, and screen reader users, cannot tell which page they are on. Search engines also use it as the headline in results.',
  whoIsAffected: [SR, 'Everyone using browser tabs or bookmarks'],
  steps: [
    'Add a <title> to the page head, or fill in the "Page title" / "SEO title" field in your CMS.',
    'Make it unique and descriptive: page name first, then site name ("Pricing | Acme").',
  ],
  example: { language: 'html', after: '<title>Pricing | Acme Plumbing</title>' },
  wcag: ['2.4.2'],
  owner: 'content',
  effort: 'quick',
};

const ariaValid: FixGuide = {
  summary: 'Some elements use ARIA (code that describes elements to assistive technology) incorrectly, so screen readers get wrong or broken information.',
  whyItMatters:
    'ARIA overrides what the browser tells assistive technology. Used incorrectly, it makes working controls look broken, or hides them entirely. Bad ARIA is often worse than none.',
  whoIsAffected: [SR, VOICE],
  steps: [
    'Send the elements under "Where we found it" to your developer. This is a code fix.',
    'For each one, check the role and aria-* attributes against the ARIA spec: misspelled attributes, invalid values (aria-expanded="yes" instead of "true"), roles that do not allow that attribute, or required attributes that are missing.',
    'Prefer native HTML: a real <button> instead of <div role="button">, a real <ul> instead of role="list". Native elements need no ARIA.',
    'If the markup comes from a plugin or theme, update it or report the bug to its vendor.',
  ],
  example: {
    language: 'html',
    before: '<div role="button" aria-expanded="yes" onclick="toggle()">Menu</div>',
    after: '<button type="button" aria-expanded="false" aria-controls="main-menu">Menu</button>',
  },
  wcag: ['4.1.2'],
  owner: 'developer',
  effort: 'moderate',
};

const ariaStructure: FixGuide = {
  ...ariaValid,
  summary: 'Some elements with an ARIA role are missing the parent or child elements that role requires (for example a list item outside a list).',
  wcag: ['1.3.1'],
};

const ariaName: FixGuide = {
  ...buttonName,
  summary: 'Some interactive widgets (toggles, sliders, progress bars, dialogs, tooltips, tree items) have no accessible name.',
  steps: [
    'Find each widget under "Where we found it".',
    'Give it a name with aria-label, or point aria-labelledby at visible text that already describes it.',
    'If the widget comes from a component library or plugin, check its docs for a "label" option.',
  ],
  example: {
    language: 'html',
    before: '<div role="progressbar" aria-valuenow="40"></div>',
    after: '<div role="progressbar" aria-valuenow="40" aria-label="Upload progress"></div>',
  },
};

const ariaHiddenFocus: FixGuide = {
  summary: 'Some elements are hidden from screen readers but can still be reached with the keyboard, so focus lands on something "invisible".',
  whyItMatters:
    'A keyboard user tabs onto a link that the screen reader says does not exist. Common with off-screen menus, closed modals, and carousels.',
  whoIsAffected: [SR, KB],
  steps: [
    'Find each element under "Where we found it".',
    'If the content should be hidden, hide it fully: use the hidden attribute, display:none, or the inert attribute on the container.',
    'If it should be usable, remove aria-hidden="true" from it and its parents.',
    'Never put aria-hidden="true" on the <body> element.',
  ],
  example: {
    language: 'html',
    before: '<nav aria-hidden="true"><a href="/shop">Shop</a></nav>',
    after: '<nav inert hidden><a href="/shop">Shop</a></nav>',
  },
  wcag: ['4.1.2'],
  owner: 'developer',
  effort: 'moderate',
};

const headingOrder: FixGuide = {
  summary: 'Headings skip levels (for example an H2 followed by an H4), which makes the page outline confusing.',
  whyItMatters:
    'Screen reader users scan a page by its headings, like a table of contents. Skipped levels suggest missing sections. Headings are often picked for their size; size should come from styling, not the heading level.',
  whoIsAffected: [SR],
  steps: [
    'List the headings on the page in order (a browser extension such as HeadingsMap helps).',
    'Make sure there is one H1 (the page topic), then H2 for main sections, H3 inside those, and so on, without skipping.',
    'If a heading level was chosen for its look, change the level and restyle it with CSS or your theme\'s text style options.',
  ],
  example: {
    language: 'html',
    before: '<h2>Services</h2>\n<h4>Drain cleaning</h4>',
    after: '<h2>Services</h2>\n<h3 class="small-heading">Drain cleaning</h3>',
  },
  owner: 'content',
  effort: 'quick',
};

const emptyHeading: FixGuide = {
  ...headingOrder,
  summary: 'Some headings are empty, so screen readers announce a heading with nothing in it.',
  steps: [
    'Find each heading under "Where we found it". Often a heading used only for spacing, or one whose text is inside an image.',
    'Add meaningful text, or change the element to a non-heading (a <div> or <p>) if it is only for layout.',
  ],
  example: { language: 'html', before: '<h2></h2>', after: '<h2>Our services</h2>' },
};

const viewportZoom: FixGuide = {
  summary: 'The page blocks pinch-to-zoom on phones.',
  whyItMatters:
    'People with low vision zoom in to read. Disabling zoom (user-scalable=no or maximum-scale below 5) stops them from using the site on a phone.',
  whoIsAffected: [LOW_VISION, OLDER],
  steps: [
    'Find the <meta name="viewport"> tag in your site\'s main template.',
    'Remove user-scalable=no and any maximum-scale value under 5.',
    'Test on a phone: you should be able to pinch to zoom.',
  ],
  example: {
    language: 'html',
    before: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
    after: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  },
  wcag: ['1.4.4'],
  owner: 'developer',
  effort: 'quick',
};

const targetSize: FixGuide = {
  summary: 'Some buttons or links are too small or too close together to tap reliably.',
  whyItMatters:
    'Tiny targets cause mis-taps for people with tremors, limited dexterity, or large fingers on a phone. WCAG asks for at least 24 by 24 pixels, or enough spacing around smaller targets.',
  whoIsAffected: ['People with tremors or limited hand control', 'Everyone on a phone'],
  steps: [
    'Find the targets under "Where we found it", typically small icons, footer links, or pagination dots.',
    'Increase the clickable area to at least 24×24 pixels (44×44 is better on mobile) with padding; the visible icon can stay the same size.',
    'Or add space between neighboring targets so each one has a 24px zone that does not overlap another.',
  ],
  example: {
    language: 'css',
    before: '.social a { width: 16px; height: 16px; }',
    after: '.social a { display: inline-grid; place-items: center; min-width: 44px; min-height: 44px; }',
  },
  wcag: ['2.5.8'],
  owner: 'designer',
  effort: 'quick',
};

const frameTitle: FixGuide = {
  summary: 'Some embedded frames (iframes such as maps, videos, or booking widgets) have no title.',
  whyItMatters: 'Screen readers announce the frame title so visitors can decide whether to enter it. Without one they hear "frame" with no context.',
  whoIsAffected: [SR],
  steps: [
    'Find each iframe under "Where we found it" (maps, YouTube videos, forms, chat widgets).',
    'Add a title attribute describing the content ("Map to our office", "Product demo video").',
  ],
  example: {
    language: 'html',
    before: '<iframe src="https://www.google.com/maps/embed?…"></iframe>',
    after: '<iframe src="https://www.google.com/maps/embed?…" title="Map to our Denver office"></iframe>',
  },
  wcag: ['4.1.2'],
  owner: 'developer',
  effort: 'quick',
};

const listStructure: FixGuide = {
  summary: 'Some lists are built incorrectly (list items outside a list, or other elements mixed in), so screen readers miscount or skip them.',
  whyItMatters: 'Screen readers announce "list, 5 items" so visitors know what to expect. Broken list markup breaks that and can hide items.',
  whoIsAffected: [SR],
  steps: [
    'Find each list under "Where we found it".',
    'Make sure <li> items sit directly inside <ul> or <ol>, and <dt>/<dd> sit directly inside <dl>.',
    'Move any other elements (divs, scripts) inside a list item, or out of the list.',
  ],
  example: {
    language: 'html',
    before: '<ul>\n  <div><li>Item</li></div>\n</ul>',
    after: '<ul>\n  <li><div>Item</div></li>\n</ul>',
  },
  wcag: ['1.3.1'],
  owner: 'developer',
  effort: 'quick',
};

const duplicateId: FixGuide = {
  summary: 'Two or more elements share the same id, which breaks the connections between labels and fields.',
  whyItMatters: 'Labels, error messages, and ARIA references point at ids. With duplicates, a screen reader may read the wrong label for a field.',
  whoIsAffected: [SR],
  steps: [
    'Find the elements under "Where we found it". Often a form or widget placed on the page twice.',
    'Give each element a unique id and update any label for, aria-labelledby, or aria-describedby that points at it.',
  ],
  wcag: ['4.1.2'],
  owner: 'developer',
  effort: 'quick',
};

const tabindex: FixGuide = {
  summary: 'Some elements force a custom keyboard order (tabindex above 0), so the Tab key jumps around the page unpredictably.',
  whyItMatters: 'Keyboard users expect Tab to follow the visual order. Positive tabindex values pull elements to the front of the order and confuse everyone.',
  whoIsAffected: [KB, SR],
  steps: [
    'Find each element under "Where we found it".',
    'Change tabindex to 0 (focusable in normal order) or remove it.',
    'If the order still feels wrong, reorder the HTML to match the visual layout instead.',
  ],
  example: { language: 'html', before: '<a href="/sale" tabindex="3">Sale</a>', after: '<a href="/sale">Sale</a>' },
  wcag: ['2.4.3'],
  owner: 'developer',
  effort: 'quick',
};

const bypass: FixGuide = {
  summary: 'There is no quick way to skip past the navigation to the main content.',
  whyItMatters: 'Keyboard and screen reader users must tab through every menu link on every page before reaching the content. A skip link or a <main> landmark fixes it.',
  whoIsAffected: [KB, SR],
  steps: [
    'Wrap the main page content in a <main> element.',
    'Add a "Skip to main content" link as the first item in the page. It can be hidden until it receives keyboard focus.',
    'Make sure the link\'s target (the id on <main>) exists on every page.',
  ],
  example: {
    language: 'html',
    after: '<a class="skip-link" href="#main">Skip to main content</a>\n…\n<main id="main" tabindex="-1">…</main>',
    note: 'Style .skip-link to sit off-screen and become visible on :focus.',
  },
  wcag: ['2.4.1'],
  owner: 'developer',
  effort: 'quick',
};

const landmarkMain: FixGuide = { ...bypass, summary: 'The page has no <main> landmark, so assistive technology cannot jump straight to the content.', wcag: [] };

const linkInText: FixGuide = {
  summary: 'Links inside paragraphs are told apart from normal text only by color.',
  whyItMatters: 'People who cannot distinguish the colors cannot find the links. An underline is the simplest fix.',
  whoIsAffected: [LOW_VISION],
  steps: [
    'Underline links inside body text (navigation menus can stay without underlines).',
    'If an underline is not acceptable, the link color needs 3:1 contrast against the surrounding text and a non-color cue on hover and focus.',
  ],
  example: { language: 'css', before: 'p a { text-decoration: none; }', after: 'p a { text-decoration: underline; text-underline-offset: 0.15em; }' },
  wcag: ['1.4.1'],
  owner: 'designer',
  effort: 'quick',
};

const sameNameLinks: FixGuide = {
  summary: 'Several links have the same text but go to different places ("Read more", "Learn more").',
  whyItMatters: 'Screen reader users often browse a list of links out of context. Five "Read more" links are indistinguishable.',
  whoIsAffected: [SR],
  steps: [
    'Make the link text describe the destination ("Read more about drain cleaning").',
    'If the visible text must stay short, add an aria-label that starts with the visible text ("Read more about drain cleaning").',
  ],
  wcag: ['2.4.9'],
  owner: 'content',
  effort: 'quick',
};

const labelInName: FixGuide = {
  summary: 'Some controls have an accessible name that does not include their visible text.',
  whyItMatters: 'Voice control users say what they see ("click Subscribe"). If the hidden name is different ("Join newsletter"), the command fails.',
  whoIsAffected: [VOICE, SR],
  steps: [
    'Find each control under "Where we found it".',
    'Make its aria-label start with the exact visible text, or remove the aria-label so the visible text is used.',
  ],
  example: { language: 'html', before: '<button aria-label="Join newsletter">Subscribe</button>', after: '<button>Subscribe</button>' },
  wcag: ['2.5.3'],
  owner: 'developer',
  effort: 'quick',
};

const metaRefresh: FixGuide = {
  summary: 'The page reloads or redirects itself on a timer.',
  whyItMatters: 'Automatic refreshes yank people away mid-sentence, which is especially disorienting for screen reader users and slow readers.',
  whoIsAffected: [SR, 'People with reading or cognitive disabilities'],
  steps: ['Remove the <meta http-equiv="refresh"> tag.', 'If it was a redirect, replace it with a server-side 301 redirect.'],
  wcag: ['2.2.1'],
  owner: 'developer',
  effort: 'quick',
};

const videoCaption: FixGuide = {
  summary: 'Some videos have no captions.',
  whyItMatters: 'Deaf and hard-of-hearing visitors miss everything said in the video. Captions also help anyone watching with the sound off.',
  whoIsAffected: ['Deaf and hard-of-hearing people', 'People watching without sound'],
  steps: [
    'For YouTube or Vimeo, upload or auto-generate captions in the video settings, then correct them.',
    'For self-hosted video, create a .vtt caption file and add a <track kind="captions"> element.',
  ],
  example: { language: 'html', after: '<video controls src="tour.mp4">\n  <track kind="captions" src="tour.en.vtt" srclang="en" label="English">\n</video>' },
  wcag: ['1.2.2'],
  owner: 'content',
  effort: 'moderate',
};

const tables: FixGuide = {
  summary: 'Some data tables do not connect their cells to their headers correctly.',
  whyItMatters: 'Screen readers announce the column and row header with each cell. Without correct headers, a table of numbers becomes meaningless.',
  whoIsAffected: [SR],
  steps: [
    'Use <th> for header cells and <td> for data cells.',
    'Add scope="col" or scope="row" to each <th>.',
    'Use a <caption> for the table title instead of a cell styled as a title.',
    'If the table is used only for layout, replace it with CSS layout.',
  ],
  example: { language: 'html', after: '<table>\n  <caption>Service prices</caption>\n  <tr><th scope="col">Service</th><th scope="col">Price</th></tr>\n  <tr><td>Drain cleaning</td><td>$120</td></tr>\n</table>' },
  wcag: ['1.3.1'],
  owner: 'developer',
  effort: 'moderate',
};

export const accessibilityGuides: Record<string, FixGuide> = {
  'image-alt': imageAlt,
  'input-image-alt': imageAlt,
  'object-alt': { ...imageAlt, summary: 'Some embedded objects have no text alternative.' },
  'role-img-alt': imageAlt,
  'svg-img-alt': imageAlt,
  'image-redundant-alt': {
    ...imageAlt,
    summary: 'Some image descriptions repeat the text right next to them, so screen readers say the same thing twice.',
    steps: ['Find each image under "Where we found it".', 'If the nearby text already says what the image shows, set alt="" on the image.', 'Otherwise, rewrite the alt text so it adds something new.'],
    wcag: [],
  },
  'color-contrast': contrast,
  'link-name': linkName,
  'button-name': buttonName,
  'input-button-name': buttonName,
  label: formLabel,
  'select-name': formLabel,
  'form-field-multiple-labels': formLabel,
  'html-has-lang': pageLang,
  'html-lang-valid': pageLang,
  'html-xml-lang-mismatch': pageLang,
  'valid-lang': { ...pageLang, summary: 'A section of the page declares a language code that is not valid.', wcag: ['3.1.2'] },
  'document-title': docTitle,
  'aria-allowed-attr': ariaValid,
  'aria-allowed-role': ariaValid,
  'aria-conditional-attr': ariaValid,
  'aria-deprecated-role': ariaValid,
  'aria-prohibited-attr': ariaValid,
  'aria-required-attr': ariaValid,
  'aria-roles': ariaValid,
  'aria-valid-attr': ariaValid,
  'aria-valid-attr-value': ariaValid,
  'aria-text': ariaValid,
  'aria-required-children': ariaStructure,
  'aria-required-parent': ariaStructure,
  'aria-command-name': ariaName,
  'aria-dialog-name': ariaName,
  'aria-input-field-name': ariaName,
  'aria-meter-name': ariaName,
  'aria-progressbar-name': ariaName,
  'aria-toggle-field-name': ariaName,
  'aria-tooltip-name': ariaName,
  'aria-treeitem-name': ariaName,
  'aria-hidden-focus': ariaHiddenFocus,
  'aria-hidden-body': ariaHiddenFocus,
  'heading-order': headingOrder,
  'empty-heading': emptyHeading,
  'meta-viewport': viewportZoom,
  'target-size': targetSize,
  'frame-title': frameTitle,
  list: listStructure,
  listitem: listStructure,
  'definition-list': listStructure,
  dlitem: listStructure,
  'duplicate-id-aria': duplicateId,
  tabindex,
  bypass,
  'skip-link': { ...bypass, summary: 'The "skip to content" link points at something that does not exist or cannot receive focus.' },
  'landmark-one-main': landmarkMain,
  'link-in-text-block': linkInText,
  'identical-links-same-purpose': sameNameLinks,
  'label-content-name-mismatch': labelInName,
  'meta-refresh': metaRefresh,
  'video-caption': videoCaption,
  'td-headers-attr': tables,
  'th-has-data-cells': tables,
  'td-has-header': tables,
  'table-fake-caption': tables,
  'table-duplicate-name': { ...tables, wcag: [] },
  accesskeys: {
    ...tabindex,
    summary: 'Some keyboard shortcut keys (accesskey) are assigned more than once.',
    steps: ['Find the elements under "Where we found it".', 'Give each accesskey a unique letter, or remove accesskey entirely; they often clash with browser and screen reader shortcuts.'],
    example: undefined,
    wcag: [],
  },
};
