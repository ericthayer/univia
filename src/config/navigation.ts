export interface MenuItem {
  id: string;
  text: string;
  icon: string;
  path: string;
  ariaLabel: string;
  showInHeader?: boolean;
  showInSidebar?: boolean;
  badge?: string;
  disabled?: boolean;
  /** Shown only to signed-in accounts that have Monitor access. */
  requiresMonitorAccess?: boolean;
}

export interface MenuOptions {
  /** True once the server confirms this account has Monitor access. */
  monitorAccess?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: 'home',
    path: '/',
    ariaLabel: 'Go to Dashboard',
    showInHeader: true,
    showInSidebar: true,
  },
  {
    id: 'audit',
    text: 'Site Audit',
    icon: 'search',
    path: '/audit',
    ariaLabel: 'Run accessibility audit',
    showInHeader: true,
    showInSidebar: true,
  },
  {
    id: 'analyze-report',
    text: 'Analyze Report',
    icon: 'analytics',
    path: '/analyze-report',
    ariaLabel: 'Analyze audit reports',
    showInHeader: false,
    showInSidebar: false,
  },
  {
    id: 'letters',
    text: 'Analyze Letter',
    icon: 'help',
    path: '/letters',
    ariaLabel: 'Analyze demand letters',
    showInHeader: true,
    showInSidebar: true,
  },
  {
    id: 'monitor',
    text: 'Monitor',
    icon: 'monitor_heart',
    path: '/monitor',
    ariaLabel: 'Monitor your sites',
    showInHeader: true,
    showInSidebar: true,
    requiresMonitorAccess: true,
  },
  {
    id: 'checklist',
    text: 'Checklist',
    icon: 'checklist',
    path: '/checklist',
    ariaLabel: 'WCAG compliance checklist',
    showInHeader: false,
    showInSidebar: false,
  },
  {
    id: 'action-plan',
    text: 'Action Plan',
    icon: 'assignment',
    path: '/action-plan',
    ariaLabel: 'Create remediation action plan',
    showInHeader: false,
    showInSidebar: false,
  },
  {
    id: 'resources',
    text: 'Resources',
    icon: 'link',
    path: '/resources',
    ariaLabel: 'View accessibility resources',
    showInHeader: false,
    showInSidebar: false,
  },
  {
    id: 'help',
    text: 'Help Center',
    icon: 'volunteer_activism',
    path: '/help',
    ariaLabel: 'Get help and support',
    showInHeader: false,
    showInSidebar: false,
  },
  {
    id: 'streaming-demo',
    text: 'AI Stream',
    icon: 'bolt',
    path: '/admin/streaming-demo',
    ariaLabel: 'Gemini Streaming Demo',
    showInHeader: false,
    showInSidebar: false,
  },
];

export const ROUTE_PATHS = {
  DASHBOARD: '/',
  AUDIT: '/audit',
  AUDIT_RESULTS: '/audit/:id',
  LETTERS: '/letters',
  CHECKLIST: '/checklist',
  ACTION_PLAN: '/action-plan',
  MONITOR: '/monitor',
  MONITOR_STATEMENT: '/monitor/statement',
  MONITOR_RECORD: '/monitor/record',
  VERIFY_RECORD: '/verify/record/:id',
  RESOURCES: '/resources',
  HELP: '/help',
  ANALYZE_REPORT: '/analyze-report',
  SHARED_LETTER: '/shared/letter',
  UNSUBSCRIBE: '/unsubscribe',
  STREAMING_DEMO: '/admin/streaming-demo',
  SIGN_IN: '/signin',
  SIGN_UP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
} as const;

/** Signed-out header entry; signed-in users get the account menu instead. */
const SIGN_IN_MENU_ITEM: MenuItem = {
  id: 'sign-in',
  text: 'Sign In',
  icon: 'login',
  path: ROUTE_PATHS.SIGN_IN,
  ariaLabel: 'Sign in to your account',
  showInHeader: true,
};

function isVisible(item: MenuItem, isAuthenticated: boolean, options: MenuOptions): boolean {
  return !item.requiresMonitorAccess || (isAuthenticated && options.monitorAccess === true);
}

export function getHeaderMenuItems(isAuthenticated: boolean = false, options: MenuOptions = {}): MenuItem[] {
  const items = MENU_ITEMS.filter(item => item.showInHeader && isVisible(item, isAuthenticated, options)).map(item => {
    if (item.id === 'dashboard') {
      return {
        ...item,
        text: isAuthenticated ? 'Dashboard' : 'Home',
        icon: isAuthenticated ? 'space_dashboard' : 'home',
        ariaLabel: isAuthenticated ? 'Go to Dashboard' : 'Go to Home',
      };
    }
    return item;
  });
  return isAuthenticated ? items : [...items, SIGN_IN_MENU_ITEM];
}

/** Mirrors the header: signed-out users get Sign In as a nav item, no Register. */
export function getSidebarMenuItems(isAuthenticated: boolean = false, options: MenuOptions = {}): MenuItem[] {
  const items = MENU_ITEMS.filter(item => item.showInSidebar && isVisible(item, isAuthenticated, options)).map(item => {
    if (item.id === 'dashboard') {
      return {
        ...item,
        text: isAuthenticated ? 'Dashboard' : 'Home',
        icon: isAuthenticated ? 'space_dashboard' : 'home',
        ariaLabel: isAuthenticated ? 'Go to Dashboard' : 'Go to Home',
      };
    }
    return item;
  });
  return isAuthenticated ? items : [...items, SIGN_IN_MENU_ITEM];
}

export function getMenuItemByPath(path: string): MenuItem | undefined {
  return MENU_ITEMS.find(item => item.path === path);
}
