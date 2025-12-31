"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import type { Notification, NotificationPreferences } from "./notification-types"
import { DEFAULT_NOTIFICATION_PREFERENCES } from "./notification-types"
import { useAuth } from "./auth-context"

interface NotificationContextType {
  notifications: Notification[]
  preferences: NotificationPreferences
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAsHandled: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void
  unreadCount: number
  requestBrowserPermission: () => Promise<void>
  browserPermission: NotificationPermission
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default")
  const { user } = useAuth()

  useEffect(() => {
    // Load preferences
    const storedPrefs = localStorage.getItem("bindme_notification_preferences")
    if (storedPrefs) {
      setPreferences(JSON.parse(storedPrefs))
    }

    // Check browser notification permission
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem("bindme_notification_preferences", JSON.stringify(preferences))
  }, [preferences])

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }
    try {
      const res = await fetch("/api/notifications", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load notifications")
      const data = await res.json()
      const normalized = (data.notifications || []).map((n: Notification) => ({
        priority: "normal",
        category: "update",
        requiresAction: false,
        handledAt: null,
        ...n,
      }))
      setNotifications(normalized)
    } catch (error) {
      console.error("Notification refresh failed", error)
    }
  }, [user])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  const requestBrowserPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setBrowserPermission(permission)
    }
  }

  const addNotification = async (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          priority: "priority" in notification ? (notification as any).priority : undefined,
          category: "category" in notification ? (notification as any).category : undefined,
          requiresAction: "requiresAction" in notification ? (notification as any).requiresAction : undefined,
          ...notification,
        }),
      })
      if (!res.ok) throw new Error("Failed to create notification")
      const data = await res.json()
      const normalized: Notification = {
        priority: data.notification?.priority ?? "normal",
        category: data.notification?.category ?? (data.notification?.requiresAction ? "action" : "update"),
        requiresAction: data.notification?.requiresAction ?? false,
        handledAt: data.notification?.handledAt ?? null,
        ...data.notification,
      }
      setNotifications((prev) => [normalized, ...prev])

      if (
        preferences.browserNotifications &&
        browserPermission === "granted" &&
        "Notification" in window &&
        document.visibilityState === "hidden"
      ) {
        new Notification(data.notification.title, {
          body: data.notification.message,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        })
      }
    } catch (error) {
      console.error("Failed to add notification", error)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ read: true }),
    }).catch((err) => console.error("Failed to mark notification read", err))
  }

  const markAllAsRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id)
    setNotifications((prev) =>
      prev.map((n) =>
        ids.includes(n.id)
          ? {
              ...n,
              read: true,
            }
          : n,
      ),
    )
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notifications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        }),
      ),
    ).catch((err) => console.error("Failed to mark all notifications read", err))
  }

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await fetch(`/api/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).catch((err) => console.error("Failed to delete notification", err))
  }

  const clearAll = async () => {
    const ids = notifications.map((n) => n.id)
    setNotifications([])
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notifications/${id}`, {
          method: "DELETE",
          credentials: "include",
        }),
      ),
    ).catch((err) => console.error("Failed to clear notifications", err))
  }

  const markAsHandled = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, handledAt: new Date().toISOString() } : n)),
    )
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ handled: true, read: true }),
    }).catch((err) => console.error("Failed to mark notification handled", err))
  }

  const updatePreferences = (prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        preferences,
        addNotification,
        markAsRead,
        markAsHandled,
        markAllAsRead,
        deleteNotification,
        clearAll,
        refreshNotifications,
        updatePreferences,
        unreadCount,
        requestBrowserPermission,
        browserPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
