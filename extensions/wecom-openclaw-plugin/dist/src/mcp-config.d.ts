/**
 * MCP 配置拉取与持久化模块
 *
 * 负责:
 * - 通过 WSClient 发送 aibot_get_mcp_config 请求
 * - 解析服务端响应,提取 MCP 配置(url、type、is_authed)
 * - 将配置写入 openclaw.plugin.json 的 wecomMcp 字段
 */
import { type WSClient } from "@wecom/aibot-node-sdk";
import type { RuntimeEnv } from "openclaw/plugin-sdk";
import type { McpConfigBody } from "./interface.js";
/**
 * 通过 WSClient 发送 aibot_get_mcp_config 命令,获取 MCP 配置
 *
 * @param wsClient - 已认证的 WSClient 实例
 * @returns MCP 配置(url、type、is_authed)
 * @throws 响应错误码非 0 或缺少 url 字段时抛出错误
 */
export declare function fetchMcpConfig(wsClient: WSClient): Promise<McpConfigBody>;
/**
 * 拉取 MCP 配置并持久化到 openclaw.plugin.json
 *
 * 认证成功后调用。失败仅记录日志,不影响 WebSocket 消息正常收发。
 *
 * @param wsClient - 已认证的 WSClient 实例
 * @param accountId - 账户 ID(用于日志)
 * @param runtime - 运行时环境(用于日志)
 */
export declare function fetchAndSaveMcpConfig(wsClient: WSClient, accountId: string, runtime: RuntimeEnv): Promise<void>;
