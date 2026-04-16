<template>
  <div class="ai-chat-container">
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
            <el-menu-item index="rag-test" @click="$router.push('/rag-test')">RAG测试</el-menu-item>
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
        <el-card shadow="hover" class="ai-chat-card">
          <template #header>
            <div class="card-header">
              <span>AI 助手</span>
              <el-upload
                class="upload-btn"
                action="#"
                :auto-upload="false"
                :on-change="handleFileUpload"
                :show-file-list="false"
                accept=".txt,.md,.pdf"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon> 上传知识库文件
                </el-button>
              </el-upload>
            </div>
          </template>
          
          <!-- AI聊天界面 -->
          <div class="ai-chat-content">
            <!-- 聊天记录 -->
            <div class="chat-messages">
              <div v-for="message in messages" :key="message.id" :class="['message-item', message.type]">
                <div class="message-avatar">
                  <el-avatar v-if="message.type === 'user'" :size="40">{{ message.avatar }}</el-avatar>
                  <el-avatar v-else :size="40" :src="aiAvatar"></el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.content }}</div>
                  <div class="message-time">{{ message.time }}</div>
                </div>
              </div>
            </div>
            
            <!-- 输入区域 -->
            <div class="chat-input-area">
              <el-input
                v-model="inputMessage"
                placeholder="输入你的问题..."
                @keyup.enter="sendMessage"
                type="textarea"
                :rows="2"
              />
              <el-button type="primary" @click="sendMessage" class="send-button">
                  <el-icon><ChatRound /></el-icon> 发送
                </el-button>
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
import { useNotificationStore } from '../../stores/notification'
import { Bell, ChatRound, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { performRAGQuery, addDocument } from '../../rag/services/ragService'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const activeIndex = ref('ai-chat')
const inputMessage = ref('')
const messages = ref([])
const aiAvatar = ref('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20assistant%20icon%20friendly%20robot&image_size=square')

// 初始化页面数据
onMounted(() => {
  // 添加欢迎消息
  addSystemMessage('你好！我是维他命博客的AI助手，有什么可以帮助你的吗？')
})

// 添加系统消息
const addSystemMessage = (content) => {
  messages.value.push({
    id: Date.now(),
    type: 'ai',
    content: content,
    time: new Date().toLocaleTimeString()
  })
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) {
    return
  }
  
  // 生成唯一的用户消息ID
  const userMessageId = Date.now()
  
  // 添加用户消息
  messages.value.push({
    id: userMessageId,
    type: 'user',
    content: inputMessage.value.trim(),
    avatar: userStore.user?.username?.charAt(0) || 'U',
    time: new Date().toLocaleTimeString()
  })
  
  // 清空输入框
  const message = inputMessage.value.trim()
  inputMessage.value = ''
  
  // 显示AI正在输入
  const typingMessageId = Date.now() + 1 // 确保与用户消息ID不同
  messages.value.push({
    id: typingMessageId,
    type: 'ai',
    content: '...',
    time: new Date().toLocaleTimeString()
  })
  
  try {
    // 执行RAG查询，获取相关上下文
    const ragResult = await performRAGQuery(message)
    console.log('RAG查询结果:', ragResult)
    
    // 调用本地Ollama API，使用RAG生成的提示词
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        prompt: ragResult.prompt,
        stream: false
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 移除正在输入的消息
    messages.value = messages.value.filter(msg => msg.id !== typingMessageId)
    
    // 添加AI回复
    addSystemMessage(data.response)
  } catch (error) {
    console.error('调用Ollama API失败:', error)
    // 移除正在输入的消息
    messages.value = messages.value.filter(msg => msg.id !== typingMessageId)
    // 添加错误消息
    addSystemMessage('抱歉，AI服务暂时不可用，请稍后再试。')
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

// 处理文件上传
const handleFileUpload = (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    const content = e.target.result
    try {
      // 将文件内容添加到知识库中
      await addDocument(content, file.name)
      ElMessage.success(`文件 ${file.name} 上传成功并已添加到知识库！`)
      console.log('上传的文件内容:', content)
    } catch (error) {
      console.error('添加文件到知识库失败:', error)
      ElMessage.error('文件上传失败，请稍后再试。')
    }
  }
  reader.readAsText(file.raw)
}
</script>

<style scoped>
.ai-chat-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.ai-chat-card {
  margin: 20px auto;
  max-width: 800px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-height: 600px;
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

.upload-btn {
  margin-left: auto;
}

.ai-chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 300px;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #f0f0f0;
  position: relative;
}

.message-item.user .message-content {
  background-color: #8BC34A;
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
}

.message-time {
  font-size: 12px;
  color: #999;
  text-align: right;
}

.message-item.user .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.chat-input-area {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input-area .el-input {
  flex: 1;
}

.send-button {
  flex-shrink: 0;
  height: 40px;
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
  
  .ai-chat-card {
    margin: 16px;
  }
  
  .message-content {
    max-width: 80%;
  }
  
  .chat-input-area {
    padding: 16px;
  }
}
</style>