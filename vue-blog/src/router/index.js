import { createRouter, createWebHistory } from 'vue-router'

// 简单的占位组件
import PlaceholderView from '../components/PlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页
    {
      path: '/',
      name: 'home',
      component: () => import('../views/user/HomeView.vue')
    },
    // 文章详情
    {
      path: '/article/:id',
      name: 'article-detail',
      component: () => import('../views/article/ArticleDetailView.vue')
    },
    // 分类列表
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/category/CategoriesView.vue')
    },
    // 热门文章
    {
      path: '/hot',
      name: 'hot',
      component: () => import('../views/article/HotArticlesView.vue')
    },
    // 推荐文章
    {
      path: '/recommended',
      name: 'recommended',
      component: () => import('../views/article/RecommendedArticlesView.vue')
    },
    // 文章列表（按分类）
    {
      path: '/category/:id',
      name: 'category-articles',
      component: () => import('../views/category/CategoryArticlesView.vue')
    },
    // 用户文章列表
    {
      path: '/user/:id/articles',
      name: 'user-articles',
      component: () => import('../views/user/UserArticlesView.vue'),
      meta: { requiresAuth: true }
    },
    // 登录
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/user/LoginView.vue')
    },
    // 注册
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/user/RegisterView.vue')
    },
    // 个人中心
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/user/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    // 我的文章
    {
      path: '/my-articles',
      name: 'my-articles',
      component: () => import('../views/user/MyArticlesView.vue'),
      meta: { requiresAuth: true }
    },
    // 创建文章
    {
      path: '/create-article',
      name: 'create-article',
      component: () => import('../views/article/CreateArticleView.vue'),
      meta: { requiresAuth: true }
    },
    // 编辑文章
    {
      path: '/edit-article/:id',
      name: 'edit-article',
      component: () => import('../views/article/EditArticleView.vue'),
      meta: { requiresAuth: true }
    },
    // 我的评论
    {
      path: '/my-comments',
      name: 'my-comments',
      component: () => import('../views/user/MyCommentsView.vue'),
      meta: { requiresAuth: true }
    },
    // 我的好友
    {
      path: '/my-friends',
      name: 'my-friends',
      component: () => import('../views/user/MyFriendsView.vue'),
      meta: { requiresAuth: true }
    },
    // 聊天页面
    {
      path: '/chat/:friendId',
      name: 'chat',
      component: () => import('../views/user/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    // 管理员控制台
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // 管理员用户管理
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/AdminUsersView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // 管理员文章管理
    {
      path: '/admin/articles',
      name: 'admin-articles',
      component: () => import('../views/admin/AdminArticlesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // 管理员评论管理
    {
      path: '/admin/comments',
      name: 'admin-comments',
      component: () => import('../views/admin/AdminCommentsView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    // 管理员分类管理
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: () => import('../views/admin/AdminCategoriesView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    //搜索
    {
      path: '/search',
      name: 'Search',
      component: () => import('../views/Search.vue'),
      meta: { requiresAuth: true }
    },
    // AI聊天页面
    {
      path: '/ai-chat',
      name: 'ai-chat',
      component: () => import('../views/user/AIChatView.vue')
    },
    // RAG测试页面
    {
      path: '/rag-test',
      name: 'rag-test',
      component: () => import('../views/user/RAGTestView.vue')
    }
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next({ name: 'login' })
    } else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
