'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import * as api from '../api/index.js'
import { Notification, GetNotificationsResponse } from '../../data/notification'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Bell, Trash2, Check, CheckCheck, MessageSquare, Reply, Clock, Calendar } from 'lucide-react'

export default function NotificationsPage() {
  const [response, setResponse] = useState<GetNotificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getNotifications({ limit: 50, offset: 0, unread_only: false })
      setResponse(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      setActionLoading(notificationId)
      await api.markNotificationAsRead(notificationId)
      
      setResponse(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          notifications: prev.notifications.map(notif => 
            notif.notification_id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          ),
          unread_count: Math.max(0, prev.unread_count - 1)
        }
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(-1)
      await api.markAllNotificationsAsRead()
      
      setResponse(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          notifications: prev.notifications.map(notif => ({ ...notif, is_read: true })),
          unread_count: 0
        }
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      setActionLoading(notificationId)
      await api.deleteNotification(notificationId)
      
      setResponse(prev => {
        if (!prev) return prev
        
        const notification = prev.notifications.find(n => n.notification_id === notificationId)
        const wasUnread = notification && !notification.is_read
        
        return {
          ...prev,
          notifications: prev.notifications.filter(n => n.notification_id !== notificationId),
          unread_count: wasUnread ? Math.max(0, prev.unread_count - 1) : prev.unread_count,
          total: Math.max(0, prev.total - 1)
        }
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-6 w-6 text-mainAccent"
    
    switch (type) {
      case 'article_comment':
        return <MessageSquare className={iconClass} />
      case 'comment_reply':
        return <Reply className={iconClass} />
      case 'game_postponed':
        return <Clock className={iconClass} />
      case 'absence_reported':
        return <Calendar className={iconClass} />
      default:
        return <Bell className={iconClass} />
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'article_comment':
        return 'Artikel reactie'
      case 'comment_reply':
        return 'Reactie antwoord'
      case 'game_postponed':
        return 'Partij uitgesteld'
      case 'absence_reported':
        return 'Afwezigheid gemeld'
      default:
        return 'Notificatie'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notificaties</h1>
          </div>
          <div className="text-center py-8 text-gray-500">
            Laden...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-mainAccent" />
            <h1 className="text-2xl font-bold text-mainAccent">Notificaties</h1>
            {response && response.unread_count > 0 && (
              <Badge className="bg-mainAccent hover:bg-mainAccentDark">
                {response.unread_count} ongelezen
              </Badge>
            )}
          </div>
          
          {response && response.unread_count > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === -1}
              variant="outline"
              className="flex items-center gap-2 border-mainAccent text-mainAccent hover:bg-mainAccent/10"
            >
              <CheckCheck className="h-4 w-4" />
              {actionLoading === -1 ? 'Bezig...' : 'Alles als gelezen markeren'}
            </Button>
          )}
        </div>

        {response && response.notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-block p-4 bg-mainAccent/10 rounded-full mb-4">
                <Bell className="h-12 w-12 text-mainAccent" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Geen notificaties
              </h3>
              <p className="text-gray-500">
                Je hebt nog geen notificaties ontvangen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {response?.notifications.map((notification) => (
              <Card 
                key={notification.notification_id}
                className={`transition-all duration-200 ${
                  !notification.is_read 
                    ? 'border-mainAccent/30 bg-mainAccent/5 shadow-sm' 
                    : 'hover:shadow-sm'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-mainAccent/10 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <Badge variant="outline" className="text-xs border-mainAccent/30 text-mainAccent">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.is_read && (
                            <Badge className="text-xs bg-mainAccent hover:bg-mainAccentDark">
                              Nieuw
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.notification_id)}
                              disabled={actionLoading === notification.notification_id}
                              className="h-8 w-8 p-0 text-mainAccent hover:text-mainAccentDark hover:bg-mainAccent/10"
                              title="Als gelezen markeren"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.notification_id)}
                            disabled={actionLoading === notification.notification_id}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          {format(new Date(notification.created_at), 'dd MMMM yyyy \'om\' HH:mm', { locale: nl })}
                        </span>
                        
                        {notification.related_article_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/articles/${notification.related_article_id}`}
                            className="text-mainAccent hover:text-mainAccentDark hover:bg-mainAccent/10"
                          >
                            Bekijk artikel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {response && response.hasMore && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement pagination
                console.log('Load more notifications')
              }}
              className="border-mainAccent text-mainAccent hover:bg-mainAccent/10"
            >
              Meer notificaties laden
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
