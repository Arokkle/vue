<template>
  <div class="admin-categories-container">
    <el-card class="admin-categories-card">
      <template #header>
        <div class="card-header">
          <h2>分类管理</h2>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新增分类
          </el-button>
        </div>
      </template>
      
      <div class="categories-content">
        <!-- 分类树 -->
        <div class="categories-tree">
          <el-card shadow="hover" class="tree-card">
            <template #header>
              <div class="card-header">
                <span>分类树</span>
              </div>
            </template>
            <el-tree
              v-model="defaultCheckedKeys"
              :data="categoryStore.getCategoryTree"
              show-checkbox
              node-key="id"
              :props="{
                value: 'id',
                label: 'name',
                children: 'children'
              }"
              @node-click="handleNodeClick"
            />
          </el-card>
        </div>
        
        <!-- 分类列表 -->
        <div class="categories-list">
          <el-card shadow="hover" class="list-card">
            <template #header>
              <div class="card-header">
                <span>分类列表</span>
              </div>
            </template>
            <el-table
              v-loading="loading"
              :data="categoryStore.categories"
              style="width: 100%"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" sortable />
              <el-table-column prop="name" label="分类名称" min-width="150" sortable />
              <el-table-column prop="description" label="描述" min-width="200" />
              <el-table-column prop="parentId" label="父分类ID" width="120" sortable />
              <el-table-column prop="sortOrder" label="排序" width="100">
                <template #default="scope">
                  <el-input-number
                    v-model="scope.row.sortOrder"
                    :min="0"
                    @change="updateCategorySort(scope.row.id, scope.row.sortOrder)"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="articleCount" label="文章数" width="100" sortable />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button
                    type="primary"
                    size="small"
                    @click="editCategory(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    @click="deleteCategory(scope.row.id, scope.row.name)"
                    :disabled="scope.row.children && scope.row.children.length > 0"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
      
      <!-- 创建分类对话框 -->
      <el-dialog
        v-model="showCreateDialog"
        title="新增分类"
        width="500px"
      >
        <el-form :model="createForm" :rules="formRules" ref="createFormRef" label-width="80px">
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="createForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="createForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述"
            />
          </el-form-item>
          <el-form-item label="父分类">
            <el-cascader
              v-model="createForm.parentId"
              :options="categoryStore.getCategoryTree"
              :props="{
                value: 'id',
                label: 'name',
                children: 'children'
              }"
              placeholder="选择父分类"
              clearable
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number
              v-model="createForm.sortOrder"
              :min="0"
              placeholder="请输入排序值"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showCreateDialog = false">取消</el-button>
            <el-button type="primary" @click="createCategory">确定</el-button>
          </div>
        </template>
      </el-dialog>
      
      <!-- 编辑分类对话框 -->
      <el-dialog
        v-model="showEditDialog"
        title="编辑分类"
        width="500px"
      >
        <el-form :model="editForm" :rules="formRules" ref="editFormRef" label-width="80px">
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="editForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="editForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述"
            />
          </el-form-item>
          <el-form-item label="父分类">
            <el-cascader
              v-model="editForm.parentId"
              :options="categoryStore.getCategoryTree"
              :props="{
                value: 'id',
                label: 'name',
                children: 'children'
              }"
              placeholder="选择父分类"
              clearable
            />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number
              v-model="editForm.sortOrder"
              :min="0"
              placeholder="请输入排序值"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showEditDialog = false">取消</el-button>
            <el-button type="primary" @click="updateCategory">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useCategoryStore } from '../../stores/category'

const categoryStore = useCategoryStore()

// 加载状态
const loading = ref(false)

// 分类树默认选中键
const defaultCheckedKeys = ref([])

// 选中的分类
const selectedCategories = ref<number[]>([])

// 创建分类对话框
const showCreateDialog = ref(false)
const createFormRef = ref()
const createForm = reactive({
  name: '',
  description: '',
  parentId: null,
  sortOrder: 0
})

// 编辑分类对话框
const showEditDialog = ref(false)
const editFormRef = ref()
const editForm = reactive({
  id: 0,
  name: '',
  description: '',
  parentId: null,
  sortOrder: 0
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
}

// 获取分类列表和树
const getCategories = async () => {
  try {
    loading.value = true
    await Promise.all([
      categoryStore.getAllCategories(),
      categoryStore.fetchCategoryTree()
    ])
  } catch (error: any) {
    ElMessage.error(error.message || '获取分类失败')
  } finally {
    loading.value = false
  }
}

// 处理节点点击
const handleNodeClick = (data: any) => {
  console.log('点击节点:', data)
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedCategories.value = selection.map(item => item.id)
}

// 显示创建分类对话框
const showCreateCategoryDialog = () => {
  showCreateDialog.value = true
}

// 创建分类
const createCategory = async () => {
  if (!createFormRef.value) return
  
  await createFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await categoryStore.createCategory({
          name: createForm.name,
          description: createForm.description,
          parentId: createForm.parentId,
          sortOrder: createForm.sortOrder
        })
        ElMessage.success('分类创建成功')
        showCreateDialog.value = false
        // 重置表单
        createForm.name = ''
        createForm.description = ''
        createForm.parentId = null
        createForm.sortOrder = 0
        // 重新获取分类
        getCategories()
      } catch (error: any) {
        ElMessage.error(error.message || '分类创建失败')
      }
    }
  })
}

// 编辑分类
const editCategory = (category: any) => {
  editForm.id = category.id
  editForm.name = category.name
  editForm.description = category.description
  editForm.parentId = category.parentId
  editForm.sortOrder = category.sortOrder
  showEditDialog.value = true
}

// 更新分类
const updateCategory = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await categoryStore.updateCategory(editForm.id, {
          name: editForm.name,
          description: editForm.description,
          parentId: editForm.parentId,
          sortOrder: editForm.sortOrder
        })
        ElMessage.success('分类更新成功')
        showEditDialog.value = false
        // 重新获取分类
        getCategories()
      } catch (error: any) {
        ElMessage.error(error.message || '分类更新失败')
      }
    }
  })
}

// 更新分类排序
const updateCategorySort = async (id: number, sortOrder: number) => {
  try {
    await categoryStore.updateCategory(id, { sortOrder })
    ElMessage.success('排序更新成功')
    // 重新获取分类
    getCategories()
  } catch (error: any) {
    ElMessage.error(error.message || '排序更新失败')
  }
}

// 删除分类
const deleteCategory = async (id: number, name: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${name}" 吗？此操作会将该分类下的所有子分类移至根目录，且不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await categoryStore.deleteCategory(id)
    ElMessage.success('分类删除成功')
    // 重新获取分类
    getCategories()
  } catch (error: any) {
    if (error === 'cancel') return // 用户取消操作
    ElMessage.error(error.message || '分类删除失败')
  }
}

// 初始化
onMounted(() => {
  getCategories()
})
</script>

<style scoped>
.admin-categories-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-categories-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.categories-content {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.categories-tree {
  flex: 1;
  min-width: 300px;
}

.categories-list {
  flex: 2;
  min-width: 400px;
}

.tree-card, .list-card {
  margin-bottom: 20px;
}

.tree-card .el-tree {
  max-height: 500px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>