import { defineStore } from 'pinia'
import axios from 'axios'
import type { FriendVO } from '@/types'

// 通知类型定义
export type NotificationType = 'friend' | 'message' | 'system' | 'article'

// 通知接口
export interface Notification {
  id: string | number
  type: NotificationType
  title: string
  content: string
  senderId?: number
  senderName?: string
  senderAvatar?: string
  relatedId?: number // 相关实体ID，如文章ID、评论ID等
  isRead: boolean
  createTime: string
}

interface NotificationState {
  friendNotifications: Notification[]  // 好友通知（包括好友申请）
  messageNotifications: Notification[] // 私信通知
  systemNotifications: Notification[]  // 系统通知
  articleNotifications: Notification[] // 文章通知（点赞、评论）
  unreadCount: number                // 未读通知总数
  loading: boolean
  error: string | null
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    friendNotifications: [],
    messageNotifications: [],
    systemNotifications: [],
    articleNotifications: [],
    unreadCount: 0,
    loading: false,
    error: null
  }),

  getters: {
    // 未处理的好友请求数量
    pendingFriendRequests: (state) => state.friendNotifications.filter(n => n.type === 'friend' && !n.isRead),
    
    // 未读私信数量
    unreadMessages: (state) => state.messageNotifications.filter(n => !n.isRead),
    
    // 未读系统通知数量
    unreadSystemNotifications: (state) => state.systemNotifications.filter(n => !n.isRead),
    
    // 未读文章通知数量
    unreadArticleNotifications: (state) => state.articleNotifications.filter(n => !n.isRead),
    
    // 按类型分组的通知
    notificationsByType: (state) => {
      return {
        friend: state.friendNotifications,
        message: state.messageNotifications,
        system: state.systemNotifications,
        article: state.articleNotifications
      }
    }
  },

  actions: {
    /**
     * 获取收到的好友请求
     */
    async fetchReceivedRequests() {
      this.loading = true
      try {
        const response = await axios.get('/api/friend/received')
        const requests = response.data.data || []
        
        // 转换为通知格式
        const friendNotifications = requests.map((req: FriendVO) => ({
          id: `friend-${req.userId}`,
          type: 'friend' as NotificationType,
          title: '好友请求',
          content: `${req.friendInfo.username} 请求添加你为好友`,
          senderId: req.userId,
          senderName: req.friendInfo.username,
          senderAvatar: req.friendInfo.avatar,
          isRead: false,
          createTime: new Date().toISOString()
        }))
        
        this.friendNotifications = friendNotifications
        this.updateUnreadCount()
      } catch (error: any) {
        this.error = error.response?.data?.message || '获取好友请求失败'
        console.error(this.error)
      } finally {
        this.loading = false
      }
    },

    /**
     * 处理好友请求（同意/拒绝）
     */
    async handleRequest(friendId: number, status: 1 | 2) {
      try {
        await axios.post('/api/friend/handle', null, {
          params: { friendId, status }
        })
        // 从列表中移除已处理的请求
        this.friendNotifications = this.friendNotifications.filter(
          req => req.senderId !== friendId
        )
        this.updateUnreadCount()
      } catch (error: any) {
        this.error = error.response?.data?.message || '操作失败'
        throw error
      }
    },

    /**
     * 添加新通知（WebSocket 回调调用）
     */
    addNotification(notification: Notification) {
      switch (notification.type) {
        case 'friend':
          // 避免重复添加好友请求
          if (!this.friendNotifications.some(n => n.senderId === notification.senderId)) {
            this.friendNotifications.unshift(notification)
          }
          break
        case 'message':
          this.messageNotifications.unshift(notification)
          break
        case 'system':
          this.systemNotifications.unshift(notification)
          break
        case 'article':
          this.articleNotifications.unshift(notification)
          break
      }
      this.updateUnreadCount()
    },

    /**
     * 标记通知为已读
     */
    markAsRead(notificationId: string | number, type: NotificationType) {
      let notifications: Notification[]
      switch (type) {
        case 'friend':
          notifications = this.friendNotifications
          break
        case 'message':
          notifications = this.messageNotifications
          break
        case 'system':
          notifications = this.systemNotifications
          break
        case 'article':
          notifications = this.articleNotifications
          break
        default:
          return
      }
      
      const notification = notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
        this.updateUnreadCount()
      }
    },

    /**
     * 更新未读通知数量
     */
    updateUnreadCount() {
      const allNotifications = [
        ...this.friendNotifications,
        ...this.messageNotifications,
        ...this.systemNotifications,
        ...this.articleNotifications
      ]
      this.unreadCount = allNotifications.filter(n => !n.isRead).length
    },

    /**
     * 清空状态（退出登录时调用）
     */
    reset() {
      this.friendNotifications = []
      this.messageNotifications = []
      this.systemNotifications = []
      this.articleNotifications = []
      this.unreadCount = 0
      this.loading = false
      this.error = null
    }
  }
})