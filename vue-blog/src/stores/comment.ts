import { defineStore } from 'pinia'
import request from '../utils/request'

interface Comment {
  id: number
  articleId: number
  content: string
  parentId: number | null
  userId: number
  createTime: string
  updateTime: string
  likeCount: number
  status: number
  isLiked: boolean
  author?: {
    id: number
    username: string
    avatar: string
  }
  replies?: Comment[]
}

interface CommentState {
  comments: Comment[]
  currentComment: Comment | null
  total: number
  page: number
  size: number
}

export const useCommentStore = defineStore('comment', {
  state: (): CommentState => ({
    comments: [],
    currentComment: null,
    total: 0,
    page: 1,
    size: 10
  }),

  getters: {
    getCommentList: (state) => state.comments,
    getCurrentComment: (state) => state.currentComment,
    getTotalCount: (state) => state.total
  },

  actions: {
    // 获取文章评论列表
    async getArticleComments(articleId: number, params?: { page?: number; size?: number }) {
      const res: any = await request.get(`/comment/article/${articleId}`, {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size
        }
      })
      this.comments = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 获取评论详情
    async getCommentDetail(id: number) {
      const res: any = await request.get(`/comment/${id}`)
      this.currentComment = res.comment
      return res
    },

    // 创建评论
    async createComment(comment: { articleId: number; content: string; parentId?: number }) {
      // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
      const params = new URLSearchParams()
      params.append('articleId', comment.articleId.toString())
      params.append('content', comment.content)
      if (comment.parentId !== undefined && comment.parentId !== null) {
        params.append('parentId', comment.parentId.toString())
      }
      
      const res: any = await request.post('/comment/create', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 回复评论
    async replyComment(parentId: number, content: string) {
      // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
      const params = new URLSearchParams()
      params.append('content', content)
      
      const res: any = await request.post(`/comment/${parentId}/reply`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 删除评论
    async deleteComment(id: number) {
      const res: any = await request.delete(`/comment/${id}`)
      return res
    },

    // 点赞评论
    async likeComment(id: number) {
      const res: any = await request.post(`/comment/${id}/like`)
      return res
    },

    // 取消点赞评论
    async unlikeComment(id: number) {
      const res: any = await request.post(`/comment/${id}/unlike`)
      return res
    },

    // 检查是否点赞
    async checkCommentLiked(id: number) {
      const res: any = await request.get(`/comment/${id}/is-liked`)
      return res
    },

    // 获取评论回复
    async getCommentReplies(parentId: number) {
      const res: any = await request.get(`/comment/${parentId}/replies`)
      return res
    },

    // 获取我的评论
    async getMyComments(params?: { page?: number; size?: number; keyword?: string }) {
      const res: any = await request.get('/comment/my', {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size,
          keyword: params?.keyword
        }
      })
      this.comments = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 获取最新评论
    async getLatestComments(limit?: number) {
      const res: any = await request.get('/comment/latest', {
        params: { limit }
      })
      return res
    },
    
    // 获取所有评论（管理员用）
    async getAllComments(params?: { page?: number; size?: number; keyword?: string; status?: number }) {
      const res: any = await request.get('/comment/admin/all', {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size,
          keyword: params?.keyword,
          status: params?.status
        }
      })
      this.comments = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    }
  }
})