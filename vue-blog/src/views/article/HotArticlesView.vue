<template>
  <div class="hot-articles-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header>
        <div class="header-content">
          <h1 class="blog-title">维他命博客</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal">
            <el-menu-item index="home" @click="$router.push('/')">首页</el-menu-item>
            <el-menu-item index="categories" @click="$router.push('/categories')">分类</el-menu-item>
            <el-menu-item index="hot" @click="$router.push('/hot')">热门</el-menu-item>
            <el-menu-item index="recommended" @click="$router.push('/recommended')">推荐</el-menu-item>
            <template v-if="userStore.isLoggedIn">
              <el-sub-menu index="profile">
                <template #title>{{ userStore.user.username }}</template>
                <el-menu-item index="my-articles" @click="$router.push('/my-articles')">我的文章</el-menu-item>
                <el-menu-item index="my-comments" @click="$router.push('/my-comments')">我的评论</el-menu-item>
                <el-menu-item index="profile" @click="$router.push('/profile')">个人中心</el-menu-item>
                <el-menu-item index="create" @click="$router.push('/create-article')">写文章</el-menu-item>
                <el-menu-item index="admin" v-if="userStore.isAdmin" @click="$router.push('/admin')">管理后台</el-menu-item>
                <el-menu-item index="logout" @click="handleLogout">退出登录</el-menu-item>
              </el-sub-menu>
            </template>
            <template v-else>
              <el-menu-item index="login" @click="$router.push('/login')">登录</el-menu-item>
              <el-menu-item index="register" @click="$router.push('/register')">注册</el-menu-item>
            </template>
          </el-menu>
        </div>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <!-- 左侧热门文章列表 -->
          <el-col :span="16">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>热门文章</span>
                </div>
              </template>
              <div class="article-list">
                <el-card v-for="article in articles" :key="article.id" shadow="hover" class="article-item">
                  <div class="article-content">
                    <h3 class="article-title">
                      <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
                    </h3>
                    <p class="article-summary">{{ article.summary }}</p>
                    <div class="article-meta">
                      <span>{{ article.author?.username }}</span>
                      <span>{{ article.createTime }}</span>
                      <el-button link @click="handleLike(article)">
                        <el-icon>
                          <StarFilled v-if="article.isLiked" />
                          <Star v-else />
                        </el-icon>
                        {{ article.likeCount }}
                      </el-button>
                      <el-button link>
                        <el-icon><ChatDotRound /></el-icon>
                        {{ article.commentCount }}
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </div>
              <!-- 分页 -->
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="pagination.page"
                  v-model:page-size="pagination.size"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="total"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </el-card>
          </el-col>

          <!-- 右侧边栏 -->
          <el-col :span="8">
            <!-- 搜索框 -->
            <el-card shadow="hover" class="sidebar-card">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索文章..."
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch"><el-icon><Search /></el-icon></el-button>
                </template>
              </el-input>
            </el-card>

            <!-- 分类列表 -->
            <el-card shadow="hover" class="sidebar-card">
              <template #header>
                <div class="card-header">
                  <span>文章分类</span>
                </div>
              </template>
              <div class="category-list">
                <div v-for="category in categories" :key="category.id" class="category-item">
                  <router-link :to="`/category/${category.id}`">{{ category.name }}</router-link>
                  <span class="category-count">{{ category.articleCount || 0 }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-main>

      <el-footer>
        <div class="footer-content">
          <p>维他命博客 &copy; 2026</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'
import { Star, StarFilled, ChatDotRound, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()

const activeIndex = ref('hot')
const searchKeyword = ref('')
const categories = ref([])
const total = computed(() => articleStore.total)

// 分页信息
const pagination = computed({
  get: () => ({ page: articleStore.page, size: articleStore.size }),
  set: (val) => {
    articleStore.page = val.page
    articleStore.size = val.size
  }
})

// 文章列表
const articles = ref([])

// 初始化页面数据
onMounted(async () => {
  await userStore.getCurrentUser().catch(() => {})
  await getHotArticles()
  await getCategories()
})

// 获取热门文章
const getHotArticles = async () => {
  try {
    const res = await articleStore.getHotRecommendations(20, 'week')
    articles.value = res.articles
  } catch (error) {
    console.error('获取热门文章失败:', error)
    // 失败时回退到旧的热门文章API
    try {
      await articleStore.getHotArticles()
      articles.value = articleStore.articles
    } catch (fallbackError) {
      console.error('回退获取热门文章失败:', fallbackError)
      ElMessage.error('获取热门文章失败')
    }
  }
}

// 获取分类列表
const getCategories = async () => {
  try {
    const res = await categoryStore.getAllCategories()
    categories.value = res.categories
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 搜索文章
const handleSearch = async () => {
  if (searchKeyword.value.trim()) {
    try {
      await articleStore.getArticleList({ keyword: searchKeyword.value.trim() })
    } catch (error) {
      console.error('搜索文章失败:', error)
      ElMessage.error('搜索文章失败')
    }
  }
}

// 点赞文章
const handleLike = async (article) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    if (article.isLiked) {
      await articleStore.unlikeArticle(article.id)
      article.likeCount--
      article.isLiked = false
      ElMessage.success('取消点赞成功')
    } else {
      await articleStore.likeArticle(article.id)
      article.likeCount++
      article.isLiked = true
      ElMessage.success('点赞成功')
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 分页大小变化
const handleSizeChange = async (size) => {
  try {
    const res = await articleStore.getHotRecommendations(size, 'week')
    articles.value = res.articles
  } catch (error) {
    console.error('获取热门文章失败:', error)
    // 失败时回退到旧的热门文章API
    try {
      await articleStore.getHotArticles({
        page: articleStore.page,
        size
      })
      articles.value = articleStore.articles
    } catch (fallbackError) {
      console.error('回退获取热门文章失败:', fallbackError)
      ElMessage.error('获取热门文章失败')
    }
  }
}

// 页码变化
const handleCurrentChange = async (page) => {
  try {
    // 新的热门推荐API暂时不支持分页，使用固定大小
    const res = await articleStore.getHotRecommendations(articleStore.size, 'week')
    articles.value = res.articles
  } catch (error) {
    console.error('获取热门文章失败:', error)
    // 失败时回退到旧的热门文章API
    try {
      await articleStore.getHotArticles({
        page,
        size: articleStore.size
      })
      articles.value = articleStore.articles
    } catch (fallbackError) {
      console.error('回退获取热门文章失败:', fallbackError)
      ElMessage.error('获取热门文章失败')
    }
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    router.push('/login')
  }
}
</script>

<style scoped>
.hot-articles-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.blog-title {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  margin-bottom: 16px;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: bold;
}

.article-title a {
  color: #333;
  text-decoration: none;
}

.article-title a:hover {
  color: #409eff;
}

.article-summary {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
  align-items: center;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.sidebar-card {
  margin-bottom: 20px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.category-item a {
  color: #333;
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.category-item a:hover {
  color: #409eff;
}

.category-count {
  font-size: 12px;
  color: #999;
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.footer-content {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>