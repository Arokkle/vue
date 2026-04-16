<template>
  <div class="rag-test-container">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header>
        <div class="header-content">
          <h1 class="blog-title">维他命博客</h1>
          <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal">
            <el-menu-item index="home" @click="$router.push('/')">首页</el-menu-item>
            <el-menu-item index="ai-chat" @click="$router.push('/ai-chat')">AI 助手</el-menu-item>
            <el-menu-item index="rag-test" @click="$router.push('/rag-test')">RAG 测试</el-menu-item>
          </el-menu>
        </div>
      </el-header>

      <el-main>
        <el-card shadow="hover" class="rag-test-card">
          <template #header>
            <div class="card-header">
              <span>RAG 本地知识库测试</span>
            </div>
          </template>
          
          <div class="rag-test-content">
            <!-- 输入区域 -->
            <div class="input-area">
              <el-input
                v-model="query"
                placeholder="输入你的问题..."
                @keyup.enter="testRAG"
                type="textarea"
                :rows="3"
              />
              <el-button type="primary" @click="testRAG" class="test-button">
                测试 RAG
              </el-button>
            </div>
            
            <!-- 结果展示 -->
            <div class="result-area" v-if="result">
              <el-collapse>
                <el-collapse-item title="原始查询">
                  <div class="result-content">{{ query }}</div>
                </el-collapse-item>
                <el-collapse-item title="相关文档">
                  <div class="result-content">
                    <div v-for="(doc, index) in result.relevantDocs" :key="index" class="document-item">
                      <div class="document-source">来源: {{ doc.source }}</div>
                      <div class="document-content">{{ doc.content }}</div>
                    </div>
                  </div>
                </el-collapse-item>
                <el-collapse-item title="生成的提示词">
                  <div class="result-content">{{ result.prompt }}</div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </el-card>
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
import { ref } from 'vue'
import { performRAGQuery } from '../../rag/services/ragService'

const activeIndex = ref('rag-test')
const query = ref('')
const result = ref(null)

// 测试RAG功能
const testRAG = async () => {
  if (!query.value.trim()) {
    return
  }
  
  try {
    const ragResult = performRAGQuery(query.value.trim())
    result.value = ragResult
  } catch (error) {
    console.error('测试RAG失败:', error)
  }
}
</script>

<style scoped>
.rag-test-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.rag-test-card {
  margin: 20px auto;
  max-width: 800px;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-height: 600px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

.card-header span {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.rag-test-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area .el-input {
  flex: 1;
}

.test-button {
  flex-shrink: 0;
  height: 40px;
}

.result-area {
  margin-top: 20px;
}

.result-content {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.document-item {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.document-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.document-source {
  font-weight: 600;
  margin-bottom: 8px;
  color: #409eff;
}

.document-content {
  color: #606266;
}

/* 头部样式 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 70px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.blog-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--primary-color);
  text-decoration: none;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-title:hover {
  transform: scale(1.05);
  text-decoration: none;
}

/* 导航菜单样式优化 */
.el-menu-demo {
  background-color: transparent;
  border-bottom: none;
}

.el-menu-demo .el-menu-item {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.3s ease;
  height: 70px;
  line-height: 70px;
}

.el-menu-demo .el-menu-item:hover {
  color: var(--primary-color);
  background-color: transparent;
}

.el-menu-demo .el-menu-item.is-active {
  color: var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
  background-color: transparent;
}

/* 页脚样式 */
.footer-content {
  text-align: center;
  padding: 32px 0;
  color: var(--text-light);
  font-size: 14px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  border-top: 1px solid var(--medium-gray);
  margin-top: 40px;
  background-color: #fff;
}

.footer-content p {
  margin: 0;
  color: var(--text-light);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 20px;
  }
  
  .el-main {
    padding: 16px;
  }
  
  .rag-test-card {
    margin: 16px;
  }
  
  .input-area {
    flex-direction: column;
    align-items: stretch;
  }
  
  .test-button {
    align-self: flex-end;
  }
}
</style>