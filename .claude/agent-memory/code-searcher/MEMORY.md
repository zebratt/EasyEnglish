# Easy English 项目代码结构记忆

## 认证架构
- 使用 JWT token 进行身份验证（存储在 localStorage）
- 无服务端 middleware，采用客户端路由守卫 + API 层验证
- Token 有效期：7天
- 密钥配置：JWT_SECRET 环境变量

## 关键文件位置
- 认证核心逻辑：`/src/lib/auth.ts`
- 管理员权限检查：`/src/lib/admin.ts`
- 客户端路由守卫：`/src/components/AuthGuard.tsx`
- 导航栏（含登出）：`/src/components/Navbar.tsx`
- 登录/注册 API：`/src/app/api/auth/login/route.ts`, `/src/app/api/auth/register/route.ts`

## API 认证模式
- 普通用户 API：从 Authorization header 提取 Bearer token，调用 verifyToken()
- 管理员 API：使用 requireAdmin() 辅助函数，返回 payload 或 401/403 响应
- 受保护的 API 路由：`/api/user/profile`, `/api/stats`, `/api/practice/records`, `/api/admin/*`

## 前端认证流程
1. 登录成功后将 token 和 user 存入 localStorage
2. AuthGuard 组件检查 token 存在性，不存在则重定向到 /login
3. 所有 API 请求通过 Authorization: Bearer ${token} 携带凭证
4. Navbar 解析 token payload 显示用户信息和角色
