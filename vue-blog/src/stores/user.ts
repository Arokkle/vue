import { defineStore } from 'pinia'
import request from '../utils/request'

interface User {
  id: number
  username: string
  email: string
  avatar: string
  gender: string
  signature: string
  role: string
  createTime: string
}

interface UserState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isAdmin: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    token: null,
    isLoggedIn: false,
    isAdmin: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => state.isLoggedIn
  },

  actions: {
    // 用户登录
    async login(username: string, password: string) {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)
      
      const res: any = await request.post('/user/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      this.user = res.user
      this.isLoggedIn = true
      this.isAdmin = res.user.role === 'ADMIN'
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('isAdmin', this.isAdmin.toString())
      return res
    },

    // 用户注册
    async register(username: string, password: string, email?: string) {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)
      if (email) {
        params.append('email', email)
      }
      
      const res: any = await request.post('/user/register', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 获取当前用户信息
    async getCurrentUser() {
      try {
        const res: any = await request.get('/user/current')
        this.user = res.user
        this.isLoggedIn = true
        this.isAdmin = res.user.role === 'ADMIN'
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('isAdmin', this.isAdmin.toString())
        return res
      } catch (error) {
        this.user = null
        this.isLoggedIn = false
        this.isAdmin = false
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('isAdmin')
        return { success: false, message: '获取用户信息失败' }
      }
    },

    // 用户注销
    async logout() {
      try {
        await request.post('/user/logout')
      } catch (error) {
        console.error('后端注销请求失败:', error)
      }
      this.user = null
      this.isLoggedIn = false
      this.isAdmin = false
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('isAdmin')
    },

    //搜索用户
    async searchUsers(params) {
      const res = await request.get('/user/search', { params })
      return res.data
    },
    
    // 更新用户信息
    async updateProfile(profile: { email?: string; avatar?: string; gender?: string; signature?: string; password?: string }) {
      const params = new URLSearchParams()
      if (profile.email) {
        params.append('email', profile.email)
      }
      if (profile.avatar) {
        params.append('avatar', profile.avatar)
      }
      if (profile.gender) {
        params.append('gender', profile.gender)
      }
      if (profile.signature) {
        params.append('signature', profile.signature)
      }
      if (profile.password) {
        params.append('password', profile.password)
      }
      
      const res: any = await request.put('/user/profile', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      if (res.success) {
        this.user = res.user
      }
      return res
    },

    // 获取指定用户信息
    async getUserInfo(userId: number) {
      const res: any = await request.get(`/user/${userId}`)
      return res.user
    }
  }
  
})