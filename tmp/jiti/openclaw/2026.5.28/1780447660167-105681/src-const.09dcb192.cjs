"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.WeComCommand = exports.WS_MAX_RECONNECT_ATTEMPTS = exports.WS_MAX_AUTH_FAILURE_ATTEMPTS = exports.WS_HEARTBEAT_INTERVAL_MS = exports.WEBHOOK_PATHS = exports.VOICE_MAX_BYTES = exports.VIDEO_MAX_BYTES = exports.VALID_CARD_TYPES = exports.UPLOAD_CHUNK_SIZE = exports.THINKING_MESSAGE = exports.TEXT_CHUNK_LIMIT = exports.TEMPLATE_CARD_CACHE_TTL_MS = exports.TEMPLATE_CARD_CACHE_MAX_SIZE = exports.SCENE_WECOM_OPENCLAW = exports.REPLY_SEND_TIMEOUT_MS = exports.MESSAGE_STATE_TTL_MS = exports.MESSAGE_STATE_MAX_SIZE = exports.MESSAGE_STATE_CLEANUP_INTERVAL_MS = exports.MESSAGE_PROCESS_TIMEOUT_MS = exports.MEDIA_IMAGE_PLACEHOLDER = exports.MEDIA_DOCUMENT_PLACEHOLDER = exports.MCP_GET_CONFIG_CMD = exports.MCP_CONFIG_FETCH_TIMEOUT_MS = exports.LIMITS = exports.IMAGE_MAX_BYTES = exports.IMAGE_DOWNLOAD_TIMEOUT_MS = exports.GLOBAL_WS_CLIENT_KEY = exports.FILE_MAX_BYTES = exports.FILE_DOWNLOAD_TIMEOUT_MS = exports.EVENT_ENTER_CHECK_UPDATE = exports.DEFAULT_MEDIA_MAX_MB = exports.CRYPTO = exports.CMD_ENTER_EVENT_REPLY = exports.CHANNEL_ID = exports.BIZ_MSG_SEND_TIMEOUT_MS = exports.API_ENDPOINTS = exports.AIBOT_SEND_BIZ_MSG_CMD = exports.ABSOLUTE_MAX_BYTES = void 0; /**
 * 企业微信渠道常量定义
 */
/**
 * 企业微信渠道 ID
 */
const CHANNEL_ID = exports.CHANNEL_ID = "wecom";
/**
 * 企业微信 WebSocket 命令枚举
 */
var WeComCommand;
(function (WeComCommand) {
  /** 认证订阅 */
  WeComCommand["SUBSCRIBE"] = "aibot_subscribe";
  /** 心跳 */
  WeComCommand["PING"] = "ping";
  /** 企业微信推送消息 */
  WeComCommand["AIBOT_CALLBACK"] = "aibot_callback";
  /** clawdbot 响应消息 */
  WeComCommand["AIBOT_RESPONSE"] = "aibot_response";
})(WeComCommand || (exports.WeComCommand = WeComCommand = {}));
// ============================================================================
// 超时和重试配置
// ============================================================================
/** 图片下载超时时间（毫秒） */
const IMAGE_DOWNLOAD_TIMEOUT_MS = exports.IMAGE_DOWNLOAD_TIMEOUT_MS = 30_000;
/** 文件下载超时时间（毫秒） */
const FILE_DOWNLOAD_TIMEOUT_MS = exports.FILE_DOWNLOAD_TIMEOUT_MS = 60_000;
/** 消息发送超时时间（毫秒） */
const REPLY_SEND_TIMEOUT_MS = exports.REPLY_SEND_TIMEOUT_MS = 15_000;
/** 消息处理总超时时间（毫秒） */
const MESSAGE_PROCESS_TIMEOUT_MS = exports.MESSAGE_PROCESS_TIMEOUT_MS = 6 * 60 * 1000;
/** WebSocket 心跳间隔（毫秒） */
const WS_HEARTBEAT_INTERVAL_MS = exports.WS_HEARTBEAT_INTERVAL_MS = 30_000;
/** WebSocket 连接断开时的最大重连次数 */
const WS_MAX_RECONNECT_ATTEMPTS = exports.WS_MAX_RECONNECT_ATTEMPTS = 10;
/** WebSocket 认证失败时的最大重试次数 */
const WS_MAX_AUTH_FAILURE_ATTEMPTS = exports.WS_MAX_AUTH_FAILURE_ATTEMPTS = 5;
// ============================================================================
// 消息状态管理配置
// ============================================================================
/** messageStates Map 条目的最大 TTL（毫秒），防止内存泄漏 */
const MESSAGE_STATE_TTL_MS = exports.MESSAGE_STATE_TTL_MS = 10 * 60 * 1000;
/** messageStates Map 清理间隔（毫秒） */
const MESSAGE_STATE_CLEANUP_INTERVAL_MS = exports.MESSAGE_STATE_CLEANUP_INTERVAL_MS = 60_000;
/** messageStates Map 最大条目数 */
const MESSAGE_STATE_MAX_SIZE = exports.MESSAGE_STATE_MAX_SIZE = 500;
/** WebSocket 全局实例键 */
const GLOBAL_WS_CLIENT_KEY = exports.GLOBAL_WS_CLIENT_KEY = "__wecom_openclaw_ws_client_instances";
// ============================================================================
// 消息模板
// ============================================================================
/** "思考中"流式消息占位内容 */
const THINKING_MESSAGE = exports.THINKING_MESSAGE = "<think></think>";
/** 仅包含图片时的消息占位符 */
const MEDIA_IMAGE_PLACEHOLDER = exports.MEDIA_IMAGE_PLACEHOLDER = "<media:image>";
/** 仅包含文件时的消息占位符 */
const MEDIA_DOCUMENT_PLACEHOLDER = exports.MEDIA_DOCUMENT_PLACEHOLDER = "<media:document>";
// ============================================================================
// 默认值
// ============================================================================
// ============================================================================
// MCP 配置
// ============================================================================
/** 获取 MCP 配置的 WebSocket 命令 */
const MCP_GET_CONFIG_CMD = exports.MCP_GET_CONFIG_CMD = "aibot_get_mcp_config";
/** 发送业务消息的 WebSocket 命令（如文档授权卡片） */
const AIBOT_SEND_BIZ_MSG_CMD = exports.AIBOT_SEND_BIZ_MSG_CMD = "aibot_send_biz_msg";
/** 业务消息超时时间（毫秒） */
const BIZ_MSG_SEND_TIMEOUT_MS = exports.BIZ_MSG_SEND_TIMEOUT_MS = 10_000;
/** MCP 配置拉取超时时间（毫秒） */
const MCP_CONFIG_FETCH_TIMEOUT_MS = exports.MCP_CONFIG_FETCH_TIMEOUT_MS = 15_000;
// ============================================================================
// 默认值
// ============================================================================
/** 默认媒体大小上限（MB） */
const DEFAULT_MEDIA_MAX_MB = exports.DEFAULT_MEDIA_MAX_MB = 5;
/** 文本分块大小上限 */
const TEXT_CHUNK_LIMIT = exports.TEXT_CHUNK_LIMIT = 4000;
// ============================================================================
// 媒体上传相关常量
// ============================================================================
/** 图片大小上限（字节）：10MB */
const IMAGE_MAX_BYTES = exports.IMAGE_MAX_BYTES = 10 * 1024 * 1024;
/** 视频大小上限（字节）：10MB */
const VIDEO_MAX_BYTES = exports.VIDEO_MAX_BYTES = 10 * 1024 * 1024;
/** 语音大小上限（字节）：2MB */
const VOICE_MAX_BYTES = exports.VOICE_MAX_BYTES = 2 * 1024 * 1024;
/** 文件大小上限（字节）：20MB */
const FILE_MAX_BYTES = exports.FILE_MAX_BYTES = 20 * 1024 * 1024;
/** 文件绝对上限（字节）：超过此值无法发送，等于 FILE_MAX_BYTES */
const ABSOLUTE_MAX_BYTES = exports.ABSOLUTE_MAX_BYTES = FILE_MAX_BYTES;
/** 上传分片大小（字节，Base64 编码前）：512KB */
const UPLOAD_CHUNK_SIZE = exports.UPLOAD_CHUNK_SIZE = 512 * 1024;
// ============================================================================
// 事件/命令名称常量
// ============================================================================
/** 版本检查事件名称（SDK 事件监听用） */
const EVENT_ENTER_CHECK_UPDATE = exports.EVENT_ENTER_CHECK_UPDATE = "event.enter_check_update";
/** 版本检查事件回复命令名称 */
const CMD_ENTER_EVENT_REPLY = exports.CMD_ENTER_EVENT_REPLY = "ww_ai_robot_enter_event";
// ============================================================================
// SDK 连接配置
// ============================================================================
/** WSClient scene 参数：企微 OpenClaw 场景 */
const SCENE_WECOM_OPENCLAW = exports.SCENE_WECOM_OPENCLAW = 1;
/**
 * WeCom 双模式常量定义
 */
/** 固定 Webhook 路径 */
const WEBHOOK_PATHS = exports.WEBHOOK_PATHS = {
  /** Bot 模式历史兼容路径（不再维护） */
  BOT: "/wecom",
  /** Bot 模式历史备用兼容路径（不再维护） */
  BOT_ALT: "/wecom/bot",
  /** Agent 模式历史兼容路径（不再维护） */
  AGENT: "/wecom/agent",
  /** Bot 模式推荐路径前缀 */
  BOT_PLUGIN: "/plugins/wecom/bot",
  /** Agent 模式推荐路径前缀 */
  AGENT_PLUGIN: "/plugins/wecom/agent"
};
/** 企业微信 API 端点 */
const API_ENDPOINTS = exports.API_ENDPOINTS = {
  GET_TOKEN: "https://qyapi.weixin.qq.com/cgi-bin/gettoken",
  SEND_MESSAGE: "https://qyapi.weixin.qq.com/cgi-bin/message/send",
  SEND_APPCHAT: "https://qyapi.weixin.qq.com/cgi-bin/appchat/send",
  UPLOAD_MEDIA: "https://qyapi.weixin.qq.com/cgi-bin/media/upload",
  DOWNLOAD_MEDIA: "https://qyapi.weixin.qq.com/cgi-bin/media/get"
};
/** 各类限制常量 */
const LIMITS = exports.LIMITS = {
  /** 文本消息最大字节数 */
  TEXT_MAX_BYTES: 2048,
  /** Token 刷新缓冲时间 (提前刷新) */
  TOKEN_REFRESH_BUFFER_MS: 60_000,
  /** HTTP 请求超时 */
  REQUEST_TIMEOUT_MS: 15_000,
  /** 最大请求体大小 */
  MAX_REQUEST_BODY_SIZE: 1024 * 1024
};
/** AES 加密常量 */
const CRYPTO = exports.CRYPTO = {
  /** PKCS#7 块大小 */
  PKCS7_BLOCK_SIZE: 32,
  /** AES Key 长度 */
  AES_KEY_LENGTH: 32
};
// ============================================================================
// 模板卡片配置
// ============================================================================
/** 合法的模板卡片 card_type 列表 */
const VALID_CARD_TYPES = exports.VALID_CARD_TYPES = [
"text_notice",
"news_notice",
"button_interaction",
"vote_interaction",
"multiple_interaction"];

/** 模板卡片缓存条目 TTL（毫秒）：24小时 */
const TEMPLATE_CARD_CACHE_TTL_MS = exports.TEMPLATE_CARD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** 模板卡片缓存最大条目数 */
const TEMPLATE_CARD_CACHE_MAX_SIZE = exports.TEMPLATE_CARD_CACHE_MAX_SIZE = 300; /* v9-09d705d0ebae47ab */
