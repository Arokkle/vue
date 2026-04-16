<template>
  <div class="create-article-container">
    <el-card class="create-article-card">
      <template #header>
        <div class="card-header">
          <h2>写文章</h2>
        </div>
      </template>
      
      <div class="article-form">
        <el-form :model="articleForm" label-width="80px" :rules="formRules" ref="articleFormRef">
          <!-- 文章标题 -->
          <el-form-item label="标题" prop="title" class="title-field">
            <el-input
              v-model="articleForm.title"
              placeholder="请输入文章标题"
              :maxlength="100"
              show-word-limit
              size="large"
              style="font-size: 20px;"
            />
          </el-form-item>
          
          <div class="form-content-wrapper">
            <!-- 文章内容（左侧） -->
            <div class="main-content">
              <el-form-item label="内容" prop="content" class="content-field">
                <div class="content-editor-container">
                  <div class="editor-toolbar">
                    <el-button type="primary" link @click="togglePreview">
                      <el-icon v-if="!isPreviewMode"><View /></el-icon>
                      <el-icon v-else><EditPen /></el-icon>
                      {{ isPreviewMode ? '编辑' : '预览' }}
                    </el-button>
                    <div class="auto-save-info" v-if="lastSavedTime">
                      <el-tooltip content="自动保存功能每5秒触发一次，或每30秒自动保存一次" placement="top">
                        <span class="text">上次自动保存: {{ formatTime(lastSavedTime) }}</span>
                      </el-tooltip>
                    </div>
                  </div>
                  <el-input
                    v-if="!isPreviewMode"
                    v-model="articleForm.content"
                    type="textarea"
                    :rows="20"
                    placeholder="请输入文章内容"
                    resize="vertical"
                    @input="handleContentChange"
                  />
                  <div v-else class="preview-content" v-html="previewContent"></div>
                </div>
              </el-form-item>
            </div>
            
            <!-- 右侧边栏 -->
            <div class="side-panel">
              <!-- 分类选择 -->
              <el-form-item label="分类" prop="categoryId">
                <el-select
                  v-model="articleForm.categoryId"
                  placeholder="选择文章分类"
                  clearable
                  size="large"
                >
                  <el-option
                    v-for="category in categoryOptions"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>
              
              <!-- 封面图片 -->
              <el-form-item label="封面图片" prop="coverImage">
                <el-upload
                  v-model="articleForm.coverImage"
                  action="/api/article/upload-image"
                  list-type="picture-card"
                  :on-success="handleCoverUploadSuccess"
                  :on-error="handleCoverUploadError"
                  :before-upload="beforeCoverUpload"
                >
                  <el-icon><Plus /></el-icon>
                  <template #tip>
                    <div class="el-upload__tip">
                      建议上传尺寸：1200×675px，支持 JPG、PNG 格式，大小不超过 2MB
                    </div>
                  </template>
                </el-upload>
                <el-image
                  v-if="articleForm.coverImage"
                  :src="articleForm.coverImage"
                  :preview-src-list="[articleForm.coverImage]"
                  style="width: 100%; height: auto; margin: 12px auto 0; display: block;"
                />
              </el-form-item>
              
              <!-- 标签 -->
              <el-form-item label="标签" prop="tags">
                <el-tag
                  v-for="tag in articleForm.tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                  style="margin-right: 8px; margin-bottom: 8px;"
                >
                  {{ tag }}
                </el-tag>
                <el-input
                  v-model="newTag"
                  placeholder="输入标签，按Enter添加"
                  size="small"
                  @keyup.enter="addTag"
                  style="width: 100%; margin-top: 8px;"
                />
              </el-form-item>
              
              <!-- 文章摘要 -->
              <el-form-item label="摘要" prop="summary">
                <el-input
                  v-model="articleForm.summary"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入文章摘要"
                  :maxlength="200"
                  show-word-limit
                  :autosize="{ minRows: 3, maxRows: 6 }"
                />
              </el-form-item>
            </div>
          </div>
          
          <!-- 发布选项 -->
            <el-form-item class="publish-options">
              <el-radio-group v-model="articleForm.status" @change="handleStatusChange">
                <el-radio value="1">立即发布</el-radio>
                <el-radio value="0">保存草稿</el-radio>
              </el-radio-group>
            </el-form-item>
          
          <!-- 操作按钮 -->
          <el-form-item class="action-buttons">
            <el-button type="primary" @click="submitArticle" :loading="isSubmitting" size="large">
              <el-icon v-if="!isSubmitting"><Upload /></el-icon>
              {{ isSubmitting ? '提交中...' : '提交' }}
            </el-button>
            <el-button @click="$router.go(-1)" size="large">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Upload, Plus, View, EditPen } from '@element-plus/icons-vue'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()
const userStore = useUserStore()

// 表单引用
const articleFormRef = ref()

// 加载状态
const isSubmitting = ref(false)

// 文章表单
const articleForm = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: null,
  status: 1, // 默认为立即发布
  coverImage: '',
  tags: []
})

// 分类选项
const categoryOptions = ref([])

// 新标签输入
const newTag = ref('')

// 自动保存相关
const autoSaveTimer = ref(null)
const lastSavedTime = ref(null)
const isAutoSaving = ref(false)

// 预览相关
const isPreviewMode = ref(false)
const previewContent = ref('')

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 3, message: '标题长度不能少于3个字符', trigger: 'blur' },
    { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { min: 10, message: '内容不能少于10个字符', trigger: 'blur' }
  ]
}

// 获取所有分类列表
const getCategoryTree = async () => {
  try {
    const res = await categoryStore.getAllCategories()
    categoryOptions.value = res.categories || []
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取分类失败，请稍后重试')
  }
}

// 添加标签
const addTag = () => {
  if (newTag.value && newTag.value.trim() && !articleForm.tags.includes(newTag.value.trim())) {
    articleForm.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

// 删除标签
const removeTag = (tag) => {
  const index = articleForm.tags.indexOf(tag)
  if (index > -1) {
    articleForm.tags.splice(index, 1)
  }
}

// 封面图片上传前验证
const beforeCoverUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG) {
    ElMessage.error('封面图片只能是 JPG 或 PNG 格式!')
  }
  if (!isLt2M) {
    ElMessage.error('封面图片大小不能超过 2MB!')
  }
  return isJPG && isLt2M
}

// 封面图片上传成功处理
const handleCoverUploadSuccess = (response) => {
  if (response.success) {
    articleForm.coverImage = response.data.url
    ElMessage.success('封面图片上传成功')
  } else {
    ElMessage.error('封面图片上传失败: ' + (response.message || '未知错误'))
  }
}

// 封面图片上传失败处理
const handleCoverUploadError = (error) => {
  ElMessage.error('封面图片上传失败: ' + (error.message || '网络错误'))
}

// 自动保存草稿
const autoSaveDraft = async () => {
  // 如果用户已经选择立即发布，就不再自动保存为草稿
  if (articleForm.status === 1) {
    return
  }
  
  if (!articleForm.title && !articleForm.content) return // 空内容不保存
  
  // 检查用户是否登录，未登录则跳过自动保存
  if (!userStore.isLoggedIn) {
    return
  }
  
  try {
    isAutoSaving.value = true
    
    // 处理换行符，将\n转换为<br>
    const processedContent = handleLineBreaks(articleForm.content)
    
    // 只传递后端createArticle方法中定义的参数，避免400错误
    const articleData = {
      title: articleForm.title,
      summary: articleForm.summary,
      content: processedContent,
      categoryId: articleForm.categoryId,
      status: 0 // 草稿状态
    }
    
    await articleStore.createArticle(articleData)
    lastSavedTime.value = new Date()
    // 不需要提示，避免干扰用户写作
  } catch (error: any) {
    console.error('自动保存失败:', error)
    // 静默失败，不干扰用户写作
  } finally {
    isAutoSaving.value = false
  }
}

// 切换预览模式
const togglePreview = () => {
  isPreviewMode.value = !isPreviewMode.value
  if (isPreviewMode.value) {
    // 处理换行符，将\n转换为<br>
    previewContent.value = handleLineBreaks(articleForm.content)
  }
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString()
}

// 处理文本换行，将\n转换为<br>
const handleLineBreaks = (text: string): string => {
  return text.replace(/\n/g, '<br>')
}

// 提交文章
const submitArticle = async () => {
  if (!articleFormRef.value) return
  
  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再提交文章')
    router.push('/login')
    return
  }
  
  await articleFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        isSubmitting.value = true
        
        // 处理换行符，将\n转换为<br>
        const processedContent = handleLineBreaks(articleForm.content)
        
        // 只传递后端createArticle方法中定义的参数，避免400错误
        const articleData = {
          title: articleForm.title,
          summary: articleForm.summary,
          content: processedContent,
          categoryId: articleForm.categoryId,
          status: articleForm.status
        }
        
        await articleStore.createArticle(articleData)
        ElMessage.success('文章保存成功')
        
        // 清除所有自动保存定时器，避免重复保存
        if (autoSaveTimer.value) {
          clearTimeout(autoSaveTimer.value)
          clearInterval(autoSaveTimer.value)
          autoSaveTimer.value = null
        }
        
        // 根据发布状态跳转
        if (articleForm.status === 1) {
          // 发布成功后跳转到文章列表
          router.push('/my-articles')
        } else {
          // 保存草稿后也跳转到文章列表
          router.push('/my-articles')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '保存文章失败')
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

// 监听内容变化，触发自动保存
const handleContentChange = () => {
  // 清除之前的定时器
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }
  // 设置新的定时器，5秒后自动保存
  autoSaveTimer.value = setTimeout(autoSaveDraft, 5000)
}

// 处理发布状态变化
const handleStatusChange = (status) => {
  // 如果用户切换到立即发布，清除自动保存定时器
  if (status === 1) {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
    }
  }
}

// 初始化
onMounted(() => {
  getCategoryTree()
  // 启动自动保存定时器，每30秒自动保存一次
  autoSaveTimer.value = setInterval(autoSaveDraft, 30000)
})

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
})
</script>

<style scoped>
.create-article-container {
  width: 100%;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background-color: transparent;
}

.create-article-card {
  margin-bottom: 0;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  border: none;
  width: 100%;
  max-width: 100%;
}

.create-article-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.create-article-card .el-card__header {
  padding: 16px 24px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.create-article-card .el-card__body {
  padding: 24px 40px;
}

.card-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.article-form {
  margin-top: 0;
}

/* 表单元素样式优化 */
.article-form .el-form-item {
  margin-bottom: 28px;
  transition: all 0.3s ease;
}

.article-form .el-form-item__label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.article-form .el-input__wrapper,
.article-form .el-select__wrapper {
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.article-form .el-input__wrapper:hover,
.article-form .el-select__wrapper:hover {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.article-form .el-input__wrapper:focus-within,
.article-form .el-select__wrapper:focus-within {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

/* 摘要输入框样式优化 */
.article-form .el-textarea__wrapper {
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.article-form .el-textarea__wrapper:hover {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.article-form .el-textarea__wrapper:focus-within {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

/* 标题字段样式 */
.title-field {
  margin-bottom: 32px !important;
}

/* 表单内容包装器 - 实现左右分栏 */
.form-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
}

/* 右侧边栏 */
.side-panel {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(5px);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* 内容字段样式 */
.content-field {
  margin-bottom: 0 !important;
}

/* 发布选项样式 */
.publish-options {
  margin-top: 32px !important;
  margin-bottom: 24px !important;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

/* 操作按钮样式 */
.action-buttons {
  margin-top: 0 !important;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 文章内容输入框样式优化 */
.article-form .el-textarea {
  font-size: 15px;
  width: 100%;
}

.article-form .el-textarea__inner {
  min-height: 300px;
  font-size: 15px;
  line-height: 1.7;
  padding: 16px;
  resize: vertical;
  border: none;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
}

/* 操作按钮样式优化 */
.article-form .el-button {
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-right: 16px;
}

.article-form .el-button--primary {
  background-color: #1976d2;
  border-color: #1976d2;
  color: #fff;
  box-shadow: none;
}

.article-form .el-button--primary:hover {
  background-color: #1565c0;
  border-color: #1565c0;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.article-form .el-button--default {
  background-color: #fff;
  border-color: #e4e7ed;
  color: #606266;
  box-shadow: none;
}

.article-form .el-button--default:hover {
  background-color: #f5f7fa;
  border-color: #1976d2;
}

/* 发布选项样式优化 */
.article-form .el-radio-group {
  display: flex;
  gap: 24px;
}

.article-form .el-radio {
  font-size: 14px;
  color: #303133;
}

.article-form .el-radio__input.is-checked .el-radio__inner {
  border-color: #1976d2;
  background-color: #1976d2;
}

.article-form .el-radio__input.is-checked + .el-radio__label {
  color: #1976d2;
}

/* 编辑器容器样式 */
.content-editor-container {
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  width: 100%;
}

/* 编辑器工具栏样式 */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  gap: 16px;
}

.editor-toolbar .el-button {
  background-color: transparent;
  border: none;
  color: #606266;
  margin-right: 0;
}

.editor-toolbar .el-button:hover {
  background-color: #f0f0f0;
  color: #1976d2;
  transform: none;
  box-shadow: none;
}

/* 自动保存信息样式 */
.auto-save-info {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.auto-save-info .text {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 预览内容样式 */
.preview-content {
  padding: 16px;
  min-height: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  font-size: 15px;
  line-height: 1.7;
  color: #303133;
  overflow-y: auto;
}

.preview-content h1, .preview-content h2, .preview-content h3, .preview-content h4, .preview-content h5, .preview-content h6 {
  margin-top: 24px;
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
  line-height: 1.4;
}

.preview-content h1 {
  font-size: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
  margin-top: 0;
}

.preview-content h2 {
  font-size: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 6px;
}

.preview-content h3 {
  font-size: 18px;
}

.preview-content p {
  margin-bottom: 16px;
  line-height: 1.7;
  color: #606266;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
}

.preview-content ul, .preview-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
  color: #606266;
}

.preview-content ul {
  list-style-type: disc;
}

.preview-content ol {
  list-style-type: decimal;
}

.preview-content li {
  margin-bottom: 8px;
  line-height: 1.7;
}

.preview-content code {
  background-color: rgba(245, 247, 250, 0.8);
  backdrop-filter: blur(5px);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  color: #303133;
}

/* 封面图片上传样式 */
.article-form .el-upload--picture-card {
  width: 100%;
  height: 180px;
  margin-bottom: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.5);
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.article-form .el-upload--picture-card:hover {
  border-color: #1976d2;
  background-color: rgba(236, 245, 255, 0.8);
  backdrop-filter: blur(5px);
}

.article-form .el-upload--picture-card .el-upload {
  width: 100%;
  height: 180px;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 封面图片上传提示文字样式 */
.article-form .el-upload__tip {
  text-align: center;
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}

.article-form .el-upload--picture-card .el-icon {
  font-size: 32px;
  color: #8c939d;
  transition: all 0.3s ease;
}

.article-form .el-upload--picture-card:hover .el-icon {
  color: #1976d2;
}

.article-form .el-upload-list {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.article-form .el-upload-list__item {
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto;
}

.article-form .el-upload-list__item img {
  border-radius: 4px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

/* 标签样式 */
.article-form .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 500;
  background-color: rgba(236, 245, 255, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(217, 236, 255, 0.8);
  color: #409eff;
  transition: all 0.3s ease;
}

.article-form .el-tag:hover {
  background-color: rgba(214, 236, 255, 0.9);
  backdrop-filter: blur(5px);
  border-color: rgba(173, 198, 255, 0.9);
}

.article-form .el-tag__close {
  color: #409eff;
  font-size: 12px;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.article-form .el-tag__close:hover {
  opacity: 1;
}

/* 标题输入框样式优化 */
.article-form .el-input--large .el-input__wrapper {
  padding: 12px 16px;
  background-color: #fff;
}

.article-form .el-input--large .el-input__inner {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  padding: 0;
  background-color: transparent;
}

/* 电脑端优化：宽屏布局 */
@media (min-width: 1200px) {
  .create-article-container {
    padding: 0;
    max-width: 100%;
  }
  
  .create-article-card .el-card__body {
    padding: 24px 40px;
  }
  
  /* 表单内容采用左右分栏布局 */
  .form-content-wrapper {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }
  
  /* 主要内容区域占70% */
  .main-content {
    flex: 1;
    min-width: 0;
  }
  
  /* 右侧边栏固定宽度 */
  .side-panel {
    width: 360px;
    min-width: 360px;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(5px);
    padding: 24px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    flex-direction: column;
    gap: 28px;
    height: fit-content;
    position: sticky;
    top: 24px;
  }
  
  /* 内容输入框最小高度 - 电脑端更大 */
  .article-form .el-textarea__inner {
    min-height: 500px;
  }
  
  /* 预览内容最小高度 - 电脑端更大 */
  .preview-content {
    min-height: 500px;
  }
  
  /* 标签输入框宽度 */
  .article-form .el-input--small {
    width: 100%;
  }
  
  /* 标题样式优化 */
  .card-header h2 {
    font-size: 20px;
  }
  
  /* 表单元素间距调整 */
  .title-field {
    margin-bottom: 32px !important;
  }
  
  .publish-options {
    margin-top: 32px !important;
  }
  
  /* 操作按钮间距 */
  .action-buttons .el-button {
    margin-right: 16px;
  }
}

/* 平板端适配 */
@media (min-width: 769px) and (max-width: 1199px) {
  .create-article-container {
    padding: 0;
  }
  
  .create-article-card .el-card__body {
    padding: 20px 30px;
  }
  
  .form-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .side-panel {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(5px);
    padding: 20px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .article-form .el-textarea__inner {
    min-height: 400px;
  }
  
  .preview-content {
    min-height: 400px;
  }
  
  .article-form .el-upload--picture-card {
    height: 180px;
  }
  
  .article-form .el-upload--picture-card .el-upload {
    height: 180px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .create-article-container {
    padding: 0;
    max-width: 100%;
  }
  
  .create-article-card {
    border-radius: 0;
  }
  
  .create-article-card .el-card__body {
    padding: 16px 20px;
  }
  
  .card-header h2 {
    font-size: 18px;
  }
  
  .article-form .el-form-item {
    margin-bottom: 20px;
  }
  
  .article-form .el-textarea__inner {
    min-height: 250px;
    font-size: 15px;
    padding: 12px;
  }
  
  .editor-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    padding: 12px 16px;
  }
  
  .editor-toolbar .el-button {
    width: 100%;
    justify-content: center;
  }
  
  .auto-save-info {
    font-size: 12px;
    text-align: center;
  }
  
  .preview-content {
    padding: 12px;
    min-height: 250px;
    font-size: 15px;
  }
  
  .side-panel {
    padding: 16px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .article-form .el-upload--picture-card {
    height: 150px;
  }
  
  .article-form .el-upload--picture-card .el-upload {
    height: 150px;
  }
  
  .article-form .el-radio-group {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 12px;
    justify-content: center;
    align-items: stretch;
  }
  
  .action-buttons .el-button {
    width: 100%;
    margin-right: 0;
  }
}
</style>