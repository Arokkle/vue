<template>
  <div class="admin-articles-container">
    <el-card class="admin-articles-card">
      <template #header>
        <div class="card-header">
          <h2>文章管理</h2>
        </div>
      </template>
      
      <div class="articles-content">
        <!-- 搜索框 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章标题"
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
            <el-option label="草稿" value="0" />
          </el-select>
          <el-button type="primary" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
          <el-button @click="resetSearch" style="margin-left: 10px;">重置</el-button>
        </div>
        
        <!-- 文章列表 -->
        <el-table
          v-loading="loading"
          :data="articleStore.articles"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="title" label="标题" min-width="300" sortable />
          <el-table-column label="作者" width="150">
            <template #default="scope">
              {{ scope.row.author?.username || '未知作者' }}
            </template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="scope">
              {{ getCategoryName(scope.row.categoryId) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 1 ? 'success' : 'warning'">
                {{ scope.row.status === 1 ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="likeCount" label="点赞数" width="100" sortable />
          <el-table-column prop="commentCount" label="评论数" width="100" sortable />
          <el-table-column prop="createTime" label="创建时间" width="180" sortable />
          <el-table-column prop="updateTime" label="更新时间" width="180" sortable />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewArticle(scope.row.id)"
              >
                查看
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteArticle(scope.row.id, scope.row.title)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="articleStore.page"
            v-model:page-size="articleStore.size"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="articleStore.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
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
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'

const router = useRouter()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()

// 加载状态
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 状态筛选
const statusFilter = ref('')

// 选中的文章
const selectedArticles = ref<number[]>([])

// 分类映射
const categoryMap = ref<Map<number, string>>(new Map())

// 获取文章列表
const getArticles = async () => {
  try {
    loading.value = true
    await articleStore.getArticleList({
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value ? parseInt(statusFilter.value) : undefined
    })
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
  }
}

// 获取所有分类
const getAllCategories = async () => {
  try {
    await categoryStore.getAllCategories()
    // 构建分类映射
    const categories = categoryStore.categories || []
    categoryMap.value = new Map(categories.map(cat => [cat.id, cat.name]))
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 搜索文章
const handleSearch = () => {
  articleStore.page = 1
  getArticles()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  articleStore.page = 1
  getArticles()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  articleStore.size = size
  getArticles()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  articleStore.page = page
  getArticles()
}

// 查看文章
const viewArticle = (id: number) => {
  router.push(`/article/${id}`)
}

// 删除文章
const deleteArticle = async (id: number, title: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章 "${title}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await articleStore.deleteArticle(id)
    ElMessage.success('文章删除成功')
    getArticles() // 重新获取文章列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '删除文章失败')
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedArticles.value = selection.map(item => item.id)
}

// 根据分类ID获取分类名称
const getCategoryName = (categoryId: number) => {
  return categoryMap.value.get(categoryId) || '未知分类'
}

// 初始化
onMounted(() => {
  getAllCategories()
  getArticles()
})
</script>

<style scoped>
.admin-articles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-articles-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.articles-content {
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

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>