/**
 * Reads a raw browser console message and says, in plain words, what it most
 * likely means and what to do. Returns undefined when we cannot tell; the UI
 * then shows the raw message on its own rather than guessing.
 */

interface Rule {
  test: RegExp;
  explain: (match: RegExpMatchArray) => string;
}

const RULES: Rule[] = [
  {
    test: /status of 404/i,
    explain: () =>
      'A file the page asks for does not exist (404 Not Found). Usually a deleted image, script, or font that is still referenced. Remove the reference or restore the file.',
  },
  {
    test: /status of 40[13]/i,
    explain: (m) =>
      `The server refused to send a file (${m[0].endsWith('1') ? '401 Unauthorized' : '403 Forbidden'}). Often a third-party widget, CDN, or hotlinked image that blocks your domain, or a file behind a login. Check the network tab to find which file, then fix its permissions or remove it.`,
  },
  {
    test: /status of 5\d\d/i,
    explain: () =>
      'A server returned an error (5xx) for one of the files on the page. This is a problem on the server or service that hosts that file. Ask your host or the service provider to check their logs.',
  },
  {
    test: /X-Frame-Options|frame-ancestors/i,
    explain: () =>
      'Your page tries to embed another site in a frame (iframe), and that site does not allow being embedded. Visitors see a blank box. Replace the embed with a link, or use the embed code the other site officially provides.',
  },
  {
    test: /\[Report Only\].*Content Security Policy/i,
    explain: () =>
      "Your site's security policy (CSP) is in report-only mode and flagged something it would block if enforced. Nothing was blocked. Before switching the policy on, either remove that item or add its domain to the policy.",
  },
  {
    test: /Content Security Policy/i,
    explain: () =>
      "Your site's security policy (CSP) blocked a script, style, or connection. Either the blocked item is unexpected and should be removed, or it is legitimate and its domain needs to be added to the policy.",
  },
  {
    test: /Access-Control-Allow-Origin|CORS/i,
    explain: () =>
      'The page tried to load data from another domain that does not allow it (a CORS error). The other server must allow your domain, or the request should go through your own server.',
  },
  {
    test: /Mixed Content/i,
    explain: () =>
      'A secure (https) page loads something over insecure http. Browsers block it, so a feature or image may be missing. Change the link to https.',
  },
  {
    test: /net::ERR_[A-Z_]+/,
    explain: (m) =>
      `A file could not be downloaded (${m[0]}). The address may be wrong, the server down, or the request blocked by an ad blocker. Check that the URL loads on its own.`,
  },
  {
    test: /Uncaught (TypeError|ReferenceError|SyntaxError)/,
    explain: (m) =>
      `A script on the page crashed (${m[1]}). Anything that script powers, such as menus, forms, or chat widgets, may not work. Your developer can find the file and line in the browser console.`,
  },
];

export function diagnoseConsoleMessage(message: string): string | undefined {
  for (const rule of RULES) {
    const match = message.match(rule.test);
    if (match) return rule.explain(match);
  }
  return undefined;
}
