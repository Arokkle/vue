<template>
  <div class="article-detail-container">
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
              <el-sub-menu index="profile">
                <template #title>{{ userStore.user.username }}</template>
                <el-menu-item index="my-articles" @click="$router.push('/my-articles')">我的文章</el-menu-item>
                <el-menu-item index="my-comments" @click="$router.push('/my-comments')">我的评论</el-menu-item>
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
        <el-row :gutter="20">
          <!-- 左侧文章详情 -->
          <el-col :span="16">
            <el-card shadow="hover" class="article-detail-card">
              <h1 class="article-title">{{ articleDetail?.title }}</h1>
              <div class="article-meta">
                <span class="author">{{ articleDetail?.authorName }}</span>
                <span class="date">{{ articleDetail?.createTime }}</span>
                <span class="category" v-if="articleDetail?.categoryId">
                  <router-link :to="`/category/${articleDetail.categoryId}`">
                    {{ articleDetail?.category?.name || '未分类' }}
                  </router-link>
                </span>
              </div>
              <div class="article-content" v-html="articleDetail?.content"></div>
              <div class="article-actions">
                <el-button link @click="handleLike" :loading="likeLoading">
                  <el-icon>
                    <StarFilled v-if="isLiked" />
                    <Star v-else />
                  </el-icon>
                  {{ articleDetail?.likeCount || 0 }} 赞
                </el-button>
                <el-button link @click="scrollToComment">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ articleDetail?.commentCount || 0 }} 评论
                </el-button>
                <el-button link v-if="canEdit" @click="editArticle">
                  <el-icon><EditPen /></el-icon>
                  编辑文章
                </el-button>
                <el-button link v-if="canEdit" @click="deleteArticle" type="danger">
                  <el-icon><Delete /></el-icon>
                  删除文章
                </el-button>
              </div>
            </el-card>

            <!-- 评论区 -->
            <el-card shadow="hover" class="comments-card" id="comments-section">
              <template #header>
                <div class="card-header">
                  <span>评论区</span>
                  <span class="comment-count">({{ commentStore.getTotalCount || 0 }})</span>
                </div>
              </template>
              
              <!-- 发表评论 -->
              <div v-if="userStore.isLoggedIn" class="comment-form">
                <el-form :model="commentForm" :rules="commentRules" ref="commentFormRef" label-width="0">
                  <el-form-item prop="content">
                    <el-input
                      v-model="commentForm.content"
                      type="textarea"
                      :rows="4"
                      placeholder="写下你的评论..."
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="submitComment" :loading="commentLoading" block>发表评论</el-button>
                  </el-form-item>
                </el-form>
              </div>
              <div v-else class="login-prompt">
                <el-alert
                  title="请先登录后发表评论"
                  type="info"
                  show-icon
                  :closable="false"
                >
                  <template #default>
                    <el-button link @click="$router.push('/login')">立即登录</el-button>
                  </template>
                </el-alert>
              </div>

              <!-- 评论列表 -->
              <div class="comments-list">
                <el-card v-for="comment in commentStore.getCommentList" :key="comment.id" shadow="hover" class="comment-item">
                  <div class="comment-header">
                    <div class="comment-author">
                      <el-avatar :src="comment.authorAvatar || ''" size="small" />
                      <span class="author-name">{{ comment.authorName }}</span>
                    </div>
                    <span class="comment-date">{{ comment.createTime }}</span>
                  </div>
                  <div class="comment-content" v-html="comment.content"></div>
                  <div class="comment-actions">
                    <el-button link @click="handleCommentLike(comment.id)">
                      <el-icon>
                        <StarFilled v-if="comment.isLiked" />
                        <Star v-else />
                      </el-icon>
                      {{ comment.likeCount || 0 }}
                    </el-button>
                    <el-button link @click="replyComment(comment.id)">回复</el-button>
                    <el-button link v-if="canDeleteComment(comment)" @click="deleteComment(comment.id)">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-button>
                  </div>
                  <!-- 回复列表 -->
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                    <el-card v-for="reply in comment.replies" :key="reply.id" shadow="hover" class="reply-item">
                      <div class="comment-header">
                        <div class="comment-author">
                          <el-avatar :src="reply.authorAvatar || ''" size="small" />
                          <span class="author-name">{{ reply.authorName }}</span>
                    </div>
                    <span class="comment-date">{{ reply.createTime }}</span>
                  </div>
                  <div class="comment-content" v-html="reply.content"></div>
                      <div class="comment-actions">
                        <el-button link @click="handleCommentLike(reply.id)">
                          <el-icon>
                            <StarFilled v-if="reply.isLiked" />
                            <Star v-else />
                          </el-icon>
                          {{ reply.likeCount || 0 }}
                        </el-button>
                        <el-button link v-if="canDeleteComment(reply)" @click="deleteComment(reply.id)">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-button>
                      </div>
                    </el-card>
                  </div>
                  <!-- 回复输入框 -->
                  <div v-if="replyToCommentId === comment.id" class="reply-form" :id="`reply-form-${comment.id}`">
                    <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="0">
                      <el-form-item prop="content">
                        <el-input
                          v-model="replyForm.content"
                          type="textarea"
                          :rows="2"
                          placeholder="写下你的回复..."
                          autofocus
                        />
                      </el-form-item>
                      <div class="reply-form-actions">
                        <el-button @click="cancelReply">取消</el-button>
                        <el-button type="primary" @click="submitReply" :loading="replyLoading">发表回复</el-button>
                      </div>
                    </el-form>
                  </div>
                </el-card>
              </div>

              <!-- 评论分页 -->
              <div class="pagination-container" v-if="commentStore.getTotalCount > 0">
                <el-pagination
                  v-model:current-page="commentStore.page"
                  v-model:page-size="commentStore.size"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="commentStore.getTotalCount"
                  @size-change="handleCommentSizeChange"
                  @current-change="handleCommentCurrentChange"
                />
              </div>
            </el-card>
          </el-col>

          <!-- 右侧边栏 -->
          <el-col :span="8">
            <!-- 作者信息 -->
            <el-card shadow="hover" class="sidebar-card">
              <template #header>
                <div class="card-header">
                  <span>作者信息</span>
                </div>
              </template>
              <div class="author-info">
                <el-avatar :src="articleDetail?.authorAvatar || ''" size="large" class="author-avatar" />
                <h3 class="author-name">{{ articleDetail?.authorName }}</h3>
                <p class="author-signature">{{ articleDetail?.author?.signature || '暂无签名' }}</p>
                <el-button link @click="viewAuthorArticles">查看更多文章</el-button>
              </div>
            </el-card>

            <!-- 相关推荐 -->
            <el-card shadow="hover" class="sidebar-card">
              <template #header>
                <div class="card-header">
                  <span>相关推荐</span>
                </div>
              </template>
              <div class="related-articles">
                <div v-for="article in relatedArticles" :key="article.id" class="related-article-item">
                  <router-link :to="`/article/${article.id}`">{{ article.title }}</router-link>
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { useArticleStore } from '../../stores/article'
import { useCommentStore } from '../../stores/comment'
import { Star, StarFilled, ChatDotRound, EditPen, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const articleStore = useArticleStore()
const commentStore = useCommentStore()

// 响应式数据
const activeIndex = ref('article-detail')
const articleDetail = ref(null)
const isLiked = ref(false)
const likeLoading = ref(false)
const relatedArticles = ref([])
const canEdit = computed(() => {
  return userStore.isLoggedIn && (userStore.isAdmin || articleDetail.value?.userId === userStore.user.id)
})

// 评论相关
const commentForm = ref({ content: '' })
const commentFormRef = ref()
const commentLoading = ref(false)
const replyForm = ref({ content: '' })
const replyFormRef = ref()
const replyLoading = ref(false)
const replyToCommentId = ref(null)

// 评论表单验证规则
const commentRules = {
  content: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 2, message: '评论内容不能少于2个字符', trigger: 'blur' }
  ]
}

const replyRules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 2, message: '回复内容不能少于2个字符', trigger: 'blur' }
  ]
}

// 获取文章ID
const articleId = computed(() => parseInt(route.params.id))

// 初始化页面数据
onMounted(async () => {
  await userStore.getCurrentUser().catch(() => {})
  await getArticleDetail()
  await checkArticleLiked()
  await getComments()
  await getRelatedArticles()
})

// 获取文章详情
const getArticleDetail = async () => {
  try {
    const res = await articleStore.getArticleDetail(articleId.value)
    articleDetail.value = res.article
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  }
}

// 检查是否点赞
const checkArticleLiked = async () => {
  try {
    if (userStore.isLoggedIn) {
      const res = await articleStore.checkArticleLiked(articleId.value)
      isLiked.value = res.isLiked
    }
  } catch (error) {
    console.error('检查点赞状态失败:', error)
  }
}

// 点赞文章
const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    likeLoading.value = true
    if (isLiked.value) {
      await articleStore.unlikeArticle(articleId.value)
      articleDetail.value.likeCount -= 1
    } else {
      await articleStore.likeArticle(articleId.value)
      articleDetail.value.likeCount += 1
    }
    isLiked.value = !isLiked.value
    ElMessage.success(isLiked.value ? '点赞成功' : '取消点赞成功')
  } catch (error) {
    console.error('点赞操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    likeLoading.value = false
  }
}

// 获取评论
const getComments = async () => {
  try {
    await commentStore.getArticleComments(articleId.value)
    
    // 获取每个评论的回复
    for (const comment of commentStore.getCommentList) {
      // 获取回复
      const repliesRes = await commentStore.getCommentReplies(comment.id)
      comment.replies = repliesRes.replies || []
      
      // 检查当前用户是否点赞
      if (userStore.isLoggedIn) {
        // 检查主评论点赞状态
        const isLikedRes = await commentStore.checkCommentLiked(comment.id)
        comment.isLiked = isLikedRes.isLiked || false
        
        // 检查回复点赞状态
        for (const reply of comment.replies) {
          const replyLikedRes = await commentStore.checkCommentLiked(reply.id)
          reply.isLiked = replyLikedRes.isLiked || false
        }
      } else {
        // 未登录用户，所有评论和回复都未点赞
        comment.isLiked = false
        for (const reply of (comment.replies || [])) {
          reply.isLiked = false
        }
      }
    }
  } catch (error) {
    console.error('获取评论失败:', error)
  }
}

// 滚动到评论区
const scrollToComment = () => {
  const commentSection = document.getElementById('comments-section')
  if (commentSection) {
    commentSection.scrollIntoView({ behavior: 'smooth' })
  }
}

// 处理文本换行，将\n转换为<br>
const handleLineBreaks = (text) => {
  return text.replace(/\n/g, '<br>')
}

// 提交评论
const submitComment = async () => {
  if (!commentFormRef.value) return
  await commentFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        commentLoading.value = true
        
        // 处理换行符，将\n转换为<br>
        const processedContent = handleLineBreaks(commentForm.value.content)
        
        await commentStore.createComment({
          articleId: articleId.value,
          content: processedContent
        })
        commentForm.value.content = ''
        await getComments()
        ElMessage.success('评论发表成功')
      } catch (error) {
        console.error('发表评论失败:', error)
        ElMessage.error('评论发表失败')
      } finally {
        commentLoading.value = false
      }
    }
  })
}

// 回复评论
const replyComment = (commentId) => {
  replyToCommentId.value = commentId
  nextTick(() => {
    const replyForm = document.querySelector(`#reply-form-${commentId}`)
    if (replyForm) {
      replyForm.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

// 取消回复
const cancelReply = () => {
  replyToCommentId.value = null
  replyForm.value.content = ''
  if (replyFormRef.value) {
    replyFormRef.value.resetFields()
  }
}

// 提交回复
const submitReply = async () => {
  // 手动验证回复内容
  if (!replyForm.value.content || replyForm.value.content.trim().length < 2) {
    ElMessage.error('回复内容不能少于2个字符')
    return
  }
  
  try {
    replyLoading.value = true
    
    // 处理换行符，将\n转换为<br>
    const processedContent = handleLineBreaks(replyForm.value.content)
    
    await commentStore.replyComment(replyToCommentId.value, processedContent)
    replyForm.value.content = ''
    replyToCommentId.value = null
    await getComments()
    ElMessage.success('回复发表成功')
  } catch (error) {
    console.error('发表回复失败:', error)
    ElMessage.error('回复发表失败')
  } finally {
    replyLoading.value = false
  }
}

// 评论点赞
const handleCommentLike = async (commentId) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    // 找到对应的评论或回复
    let targetComment = null
    let isReply = false
    
    // 查找主评论
    for (const comment of commentStore.getCommentList) {
      if (comment.id === commentId) {
        targetComment = comment
        break
      }
      // 查找回复
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply.id === commentId) {
            targetComment = reply
            isReply = true
            break
          }
        }
      }
      if (targetComment) break
    }
    
    if (!targetComment) return
    
    // 执行点赞或取消点赞
    if (targetComment.isLiked) {
      await commentStore.unlikeComment(commentId)
      targetComment.likeCount -= 1
    } else {
      await commentStore.likeComment(commentId)
      targetComment.likeCount += 1
    }
    // 更新点赞状态
    targetComment.isLiked = !targetComment.isLiked
    
    ElMessage.success(targetComment.isLiked ? '点赞成功' : '取消点赞成功')
  } catch (error) {
    console.error('评论点赞失败:', error)
    ElMessage.error('操作失败')
  }
}

// 检查是否可以删除评论
const canDeleteComment = (comment) => {
  return userStore.isLoggedIn && (userStore.isAdmin || comment.userId === userStore.user.id)
}

// 删除评论
const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await commentStore.deleteComment(commentId)
    await getComments()
    ElMessage.success('评论删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('评论删除失败')
    }
  }
}

// 编辑文章
const editArticle = () => {
  router.push(`/edit-article/${articleId.value}`)
}

// 删除文章
const deleteArticle = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await articleStore.deleteArticle(articleId.value)
    ElMessage.success('文章删除成功')
    router.push('/')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('文章删除失败')
    }
  }
}

// 查看作者文章
const viewAuthorArticles = () => {
  router.push(`/user/${articleDetail.value?.userId}/articles`)
}

// 获取相关推荐
const getRelatedArticles = async () => {
  try {
    // 使用新的相关推荐API
    const res = await articleStore.getRelatedRecommendations(articleId.value, 5)
    relatedArticles.value = res.articles
  } catch (error) {
    console.error('获取相关推荐失败:', error)
    // 失败时回退到热门文章
    try {
      const res = await articleStore.getHotArticles(5)
      relatedArticles.value = res.articles
    } catch (fallbackError) {
      console.error('回退获取相关推荐失败:', fallbackError)
    }
  }
}

// 评论分页
const handleCommentSizeChange = async (size) => {
  await commentStore.getArticleComments(articleId.value, { size })
}

const handleCommentCurrentChange = async (page) => {
  await commentStore.getArticleComments(articleId.value, { page })
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    router.push('/login')
  }
}
</script>

<style scoped>
.article-detail-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 60px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.blog-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1976d2;
  text-decoration: none;
  transition: all 0.3s ease;
}

.blog-title:hover {
  color: #1565c0;
  text-decoration: none;
}

/* 主内容区域样式 */
.el-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  background-color: transparent;
}

/* 文章详情卡片样式 */
.article-detail-card {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  background-color: #fff;
}

.article-detail-card .el-card__body {
  padding: 32px;
}

/* 文章标题样式 */
.article-title {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.3;
}

/* 文章元信息样式 */
.article-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 14px;
  color: #909399;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.article-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.article-meta span:hover {
  color: #1976d2;
}

.article-meta .category a {
  color: #1976d2;
  text-decoration: none;
  transition: all 0.3s ease;
}

.article-meta .category a:hover {
  color: #1565c0;
  text-decoration: none;
}

.article-meta .author {
  font-weight: 500;
  color: #606266;
}

/* 文章内容样式 */
.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  margin-bottom: 32px;
  padding: 0 20px;
}

.article-content h1, .article-content h2, .article-content h3, .article-content h4, .article-content h5, .article-content h6 {
  margin-top: 32px;
  margin-bottom: 16px;
  color: #303133;
  font-weight: 600;
}

.article-content h1 {
  font-size: 28px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.article-content h2 {
  font-size: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 6px;
}

.article-content h3 {
  font-size: 20px;
}

.article-content p {
  margin-bottom: 16px;
  color: #303133;
  line-height: 1.8;
}

.article-content a {
  color: #1976d2;
  text-decoration: none;
  transition: all 0.3s ease;
}

.article-content a:hover {
  color: #1565c0;
  text-decoration: underline;
}

.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-content code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  color: #e96900;
}

.article-content pre {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid #e0e0e0;
}

.article-content pre code {
  background-color: transparent;
  padding: 0;
  color: #303133;
}

.article-content ul, .article-content ol {
  margin-bottom: 16px;
  padding-left: 24px;
}

.article-content li {
  margin-bottom: 8px;
  color: #303133;
  line-height: 1.6;
}

/* 文章操作按钮样式 */
.article-actions {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.article-actions .el-button {
  font-size: 14px;
  transition: all 0.3s ease;
}

.article-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 评论区样式 */
.comments-card {
  margin-top: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  background-color: #fff;
}

.comments-card .el-card__header {
  padding: 16px 24px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.comments-card .el-card__body {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.comment-count {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
}

/* 评论表单样式 */
.comment-form {
  margin-bottom: 32px;
}

.comment-form .el-form-item {
  margin-bottom: 16px;
}

.comment-form .el-input__wrapper {
  box-shadow: none;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.comment-form .el-input__wrapper:hover {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
}

.comment-form .el-input__wrapper:focus-within {
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.login-prompt {
  margin-bottom: 32px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

/* 评论列表样式 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  margin-bottom: 0;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #fff;
}

.comment-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: #e0e0e0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.author-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  margin-bottom: 12px;
  line-height: 1.7;
  color: #303133;
  font-size: 14px;
  padding: 0 4px;
}

.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.comment-actions .el-button {
  padding: 4px 8px;
  height: auto;
  font-size: 13px;
  color: #909399;
  transition: all 0.3s ease;
}

.comment-actions .el-button:hover {
  color: #1976d2;
}

/* 回复列表样式 */
.replies-list {
  margin-top: 16px;
  padding-left: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  margin-bottom: 0;
  border-left: 2px solid #e0e0e0;
  padding-left: 20px;
  background-color: #fafafa;
  padding: 12px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.reply-item:hover {
  background-color: #f5f5f5;
  border-left-color: #1976d2;
}

/* 回复表单样式 */
.reply-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e0e0e0;
}

.reply-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}

.reply-form-actions .el-button {
  font-size: 13px;
  padding: 6px 16px;
}

/* 分页样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding-top: 20px;
}

/* 相关文章边栏样式 */
.sidebar-card {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  background-color: #fff;
}

.sidebar-card .el-card__header {
  padding: 12px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-card .el-card__body {
  padding: 16px 20px;
}

.related-articles {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.related-article-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.related-article-item:last-child {
  border-bottom: none;
}

.related-article-item a {
  color: #303133;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: all 0.3s ease;
}

.related-article-item a:hover {
  color: #1976d2;
  text-decoration: none;
}

.related-article-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

/* 页脚样式 */
.el-footer {
  background-color: #fff;
  padding: 24px 0;
  text-align: center;
  color: #909399;
  border-top: 1px solid #f0f0f0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer-content {
  text-align: center;
  padding: 0;
  color: #909399;
  font-size: 13px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }
  
  .el-main {
    padding: 16px;
  }
  
  .article-detail-card .el-card__body {
    padding: 20px;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-meta {
    gap: 16px;
    font-size: 13px;
  }
  
  .article-content {
    font-size: 15px;
    padding: 0;
  }
  
  .article-actions {
    gap: 16px;
  }
  
  .comments-card .el-card__body {
    padding: 16px;
  }
  
  .replies-list {
    padding-left: 20px;
  }
  
  .el-col-xs-24 {
    max-width: 100%;
  }
}
</style>