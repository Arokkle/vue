<template>
  <div class="my-articles-container">
    <el-card class="my-articles-card">
      <template #header>
        <div class="card-header">
          <h2>我的文章</h2>
          <el-button type="primary" @click="$router.push('/create-article')">
            <el-icon><Plus /></el-icon>
            写文章
          </el-button>
        </div>
      </template>
      
      <div class="articles-content">
        <!-- 搜索和筛选 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索文章标题"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        
        <!-- 文章列表 -->
        <el-table
          v-loading="loading"
          :data="articleList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="scope">
              <el-link :href="`/article/${scope.row.id}`" target="_blank">
                {{ scope.row.title }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="categoryId" label="分类" width="120">
            <template #default="scope">
              {{ getCategoryName(scope.row.categoryId) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
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
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="editArticle(scope.row.id)">
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteArticle(scope.row.id, scope.row.title)"
              >
                删除
              </el-button>
              <el-button
                v-if="scope.row.status === 0"
                type="success"
                size="small"
                @click="publishArticle(scope.row.id)"
              >
                发布
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
import { Plus } from '@element-plus/icons-vue'
import { useArticleStore } from '../../stores/article'
import { useCategoryStore } from '../../stores/category'

const router = useRouter()
const articleStore = useArticleStore()
const categoryStore = useCategoryStore()

// 加载状态
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 选中的文章
const selectedArticles = ref<number[]>([])

// 分页信息
const pagination = ref({
  page: 1,
  size: 10
})

// 文章总数
const total = ref(0)

// 文章列表
const articleList = computed(() => articleStore.articles)

// 分类映射
const categoryMap = ref<Map<number, string>>(new Map())

// 获取文章列表
const getMyArticles = async () => {
  try {
    loading.value = true
    await articleStore.getMyArticles({
      page: pagination.value.page,
      size: pagination.value.size
    })
    total.value = articleStore.total
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
  pagination.value.page = 1
  getMyArticles()
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  pagination.value.page = 1
  getMyArticles()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  getMyArticles()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  getMyArticles()
}

// 编辑文章
const editArticle = (id: number) => {
  router.push(`/edit-article/${id}`)
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
    getMyArticles() // 重新获取文章列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '删除文章失败')
  }
}

// 发布文章
const publishArticle = async (id: number) => {
  try {
    await articleStore.publishArticle(id)
    ElMessage.success('文章发布成功')
    getMyArticles() // 重新获取文章列表
  } catch (error: any) {
    ElMessage.error(error.message || '发布文章失败')
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
  getMyArticles()
})
</script>

<style scoped>
.my-articles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.my-articles-card {
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
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar .el-input {
  width: 300px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>