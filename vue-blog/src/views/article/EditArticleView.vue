<template>
  <div class="edit-article-container">
    <el-card class="edit-article-card">
      <template #header>
        <div class="card-header">
          <h2>编辑文章</h2>
        </div>
      </template>
      
      <div v-if="article" class="article-form">
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
            <el-radio-group v-model="articleForm.status">
              <el-radio value="1">立即发布</el-radio>
              <el-radio value="0">保存草稿</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <!-- 操作按钮 -->
          <el-form-item class="action-buttons">
            <el-button type="primary" @click="updateArticle" :loading="isUpdating" size="large">
              <el-icon v-if="!isUpdating"><Edit /></el-icon>
              {{ isUpdating ? '更新中...' : '更新' }}
            </el-button>
            <el-button @click="$router.go(-1)" size="large">取消</el-button>
            <el-button type="danger" @click="deleteArticle" :loading="isDeleting" size="large">
              <el-icon v-if="!isDeleting"><Delete /></el-icon>
              删除文章
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div v-else-if="loading" class="loading-state">
        <el-skeleton :rows="8" animated />
      </div>
      
      <div v-else class="not-found">
        <el-empty description="文章不存在或已被删除" />
        <el-button type="primary" @click="$router.push('/my-articles')" style="margin-top: 20px;">
          返回我的文章
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, View, EditPen } from '@element-plus/icons-vue'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'
import { useUserStore } from '../../stores/user'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()
const userStore = useUserStore()

// 表单引用
const articleFormRef = ref()

// 加载状态
const loading = ref(true)
const isUpdating = ref(false)
const isDeleting = ref(false)

// 文章ID
const articleId = ref(0)

// 文章详情
const article = ref(null)

// 文章表单
const articleForm = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: null,
  status: 1
})

// 分类选项
const categoryOptions = ref([])

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

// 获取文章详情
const getArticleDetail = async () => {
  try {
    loading.value = true
    const res = await articleStore.getArticleDetail(articleId.value)
    if (res.success && res.article) {
      article.value = res.article
      
      // 检查权限：只有文章作者或管理员可以编辑
      if (res.article.userId !== userStore.user?.id && !userStore.isAdmin) {
        ElMessage.error('您没有权限编辑这篇文章')
        router.push('/403')
        return
      }
      
      // 填充表单数据
      articleForm.title = res.article.title
      articleForm.summary = res.article.summary || ''
      articleForm.content = res.article.content || ''
      articleForm.categoryId = res.article.categoryId
      articleForm.status = res.article.status
    } else {
      article.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章详情失败')
    article.value = null
  } finally {
    loading.value = false
  }
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

// 更新文章
const updateArticle = async () => {
  if (!articleFormRef.value) return
  
  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再更新文章')
    router.push('/login')
    return
  }
  
  await articleFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        isUpdating.value = true
        
        const articleData = {
          title: articleForm.title,
          summary: articleForm.summary,
          content: articleForm.content,
          categoryId: articleForm.categoryId,
          status: articleForm.status
        }
        
        await articleStore.updateArticle(articleId.value, articleData)
        ElMessage.success('文章更新成功')
        router.push(`/article/${articleId.value}`)
      } catch (error: any) {
        ElMessage.error(error.message || '更新文章失败')
      } finally {
        isUpdating.value = false
      }
    }
  })
}

// 删除文章
const deleteArticle = async () => {
  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录后再删除文章')
    router.push('/login')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除文章 "${articleForm.title}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    isDeleting.value = true
    await articleStore.deleteArticle(articleId.value)
    ElMessage.success('文章删除成功')
    router.push('/my-articles')
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '删除文章失败')
  } finally {
    isDeleting.value = false
  }
}

// 自动保存草稿
const autoSaveDraft = async () => {
  if (!articleForm.title && !articleForm.content) return // 空内容不保存
  
  // 检查用户是否登录，未登录则跳过自动保存
  if (!userStore.isLoggedIn) {
    return
  }
  
  try {
    isAutoSaving.value = true
    const articleData = {
      title: articleForm.title,
      summary: articleForm.summary,
      content: articleForm.content,
      categoryId: articleForm.categoryId,
      status: 0 // 草稿状态
    }
    
    await articleStore.updateArticle(articleId.value, articleData)
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
    // 这里可以添加Markdown渲染逻辑，如果需要的话
    previewContent.value = articleForm.content
  }
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleTimeString()
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

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    articleId.value = parseInt(newId as string)
    getArticleDetail()
  }
})

// 初始化
onMounted(() => {
  const id = route.params.id as string
  if (id) {
    articleId.value = parseInt(id)
    getCategoryTree()
    getArticleDetail()
    // 启动自动保存定时器，每30秒自动保存一次
    autoSaveTimer.value = setInterval(autoSaveDraft, 30000)
  }
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
.edit-article-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.edit-article-card {
  margin-bottom: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  background-color: #fff;
}

.edit-article-card .el-card__header {
  padding: 20px 24px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.edit-article-card .el-card__body {
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.article-form {
  margin-top: 0;
}

/* 表单元素样式优化 */
.article-form .el-form-item {
  margin-bottom: 24px;
}

.article-form .el-form-item__label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.article-form .el-input__wrapper {
  box-shadow: none;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.article-form .el-input__wrapper:hover {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.article-form .el-input__wrapper:focus-within {
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
  gap: 24px;
}

/* 主要内容区域 */
.main-content {
  width: 100%;
}

/* 右侧边栏 */
.side-panel {
  width: 100%;
  background-color: #fafafa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

/* 内容字段样式 */
.content-field {
  margin-bottom: 0 !important;
}

/* 发布选项样式 */
.publish-options {
  margin-top: 32px !important;
  margin-bottom: 24px !important;
}

/* 操作按钮样式 */
.action-buttons {
  margin-top: 0 !important;
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
}

/* 操作按钮样式优化 */
.article-form .el-button {
  font-size: 14px;
  padding: 10px 24px;
  transition: all 0.3s ease;
  margin-right: 16px;
}

.article-form .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.article-form .el-button:last-child {
  margin-right: 0;
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

/* 编辑器容器样式 */
.content-editor-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
  width: 100%;
}

/* 编辑器工具栏样式 */
.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

/* 自动保存信息样式 */
.auto-save-info {
  font-size: 12px;
  color: #909399;
}

.auto-save-info .text {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 预览内容样式 */
.preview-content {
  padding: 20px;
  min-height: 300px;
  background-color: #fff;
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
}

.preview-content h1 {
  font-size: 24px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.preview-content h2 {
  font-size: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 6px;
}

.preview-content p {
  margin-bottom: 16px;
  line-height: 1.7;
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
}

.preview-content li {
  margin-bottom: 8px;
  line-height: 1.7;
}

/* 标题输入框样式优化 */
.article-form .el-input--large .el-input__wrapper {
  padding: 12px 16px;
}

.article-form .el-input--large .el-input__inner {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 电脑端优化：宽屏布局 */
@media (min-width: 1200px) {
  .edit-article-container {
    padding: 32px;
  }
  
  .edit-article-card .el-card__body {
    padding: 32px;
  }
  
  /* 表单内容采用左右分栏布局 */
  .form-content-wrapper {
    display: flex;
    gap: 32px;
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
    background-color: #fafafa;
    padding: 24px;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: fit-content;
    position: sticky;
    top: 24px;
  }
  
  /* 内容输入框最小高度 - 电脑端更大 */
  .article-form .el-textarea__inner {
    min-height: 600px;
  }
  
  /* 预览内容最小高度 - 电脑端更大 */
  .preview-content {
    min-height: 600px;
  }
  
  /* 标题样式优化 */
  .card-header h2 {
    font-size: 28px;
  }
  
  /* 表单元素间距调整 */
  .title-field {
    margin-bottom: 40px !important;
  }
  
  .publish-options {
    margin-top: 40px !important;
  }
  
  /* 操作按钮间距 */
  .action-buttons .el-button {
    margin-right: 16px;
  }
}

/* 平板端适配 */
@media (min-width: 769px) and (max-width: 1199px) {
  .edit-article-container {
    padding: 24px;
  }
  
  .form-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .side-panel {
    width: 100%;
  }
  
  .article-form .el-textarea__inner {
    min-height: 400px;
  }
  
  .preview-content {
    min-height: 400px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .edit-article-container {
    padding: 16px;
    max-width: 100%;
  }
  
  .edit-article-card .el-card__body {
    padding: 16px;
  }
  
  .card-header h2 {
    font-size: 20px;
  }
  
  .article-form .el-form-item {
    margin-bottom: 20px;
  }
  
  .article-form .el-textarea__inner {
    min-height: 250px;
  }
  
  .editor-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .auto-save-info {
    font-size: 11px;
  }
  
  .preview-content {
    padding: 16px;
    min-height: 250px;
  }
  
  .side-panel {
    padding: 16px;
  }
  
  .article-form .el-button {
    margin-right: 8px;
    margin-bottom: 8px;
  }
  
  .article-form .el-button:last-child {
    margin-right: 0;
  }
}

/* 加载状态和未找到状态样式 */
.loading-state {
  margin: 24px 0;
}

.not-found {
  text-align: center;
  padding: 40px 0;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 20px 0;
}
</style>