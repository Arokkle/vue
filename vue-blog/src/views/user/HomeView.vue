<template>
  <div class="home-container">
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
                    
                    <!-- 文章通知 -->
                    <template v-if="notificationStore.unreadArticleNotifications.length > 0">
                      <el-dropdown-item disabled class="notification-section-title">文章通知</el-dropdown-item>
                      <el-dropdown-item v-for="notif in notificationStore.unreadArticleNotifications" :key="notif.id">
                        <div class="notification-item">
                          <div class="notification-content">
                            <span class="notification-sender">{{ notif.senderName }}</span> {{ notif.content }}
                          </div>
                        </div>
                      </el-dropdown-item>
                    </template>
                    
                    <!-- 系统通知 -->
                    <template v-if="notificationStore.unreadSystemNotifications.length > 0">
                      <el-dropdown-item disabled class="notification-section-title">系统通知</el-dropdown-item>
                      <el-dropdown-item v-for="notif in notificationStore.unreadSystemNotifications" :key="notif.id">
                        <div class="notification-item">
                          <div class="notification-content">{{ notif.content }}</div>
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
        <!-- 轮播图 -->
        <el-row :gutter="20" class="carousel-row">
          <el-col :span="24">
            <el-card shadow="hover" class="carousel-card">
              <el-carousel :interval="5000" height="250px">
                <el-carousel-item v-for="item in displayCarouselItems" :key="item.id">
                  <div class="carousel-item">
                    <router-link :to="item.link || '#'" class="carousel-link">
                      <div class="carousel-content-full">
                        <h3>{{ item.title }}</h3>
                        <p>{{ item.summary || item.description }}</p>
                        <div class="carousel-meta" v-if="item.author">
                          <span class="author">{{ item.author?.username }}</span>
                          <span class="time">{{ item.createTime }}</span>
                          <span class="like">
                            <el-icon><StarFilled /></el-icon>
                            {{ item.likeCount || 0 }}
                          </span>
                        </div>
                        <el-button v-else type="primary" size="small">{{ item.buttonText }}</el-button>
                      </div>
                    </router-link>
                  </div>
                </el-carousel-item>
              </el-carousel>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <!-- 左侧文章列表 -->
          <el-col :span="16">
            <el-card shadow="hover" class="latest-articles-card">
              <template #header>
                <div class="card-header">
                  <span>最新文章</span>
                </div>
              </template>
              <div class="article-list">
                <el-card v-for="article in articleStore.articles" :key="article.id" shadow="hover" class="article-item">
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
                        {{ article.likeCount || 0 }}
                      </el-button>
                      <el-button link>
                        <el-icon><ChatDotRound /></el-icon>
                        {{ article.commentCount || 0 }}
                      </el-button>
                    </div>
                  </div>
                </el-card>
              </div>
              <!-- 分页 -->
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="articleStore.page"
                  v-model:page-size="articleStore.size"
                  :page-sizes="[7, 10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="articleStore.total"
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
                placeholder="搜索文章/用户..."
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch"><el-icon><Search /></el-icon></el-button>
                </template>
              </el-input>
            </el-card>

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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'
import { Star, StarFilled, ChatDotRound, Search, Picture } from '@element-plus/icons-vue'
import { Bell } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'
import { ElMessage } from 'element-plus'
import webSocket from '@/utils/websocket'

const router = useRouter()
const userStore = useUserStore()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()
const notificationStore = useNotificationStore()

const searchKeyword = ref('')
const hotArticles = ref([])
const recommendedArticles = ref([])
const activeIndex = ref('home')
const categories = ref([])
const carouselItems = ref([
  {
    id: 1,
    title: '欢迎来到维他命博客',
    description: '分享知识，交流思想，记录生活的点滴',
    buttonText: '开始探索',
    link: '/'
  },
  {
    id: 2,
    title: '发现精彩内容',
    description: '浏览热门文章，探索分类内容，发现更多精彩',
    buttonText: '查看热门',
    link: '/hot'
  },
  {
    id: 3,
    title: '发布你的文章',
    description: '分享你的知识和经验，与他人交流学习',
    buttonText: '写文章',
    link: '/create-article'
  },
  {
    id: 4,
    title: '参与讨论',
    description: '对文章进行评论和点赞，参与社区讨论',
    buttonText: '加入讨论',
    link: '/'
  }
])

// 轮播图显示数据，优先使用推荐文章，若无则使用默认数据
const displayCarouselItems = computed(() => {
  if (recommendedArticles.value && recommendedArticles.value.length > 0) {
    return recommendedArticles.value;
  }
  return carouselItems.value;
})

// 初始化页面数据
onMounted(async () => {
  await userStore.getCurrentUser().catch(() => {})
  await articleStore.getArticleList().catch(() => {})
  
  // 检查每个文章的点赞状态
  if (userStore.isLoggedIn) {
    for (const article of articleStore.articles) {
      try {
        const res = await articleStore.checkArticleLiked(article.id)
        article.isLiked = res.isLiked || false
      } catch (error) {
        console.error('检查点赞状态失败:', error)
        article.isLiked = false
      }
    }
  } else {
    // 未登录用户，所有文章都未点赞
    for (const article of articleStore.articles) {
      article.isLiked = false
    }
  }
  
  await getHotArticles().catch(() => {})
  await getRecommendedArticles().catch(() => {})
  await getCategories().catch(() => {})
})

// 获取热门文章
const getHotArticles = async () => {
  try {
    const res = await articleStore.getHotArticles(5)
    hotArticles.value = res.articles
  } catch (error) {
    console.error('获取热门文章失败:', error)
  }
}

// 获取推荐文章（使用新的个性化推荐API）
const getRecommendedArticles = async () => {
  try {
    const res = await articleStore.getPersonalizedRecommendations(5)
    recommendedArticles.value = res.articles
  } catch (error) {
    console.error('获取推荐文章失败:', error)
    // 失败时回退到旧的推荐API
    try {
      const res = await articleStore.getRecommendedArticles(5)
      recommendedArticles.value = res.articles
    } catch (fallbackError) {
      console.error('回退获取推荐文章失败:', fallbackError)
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
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchKeyword.value.trim() }
    })
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
      article.likeCount = Math.max(0, article.likeCount - 1)
    } else {
      await articleStore.likeArticle(article.id)
      article.likeCount = (article.likeCount || 0) + 1
    }
    article.isLiked = !article.isLiked
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 分页相关
const handleSizeChange = async (size) => {
  try {
    await articleStore.getArticleList({ size })
    
    // 检查每个文章的点赞状态
    if (userStore.isLoggedIn) {
      for (const article of articleStore.articles) {
        try {
          const res = await articleStore.checkArticleLiked(article.id)
          article.isLiked = res.isLiked || false
        } catch (error) {
          console.error('检查点赞状态失败:', error)
          article.isLiked = false
        }
      }
    } else {
      // 未登录用户，所有文章都未点赞
      for (const article of articleStore.articles) {
        article.isLiked = false
      }
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
}

const handleCurrentChange = async (page) => {
  try {
    await articleStore.getArticleList({ page })
    
    // 检查每个文章的点赞状态
    if (userStore.isLoggedIn) {
      for (const article of articleStore.articles) {
        try {
          const res = await articleStore.checkArticleLiked(article.id)
          article.isLiked = res.isLiked || false
        } catch (error) {
          console.error('检查点赞状态失败:', error)
          article.isLiked = false
        }
      }
    } else {
      // 未登录用户，所有文章都未点赞
      for (const article of articleStore.articles) {
        article.isLiked = false
      }
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
  }
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

// WebSocket 消息回调
const onWebSocketMessage = (message) => {
  console.log('收到WebSocket消息:', message)
  if (message.type === 'FRIEND_REQUEST') {
    // 将收到的请求添加到通知列表
    notificationStore.addNotification({
      id: `friend-${message.data.userId}`,
      type: 'friend',
      title: '好友请求',
      content: `${message.data.friendInfo.username} 请求添加你为好友`,
      senderId: message.data.userId,
      senderName: message.data.friendInfo.username,
      senderAvatar: message.data.friendInfo.avatar,
      isRead: false,
      createTime: new Date().toISOString()
    })
  } else if (message.type === 'CHAT_MESSAGE') {
    // 私信通知
    notificationStore.addNotification({
      id: `message-${message.id}`,
      type: 'message',
      title: '新消息',
      content: message.content,
      senderId: message.senderId,
      senderName: message.senderInfo.username,
      senderAvatar: message.senderInfo.avatar,
      isRead: false,
      createTime: message.sendTime
    })
  } else if (message.type === 'ARTICLE_NOTIFICATION') {
    // 文章通知（点赞、评论）
    notificationStore.addNotification({
      id: `article-${message.id}`,
      type: 'article',
      title: '文章通知',
      content: message.content,
      senderId: message.senderId,
      senderName: message.senderName,
      relatedId: message.relatedId,
      isRead: false,
      createTime: new Date().toISOString()
    })
  } else if (message.type === 'SYSTEM_NOTIFICATION') {
    // 系统通知
    notificationStore.addNotification({
      id: `system-${Date.now()}`,
      type: 'system',
      title: '系统通知',
      content: message.content,
      isRead: false,
      createTime: new Date().toISOString()
    })
  }
}

// 连接 WebSocket（登录成功后）
const initWebSocket = () => {
  if (userStore.isLoggedIn && userStore.user) {
    try {
      webSocket.connect(userStore.token, userStore.user.id)
      webSocket.onMessage(onWebSocketMessage)
    } catch (error) {
      console.error('WebSocket连接失败:', error)
    }
  }
}

// 页面加载时获取已有的通知并连接 WebSocket
onMounted(async () => {
  await userStore.getCurrentUser().catch(() => {})
  await articleStore.getArticleList().catch(() => {})
  
  // 检查每个文章的点赞状态
  if (userStore.isLoggedIn) {
    for (const article of articleStore.articles) {
      try {
        const res = await articleStore.checkArticleLiked(article.id)
        article.isLiked = res.isLiked || false
      } catch (error) {
        console.error('检查点赞状态失败:', error)
        article.isLiked = false
      }
    }
  } else {
    // 未登录用户，所有文章都未点赞
    for (const article of articleStore.articles) {
      article.isLiked = false
    }
  }
  
  await getHotArticles().catch(() => {})
  await getRecommendedArticles().catch(() => {})
  await getCategories().catch(() => {})
  
  if (userStore.isLoggedIn) {
    await notificationStore.fetchReceivedRequests()
    initWebSocket()
  }
})

// 页面卸载时断开 WebSocket
onUnmounted(() => {
  webSocket.disconnect()
})

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

// 跳转到聊天页面
const navigateToChat = (friendId) => {
  router.push(`/chat/${friendId}`)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}
.notification-badge {
  margin-right: 15px;
  cursor: pointer;
}
.notification-item {
  display: flex;
  flex-direction: column;
  padding: 5px 0;
  min-width: 250px;
}
.notification-sender {
  font-weight: bold;
  margin-right: 5px;
}
.notification-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
/* 轮播图样式 */
.carousel-row {
  margin-bottom: 24px;
}

.carousel-card {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.carousel-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.carousel-item {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(139, 195, 74, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%);
  border-radius: 4px;
  overflow: hidden;
}

.carousel-link {
  display: flex;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.carousel-link:hover {
  transform: scale(1.02);
}

/* 全屏内容样式 */
.carousel-content-full {
  width: 100%;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
}

.carousel-content-full h3 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #303133;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  transition: color 0.3s ease;
  max-width: 800px;
}

.carousel-content-full h3:hover {
  color: #8BC34A;
}

.carousel-content-full p {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  display: box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  box-orient: vertical;
  max-width: 700px;
}

.carousel-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.carousel-meta .author {
  font-weight: 500;
  color: #606266;
}

.carousel-meta .time {
  color: #909399;
}

.carousel-meta .like {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #FFB300;
}

.carousel-meta .like .el-icon {
  font-size: 14px;
}

/* 轮播图指示器样式 */
.el-carousel__indicator.is-active .el-carousel__button {
  background-color: #8BC34A;
}

.el-carousel__button {
  background-color: rgba(139, 195, 74, 0.4);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 0 8px;
}

/* 轮播图箭头样式 */
.el-carousel__arrow {
  background-color: rgba(255, 255, 255, 0.8);
  color: #8BC34A;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.el-carousel__arrow:hover {
  background-color: #8BC34A;
  color: #fff;
  transform: scale(1.1);
}

.el-carousel__arrow--left {
  left: 20px;
}

.el-carousel__arrow--right {
  right: 20px;
}

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

/* 文章列表样式 */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: stretch;
}

.article-item {
  margin-bottom: 0;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: var(--transition);
  border: 1px solid rgba(204, 204, 204, 0.1);
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  backdrop-filter: blur(5px);
}

.article-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--box-shadow-xl);
  border-color: var(--primary-light);
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

/* 最新文章栏目外层卡片样式 */
.latest-articles-card {
  border: 1px solid rgba(204, 204, 204, 0.1);
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
}

.latest-articles-card:hover {
  box-shadow: var(--box-shadow-xl);
  border-color: var(--primary-light);
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
}

/* 最新文章栏目头部样式 */
.latest-articles-card .card-header {
  color: #333;
  font-weight: 700;
}

/* 分页容器样式 */
.pagination-container {
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  padding: 20px 0;
  margin-top: 0;
  border-top: 1px solid rgba(204, 204, 204, 0.1);
}

/* 分页组件样式优化 */
.pagination-container .el-pagination {
  margin: 0;
  color: #333;
}

.pagination-container .el-pagination__sizes .el-input .el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(204, 204, 204, 0.2);
}

.pagination-container .el-pagination__sizes .el-input .el-input__inner {
  color: #333;
}

.pagination-container .el-pagination .el-pager li {
  color: #333;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.pagination-container .el-pagination .el-pager li:hover {
  background-color: rgba(255, 255, 255, 0.5);
  color: #333;
}

.pagination-container .el-pagination .el-pager li.is-active {
  background-color: #8BC34A;
  color: white;
  border-color: #8BC34A;
}

.pagination-container .el-pagination__prev,
.pagination-container .el-pagination__next,
.pagination-container .el-pagination__jump-prev,
.pagination-container .el-pagination__jump-next {
  color: #333;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius);
  transition: all 0.3s ease;
}

.pagination-container .el-pagination__prev:hover,
.pagination-container .el-pagination__next:hover,
.pagination-container .el-pagination__jump-prev:hover,
.pagination-container .el-pagination__jump-next:hover {
  background-color: rgba(255, 255, 255, 0.5);
  color: #333;
}

.article-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.article-title {
  margin: 0 0 16px 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  flex-shrink: 0;
}

.article-summary {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 15px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  flex-grow: 1;
}

.article-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-light);
  align-items: center;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--medium-gray);
  flex-shrink: 0;
}

.article-title a {
  color: var(--text-primary);
  text-decoration: none;
  transition: var(--transition);
  display: inline-block;
}

.article-title a:hover {
  color: var(--primary-color);
  text-decoration: none;
  transform: translateX(5px);
}

.article-summary {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 15px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: var(--text-light);
  align-items: center;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 1px solid var(--medium-gray);
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
}

.article-meta span:hover {
  color: var(--primary-color);
  transform: translateY(-2px);
}

.article-meta .el-button {
  padding: 4px 8px;
  font-size: 13px;
  border: none;
  color: var(--text-light);
}

.article-meta .el-button:hover {
  color: var(--primary-color);
  background-color: transparent;
}

.article-meta .el-icon {
  font-size: 16px;
  transition: var(--transition);
}

.article-meta .el-button:hover .el-icon {
  transform: scale(1.2);
}

.article-meta .el-icon.StarFilled {
  color: var(--warning-color);
}

.article-meta .el-button:hover .el-icon.StarFilled {
  color: var(--warning-color);
  transform: scale(1.2);
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 24px 0 0 0;
  border-top: 1px solid var(--medium-gray);
  background-color: #fff;
  border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  margin-bottom: 0;
}

/* 分页样式优化 */
.pagination-container .el-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.pagination-container .el-pagination__sizes .el-input .el-input__wrapper {
  border-radius: var(--border-radius);
  border: 1px solid var(--medium-gray);
  transition: var(--transition);
}

.pagination-container .el-pagination__sizes .el-input .el-input__wrapper:hover,
.pagination-container .el-pagination__sizes .el-input .el-input__wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.pagination-container .el-pagination .el-pager li {
  border-radius: var(--border-radius);
  transition: var(--transition);
  font-weight: 500;
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  margin: 0;
}

.pagination-container .el-pagination .el-pager li:hover {
  color: var(--primary-color);
  background-color: var(--primary-light);
}

.pagination-container .el-pagination .el-pager li.is-active {
  background-color: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
  box-shadow: var(--box-shadow-sm);
}

.pagination-container .el-pagination__prev, 
.pagination-container .el-pagination__next, 
.pagination-container .el-pagination__jump-prev, 
.pagination-container .el-pagination__jump-next {
  border-radius: var(--border-radius);
  transition: var(--transition);
  color: var(--text-secondary);
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  margin: 0;
  border: 1px solid var(--medium-gray);
  background-color: #fff;
}

.pagination-container .el-pagination__prev:hover, 
.pagination-container .el-pagination__next:hover, 
.pagination-container .el-pagination__jump-prev:hover, 
.pagination-container .el-pagination__jump-next:hover {
  color: var(--primary-color);
  background-color: var(--primary-light);
  border-color: var(--primary-color);
  box-shadow: none;
}

/* 调整分页信息文本样式 */
.pagination-container .el-pagination__total {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: 16px;
}

.pagination-container .el-pagination__jump {
  color: var(--text-secondary);
  font-size: 14px;
}

.pagination-container .el-pagination__jump .el-input {
  width: 80px;
}

.pagination-container .el-pagination__jump .el-input .el-input__wrapper {
  border-radius: var(--border-radius);
  border: 1px solid var(--medium-gray);
  transition: var(--transition);
}

.pagination-container .el-pagination__jump .el-input .el-input__wrapper:hover,
.pagination-container .el-pagination__jump .el-input .el-input__wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 边栏样式 */
.sidebar-card {
  margin-bottom: 24px;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  transition: var(--transition);
  border: 1px solid var(--medium-gray);
  background-color: #fff;
}

.sidebar-card:hover {
  box-shadow: var(--box-shadow-lg);
  border-color: var(--primary-light);
  transform: translateY(-2px);
}

.sidebar-card .el-card__header {
  padding: 16px 20px;
  background-color: var(--light-gray);
  border-bottom: 1px solid var(--medium-gray);
}

.sidebar-card .el-card__body {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.card-header span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 热门文章和推荐文章样式 */
.hot-articles, .recommended-articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hot-article-item, .recommended-article-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: var(--border-radius);
  transition: var(--transition);
  background-color: #fff;
  border: 1px solid var(--medium-gray);
}

.hot-article-item:last-child, .recommended-article-item:last-child {
  border-bottom: none;
}

.hot-article-item:hover, .recommended-article-item:hover {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
  transform: translateX(5px);
  box-shadow: var(--box-shadow-sm);
}

.hot-article-item a, .recommended-article-item a {
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: var(--transition);
  font-weight: 500;
}

.hot-article-item a:hover, .recommended-article-item a:hover {
  color: var(--primary-color);
  text-decoration: none;
}

.hot-article-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-light);
}

/* 分类列表样式 */
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
  padding: 12px;
  transition: var(--transition);
  border-radius: var(--border-radius);
  background-color: #fff;
  border: 1px solid var(--medium-gray);
}

.category-item:hover {
  background-color: var(--primary-light);
  border-color: var(--primary-color);
  transform: translateX(5px);
  box-shadow: var(--box-shadow-sm);
  padding: 12px;
}

.category-item a {
  color: var(--text-primary);
  text-decoration: none;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: var(--transition);
  font-weight: 500;
}

.category-item a:hover {
  color: var(--primary-color);
  text-decoration: none;
}

.category-count {
  font-size: 12px;
  color: var(--primary-color);
  background-color: var(--primary-light);
  padding: 4px 12px;
  border-radius: 16px;
  min-width: 32px;
  text-align: center;
  transition: var(--transition);
  font-weight: 500;
}

.category-item:hover .category-count {
  background-color: var(--primary-color);
  color: #fff;
  transform: scale(1.1);
}

/* 搜索框样式 */
.sidebar-card .el-input {
  border-radius: var(--border-radius);
  overflow: hidden;
}

.sidebar-card .el-input__wrapper {
  box-shadow: none;
  border: 2px solid var(--medium-gray);
  transition: var(--transition);
  border-radius: var(--border-radius);
  background-color: #fff;
}

.sidebar-card .el-input__wrapper:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sidebar-card .el-input__wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 搜索按钮样式 */
.sidebar-card .el-input .el-button {
  background-color: var(--primary-color);
  border: none;
  color: #fff;
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  transition: var(--transition);
}

.sidebar-card .el-input .el-button:hover {
  background-color: var(--primary-hover);
  transform: scale(1.05);
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
  
  .article-title {
    font-size: 20px;
  }
  
  .article-meta {
    gap: 12px;
    font-size: 12px;
  }
  
  .sidebar-card {
    margin-bottom: 16px;
  }
}
</style>