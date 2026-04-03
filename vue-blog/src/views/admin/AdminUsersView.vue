<template>
  <div class="admin-users-container">
    <el-card class="admin-users-card">
      <template #header>
        <div class="card-header">
          <h2>用户管理</h2>
        </div>
      </template>
      
      <div class="users-content">
        <!-- 搜索框 -->
        <div class="search-bar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索用户名或邮箱"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
        
        <!-- 用户列表 -->
        <el-table
          v-loading="loading"
          :data="adminStore.getUserList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="username" label="用户名" min-width="150" sortable />
          <el-table-column prop="email" label="邮箱" min-width="200" sortable />
          <el-table-column label="角色" width="120">
            <template #default="scope">
              <el-select
                v-model="scope.row.role"
                placeholder="选择角色"
                @change="updateUserRole(scope.row.id, scope.row.role)"
                size="small"
              >
                <el-option label="普通用户" value="USER" />
                <el-option label="管理员" value="ADMIN" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" sortable />
          <el-table-column prop="lastLoginTime" label="最后登录" width="180" sortable />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="deleteUser(scope.row.id, scope.row.username)"
                :disabled="scope.row.id === currentUserId"
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
            :total="adminStore.getTotalCount"
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
import { useAdminStore } from '../../stores/admin'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const adminStore = useAdminStore()
const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 搜索关键词
const searchKeyword = ref('')

// 选中的用户
const selectedUsers = ref<number[]>([])

// 分页信息
const pagination = ref({
  page: 1,
  size: 10
})

// 当前登录用户ID
const currentUserId = computed(() => userStore.user?.id || 0)

// 获取用户列表
const getUsers = async () => {
  try {
    loading.value = true
    await adminStore.getAllUsers({
      page: pagination.value.page,
      size: pagination.value.size
    })
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索用户
const handleSearch = async () => {
  if (!searchKeyword.value) {
    getUsers()
    return
  }
  
  try {
    loading.value = true
    pagination.value.page = 1
    await adminStore.searchUsers(searchKeyword.value, {
      page: pagination.value.page,
      size: pagination.value.size
    })
  } catch (error: any) {
    ElMessage.error(error.message || '搜索用户失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchKeyword.value = ''
  getUsers()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.value.size = size
  getUsers()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  getUsers()
}

// 更新用户角色
const updateUserRole = async (id: number, role: string) => {
  try {
    if (id === currentUserId.value) {
      ElMessage.warning('禁止修改自身角色')
      // 恢复原角色
      await getUsers()
      return
    }
    
    await adminStore.updateUserRole(id, role)
    ElMessage.success('角色更新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '角色更新失败')
    // 恢复原角色
    await getUsers()
  }
}

// 删除用户
const deleteUser = async (id: number, username: string) => {
  try {
    if (id === currentUserId.value) {
      ElMessage.warning('禁止删除自身账号')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要删除用户 "${username}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await adminStore.deleteUser(id)
    ElMessage.success('用户删除成功')
    getUsers() // 重新获取用户列表
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '删除用户失败')
  }
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedUsers.value = selection.map(item => item.id)
}

// 初始化
onMounted(() => {
  getUsers()
})
</script>

<style scoped>
.admin-users-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-users-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.users-content {
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