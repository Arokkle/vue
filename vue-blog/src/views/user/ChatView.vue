<template>
  <div class="chat-container">
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
        <el-card shadow="hover" class="chat-card">
          <template #header>
            <div class="card-header">
              <span>与 {{ friendInfo?.username || '好友' }} 聊天</span>
              <el-button type="info" size="small" @click="$router.push('/my-friends')">返回好友列表</el-button>
            </div>
          </template>
          
          <!-- 聊天记录 -->
          <div class="chat-messages" ref="messagesContainer">
            <div v-for="message in messages" :key="message.id" :class="['message-item', message.senderId === userStore.user.id ? 'sent' : 'received']">
              <div class="message-content">
                <div class="message-sender">{{ message.senderInfo.username }}</div>
                <div class="message-text">{{ message.content }}</div>
                <div class="message-time">{{ formatTime(message.sendTime) }}</div>
              </div>
            </div>
            <div v-if="messages.length === 0" class="no-messages">
              <p>暂无消息，开始聊天吧！</p>
            </div>
          </div>
          
          <!-- 消息输入框 -->
          <div class="chat-input-container">
            <el-input
              v-model="messageContent"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              @keyup.enter.exact="sendMessage"
            />
            <el-button type="primary" @click="sendMessage" :disabled="!messageContent.trim()">发送</el-button>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useNotificationStore } from '../../stores/notification'
import { Bell } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import webSocket from '../../utils/websocket'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const activeIndex = ref('my-friends')
const friendId = computed(() => Number(route.params.friendId))
const friendInfo = ref(null)
const messages = ref([])
const messageContent = ref('')
const messagesContainer = ref(null)

// 初始化页面数据
onMounted(async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  
  if (!friendId.value) {
    ElMessage.error('好友ID不能为空')
    router.push('/my-friends')
    return
  }
  
  try {
    // 尝试获取用户信息，但不阻塞后续操作
    if (!userStore.user) {
      try {
        await userStore.getCurrentUser()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 继续执行，不中断初始化
      }
    }
    
    // 尝试获取好友信息
    try {
      await fetchFriendInfo()
    } catch (error) {
      console.error('获取好友信息失败:', error)
      // 继续执行，不中断初始化
    }
    
    // 尝试获取聊天历史
    try {
      await fetchChatHistory()
    } catch (error) {
      console.error('获取聊天历史失败:', error)
      // 继续执行，不中断初始化
    }
    
    // 尝试连接WebSocket
    try {
      initWebSocket()
    } catch (error) {
      console.error('连接WebSocket失败:', error)
      // 继续执行，不中断初始化
    }
  } catch (error) {
    console.error('初始化聊天页面失败:', error)
    // 不再显示错误提示，避免影响用户体验
  }
})

// 获取好友信息
const fetchFriendInfo = async () => {
  try {
    const response = await axios.get(`/api/user/${friendId.value}`)
    friendInfo.value = response.data.user
  } catch (error) {
    console.error('获取好友信息失败:', error)
    ElMessage.error('获取好友信息失败')
  }
}

// 获取聊天历史
const fetchChatHistory = async () => {
  try {
    const response = await axios.get(`/api/message/history/${friendId.value}`)
    messages.value = response.data.data
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('获取聊天历史失败:', error)
    ElMessage.error('获取聊天历史失败')
  }
}

// 发送消息
const sendMessage = async () => {
  if (!messageContent.value.trim()) return
  
  try {
    const content = messageContent.value.trim()
    // 先创建本地消息对象，立即显示
    const tempMessage = {
      id: Date.now(), // 临时ID
      senderId: userStore.user.id,
      receiverId: friendId.value,
      content: content,
      msgType: 1,
      sendTime: new Date().toISOString(),
      senderInfo: userStore.user,
      receiverInfo: friendInfo.value
    }
    messages.value.push(tempMessage)
    messageContent.value = ''
    await nextTick()
    scrollToBottom()
    
    // 发送消息到服务器
    await axios.post('/api/message/send', {
      receiverId: friendId.value,
      content: content,
      msgType: 1 // 1表示文本消息
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
    // 发送失败时，移除临时消息
    messages.value = messages.value.filter(msg => msg.id !== Date.now())
  }
}

// WebSocket 消息回调
const onWebSocketMessage = (message) => {
  if (message.type === 'CHAT_MESSAGE') {
    // 检查是否是当前聊天的消息
    if ((message.receiverId === userStore.user.id || message.senderId === userStore.user.id) && 
        (message.receiverId === friendId.value || message.senderId === friendId.value)) {
      messages.value.push(message)
      nextTick(() => {
        scrollToBottom()
      })
    } else if (message.receiverId === userStore.user.id) {
      // 如果是其他好友发来的消息，添加到通知列表
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
    }
  }
}

// 连接 WebSocket
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

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleString()
}

// 处理通知下拉菜单命令
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
.chat-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.chat-card {
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

.chat-messages {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.message-item {
  margin-bottom: 16px;
  display: flex;
}

.message-item.sent {
  justify-content: flex-end;
}

.message-item.received {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
}

.message-item.sent .message-content {
  background-color: #8BC34A;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.received .message-content {
  background-color: #eaeaea;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-sender {
  font-size: 12px;
  margin-bottom: 4px;
  opacity: 0.8;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  text-align: right;
}

.no-messages {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 16px;
}

.chat-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input-container .el-input {
  flex: 1;
}

.chat-input-container .el-button {
  align-self: flex-end;
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
  
  .chat-card {
    margin: 10px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .chat-input-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chat-input-container .el-button {
    align-self: stretch;
  }
}
</style>