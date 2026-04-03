import { defineStore } from 'pinia'
import request from '../utils/request'

interface Article {
  id: number
  title: string
  summary: string
  content: string
  categoryId: number
  status: number
  userId: number
  createTime: string
  updateTime: string
  likeCount: number
  commentCount: number
  isTop: boolean
  isRecommend: boolean
  isLiked: boolean
  author?: {
    id: number
    username: string
    avatar: string
  }
}

// 为Article类型添加默认值处理
const defaultArticle: Partial<Article> = {
  isLiked: false,
  likeCount: 0,
  commentCount: 0
}

interface ArticleState {
  articles: Article[]
  currentArticle: Article | null
  total: number
  page: number
  size: number
}

export const useArticleStore = defineStore('article', {
  state: (): ArticleState => ({
    articles: [],
    currentArticle: null,
    total: 0,
    page: 1,
    size: 10
  }),

  getters: {
    articleList: (state) => state.articles,
    getCurrentArticle: (state) => state.currentArticle,
    getTotalCount: (state) => state.total
  },

  actions: {
    // 获取文章列表
    async getArticleList(params?: { page?: number; size?: number; categoryId?: number; keyword?: string; status?: number }) {
      const res: any = await request.get('/article/list', {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size,
          categoryId: params?.categoryId,
          keyword: params?.keyword,
          status: params?.status
        }
      })
      
      this.articles = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 获取文章详情
    async getArticleDetail(id: number) {
      const res: any = await request.get(`/article/${id}`)
      this.currentArticle = res.article
      return res
    },

    // 创建文章
    async createArticle(article: { title: string; summary?: string; content?: string; categoryId?: number; status?: number }) {
      // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
      const params = new URLSearchParams()
      params.append('title', article.title)
      if (article.summary) {
        params.append('summary', article.summary)
      }
      if (article.content) {
        params.append('content', article.content)
      }
      if (article.categoryId !== undefined && article.categoryId !== null) {
        params.append('categoryId', article.categoryId.toString())
      }
      if (article.status !== undefined && article.status !== null) {
        params.append('status', article.status.toString())
      }
      
      const res: any = await request.post('/article/create', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 更新文章
    async updateArticle(id: number, article: { title?: string; summary?: string; content?: string; categoryId?: number; status?: number }) {
      // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
      const params = new URLSearchParams()
      if (article.title) {
        params.append('title', article.title)
      }
      if (article.summary) {
        params.append('summary', article.summary)
      }
      if (article.content) {
        params.append('content', article.content)
      }
      if (article.categoryId !== undefined && article.categoryId !== null) {
        params.append('categoryId', article.categoryId.toString())
      }
      if (article.status !== undefined && article.status !== null) {
        params.append('status', article.status.toString())
      }
      
      const res: any = await request.put(`/article/${id}`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    // 删除文章
    async deleteArticle(id: number) {
      const res: any = await request.delete(`/article/${id}`)
      return res
    },

    // 点赞文章
    async likeArticle(id: number) {
      const res: any = await request.post(`/article/${id}/like`)
      return res
    },

    // 取消点赞文章
    async unlikeArticle(id: number) {
      const res: any = await request.post(`/article/${id}/unlike`)
      return res
    },

    // 检查是否点赞
    async checkArticleLiked(id: number) {
      const res: any = await request.get(`/article/${id}/is-liked`)
      return res
    },

    // 获取我的文章
    async getMyArticles(params?: { page?: number; size?: number }) {
      const res: any = await request.get('/article/my', {
        params: {
          page: params?.page || this.page,
          size: params?.size || this.size
        }
      })
      this.articles = res.data.records
      this.total = res.data.total
      this.page = res.data.current
      this.size = res.data.size
      return res
    },

    // 获取热门文章
    async getHotArticles(limit?: number) {
      const res: any = await request.get('/article/hot', {
        params: { limit }
      })
      return res
    },

    // 获取推荐文章
    async getRecommendedArticles(limit?: number) {
      const res: any = await request.get('/article/recommended', {
        params: { limit }
      })
      return res
    },

    // 获取个性化推荐
    async getPersonalizedRecommendations(limit?: number) {
      const res: any = await request.get('/recommend/personal', {
        params: { limit }
      })
      return res
    },

    // 获取热门推荐（新API）
    async getHotRecommendations(limit?: number, timeRange?: string) {
      const res: any = await request.get('/recommend/hot', {
        params: { limit, timeRange }
      })
      return res
    },

    // 获取相关推荐
    async getRelatedRecommendations(articleId: number, limit?: number) {
      const res: any = await request.get('/recommend/related', {
        params: { articleId, limit }
      })
      return res
    },

    // 记录推荐反馈
    async recordRecommendationFeedback(articleId: number, action: string, score?: number) {
      const res: any = await request.post('/recommend/feedback', {
        articleId,
        action,
        score
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return res
    },

    //搜索文章
    async searchArticles(params) {
      const res = await request.get('/article/search', { params })
      return res.data  // 返回分页对象 { records, total, size, current, pages }
    },
    // 发布文章
    async publishArticle(id: number) {
      const res: any = await request.post(`/article/${id}/publish`)
      return res
    }
  }
})