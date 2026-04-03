import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null
    this.messageCallback = null
  }

  connect(token, userId) {
    console.log('开始连接WebSocket，用户ID:', userId)
    this.stompClient = new Client({
      webSocketFactory: () => {
        const socket = new SockJS('http://localhost:8081/ws')
        socket.onopen = () => console.log('WebSocket连接已打开')
        socket.onclose = () => console.log('WebSocket连接已关闭')
        socket.onerror = (error) => console.error('WebSocket连接错误:', error)
        return socket
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: (frame) => {
        console.log('WebSocket连接成功:', frame)
        console.log('开始订阅消息队列:', `/user/${userId}/queue/messages`)
        this.stompClient.subscribe(`/user/${userId}/queue/messages`, (message) => {
          console.log('收到消息:', message.body)
          if (this.messageCallback) {
            const parsedMessage = JSON.parse(message.body)
            console.log('解析后的消息:', parsedMessage)
            this.messageCallback(parsedMessage)
          }
        })
      },
      onStompError: (error) => {
        console.error('WebSocket STOMP错误:', error)
      },
      onDisconnect: (frame) => {
        console.log('WebSocket断开连接:', frame)
      }
    })
    console.log('激活WebSocket客户端')
    this.stompClient.activate()
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate()
    }
  }

  onMessage(callback) {
    this.messageCallback = callback
  }
}

export default new WebSocketService()