<template>
  <div class="search-container">
    <el-container>
      <!-- 顶部导航栏（可复用首页的导航组件，建议抽离为公共组件） -->
      <el-header>
        <!-- 这里可以复用首页的导航栏，或使用相同的布局 -->
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
        <!-- 搜索框（可保留在当前页，方便重新搜索） -->
        <el-card shadow="hover" class="search-box-card">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章或用户..."
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch"><el-icon><Search /></el-icon></el-button>
            </template>
          </el-input>
        </el-card>

        <!-- 搜索结果 -->
        <el-tabs v-model="activeTab" class="search-tabs">
          <el-tab-pane label="文章" name="articles">
            <div v-if="loading.articles" class="loading">加载中...</div>
            <div v-else-if="articleResults.length === 0" class="no-result">没有找到相关文章</div>
            <el-card v-for="article in articleResults" :key="article.id" shadow="hover" class="result-item">
              <h3>
                <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
              </h3>
              <p>{{ article.summary }}</p>
              <div class="meta">
                <span>{{ article.author?.username }}</span>
                <span>{{ article.createTime }}</span>
                <span><el-icon><Star /></el-icon> {{ article.likeCount || 0 }}</span>
                <span><el-icon><ChatDotRound /></el-icon> {{ article.commentCount || 0 }}</span>
              </div>
            </el-card>
            <!-- 文章分页 -->
            <el-pagination
              v-if="articleTotal > articlePageSize"
              v-model:current-page="articlePage"
              v-model:page-size="articlePageSize"
              :total="articleTotal"
              layout="prev, pager, next"
              @current-change="searchArticles"
            />
          </el-tab-pane>

          <el-tab-pane label="用户" name="users">
            <div v-if="loading.users" class="loading">加载中...</div>
            <div v-else-if="userResults.length === 0" class="no-result">没有找到相关用户</div>
            <el-card v-for="user in userResults" :key="user.id" shadow="hover" class="result-item">
              <div class="user-info">
                <el-avatar :size="40" :src="user.avatar || defaultAvatar"></el-avatar>
                <div class="user-detail">
                  <router-link :to="`/user/${user.id}`">{{ user.username }}</router-link>
                  <p>{{ user.bio || '暂无简介' }}</p>
                </div>
                <div class="user-actions">
                  <el-button 
                    v-if="!user.isFriend && !user.requestSent" 
                    type="primary" 
                    size="small" 
                    @click="sendFriendRequest(user)"
                  >添加好友</el-button>
                  <el-button 
                    v-else-if="user.requestSent" 
                    type="info" 
                    size="small" 
                    disabled
                  >已发送请求</el-button>
                  <el-button 
                    v-else 
                    type="success" 
                    size="small" 
                    disabled
                  >已是好友</el-button>
                </div>
              </div>
            </el-card>
            <!-- 用户分页 -->
            <el-pagination
              v-if="userTotal > userPageSize"
              v-model:current-page="userPage"
              v-model:page-size="userPageSize"
              :total="userTotal"
              layout="prev, pager, next"
              @current-change="searchUsers"
            />
          </el-tab-pane>
        </el-tabs>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useArticleStore } from '../stores/article'
import { useFriendStore } from '../stores/friend'
import { Star, ChatDotRound, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const articleStore = useArticleStore()
const friendStore = useFriendStore()

const sendFriendRequest = async (user) => {
  try {
    await friendStore.sendFriendRequest(user.id)
    user.requestSent = true  // 立即更新按钮状态
    ElMessage.success('好友请求已发送')
  } catch (error) {
    ElMessage.error('发送失败：' + (error.response?.data?.message || '未知错误'))
  }
}

// 搜索关键词
const searchKeyword = ref('')
// 当前激活的 tab
const activeTab = ref('articles')
// 文章搜索结果
const articleResults = ref([])
const articleTotal = ref(0)
const articlePage = ref(1)
const articlePageSize = ref(10)
// 用户搜索结果
const userResults = ref([])
const userTotal = ref(0)
const userPage = ref(1)
const userPageSize = ref(10)
// 加载状态
const loading = ref({ articles: false, users: false })

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 初始化：从 URL 获取关键词并搜索
onMounted(() => {
  const q = route.query.q
  if (q) {
    searchKeyword.value = q
    searchAll()
  }
})

// 监听路由参数变化（当用户在同一页面再次搜索时）
watch(() => route.query.q, (newQ) => {
  if (newQ) {
    searchKeyword.value = newQ
    searchAll()
  }
})

// 执行全部搜索
const searchAll = () => {
  searchArticles()
  searchUsers()
}

// 搜索文章
const searchArticles = async () => {
  if (!searchKeyword.value) return
  loading.value.articles = true
  try {
    // 调用 articleStore 的搜索方法
    const res = await articleStore.searchArticles({
      keyword: searchKeyword.value,
      page: articlePage.value,
      size: articlePageSize.value
    })
    // 根据返回结构赋值（res 是 { records, total, ... }）
    articleResults.value = res.records || []
    articleTotal.value = res.total || 0
    console.log('文章搜索结果:', res)  // 可临时查看
  } catch (error) {
    ElMessage.error('搜索文章失败')
    console.error(error)
  } finally {
    loading.value.articles = false
  }
}

// 搜索用户（需要在 userStore 中实现 searchUsers 方法）
const searchUsers = async () => {
  if (!searchKeyword.value) return
  loading.value.users = true
  try {
    const res = await userStore.searchUsers({
      keyword: searchKeyword.value,
      page: userPage.value,
      size: userPageSize.value
    })
    // 根据实际返回结构，res 现在是 { records, total, size, current, pages }
    userResults.value = res.records || []    
    userTotal.value = res.total || 0
    console.log('用户搜索结果:', res) // 可临时查看数据
  } catch (error) {
    ElMessage.error('搜索用户失败')
    console.error(error)
  } finally {
    loading.value.users = false
  }
}

// 处理本页搜索框的搜索
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchKeyword.value.trim() }
    })
  }
}

// 退出登录（可复用首页的逻辑）
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
.search-container {
  min-height: 100vh;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.blog-title {
  font-size: 24px;
  color: #409EFF;
  margin: 0;
}
.el-menu-demo {
  flex: 1;
  justify-content: flex-end;
  border-bottom: none;
}
.search-box-card {
  margin-bottom: 20px;
}
.search-tabs {
  margin-top: 20px;
}
.result-item {
  margin-bottom: 15px;
}
.result-item h3 {
  margin: 0 0 10px;
}
.meta {
  display: flex;
  gap: 15px;
  color: #909399;
  font-size: 14px;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}
.user-detail {
  flex: 1;
}
.user-detail p {
  margin: 5px 0 0;
  color: #606266;
  font-size: 14px;
}
.loading, .no-result {
  text-align: center;
  padding: 40px;
  color: #909399;
}
.footer-content {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
</style>