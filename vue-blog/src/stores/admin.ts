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
  updateTime: string
  lastLoginTime: string
}

interface UserPage {
  records: User[]
  total: number
  current: number
  size: number
}

interface AdminState {
  users: User[]
  total: number
  page: number
  size: number
  currentUser: User | null
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    users: [],
    total: 0,
    page: 1,
    size: 10,
    currentUser: null
  }),

  getters: {
    getUserList: (state) => state.users,
    getTotalCount: (state) => state.total,
    getCurrentUser: (state) => state.currentUser
  },

  actions: {
    // 获取所有用户列表（分页）
    async getAllUsers(params?: { page?: number; size?: number }) {
      const res: any = await request.get('/admin/user/list', {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size
        }
      })
      this.users = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 删除用户
    async deleteUser(id: number) {
      const res: any = await request.delete(`/admin/user/${id}`)
      return res
    },

    // 修改用户角色
    async updateUserRole(id: number, role: string) {
      // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
      const params = new URLSearchParams()
      params.append('role', role)
      
      const res: any = await request.put(`/admin/user/${id}/role`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 搜索用户
    async searchUsers(keyword: string, params?: { page?: number; size?: number }) {
      const res: any = await request.get('/admin/user/search', {
        params: {
          keyword,
          page: params?.page || this.page,
          size: params?.size || this.size
        }
      })
      this.users = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 获取用户详情
    async getUserDetail(id: number) {
      const res: any = await request.get(`/admin/user/detail/${id}`)
      this.currentUser = res.user
      return res
    }
  }
})