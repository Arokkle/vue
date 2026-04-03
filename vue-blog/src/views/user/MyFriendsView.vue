<template>
  <div class="my-friends-container">
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
        <el-card shadow="hover" class="friends-card">
          <template #header>
            <div class="card-header">
              <span>我的好友</span>
            </div>
          </template>
          
          <!-- 好友列表 -->
          <div class="friends-list">
            <el-card v-for="friend in friends" :key="friend.id" shadow="hover" class="friend-item">
              <div class="friend-content">
                <div class="friend-info">
                  <h3 class="friend-username">{{ friend.friendInfo.username }}</h3>
                  <p class="friend-remark" v-if="friend.remark">{{ friend.remark }}</p>
                </div>
                <div class="friend-actions">
                  <el-button type="primary" @click="viewFriendArticles(friend.friendInfo.id)">查看文章</el-button>
                  <el-button type="success" @click="sendMessage(friend.friendInfo.id)">发送消息</el-button>
                </div>
              </div>
            </el-card>
            <div v-if="friends.length === 0" class="no-friends">
              <p>暂无好友，去添加好友吧！</p>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useFriendStore } from '../../stores/friend'
import { useNotificationStore } from '../../stores/notification'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const friendStore = useFriendStore()
const notificationStore = useNotificationStore()

const activeIndex = ref('my-friends')
const friends = ref([])

// 初始化页面数据
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  try {
    await userStore.getCurrentUser()
    await friendStore.fetchFriendList()
    friends.value = friendStore.friends
  } catch (error) {
    console.error('获取好友列表失败:', error)
    ElMessage.error('获取好友列表失败')
  }
})

// 查看好友文章
const viewFriendArticles = (friendId) => {
  router.push(`/user/${friendId}/articles`)
}

// 发送消息
const sendMessage = (friendId) => {
  router.push(`/chat/${friendId}`)
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
.my-friends-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.friends-card {
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

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.friend-item {
  margin-bottom: 0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(204, 204, 204, 0.1);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
}

.friend-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #8BC34A;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.friend-content {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.friend-info {
  flex: 1;
}

.friend-username {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.friend-remark {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.friend-actions {
  display: flex;
  gap: 12px;
}

.no-friends {
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
  
  .friend-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .friend-actions {
    align-self: flex-end;
  }
}
</style>