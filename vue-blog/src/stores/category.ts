import { defineStore } from 'pinia'
import request from '../utils/request'

interface Category {
  id: number
  name: string
  description: string
  parentId: number | null
  sortOrder: number
  articleCount: number
  children?: Category[]
}

interface CategoryState {
  categories: Category[]
  categoryTree: Category[]
  currentCategory: Category | null
}

export const useCategoryStore = defineStore('category', {
  state: (): CategoryState => ({
    categories: [],
    categoryTree: [],
    currentCategory: null
  }),

  getters: {
    getCategories: (state) => state.categories,
    getCategoryTree: (state) => state.categoryTree,
    getCurrentCategory: (state) => state.currentCategory
  },

  actions: {
    // 获取所有分类列表
    async getAllCategories() {
      try {
        const res: any = await request.get('/category/list')
        this.categories = res.categories
        return res
      } catch (error) {
        console.error('获取分类列表失败:', error)
        return { success: false, message: '获取分类列表失败' }
      }
    },

    // 获取分类树形结构
    async fetchCategoryTree() {
      try {
        const res: any = await request.get('/category/tree')
        this.categoryTree = res.tree
        return res
      } catch (error) {
        console.error('获取分类树形结构失败:', error)
        return { success: false, message: '获取分类树形结构失败' }
      }
    },

    // 获取分类详情
    async getCategoryDetail(id: number) {
      try {
        const res: any = await request.get(`/category/${id}`)
        this.currentCategory = res.category
        return res
      } catch (error) {
        console.error('获取分类详情失败:', error)
        return { success: false, message: '获取分类详情失败' }
      }
    },

    // 创建分类（仅管理员）
    async createCategory(category: { name: string; description?: string; parentId?: number; sortOrder?: number }) {
      try {
        // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
        const params = new URLSearchParams()
        params.append('name', category.name)
        if (category.description) {
          params.append('description', category.description)
        }
        if (category.parentId !== undefined && category.parentId !== null) {
          params.append('parentId', category.parentId.toString())
        }
        if (category.sortOrder !== undefined && category.sortOrder !== null) {
          params.append('sortOrder', category.sortOrder.toString())
        }
        
        const res: any = await request.post('/category/create', params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        return res
      } catch (error) {
        console.error('创建分类失败:', error)
        throw error
      }
    },

    // 更新分类（仅管理员）
    async updateCategory(id: number, category: { name?: string; description?: string; parentId?: number; sortOrder?: number }) {
      try {
        // 使用URLSearchParams构造表单数据，符合后端@RequestParam要求
        const params = new URLSearchParams()
        if (category.name) {
          params.append('name', category.name)
        }
        if (category.description) {
          params.append('description', category.description)
        }
        if (category.parentId !== undefined && category.parentId !== null) {
          params.append('parentId', category.parentId.toString())
        }
        if (category.sortOrder !== undefined && category.sortOrder !== null) {
          params.append('sortOrder', category.sortOrder.toString())
        }
        
        const res: any = await request.put(`/category/${id}`, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        return res
      } catch (error) {
        console.error('更新分类失败:', error)
        throw error
      }
    },

    // 删除分类（仅管理员）
    async deleteCategory(id: number) {
      try {
        const res: any = await request.delete(`/category/${id}`)
        return res
      } catch (error) {
        console.error('删除分类失败:', error)
        throw error
      }
    },

    // 获取分类下的文章数量
    async getCategoryArticleCount(id: number) {
      try {
        const res: any = await request.get(`/category/${id}/article-count`)
        return res
      } catch (error) {
        console.error('获取分类文章数量失败:', error)
        return { success: false, message: '获取分类文章数量失败' }
      }
    },

    // 获取一级分类列表
    async getRootCategories() {
      try {
        const res: any = await request.get('/category/root')
        return res
      } catch (error) {
        console.error('获取一级分类列表失败:', error)
        return { success: false, message: '获取一级分类列表失败' }
      }
    },

    // 获取子分类列表
    async getChildCategories(id: number) {
      try {
        const res: any = await request.get(`/category/${id}/children`)
        return res
      } catch (error) {
        console.error('获取子分类列表失败:', error)
        return { success: false, message: '获取子分类列表失败' }
      }
    }
  }
})