<script setup>
import { onMounted } from 'vue'
import { useUserStore } from './stores/user'
import webSocket from './utils/websocket'
import { ElNotification } from 'element-plus'

const userStore = useUserStore()

// 应用初始化时恢复用户状态
onMounted(() => {
  if (userStore.isLoggedIn) {
    webSocket.connect(userStore.token, userStore.user.id)
    webSocket.onMessage((message) => {
      // 假设消息对象包含 type 字段，例如 'FRIEND_REQUEST'
      if (message.type === 'FRIEND_REQUEST') {
        ElNotification({
          title: '好友请求',
          message: `用户 ${message.sender.username} 请求添加你为好友`,
          type: 'info',
          duration: 0,
          onClick: () => {
            // 点击跳转到好友请求列表页
            router.push('/friend-requests')
          }
        })
      }
    })
  }
  userStore.getCurrentUser().catch(() => {
    // 忽略获取用户信息失败的情况
  })
})
// onUnmounted(() => {
//   webSocket.disconnect()
// })
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
}

/* 占位符视图样式 */
.placeholder-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 20px;
}

/* 主容器样式 */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-image: url('./videos/back.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
  overflow-x: hidden;
}

/* 背景图片遮罩，增强内容可读性 */
#app::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 0;
}

/* 确保所有内容在遮罩上方 */
#app > * {
  position: relative;
  z-index: 1;
}

/* Element Plus 样式覆盖 */
.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.12);
}

.el-menu {
  border-bottom: none;
}

.el-menu--horizontal > .el-sub-menu .el-sub-menu__title {
  height: 60px;
  line-height: 60px;
}

.el-menu-item {
  height: 60px;
  line-height: 60px;
}

.el-header {
  padding: 0;
  background-color: #8BC34A;
  box-shadow: 0 2px 8px rgba(139, 195, 74, 0.3);
  z-index: 100;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

/* 修改导航栏文字和图标颜色 */
.el-menu-demo {
  background-color: transparent !important;
  border-bottom: none !important;
}

.el-menu-demo .el-menu-item,
.el-menu-demo .el-sub-menu__title {
  color: #E8F5E8 !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.el-menu-demo .el-menu-item:hover,
.el-menu-demo .el-sub-menu__title:hover {
  color: #E8F5E8 !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.el-menu-demo .el-menu-item.is-active {
  color: #E8F5E8 !important;
  background-color: rgba(255, 255, 255, 0.2) !important;
  border-bottom-color: #E8F5E8 !important;
}

.el-main {
  padding: 24px 0;
  padding-top: 84px;
  flex: 1;
}

.el-footer {
  background-color: #fff;
  padding: 20px 0;
  text-align: center;
  color: #909399;
  border-top: 1px solid #e4e7ed;
}
</style>
