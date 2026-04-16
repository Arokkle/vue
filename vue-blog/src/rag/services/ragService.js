// 纯JavaScript实现的RAG服务
// 避免依赖问题，使用模拟数据和简单算法

// 模拟文档数据
const documents = [
  {
    id: 1,
    content: '维他命博客是一个专注于技术分享的平台，提供高质量的技术文章和教程。',
    source: 'about.txt',
    tags: ['博客', '技术', '分享']
  },
  {
    id: 2,
    content: 'Vue 3 是目前最新的 Vue.js 版本，带来了 Composition API、Teleport 等新特性。',
    source: 'vue3.txt',
    tags: ['Vue', '前端', '框架']
  },
  {
    id: 3,
    content: 'LangChain 是一个用于构建 LLM 应用的框架，提供了丰富的工具和组件。',
    source: 'langchain.txt',
    tags: ['LangChain', 'AI', '框架']
  },
  {
    id: 4,
    content: 'RAG (Retrieval-Augmented Generation) 是一种结合检索和生成的 AI 技术，可以提高模型回答的准确性。',
    source: 'rag.txt',
    tags: ['RAG', 'AI', '技术']
  },
  {
    id: 5,
    content: 'Ollama 是一个本地运行大语言模型的工具，支持多种模型如 Llama、Qwen 等。',
    source: 'ollama.txt',
    tags: ['Ollama', 'AI', '本地部署']
  },
  {
    id: 6,
    content: 'Vue Router 是 Vue.js 的官方路由管理器，用于构建单页应用。',
    source: 'vue-router.txt',
    tags: ['Vue', '前端', '路由']
  },
  {
    id: 7,
    content: 'Pinia 是 Vue 3 的官方状态管理库，提供了更简洁的 API 和更好的 TypeScript 支持。',
    source: 'pinia.txt',
    tags: ['Vue', '前端', '状态管理']
  },
  {
    id: 8,
    content: 'Element Plus 是基于 Vue 3 的 UI 组件库，提供了丰富的组件和主题。',
    source: 'element-plus.txt',
    tags: ['Vue', '前端', 'UI库']
  }
];

// 简单的文本相似度计算函数
const calculateSimilarity = (text1, text2) => {
  // 简单的基于词频的相似度计算
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

// 分割文档为小块
const splitDocuments = (docs, chunkSize = 200) => {
  const chunks = [];
  
  docs.forEach(doc => {
    const content = doc.content;
    let start = 0;
    
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push({
        id: `${doc.id}-${start}`,
        content: content.substring(start, end),
        source: doc.source,
        tags: doc.tags
      });
      start = end;
    }
  });
  
  return chunks;
};

// 初始化向量存储（模拟）
const initVectorStore = () => {
  const chunks = splitDocuments(documents);
  
  return {
    chunks,
    // 相似度搜索
    similaritySearch: (query, k = 3) => {
      return chunks
        .map(chunk => ({
          ...chunk,
          score: calculateSimilarity(query, chunk.content)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k)
        .map(({ score, ...chunk }) => chunk);
    }
  };
};

// 执行RAG查询
const performRAGQuery = (query) => {
  try {
    const vectorStore = initVectorStore();
    
    // 检索相关文档
    const relevantDocs = vectorStore.similaritySearch(query, 3);
    
    // 构建上下文
    const context = relevantDocs
      .map(doc => `来源: ${doc.source}\n内容: ${doc.content}`)
      .join('\n\n');
    
    // 构建提示词
    const prompt = `基于以下上下文回答用户问题:\n\n${context}\n\n用户问题: ${query}\n\n请使用中文回答，并且基于提供的上下文信息。如果上下文没有相关信息，请说明无法回答。`;
    
    return {
      prompt,
      context,
      relevantDocs
    };
  } catch (error) {
    console.error('执行RAG查询失败:', error);
    throw error;
  }
};

// 加载文档（模拟）
const loadDocuments = () => {
  return Promise.resolve(documents);
};

// 添加文档到知识库
const addDocument = (content, source) => {
  const newDocument = {
    id: documents.length + 1,
    content: content,
    source: source,
    tags: []
  };
  documents.push(newDocument);
  return Promise.resolve(newDocument);
};

export { initVectorStore, performRAGQuery, loadDocuments, addDocument };