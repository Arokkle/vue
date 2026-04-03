<template>
  <div class="my-comments-container">
    <el-card class="my-comments-card">
      <template #header>
        <div class="card-header">
          <h2>我的评论</h2>
        </div>
      </template>
      
      <div class="comments-content">
        <!-- 搜索框 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索评论内容"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        
        <!-- 评论列表 -->
        <el-table
          v-loading="loading"
          :data="commentList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column label="评论内容" min-width="300">
            <template #default="scope">
              <div class="comment-content">{{ scope.row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column label="所属文章" width="200">
            <template #default="scope">
              <el-link :href="`/article/${scope.row.articleId}`" target="_blank">
                {{ getArticleTitle(scope.row.articleId) || '未知文章' }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="likeCount" label="点赞数" width="100" sortable />
          <el-table-column prop="createTime" label="创建时间" width="180" sortable />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                {{ scope.row.status === 1 ? '已发布' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="deleteComment(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCommentStore } from '../../stores/comment'
import { useArticleStore } from '../../stores/article'

const router = useRouter()
const commentStore = useCommentStore()
const articleStore = useArticleStore()

// 加载状态
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 选中的评论
const selectedComments = ref<number[]>([])

// 评论总数
const total = computed(() => commentStore.total)

// 评论列表
const commentList = computed(() => commentStore.comments)

// 分页信息，直接使用commentStore的分页状态
const pagination = computed({
  get: () => ({ page: commentStore.page, size: commentStore.size }),
  set: (val) => {
    commentStore.page = val.page
    commentStore.size = val.size
  }
})

// 文章标题映射，用于显示评论所属文章
const articleTitleMap = ref<Map<number, string>>(new Map())

// 获取文章标题列表
const getArticleTitles = async (articleIds: number[]) => {
  if (articleIds.length === 0) return
  
  try {
    // 对于每个文章ID，获取文章详情来获取标题
    for (const articleId of articleIds) {
      if (!articleTitleMap.value.has(articleId)) {
        const res: any = await articleStore.getArticleDetail(articleId)
        if (res.success && res.article) {
          articleTitleMap.value.set(articleId, res.article.title)
        }
      }
    }
  } catch (error) {
    console.error('获取文章标题失败:', error)
  }
}

// 获取我的评论列表
const getMyComments = async () => {
  try {
    loading.value = true
    await commentStore.getMyComments({
      page: commentStore.page,
      size: commentStore.size,
      keyword: searchKeyword.value || undefined
    })
    // 收集文章ID，用于获取文章标题
    const articleIds = commentList.value.map(comment => comment.articleId)
    // 去重 - 使用Array.from替代展开运算符，解决TypeScript编译错误
    const uniqueIds = Array.from(new Set(articleIds))
    // 获取文章标题
    await getArticleTitles(uniqueIds)
  } catch (error: any) {
    ElMessage.error(error.message || '获取评论列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索评论
const handleSearch = () => {
  commentStore.page = 1
  getMyComments()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  commentStore.page = 1
  getMyComments()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  commentStore.size = size
  getMyComments()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  commentStore.page = page
  getMyComments()
}

// 删除评论
const deleteComment = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await commentStore.deleteComment(id)
    ElMessage.success('评论删除成功')
    getMyComments() // 重新获取评论列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '删除评论失败')
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedComments.value = selection.map(item => item.id)
}

// 根据文章ID获取文章标题
const getArticleTitle = (articleId: number) => {
  return articleTitleMap.value.get(articleId) || '未知文章'
}

// 初始化
onMounted(() => {
  getMyComments()
})
</script>

<style scoped>
.my-comments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.my-comments-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comments-content {
  margin-top: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar .el-input {
  width: 300px;
}

.comment-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>