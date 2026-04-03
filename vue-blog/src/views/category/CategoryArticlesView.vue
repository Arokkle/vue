<template>
  <div class="category-articles-container">
    <el-card class="category-articles-card">
      <template #header>
        <div class="card-header">
          <h2>{{ categoryName }} - 文章列表</h2>
        </div>
      </template>
      
      <div class="articles-content">
        <!-- 搜索框 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章标题"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        
        <!-- 文章列表 -->
        <el-card
          v-for="article in articleList"
          :key="article.id"
          shadow="hover"
          class="article-item"
        >
          <template #header>
            <div class="article-header">
              <h3 class="article-title">
                <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
              </h3>
              <span class="article-date">{{ article.createTime }}</span>
            </div>
          </template>
          
          <div class="article-meta">
            <span class="article-author">{{ article.author?.username }}</span>
            <span class="article-category">
              <router-link :to="`/category/${article.categoryId}`">
                {{ getCategoryName(article.categoryId) }}
              </router-link>
            </span>
            <span class="article-comments">{{ article.commentCount }} 评论</span>
            <span class="article-likes">{{ article.likeCount }} 点赞</span>
          </div>
          
          <div class="article-summary">{{ article.summary }}</div>
          
          <div class="article-actions">
            <router-link :to="`/article/${article.id}`" class="read-more">
              阅读全文 <el-icon><ArrowRight /></el-icon>
            </router-link>
          </div>
        </el-card>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'

const route = useRoute()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()

// 加载状态
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 分页信息
const pagination = ref({
  page: 1,
  size: 10
})

// 文章总数
const total = ref(0)

// 文章列表
const articleList = computed(() => articleStore.articles)

// 分类ID
const categoryId = ref(0)

// 分类名称
const categoryName = ref('加载中...')

// 分类映射
const categoryMap = ref<Map<number, string>>(new Map())

// 获取分类下的文章列表
const getCategoryArticles = async () => {
  try {
    loading.value = true
    await articleStore.getArticleList({
      page: pagination.value.page,
      size: pagination.value.size,
      categoryId: categoryId.value,
      keyword: searchKeyword.value
    })
    total.value = articleStore.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
  }
}

// 获取分类名称
const getCategoryNameById = async () => {
  try {
    const res = await categoryStore.getCategoryDetail(categoryId.value)
    if (res.success) {
      categoryName.value = res.category.name
    } else {
      categoryName.value = '未知分类'
    }
  } catch (error) {
    console.error('获取分类名称失败:', error)
    categoryName.value = '未知分类'
  }
}

// 获取所有分类
const getAllCategories = async () => {
  try {
    await categoryStore.getAllCategories()
    // 构建分类映射
    const categories = categoryStore.categories || []
    categoryMap.value = new Map(categories.map(cat => [cat.id, cat.name]))
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 搜索文章
const handleSearch = () => {
  pagination.value.page = 1
  getCategoryArticles()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  pagination.value.page = 1
  getCategoryArticles()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  getCategoryArticles()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  getCategoryArticles()
}

// 根据分类ID获取分类名称
const getCategoryName = (id: number) => {
  return categoryMap.value.get(id) || '未知分类'
}

// 初始化
onMounted(() => {
  const id = route.params.id as string
  if (id) {
    categoryId.value = parseInt(id)
    getAllCategories()
    getCategoryNameById()
    getCategoryArticles()
  }
})
</script>

<style scoped>
.category-articles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-articles-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.articles-content {
  margin-top: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar .el-input {
  width: 300px;
}

.article-item {
  margin-bottom: 20px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-title {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
}

.article-title a {
  color: #333;
  text-decoration: none;
}

.article-title a:hover {
  color: #409eff;
}

.article-date {
  font-size: 14px;
  color: #999;
}

.article-meta {
  display: flex;
  gap: 20px;
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}

.article-author {
  font-weight: 500;
}

.article-category a {
  color: #409eff;
  text-decoration: none;
}

.article-category a:hover {
  text-decoration: underline;
}

.article-summary {
  margin: 10px 0;
  color: #333;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-actions {
  margin-top: 15px;
  text-align: right;
}

.read-more {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.read-more:hover {
  text-decoration: underline;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>