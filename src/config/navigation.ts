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
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    text: 'Dashboard',
    icon: 'dashboard',
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
    id: 'letters',
    text: 'Analyze Letter',
    icon: 'help',
    path: '/letters',
    ariaLabel: 'Analyze demand letters',
    showInHeader: true,
    showInSidebar: true,
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
    showInHeader: true,
    showInSidebar: true,
  },
  {
    id: 'help',
    text: 'Help Center',
    icon: 'volunteer_activism',
    path: '/help',
    ariaLabel: 'Get help and support',
    showInHeader: true,
    showInSidebar: true,
  },
];

export const ROUTE_PATHS = {
  DASHBOARD: '/',
  AUDIT: '/audit',
  AUDIT_RESULTS: '/audit/:id',
  LETTERS: '/letters',
  CHECKLIST: '/checklist',
  ACTION_PLAN: '/action-plan',
  RESOURCES: '/resources',
  HELP: '/help',
} as const;

export function getHeaderMenuItems(): MenuItem[] {
  return MENU_ITEMS.filter(item => item.showInHeader);
}

export function getSidebarMenuItems(): MenuItem[] {
  return MENU_ITEMS.filter(item => item.showInSidebar);
}

export function getMenuItemByPath(path: string): MenuItem | undefined {
  return MENU_ITEMS.find(item => item.path === path);
}
