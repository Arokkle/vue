<template>
  <div class="profile-container">
    <el-card class="profile-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>个人中心</h2>
          <el-tag v-if="userStore.isAuthenticated" type="success" effect="plain">已登录</el-tag>
        </div>
      </template>

      <div v-if="userStore.isAuthenticated" class="profile-content">
        <el-tabs v-model="activeTab" type="border-card" class="profile-tabs">
          <!-- 个人信息 Tab -->
          <el-tab-pane label="个人信息" name="info">
            <div class="info-layout">
              <!-- 左侧头像区域 -->
              <div class="avatar-section">
                <div class="avatar-wrapper">
                  <el-avatar
                      :size="120"
                      :src="avatarUrl"
                      class="profile-avatar"
                      fit="cover"
                  >
                    <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="默认头像"/>
                  </el-avatar>
                  <div class="avatar-upload-overlay">
                    <el-upload
                        class="avatar-uploader"
                        :show-file-list="false"
                        :before-upload="beforeAvatarUpload"
                        :http-request="handleAvatarUpload"
                        :disabled="avatarUploading"
                    >
                      <el-button type="primary" :loading="avatarUploading" circle>
                        <el-icon><Camera /></el-icon>
                      </el-button>
                    </el-upload>
                  </div>
                </div>
                <p class="upload-tip">支持 jpg/png 格式，小于 2M</p>
              </div>

              <!-- 右侧表单区域 -->
              <div class="form-section">
                <el-form :model="userForm" label-width="100px" :rules="formRules" ref="userFormRef">
                  <el-form-item label="用户名" prop="username">
                    <el-input v-model="userForm.username" disabled placeholder="用户名" />
                  </el-form-item>
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="userForm.email" placeholder="请输入邮箱" />
                  </el-form-item>
                  <el-form-item label="性别">
                    <el-radio-group v-model="userForm.gender">
                      <el-radio value="男">男</el-radio>
                      <el-radio value="女">女</el-radio>
                      <el-radio value="保密">保密</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="个性签名" prop="signature">
                    <el-input v-model="userForm.signature" type="textarea" :rows="3" placeholder="请输入个性签名" />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="updateProfile" :loading="isUpdating">保存修改</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </el-tab-pane>

          <!-- 密码修改 Tab -->
          <el-tab-pane label="密码修改" name="password">
            <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passwordFormRef">
              <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="updatePassword" :loading="isUpdatingPassword">修改密码</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-else class="not-logged-in">
        <el-empty description="请先登录" />
        <el-button type="primary" @click="$router.push('/login')" style="margin-top: 20px;">
          去登录
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import type { UploadProps, UploadRequestOptions } from 'element-plus'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const userFormRef = ref()
const passwordFormRef = ref()

// 标签页
const activeTab = ref('info')

// 加载状态
const isUpdating = ref(false)
const isUpdatingPassword = ref(false)
const avatarUploading = ref(false)

// 用户表单
const userForm = reactive({
  username: '',
  email: '',
  gender: '保密',
  signature: ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 头像 URL (计算属性，从 store 获取)
const avatarUrl = computed(() => {
  return userStore.user?.avatar || ''
})

// 表单验证规则
const formRules = {
  email: [
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  signature: [
    { max: 100, message: '个性签名不能超过100个字符', trigger: 'blur' }
  ]
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, trigger: 'blur'
    }
  ]
}

// 获取用户信息
const getUserInfo = async () => {
  if (userStore.isAuthenticated) {
    await userStore.getCurrentUser()
    if (userStore.user) {
      userForm.username = userStore.user.username
      userForm.email = userStore.user.email || ''
      userForm.gender = userStore.user.gender || '保密'
      userForm.signature = userStore.user.signature || ''
    }
  }
}

// 更新个人信息
const updateProfile = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        isUpdating.value = true
        const res = await userStore.updateProfile({
          email: userForm.email,
          gender: userForm.gender,
          signature: userForm.signature
        })
        if (res.success) {
          ElMessage.success('个人信息更新成功')
        } else {
          ElMessage.error(res.message || '更新失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
      } finally {
        isUpdating.value = false
      }
    }
  })
}

// 更新密码
const updatePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        isUpdatingPassword.value = true
        const res = await userStore.updateProfile({
          password: passwordForm.newPassword
        })
        if (res.success) {
          ElMessage.success('密码修改成功')
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
        } else {
          ElMessage.error(res.message || '修改失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '修改失败')
      } finally {
        isUpdatingPassword.value = false
      }
    }
  })
}

// ---------- 头像上传相关 ----------
// 上传前校验
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('头像只能为 JPG/PNG 格式')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过 2MB')
    return false
  }
  return true
}

// 自定义上传处理
const handleAvatarUpload = async (options: UploadRequestOptions) => {
  const file = options.file
  avatarUploading.value = true

  try {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = async () => {
      try {
        const base64Avatar = reader.result as string
        const currentUser = userStore.user
        if (!currentUser) {
          ElMessage.error('用户信息不存在，请刷新页面')
          return
        }

        // 只传递头像字段，避免邮箱字段导致的错误信息
        const res = await userStore.updateProfile({
          avatar: base64Avatar
        })

        if (res.success) {
          ElMessage.success('头像上传成功')
          await userStore.getCurrentUser()   // 重新获取最新用户信息
        } else {
          ElMessage.error(res.message || '头像上传失败')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '头像上传失败')
      } finally {
        avatarUploading.value = false
      }
    }

    reader.onerror = () => {
      ElMessage.error('头像读取失败')
      avatarUploading.value = false
    }
  } catch (error: any) {
    ElMessage.error(error.message || '头像上传失败')
    avatarUploading.value = false
  }
}

// 初始化
onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.profile-container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}

.profile-card {
  border-radius: 20px;
  transition: all 0.3s ease;
  border: none;
  background: linear-gradient(145deg, #ffffff 0%, #fafcff 100%);
}

.profile-card :deep(.el-card__header) {
  padding: 20px 30px;
  border-bottom: 1px solid #ebeef5;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.profile-tabs :deep(.el-tabs__header) {
  background-color: #f8faff;
  border-radius: 12px 12px 0 0;
  padding: 0 20px;
}

.profile-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  color: #4a5568;
  transition: all 0.3s;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: #3498db;
  font-weight: 600;
}

.profile-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2ecc71);
}

/* 信息布局：左右分栏 */
.info-layout {
  display: flex;
  gap: 40px;
  padding: 20px 10px;
  flex-wrap: wrap;
}

/* 左侧头像区域 */
.avatar-section {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 0;
}

.avatar-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 15px;
}

.profile-avatar {
  width: 140px;
  height: 140px;
  border: 4px solid white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.profile-avatar:hover {
  transform: scale(1.02);
  box-shadow: 0 15px 30px rgba(52, 152, 219, 0.2);
}

.avatar-upload-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
}

.avatar-uploader :deep(.el-upload) {
  display: block;
}

.avatar-upload-overlay .el-button {
  width: 42px;
  height: 42px;
  background: #3498db;
  border: 2px solid white;
  color: white;
  transition: all 0.3s;
}

.avatar-upload-overlay .el-button:hover {
  background: #2c3e50;
  transform: rotate(15deg) scale(1.1);
}

.upload-tip {
  font-size: 13px;
  color: #7f8c8d;
  margin-top: 10px;
  background: #f0f5fa;
  padding: 6px 15px;
  border-radius: 30px;
}

/* 右侧表单区域 */
.form-section {
  flex: 1;
  min-width: 300px;
}

.form-section :deep(.el-form-item__label) {
  font-weight: 500;
  color: #34495e;
}

.form-section :deep(.el-input__wrapper),
.form-section :deep(.el-textarea__wrapper) {
  border-radius: 10px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.form-section :deep(.el-input__wrapper:hover),
.form-section :deep(.el-textarea__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

.form-section :deep(.el-input__wrapper.is-focus),
.form-section :deep(.el-textarea__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3498db inset;
}

/* 密码修改 tab 美化 */
.el-form[label-width="120px"] {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px 30px;
  background: #fbfdff;
  border-radius: 16px;
}

.el-form[label-width="120px"] :deep(.el-input__wrapper) {
  border-radius: 10px;
}

/* 未登录状态 */
.not-logged-in {
  text-align: center;
  padding: 60px 0;
  background: #f8fcff;
  border-radius: 20px;
  margin: 20px;
}

.not-logged-in .el-empty__description {
  color: #7f8c8d;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .info-layout {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .avatar-section {
    flex: none;
    width: 100%;
  }

  .form-section {
    width: 100%;
  }

  .el-form[label-width="120px"] {
    padding: 15px;
  }
}
</style>