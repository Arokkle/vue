// 用户公开信息（与后端 UserInfo 对应）
export interface UserInfo {
  id: number
  username: string
  avatar: string
  // 可选的其他公开字段
  bio?: string
}

// 好友关系视图对象（与后端 FriendVO 对应）
export interface FriendVO {
  id: number
  userId?: number        // 当前用户ID（视后端返回情况）
  friendId: number       // 好友用户ID
  status: number         // 0-待确认,1-已同意,2-已拒绝,3-已拉黑
  remark?: string        // 备注
  friendInfo: UserInfo   // 好友的详细信息
  createTime?: string    // 创建时间
  unreadCount?: number   // 未读消息数（可选）
}