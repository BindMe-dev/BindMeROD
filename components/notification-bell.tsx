"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/lib/notification-store"
import { useAuth } from "@/lib/auth-context"
import type { Notification as AppNotification } from "@/lib/notification-types"
import { Button } from "@/components/ui/button"
import { Bell, Shield, Users, FileText, X, Clock, CheckCircle2, AlertCircle, Zap, Settings, Filter, Search, Archive, Star, Trash2, Eye, EyeOff } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAsHandled, markAllAsRead, deleteNotification, clearAll } = useNotifications()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "unread" | "urgent" | "action" | "witness" | "counterparty">("all")
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  const userNotifications = user ? notifications.filter((n) => n.userId === user.id) : notifications
  const userUnreadCount = userNotifications.filter((n) => !n.read).length

  // Animate bell when new notifications arrive
  useEffect(() => {
    if (userUnreadCount > 0) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [userUnreadCount])

  const filteredNotifications = userNotifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = (() => {
      switch (selectedFilter) {
        case "unread": return !notification.read
        case "urgent": return notification.priority === "urgent" || notification.type === 'deadline_reminder' || notification.type === 'recurring_due'
        case "action": return notification.requiresAction === true && !notification.handledAt
        case "witness": return notification.type === 'witness_request' || notification.message.includes('witness')
        case "counterparty": return notification.type === 'agreement_signature' && notification.message.includes('counterparty')
        default: return true
      }
    })()
    
    return matchesSearch && matchesFilter
  })

  const getFilterCount = (filter: typeof selectedFilter) => {
    switch (filter) {
      case "unread": return userNotifications.filter(n => !n.read).length
      case "urgent": return userNotifications.filter(n => (n.priority === "urgent") || n.type === 'deadline_reminder' || n.type === 'recurring_due').length
      case "action": return userNotifications.filter(n => n.requiresAction && !n.handledAt).length
      case "witness": return userNotifications.filter(n => n.type === 'witness_request' || n.message.includes('witness')).length
      case "counterparty": return userNotifications.filter(n => n.type === 'agreement_signature' && n.message.includes('counterparty')).length
      default: return userNotifications.length
    }
  }

  const handleNotificationClick = (notificationId: string, agreementId?: string) => {
    markAsRead(notificationId)
    if (agreementId) {
      setOpen(false)
      router.push(`/agreement/${agreementId}`)
    }
  }

  const getNotificationStyle = (notification: AppNotification) => {
    const { type, message, priority, requiresAction, handledAt } = notification
    
    const isWitnessNotification = type === 'witness_request' || 
      (type === 'agreement_signature' && message.includes('witness'))
    
    const isCounterpartyNotification = type === 'agreement_signature' && 
      message.includes('counterparty')
    
    const isUrgent = priority === "urgent" || type === 'deadline_reminder' || type === 'recurring_due'
    const isAction = requiresAction && !handledAt

    if (isUrgent) {
      return {
        bg: notification.read ? "bg-red-500/10 border-red-500/20" : "bg-red-500/20 border-red-500/40",
        icon: <AlertCircle className="w-4 h-4 text-red-400" />,
        badge: "Urgent",
        badgeColor: "bg-red-500/20 text-red-300 border-red-500/30"
      }
    }

    if (isWitnessNotification) {
      return {
        bg: notification.read ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-500/20 border-purple-500/40",
        icon: <Shield className="w-4 h-4 text-purple-400" />,
        badge: "Witness",
        badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30"
      }
    }
    
    if (isCounterpartyNotification) {
      return {
        bg: notification.read ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-500/20 border-blue-500/40",
        icon: <Users className="w-4 h-4 text-blue-400" />,
        badge: "Counterparty",
        badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30"
      }
    }
    
    if (isAction) {
      return {
        bg: notification.read ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-500/20 border-amber-500/40",
        icon: <FileText className="w-4 h-4 text-amber-200" />,
        badge: "Action",
        badgeColor: "bg-amber-500/20 text-amber-100 border-amber-500/30"
      }
    }
    
    return {
      bg: notification.read ? "bg-slate-800/50 border-slate-700" : "bg-slate-700/50 border-slate-600",
      icon: <FileText className="w-4 h-4 text-slate-400" />,
      badge: "Update",
      badgeColor: "bg-slate-600/20 text-slate-300 border-slate-600/30"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deadline_reminder':
      case 'recurring_due':
        return <Clock className="w-3 h-3" />
      case 'agreement_signature':
        return <CheckCircle2 className="w-3 h-3" />
      case 'witness_request':
        return <Shield className="w-3 h-3" />
      default:
        return <Zap className="w-3 h-3" />
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "relative text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300 group",
            isAnimating && "animate-bounce"
          )}
        >
          <Bell className={cn(
            "w-4 h-4 transition-all duration-300",
            userUnreadCount > 0 && "text-blue-400 drop-shadow-lg",
            isAnimating && "scale-110"
          )} />
          {userUnreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
              {userUnreadCount > 9 ? "9+" : userUnreadCount}
            </div>
          )}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] bg-slate-950 border-slate-800 p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="border-b border-slate-800 p-6 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-white text-xl font-bold">Notifications</SheetTitle>
                  <p className="text-sm text-slate-400">
                    {userUnreadCount} unread • {userNotifications.length} total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-slate-700">
                    <DropdownMenuItem onClick={markAllAsRead} className="text-slate-300 hover:text-white hover:bg-slate-800">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark all read
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={clearAll}
                      className="text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive all
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => {
                        setOpen(false)
                        router.push("/settings?tab=notifications")
                      }}
                      className="text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Notification settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/30">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            
            <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as typeof selectedFilter)} className="w-full">
              <TabsList className="grid w-full grid-cols-6 bg-slate-800 p-1">
                <TabsTrigger value="all" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  All
                  <Badge variant="secondary" className="ml-1 text-xs bg-slate-700 text-slate-300">
                    {getFilterCount("all")}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  New
                  {getFilterCount("unread") > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-red-500 text-white">
                      {getFilterCount("unread")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs data-[state=active]:bg-red-600 data-[state=active]:text-white">
                  Urgent
                  {getFilterCount("urgent") > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-red-500 text-white">
                      {getFilterCount("urgent")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="action" className="text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                  Action
                  {getFilterCount("action") > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-amber-500 text-white">
                      {getFilterCount("action")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="witness" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                  Witness
                  {getFilterCount("witness") > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-purple-500 text-white">
                      {getFilterCount("witness")}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="counterparty" className="text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  Party
                  {getFilterCount("counterparty") > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-green-500 text-white">
                      {getFilterCount("counterparty")}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        
        <ScrollArea className="flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                {searchQuery ? (
                  <Search className="w-10 h-10 text-slate-400" />
                ) : selectedFilter === "unread" ? (
                  <Eye className="w-10 h-10 text-slate-400" />
                ) : (
                  <Bell className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchQuery ? "No matching notifications" : selectedFilter === "unread" ? "All caught up!" : "No notifications"}
              </h3>
              <p className="text-slate-400">
                {searchQuery ? "Try adjusting your search terms" : selectedFilter === "unread" ? "No new notifications" : "You're all set"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => {
                const style = getNotificationStyle(notification)
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm overflow-hidden",
                      style.bg,
                      !notification.read && "ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10"
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.agreementId)}
                  >
                    {/* Gradient overlay for unread */}
                    {!notification.read && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                    )}
                    
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                        !notification.read ? "bg-slate-700/80 shadow-lg" : "bg-slate-800/50"
                      )}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={cn("text-xs px-2 py-1 font-medium", style.badgeColor)}>
                            {getTypeIcon(notification.type)}
                            <span className="ml-1">{style.badge}</span>
                          </Badge>
                          {notification.priority === "urgent" && (
                            <Badge className="text-[10px] px-2 py-1 font-medium bg-red-500/20 text-red-200 border-red-500/30">
                              Urgent
                            </Badge>
                          )}
                          {notification.requiresAction && !notification.handledAt && (
                            <Badge className="text-[10px] px-2 py-1 font-medium bg-amber-500/20 text-amber-100 border-amber-500/30">
                              Action Required
                            </Badge>
                          )}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-sm" />
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            {notification.requiresAction && !notification.handledAt && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsHandled(notification.id)
                                }}
                                className="h-6 px-2 text-amber-200 hover:text-amber-50 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                Done
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              {notification.read ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="h-6 w-6 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white text-sm mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-xs text-slate-400 font-medium">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                          <div className="flex items-center gap-2">
                            {notification.agreementId && (
                              <Badge variant="outline" className="text-xs bg-slate-800/50 text-slate-400 border-slate-600">
                                Agreement
                              </Badge>
                            )}
                            {notification.category && (
                              <Badge variant="outline" className="text-xs bg-slate-800/50 text-slate-400 border-slate-600 capitalize">
                                {notification.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}
