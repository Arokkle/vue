import { defineStore } from 'pinia'
import axios from 'axios'
import type { FriendVO, UserInfo } from '@/types'  // 需要定义类型，见下文

interface FriendState {
  friends: FriendVO[]               // 好友列表
  receivedRequests: FriendVO[]       // 收到的好友请求（别人发给我的）
  sentRequests: FriendVO[]           // 已发送的好友请求（我发出的）
  loading: boolean                   // 全局加载状态
  error: string | null               // 错误信息
}

export const useFriendStore = defineStore('friend', {
  state: (): FriendState => ({
    friends: [],
    receivedRequests: [],
    sentRequests: [],
    loading: false,
    error: null
  }),

  getters: {
    // 根据用户ID判断是否为好友（返回布尔值）
    isFriend: (state) => (userId: number): boolean => {
      return state.friends.some(f => f.friendId === userId)
    },
    // 判断是否已发送请求给指定用户
    hasSentRequest: (state) => (userId: number): boolean => {
      return state.sentRequests.some(r => r.friendId === userId)
    },
    // 判断是否收到来自指定用户的请求
    hasReceivedRequest: (state) => (userId: number): boolean => {
      return state.receivedRequests.some(r => r.userId === userId)
    }
  },

  actions: {
    /**
     * 发送好友请求
     */
    async sendFriendRequest(friendId: number) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/friend/request', null, {
          params: { friendId }
        })
        // 请求成功后，更新 sentRequests（可以重新获取或手动添加）
        await this.fetchSentRequests()  // 重新拉取已发送请求列表
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || '发送好友请求失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 处理好友请求
     * @param friendId 对方用户ID（请求发起者）
     * @param status 1-同意，2-拒绝
     */
    async handleFriendRequest(friendId: number, status: 1 | 2) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/api/friend/handle', null, {
          params: { friendId, status }
        })
        // 处理成功后，重新获取相关列表
        if (status === 1) {
          // 同意后，好友列表会变化，同时对方成为好友，从 receivedRequests 移除
          await Promise.all([
            this.fetchFriendList(),
            this.fetchReceivedRequests()
          ])
        } else {
          // 拒绝后，仅需刷新 receivedRequests
          await this.fetchReceivedRequests()
        }
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.message || '处理好友请求失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取好友列表
     */
    async fetchFriendList() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/friend/list')
        this.friends = response.data.data || []
      } catch (error: any) {
        this.error = error.response?.data?.message || '获取好友列表失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取收到的好友请求
     */
    async fetchReceivedRequests() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/friend/received')
        this.receivedRequests = response.data.data || []
      } catch (error: any) {
        this.error = error.response?.data?.message || '获取收到的好友请求失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取已发送的好友请求
     */
    async fetchSentRequests() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('/api/friend/sent')
        this.sentRequests = response.data.data || []
      } catch (error: any) {
        this.error = error.response?.data?.message || '获取已发送的好友请求失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    /**
     * 清空状态（退出登录时调用）
     */
    reset() {
      this.friends = []
      this.receivedRequests = []
      this.sentRequests = []
      this.loading = false
      this.error = null
    }
  }
})

