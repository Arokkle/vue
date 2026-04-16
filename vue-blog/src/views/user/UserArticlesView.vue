<template>
  <div class="user-articles-container">
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
            <!-- 通知图标 -->
            <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" class="notification-badge">
              <el-dropdown trigger="click" @command="handleNotificationCommand">
                <el-button :icon="Bell" circle size="small" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 好友通知 -->
                    <template v-if="notificationStore.pendingFriendRequests.length > 0">
                      <el-dropdown-item disabled class="notification-section-title">好友通知</el-dropdown-item>
                      <el-dropdown-item v-for="req in notificationStore.pendingFriendRequests" :key="req.id">
                        <div class="notification-item">
                          <div class="notification-content">
                            <span class="notification-sender">{{ req.senderName }}</span> 请求添加好友
                          </div>
                          <div class="notification-actions">
                            <el-button size="small" type="primary" @click.stop="handleFriendRequest(req.senderId, 1)">同意</el-button>
                            <el-button size="small" type="info" @click.stop="handleFriendRequest(req.senderId, 2)">拒绝</el-button>
                          </div>
                        </div>
                      </el-dropdown-item>
                    </template>
                    
                    <!-- 私信通知 -->
                    <template v-if="notificationStore.unreadMessages.length > 0">
                      <el-dropdown-item disabled class="notification-section-title">私信通知</el-dropdown-item>
                      <el-dropdown-item v-for="msg in notificationStore.unreadMessages" :key="msg.id" @click="navigateToChat(msg.senderId)">
                        <div class="notification-item">
                          <div class="notification-content">
                            <span class="notification-sender">{{ msg.senderName }}</span> 给你发送了一条消息
                          </div>
                          <div class="notification-preview">{{ msg.content.substring(0, 20) }}...</div>
                        </div>
                      </el-dropdown-item>
                    </template>
                    
                    <!-- 无通知 -->
                    <el-dropdown-item v-if="notificationStore.unreadCount === 0" disabled>
                      暂无新通知
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-badge>
              <el-sub-menu index="profile">
                <template #title>{{ userStore.user.username }}</template>
                <el-menu-item index="my-articles" @click="$router.push('/my-articles')">我的文章</el-menu-item>
                <el-menu-item index="my-comments" @click="$router.push('/my-comments')">我的评论</el-menu-item>
                <el-menu-item index="my-friends" @click="$router.push('/my-friends')">我的好友</el-menu-item>
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
        <el-card shadow="hover" class="user-articles-card">
          <template #header>
            <div class="card-header">
              <span>{{ userInfo.username }}的文章</span>
            </div>
          </template>
          
          <!-- 文章列表 -->
          <div class="articles-list">
            <el-card v-for="article in articles" :key="article.id" shadow="hover" class="article-item">
              <div class="article-content">
                <h3 class="article-title" @click="navigateToArticle(article.id)">{{ article.title }}</h3>
                <p class="article-summary">{{ article.summary }}</p>
                <div class="article-meta">
                  <span class="article-date">{{ formatDate(article.createTime) }}</span>
                  <span class="article-views">浏览 {{ article.viewCount }}</span>
                  <span class="article-likes">点赞 {{ article.likeCount }}</span>
                  <span class="article-comments">评论 {{ article.commentCount }}</span>
                </div>
              </div>
            </el-card>
            <div v-if="articles.length === 0" class="no-articles">
              <p>该用户暂无文章</p>
            </div>
          </div>
        </el-card>
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
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useArticleStore } from '../../stores/article'
import { useNotificationStore } from '../../stores/notification'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const articleStore = useArticleStore()
const notificationStore = useNotificationStore()

const activeIndex = ref('user-articles')
const articles = ref([])
const userInfo = ref({ username: '加载中...' })

// 初始化页面数据
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    const userId = route.params.id
    await userStore.getCurrentUser()
    await fetchUserArticles(userId)
    await fetchUserInfo(userId)
  } catch (error) {
    console.error('获取用户文章失败:', error)
    ElMessage.error('获取用户文章失败')
  }
})

// 获取用户文章
const fetchUserArticles = async (userId) => {
  try {
    await articleStore.fetchUserArticles(userId)
    articles.value = articleStore.userArticles
  } catch (error) {
    console.error('获取用户文章失败:', error)
    throw error
  }
}

// 获取用户信息
const fetchUserInfo = async (userId) => {
  try {
    const user = await userStore.getUserInfo(userId)
    userInfo.value = user
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 继续执行，不影响文章显示
  }
}

// 跳转到文章详情
const navigateToArticle = (articleId) => {
  router.push(`/article/${articleId}`)
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 处理通知下拉菜单命令（点击同意/拒绝时触发）
const handleFriendRequest = async (friendId, status) => {
  try {
    await notificationStore.handleRequest(friendId, status)
    ElMessage.success(status === 1 ? '已同意好友请求' : '已拒绝好友请求')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使退出登录失败，也重定向到登录页
    router.push('/login')
  }
}

// 处理通知命令
const handleNotificationCommand = (command) => {
  console.log('Notification command:', command)
}

// 跳转到聊天页面
const navigateToChat = (friendId) => {
  router.push(`/chat/${friendId}`)
}
</script>

<style scoped>
.user-articles-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.user-articles-card {
  margin: 20px auto;
  max-width: 800px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.article-item {
  margin-bottom: 0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(204, 204, 204, 0.1);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
}

.article-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #8BC34A;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.article-content {
  padding: 20px;
}

.article-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-title:hover {
  color: #8BC34A;
}

.article-summary {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.no-articles {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 16px;
}

/* 头部样式 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 70px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.blog-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-title:hover {
  transform: scale(1.05);
  text-decoration: none;
}

/* 导航菜单样式优化 */
.el-menu-demo {
  background-color: transparent;
  border-bottom: none;
}

.el-menu-demo .el-menu-item {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  height: 70px;
  line-height: 70px;
}

.el-menu-demo .el-menu-item:hover {
  color: var(--primary-color);
  background-color: transparent;
}

.el-menu-demo .el-menu-item.is-active {
  color: var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
  background-color: transparent;
}

.el-menu-demo .el-sub-menu .el-sub-menu__title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  height: 70px;
  line-height: 70px;
  transition: all 0.3s ease;
}

.el-menu-demo .el-sub-menu .el-sub-menu__title:hover {
  color: var(--primary-color);
  background-color: transparent;
}

/* 页脚样式 */
.footer-content {
  text-align: center;
  padding: 32px 0;
  color: var(--text-light);
  font-size: 14px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  border-top: 1px solid var(--medium-gray);
  margin-top: 40px;
  background-color: #fff;
}

.footer-content p {
  margin: 0;
  color: var(--text-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }
  
  .el-main {
    padding: 16px;
  }
  
  .article-content {
    padding: 16px;
  }
  
  .article-title {
    font-size: 16px;
  }
  
  .article-meta {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>