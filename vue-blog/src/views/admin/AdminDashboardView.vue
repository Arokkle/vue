<template>
  <div class="admin-dashboard-container">
    <el-card class="admin-dashboard-card">
      <template #header>
        <div class="card-header">
          <h2>管理控制台</h2>
        </div>
      </template>
      
      <div class="dashboard-content">
        <!-- 欢迎信息 -->
        <div class="welcome-section">
          <el-card shadow="hover" class="welcome-card">
            <h3>欢迎，{{ userStore.user ? userStore.user.username : '管理员' }}</h3>
            <p>这里是管理员控制台，您可以管理用户、文章、评论和分类。</p>
          </el-card>
        </div>
        
        <!-- 数据大屏 -->
        <div class="data-dashboard">
          <el-card shadow="hover" class="dashboard-card">
            <template #header>
              <div class="card-header">
                <span>数据大屏</span>
              </div>
            </template>
            
            <!-- 核心指标卡片 -->
            <el-row :gutter="20" class="metrics-row">
              <el-col :span="6">
                <el-statistic
                  :title="'用户总数'"
                  :value="stats.userCount || 0"
                  :precision="0"
                  :value-style="{ color: '#1976d2', fontSize: '24px', fontWeight: 'bold' }"
                  class="metric-card"
                >
                  <template #prefix>
                    <el-icon style="color: #1976d2; font-size: 24px;">
                      <User />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic
                  :title="'文章总数'"
                  :value="stats.articleCount || 0"
                  :precision="0"
                  :value-style="{ color: '#4caf50', fontSize: '24px', fontWeight: 'bold' }"
                  class="metric-card"
                >
                  <template #prefix>
                    <el-icon style="color: #4caf50; font-size: 24px;">
                      <Document />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic
                  :title="'评论总数'"
                  :value="stats.commentCount || 0"
                  :precision="0"
                  :value-style="{ color: '#ff9800', fontSize: '24px', fontWeight: 'bold' }"
                  class="metric-card"
                >
                  <template #prefix>
                    <el-icon style="color: #ff9800; font-size: 24px;">
                      <ChatDotRound />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic
                  :title="'分类总数'"
                  :value="stats.categoryCount || 0"
                  :precision="0"
                  :value-style="{ color: '#f44336', fontSize: '24px', fontWeight: 'bold' }"
                  class="metric-card"
                >
                  <template #prefix>
                    <el-icon style="color: #f44336; font-size: 24px;">
                      <Menu />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
            </el-row>
            
            <!-- 数据图表 -->
            <div class="charts-section">
              <el-row :gutter="20">
                <!-- 文章分类分布 -->
                <el-col :span="12">
                  <el-card shadow="hover" class="chart-card">
                    <template #header>
                      <div class="card-header">
                        <span>文章分类分布</span>
                      </div>
                    </template>
                    <div class="chart-container">
                      <el-empty description="暂无分类数据" v-if="!categoryStats.length" />
                      <v-chart
                        v-else
                        class="pie-chart"
                        :option="pieChartOption"
                        autoresize
                      />
                    </div>
                  </el-card>
                </el-col>
                
                <!-- 文章状态分布 -->
                <el-col :span="12">
                  <el-card shadow="hover" class="chart-card">
                    <template #header>
                      <div class="card-header">
                        <span>文章状态分布</span>
                      </div>
                    </template>
                    <div class="chart-container">
                      <div class="status-stats">
                        <div class="status-item">
                          <span class="status-label">已发布</span>
                          <el-tag type="success" size="large">{{ articleStats.published || 0 }}</el-tag>
                        </div>
                        <div class="status-item">
                          <span class="status-label">草稿</span>
                          <el-tag type="warning" size="large">{{ articleStats.draft || 0 }}</el-tag>
                        </div>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </div>
        
        <!-- 管理功能卡片 -->
        <div class="management-section">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card
                shadow="hover"
                class="management-card"
                @click="$router.push('/admin/users')"
              >
                <div class="card-icon user-icon">
                  <el-icon><User /></el-icon>
                </div>
                <h3>用户管理</h3>
                <p>管理所有用户账号</p>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card
                shadow="hover"
                class="management-card"
                @click="$router.push('/admin/articles')"
              >
                <div class="card-icon article-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <h3>文章管理</h3>
                <p>管理所有文章</p>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card
                shadow="hover"
                class="management-card"
                @click="$router.push('/admin/comments')"
              >
                <div class="card-icon comment-icon">
                  <el-icon><ChatDotRound /></el-icon>
                </div>
                <h3>评论管理</h3>
                <p>管理所有评论</p>
              </el-card>
            </el-col>
            
            <el-col :span="6">
              <el-card
                shadow="hover"
                class="management-card"
                @click="$router.push('/admin/categories')"
              >
                <div class="card-icon category-icon">
                  <el-icon><Menu /></el-icon>
                </div>
                <h3>分类管理</h3>
                <p>管理文章分类</p>
              </el-card>
            </el-col>
          </el-row>
        </div>
        
        <!-- 最新数据 -->
        <div class="latest-data">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card shadow="hover" class="latest-card">
                <template #header>
                  <div class="card-header">
                    <span>最新文章</span>
                  </div>
                </template>
                <div v-if="latestArticles.length" class="latest-list">
                  <div v-for="article in latestArticles" :key="article.id" class="list-item">
                    <div class="article-item">
                      <span class="article-title">{{ article.title }}</span>
                      <span class="article-date">{{ formatDate(article.createTime) }}</span>
                    </div>
                  </div>
                </div>
                <el-empty description="暂无文章" v-else />
              </el-card>
            </el-col>
            
            <el-col :span="12">
              <el-card shadow="hover" class="latest-card">
                <template #header>
                  <div class="card-header">
                    <span>最新用户</span>
                  </div>
                </template>
                <div v-if="latestUsers.length" class="latest-list">
                  <div v-for="user in latestUsers" :key="user.id" class="list-item">
                    <div class="user-item">
                      <span class="user-name">{{ user.username }}</span>
                      <el-tag :type="user.role === 'ADMIN' ? 'danger' : 'info'" size="small">
                        {{ user.role === 'ADMIN' ? '管理员' : '普通用户' }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <el-empty description="暂无用户" v-else />
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { User, Document, ChatDotRound, Menu } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必须的组件
use([
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

const userStore = useUserStore()

// 统计信息
const stats = ref({
  userCount: 0,
  articleCount: 0,
  commentCount: 0,
  categoryCount: 0
})

// 分类统计数据
const categoryStats = ref([])

// 文章状态统计数据
const articleStats = ref({
  published: 0,
  draft: 0
})

// 饼图配置选项
const pieChartOption = computed(() => {
  // 准备饼图数据
  const pieData = categoryStats.value.map(category => ({
    name: category.name,
    value: category.count
  }))
  
  // 生成颜色数组
  const colors = categoryStats.value.map(category => getRandomColor(category.id))
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: categoryStats.value.map(category => category.name)
    },
    color: colors,
    series: [
      {
        name: '文章分类',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ]
  }
})

// 最新文章
const latestArticles = ref([])

// 最新用户
const latestUsers = ref([])

// 加载状态
const loading = ref(false)

// 获取统计信息
const getDashboardStats = async () => {
  try {
    loading.value = true
    console.log('开始请求统计数据...')
    const res: any = await request.get('/admin/stats/dashboard')
    console.log('统计数据请求结果:', res)
    if (res.success) {
      console.log('统计数据:', res.stats)
      stats.value = res.stats
    } else {
      console.error('请求失败，success为false:', res)
      ElMessage.error('获取统计信息失败: ' + (res.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('获取统计信息时发生异常:', error)
    ElMessage.error('获取统计信息失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 获取分类统计数据
const getCategoryStats = async () => {
  try {
    // 直接从后端获取所有分类和对应的文章数量
    const res: any = await request.get('/category/list')
    if (res.success) {
      const categories = res.categories || []
      
      console.log('原始分类数据:', categories)
      
      // 计算总文章数
      const totalArticles = categories.reduce((sum: number, category: any) => {
        return sum + (typeof category.articleCount === 'number' ? category.articleCount : 0)
      }, 0)
      
      console.log('计算的总文章数:', totalArticles)
      
      // 计算每个分类的文章占比
      const categoryStatsList = categories.map((category: any) => {
        const articleCount = typeof category.articleCount === 'number' ? category.articleCount : 0
        const percentage = totalArticles > 0 ? Math.round((articleCount / totalArticles) * 100) : 0
        return {
          id: category.id,
          name: category.name,
          count: articleCount,
          percentage
        }
      })
      
      // 按文章数量降序排序，过滤掉文章数为0的分类
      const filteredAndSorted = categoryStatsList
        .filter((category: any) => category.count > 0)
        .sort((a: any, b: any) => b.count - a.count)
      
      categoryStats.value = filteredAndSorted
      
      console.log('分类统计数据:', filteredAndSorted)
    }
  } catch (error: any) {
    console.error('获取分类统计数据失败:', error)
  }
}

// 获取文章状态统计数据
const getArticleStats = async () => {
  try {
    // 使用正确的API路径获取文章统计数据
    const statsRes: any = await request.get('/article/stats')
    if (statsRes.success && statsRes.stats) {
      articleStats.value = {
        published: statsRes.stats.publishedCount || 0,
        draft: statsRes.stats.draftCount || 0
      }
    }
  } catch (error: any) {
    console.error('获取文章状态统计数据失败:', error)
  }
}

// 获取最新文章
const getLatestArticles = async () => {
  try {
    // 使用正确的API路径获取最新文章
    const res: any = await request.get('/article/admin/all?page=1&size=5')
    if (res.success) {
      latestArticles.value = res.data.records || []
    }
  } catch (error: any) {
    console.error('获取最新文章失败:', error)
  }
}

// 获取最新用户
const getLatestUsers = async () => {
  try {
    // 使用正确的API路径获取最新用户
    const res: any = await request.get('/admin/user/list?page=1&size=5')
    if (res.success) {
      latestUsers.value = res.data.records || []
    }
  } catch (error: any) {
    console.error('获取最新用户失败:', error)
  }
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 生成随机颜色
const getRandomColor = (id: number) => {
  const colors = [
    '#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0',
    '#3f51b5', '#009688', '#ffc107', '#795548', '#607d8b'
  ]
  return colors[id % colors.length]
}

// 初始化
onMounted(async () => {
  // 获取统计信息
  await getDashboardStats()
  
  // 获取分类统计数据
  await getCategoryStats()
  
  // 获取文章状态统计数据
  await getArticleStats()
  
  // 获取最新文章
  await getLatestArticles()
  
  // 获取最新用户
  await getLatestUsers()
})
</script>

<style scoped>
.admin-dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.admin-dashboard-card {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.admin-dashboard-card .el-card__header {
  padding: 16px 24px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.admin-dashboard-card .el-card__body {
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.card-header span {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.dashboard-content {
  margin-top: 0;
}

/* 欢迎信息样式 */
.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  padding: 24px;
  text-align: left;
  border-radius: 8px;
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
}

.welcome-card h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.welcome-card p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 14px;
}

/* 数据大屏样式 */
.data-dashboard {
  margin-bottom: 24px;
}

.dashboard-card {
  border-radius: 8px;
  overflow: hidden;
}

/* 指标卡片样式 */
.metrics-row {
  margin-bottom: 24px;
}

.metric-card {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  height: 100%;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* 图表区域样式 */
.charts-section {
  margin-top: 24px;
}

.chart-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.chart-container {
  padding: 20px 0;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

/* 饼图样式 */
.pie-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

/* 状态统计样式 */
.status-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
}

.status-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.status-label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

/* 管理功能卡片样式 */
.management-section {
  margin-bottom: 24px;
}

.management-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  background-color: #fff;
}

.management-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  border-color: #e0e0e0;
}

.card-icon {
  font-size: 56px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.management-card:hover .card-icon {
  transform: scale(1.1);
}

.user-icon {
  color: #1976d2;
}

.article-icon {
  color: #4caf50;
}

.comment-icon {
  color: #ff9800;
}

.category-icon {
  color: #f44336;
}

.management-card h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.management-card p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

/* 最新数据样式 */
.latest-data {
  margin-bottom: 24px;
}

.latest-card {
  border-radius: 8px;
  overflow: hidden;
}

.latest-list {
  padding: 10px 0;
}

.list-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.list-item:last-child {
  border-bottom: none;
}

.article-item,
.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.article-title,
.user-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.article-date {
  font-size: 12px;
  color: #909399;
  margin-left: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .admin-dashboard-container {
    max-width: 100%;
  }
  
  .category-progress {
    margin-bottom: 12px;
  }
}

@media (max-width: 768px) {
  .admin-dashboard-container {
    padding: 16px;
  }
  
  .metrics-row .el-col {
    margin-bottom: 16px;
  }
  
  .status-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .article-item,
  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .management-card {
    height: 180px;
    margin-bottom: 16px;
  }
  
  .welcome-card h3 {
    font-size: 20px;
  }
  
  .chart-container {
    height: 200px;
    padding: 16px 0;
  }
}
</style>