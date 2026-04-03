<template>
  <div class="categories-container">
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
          <!-- 左侧分类列表 -->
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>文章分类</span>
                </div>
              </template>
              <div class="category-list">
                <el-card 
                  v-for="category in categories" 
                  :key="category.id" 
                  shadow="hover" 
                  class="category-item"
                  @click="navigateToCategory(category.id)"
                >
                  <div class="category-content">
                    <h3 class="category-name">{{ category.name }}</h3>
                    <p class="category-description">{{ category.description || '暂无描述' }}</p>
                    <div class="category-meta">
                      <span class="article-count">{{ category.articleCount || 0 }} 篇文章</span>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧热门文章 -->
          <el-col :span="8">
            <!-- 热门文章 -->
            <el-card shadow="hover" class="sidebar-card">
              <template #header>
                <div class="card-header">
                  <span>热门文章</span>
                </div>
              </template>
              <div class="hot-articles">
                <div v-for="article in hotArticles" :key="article.id" class="hot-article-item">
                  <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
                  <div class="hot-article-meta">
                    <span>{{ article.likeCount }} 赞</span>
                    <span>{{ article.commentCount }} 评论</span>
                  </div>
                </div>
              </div>
            </el-card>

            <!-- 推荐文章 -->
            <el-card shadow="hover" class="sidebar-card">
              <template #header>
                <div class="card-header">
                  <span>推荐文章</span>
                </div>
              </template>
              <div class="recommended-articles">
                <div v-for="article in recommendedArticles" :key="article.id" class="recommended-article-item">
                  <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useCategoryStore } from '../../stores/category'
import { useArticleStore } from '../../stores/article'

const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const articleStore = useArticleStore()

const activeIndex = ref('categories')
const categories = ref([])
const hotArticles = ref([])
const recommendedArticles = ref([])

// 初始化页面数据
onMounted(async () => {
  await userStore.getCurrentUser().catch(() => {})
  await getAllCategories()
  await getHotArticles()
  await getRecommendedArticles()
})

// 获取所有分类
const getAllCategories = async () => {
  try {
    const res = await categoryStore.getAllCategories()
    categories.value = res.categories
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 获取热门文章
const getHotArticles = async () => {
  try {
    const res = await articleStore.getHotArticles(5)
    hotArticles.value = res.articles
  } catch (error) {
    console.error('获取热门文章失败:', error)
  }
}

// 获取推荐文章
const getRecommendedArticles = async () => {
  try {
    const res = await articleStore.getRecommendedArticles(5)
    recommendedArticles.value = res.articles
  } catch (error) {
    console.error('获取推荐文章失败:', error)
  }
}

// 跳转到分类文章列表
const navigateToCategory = (categoryId) => {
  router.push(`/category/${categoryId}`)
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
.categories-container {
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.category-item:hover {
  transform: translateY(-2px);
}

.category-content {
  padding: 16px;
}

.category-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.category-description {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.category-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
  align-items: center;
}

.article-count {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 60px;
  text-align: center;
}

.hot-articles, .recommended-articles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-article-item, .recommended-article-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hot-article-item a, .recommended-article-item a {
  color: #333;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.hot-article-item a:hover, .recommended-article-item a:hover {
  color: #409eff;
}

.hot-article-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.sidebar-card {
  margin-bottom: 20px;
}

.footer-content {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>