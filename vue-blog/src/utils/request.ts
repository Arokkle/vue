import axios from 'axios'
import type { AxiosInstance } from 'axios'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: '/api', // 基础URL，结合代理配置实现正确的API请求
  timeout: 10000, // 请求超时时间
  withCredentials: true // 发送请求时携带cookie，用于保持登录状态
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 检查响应数据是否符合预期格式
    if (typeof res === 'object' && res !== null) {
      if (res.success) {
        return res
      } else {
        // 处理错误情况
        const errorMessage = res.message || '请求失败'
        console.error('请求失败:', errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
    } else {
      // 响应数据格式不符合预期
      console.error('响应数据格式错误:', res)
      return Promise.reject(new Error('响应数据格式错误'))
    }
  },
  (error) => {
    // 优化错误处理，避免不必要的控制台日志
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status
      // 401未授权错误是正常的，不显示详细错误日志
      if (status === 401) {
        // 不打印日志，只返回错误对象
      } else {
        console.error('网络错误:', error.message || error)
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误:', '服务器无响应，请检查网络连接')
    } else {
      // 请求配置错误
      console.error('网络错误:', error.message || error)
    }
    // 提供更友好的错误信息
    let errorMessage = '网络请求失败'
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        errorMessage = '请先登录'
      } else {
        errorMessage = `请求失败，状态码: ${status}`
      }
    } else if (error.request) {
      errorMessage = '服务器无响应，请检查网络连接'
    }
    return Promise.reject(new Error(errorMessage))
  }
)

export default request