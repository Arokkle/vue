<template>
  <div class="register-container">
    <!-- 视频背景 -->
    <video class="background-video" autoplay muted loop playsinline>
      <source src="../videos/login.mp4" type="video/mp4" />
      您的浏览器不支持HTML5视频。
    </video>
    <!-- 半透明遮罩 -->
    <div class="video-overlay"></div>
    <el-card class="register-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>用户注册</h2>
        </div>
      </template>
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" block>注册</el-button>
        </el-form-item>
        <el-form-item class="login-link">
          <span>已有账号？</span>
          <el-button link @click="$router.push('/login')">立即登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()
const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: ''
})

const validateConfirmPassword = (_, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.register(registerForm.username, registerForm.password, registerForm.email)
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        ElMessage.error('注册失败')
      } finally {
        loading.value = false
      }
    } else {
      return false
    }
  })
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;
}

/* 视频背景样式 */
.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* 半透明遮罩 */
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.register-card {
  width: 400px;
  border-radius: 12px;
  position: relative;
  z-index: 3;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(173, 216, 230, 0.9) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 修改文字颜色以适应渐变背景 */
.register-card h2 {
  color: #333;
  font-weight: 700;
}

.register-card .el-input__wrapper {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.register-card .el-input__wrapper:hover,
.register-card .el-input__wrapper:focus-within {
  background: rgba(255, 255, 255, 0.9);
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.register-card .el-input__inner {
  color: #333;
  font-weight: 500;
}

.register-card .el-input__placeholder {
  color: rgba(0, 0, 0, 0.4);
}

.register-card .el-form-item__label {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
}

.register-card .login-link span {
  color: rgba(0, 0, 0, 0.6);
}

.register-card .login-link .el-button {
  color: #409eff;
  font-weight: 500;
}

.register-card .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.register-card .el-button--primary:hover {
  background: linear-gradient(135deg, #337ecc 0%, #2a6bbf 100%);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  transform: translateY(-1px);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 700;
}

.login-link {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.login-link span {
  margin-right: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-card {
    width: 90%;
    margin: 0 20px;
  }
}
</style>