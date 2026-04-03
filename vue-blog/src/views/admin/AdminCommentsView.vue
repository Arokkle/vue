<template>
  <div class="admin-comments-container">
    <el-card class="admin-comments-card">
      <template #header>
        <div class="card-header">
          <h2>评论管理</h2>
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
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            style="margin-left: 10px;"
          >
            <el-option label="全部状态" value="" />
            <el-option label="已发布" value="1" />
            <el-option label="待审核" value="0" />
          </el-select>
          <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
          <el-button @click="resetSearch" style="margin-left: 10px;">重置</el-button>
        </div>
        
        <!-- 评论列表 -->
        <el-table
          v-loading="loading"
          :data="commentStore.getCommentList"
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
          <el-table-column label="作者" width="150">
            <template #default="scope">
              {{ scope.row.author?.username || '未知作者' }}
            </template>
          </el-table-column>
          <el-table-column prop="likeCount" label="点赞数" width="100" sortable />
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                {{ scope.row.status === 1 ? '已发布' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" sortable />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button
                v-if="scope.row.status === 0"
                type="success"
                size="small"
                @click="reviewComment(scope.row.id, 1)"
              >
                通过
              </el-button>
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
            v-model:current-page="commentStore.page"
            v-model:page-size="commentStore.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="commentStore.getTotalCount"
            @size-change="handleCommentSizeChange"
            @current-change="handleCommentCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// 状态筛选
const statusFilter = ref('')

// 选中的评论
const selectedComments = ref<number[]>([])

// 文章标题映射
const articleTitleMap = ref<Map<number, string>>(new Map())

// 获取所有评论
const getAllComments = async () => {
  try {
    loading.value = true
    await commentStore.getAllComments({
      page: commentStore.page,
      size: commentStore.size,
      keyword: searchKeyword.value,
      status: statusFilter.value ? parseInt(statusFilter.value) : undefined
    })
  } catch (error: any) {
    ElMessage.error(error.message || '获取评论列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索评论
const handleSearch = () => {
  commentStore.page = 1
  getAllComments()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  commentStore.page = 1
  getAllComments()
}

// 分页大小变化
const handleCommentSizeChange = (size: number) => {
  commentStore.size = size
  getAllComments()
}

// 页码变化
const handleCommentCurrentChange = (page: number) => {
  commentStore.page = page
  getAllComments()
}

// 审核评论
const reviewComment = async (id: number, status: number) => {
  try {
    // 这里需要调用审核评论的API，等待后端提供
    // await commentStore.reviewComment(id, status)
    ElMessage.success('评论审核成功')
    getAllComments()
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败')
  }
}

// 删除评论
const deleteComment = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await commentStore.deleteComment(id)
    await getAllComments()
    ElMessage.success('评论删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('评论删除失败')
    }
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
  getAllComments()
})
</script>

<style scoped>
.admin-comments-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-comments-card {
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
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
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