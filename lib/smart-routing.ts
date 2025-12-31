/**
 * Smart Routing Engine
 * Intelligently routes users to the most relevant page based on context
 */

export interface UserContext {
  userId: string
  isAdmin: boolean
  pendingActions: PendingAction[]
  unreadNotifications: number
  lastVisitedPath?: string
  userRole: 'admin' | 'user' | 'guest'
}

export interface PendingAction {
  type: 'signature_needed' | 'dispute_active' | 'verification_pending' | 'payment_due' | 'response_needed'
  agreementId?: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: Date
  path: string
}

export interface RoutingDecision {
  path: string
  reason: string
  priority: number
  metadata?: Record<string, any>
}

/**
 * Analyze user context and determine the best landing page
 */
export function getSmartRoute(context: UserContext): RoutingDecision {
  const decisions: RoutingDecision[] = []

  // Priority 1: Critical pending actions
  const criticalActions = context.pendingActions.filter(a => a.priority === 'high')
  if (criticalActions.length > 0) {
    const action = criticalActions[0]
    decisions.push({
      path: action.path,
      reason: `Critical action required: ${action.type}`,
      priority: 100,
      metadata: { action }
    })
  }

  // Priority 2: Admin users with admin-specific tasks
  if (context.isAdmin) {
    const adminActions = context.pendingActions.filter(a => 
      a.type === 'verification_pending'
    )
    if (adminActions.length > 0) {
      decisions.push({
        path: '/admin/verifications',
        reason: `${adminActions.length} verification(s) pending review`,
        priority: 90,
        metadata: { count: adminActions.length }
      })
    }
  }

  // Priority 3: Disputes requiring attention
  const disputes = context.pendingActions.filter(a => a.type === 'dispute_active')
  if (disputes.length > 0) {
    decisions.push({
      path: disputes[0].path,
      reason: 'Active dispute requires your attention',
      priority: 85,
      metadata: { dispute: disputes[0] }
    })
  }

  // Priority 4: Signatures needed
  const signatures = context.pendingActions.filter(a => a.type === 'signature_needed')
  if (signatures.length > 0) {
    decisions.push({
      path: signatures[0].path,
      reason: `${signatures.length} agreement(s) awaiting your signature`,
      priority: 80,
      metadata: { count: signatures.length }
    })
  }

  // Priority 5: High unread notifications
  if (context.unreadNotifications > 5) {
    decisions.push({
      path: '/dashboard?tab=notifications',
      reason: `${context.unreadNotifications} unread notifications`,
      priority: 70,
      metadata: { count: context.unreadNotifications }
    })
  }

  // Priority 6: Return to last visited path (if recent)
  if (context.lastVisitedPath && context.lastVisitedPath !== '/') {
    decisions.push({
      path: context.lastVisitedPath,
      reason: 'Continue where you left off',
      priority: 60,
      metadata: { lastPath: context.lastVisitedPath }
    })
  }

  // Priority 7: Default routes based on role
  if (context.isAdmin) {
    decisions.push({
      path: '/admin',
      reason: 'Admin dashboard',
      priority: 50
    })
  } else {
    decisions.push({
      path: '/dashboard',
      reason: 'User dashboard',
      priority: 50
    })
  }

  // Sort by priority and return the highest
  decisions.sort((a, b) => b.priority - a.priority)
  return decisions[0]
}

/**
 * Generate breadcrumb trail for current path
 */
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: Array<{ label: string; href: string }> = [
    { label: 'Home', href: '/dashboard' }
  ]

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    breadcrumbs.push({
      label: formatSegmentLabel(segment),
      href: currentPath
    })
  }

  return breadcrumbs
}

function formatSegmentLabel(segment: string): string {
  // Convert URL segments to readable labels
  const labelMap: Record<string, string> = {
    'admin': 'Admin',
    'dashboard': 'Dashboard',
    'agreements': 'Agreements',
    'users': 'Users',
    'verifications': 'Verifications',
    'settings': 'Settings',
    'profile': 'Profile',
    'network': 'Network',
    'activity': 'Activity',
    'statistics': 'Statistics',
  }

  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

/**
 * Track user navigation for smart routing
 */
export function trackNavigation(userId: string, path: string) {
  if (typeof window === 'undefined') return

  const key = `nav_history_${userId}`
  const history = JSON.parse(localStorage.getItem(key) || '[]')
  
  history.unshift({
    path,
    timestamp: new Date().toISOString()
  })

  // Keep only last 10 paths
  localStorage.setItem(key, JSON.stringify(history.slice(0, 10)))
}

/**
 * Get user's navigation history
 */
export function getNavigationHistory(userId: string): Array<{ path: string; timestamp: string }> {
  if (typeof window === 'undefined') return []
  
  const key = `nav_history_${userId}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}

