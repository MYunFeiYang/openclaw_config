"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.wecomSetupWizard = exports.wecomSetupAdapter = void 0;




var _openclawCompat = require("./openclaw-compat.js");
var _accounts = require("./accounts.js");
var _const = require("./const.js"); /**
 * 企业微信 setupWizard — 声明式 CLI setup wizard 配置。
 *
 * 框架通过 plugin.setupWizard 字段识别并驱动 channel 的引导配置流程。
 */ // ============================================================================
// ChannelSetupAdapter — 框架用于应用配置输入的适配器
// ============================================================================
const wecomSetupAdapter = exports.wecomSetupAdapter = { applyAccountConfig: ({ cfg, input }) => {const patch = {};if (input.token !== undefined) {
      patch.botId = String(input.token).trim();
    }
    if (input.privateKey !== undefined) {
      patch.secret = String(input.privateKey).trim();
    }
    // 如果是首次配置，默认启用
    const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
    if (!account.botId && !account.secret) {
      patch.enabled = true;
    }
    return (0, _accounts.setWeComAccountMulti)(cfg, patch);
  }
};
// ============================================================================
// DM Policy 配置
// ============================================================================
/**
 * 设置企业微信 dmPolicy
 */
function setWeComDmPolicy(cfg, dmPolicy) {
  const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
  const existingAllowFrom = account.config.allowFrom ?? [];
  const allowFrom = dmPolicy === "open" ?
  (0, _openclawCompat.addWildcardAllowFrom)(existingAllowFrom.map((x) => String(x))) :
  existingAllowFrom.map((x) => String(x));
  return (0, _accounts.setWeComAccountMulti)(cfg, {
    dmPolicy,
    allowFrom
  });
}
const dmPolicy = {
  label: "企业微信",
  channel: _const.CHANNEL_ID,
  policyKey: `channels.${_const.CHANNEL_ID}.dmPolicy`,
  allowFromKey: `channels.${_const.CHANNEL_ID}.allowFrom`,
  getCurrent: (cfg) => {
    const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
    return account.config.dmPolicy ?? "open";
  },
  setPolicy: (cfg, policy) => {
    return setWeComDmPolicy(cfg, policy);
  },
  promptAllowFrom: async ({ cfg, prompter }) => {
    const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
    const existingAllowFrom = account.config.allowFrom ?? [];
    const entry = await prompter.text({
      message: "企业微信允许来源（用户ID或群组ID，逗号分隔）",
      placeholder: "user123, group456",
      initialValue: existingAllowFrom[0] ? String(existingAllowFrom[0]) : undefined
    });
    const allowFrom = String(entry ?? "").
    split(/[\n,;]+/g).
    map((s) => s.trim()).
    filter(Boolean);
    return (0, _accounts.setWeComAccountMulti)(cfg, { allowFrom });
  }
};
// ============================================================================
// ChannelSetupWizard — 声明式 setup wizard 配置
// ============================================================================
const wecomSetupWizard = exports.wecomSetupWizard = {
  channel: _const.CHANNEL_ID,
  // ── 状态 ──────────────────────────────────────────────────────────────
  status: {
    configuredLabel: "已配置 ✓",
    unconfiguredLabel: "需要 Bot ID 和 Secret",
    configuredHint: "已配置",
    unconfiguredHint: "需要设置",
    resolveConfigured: ({ cfg }) => {
      const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
      return Boolean(account.botId?.trim() && account.secret?.trim());
    },
    resolveStatusLines: ({ cfg, configured }) => {
      return [`企业微信: ${configured ? "已配置" : "需要 Bot ID 和 Secret"}`];
    }
  },
  // ── 引导说明 ──────────────────────────────────────────────────────────
  introNote: {
    title: "企业微信设置",
    lines: [
    "企业微信机器人需要以下配置信息：",
    "1. Bot ID: 企业微信机器人 ID",
    "2. Secret: 企业微信机器人密钥"],

    shouldShow: ({ cfg }) => {
      const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
      return !account.botId?.trim() || !account.secret?.trim();
    }
  },
  // ── 凭据输入 ──────────────────────────────────────────────────────────
  credentials: [
  {
    inputKey: "token",
    providerHint: "企业微信",
    credentialLabel: "Bot ID",
    envPrompt: "使用环境变量中的 Bot ID？",
    keepPrompt: "Bot ID 已配置，保留当前值？",
    inputPrompt: "企业微信机器人 Bot ID",
    inspect: ({ cfg }) => {
      const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
      const hasValue = Boolean(account.botId?.trim());
      return {
        accountConfigured: hasValue,
        hasConfiguredValue: hasValue,
        resolvedValue: account.botId || undefined
      };
    },
    applySet: ({ cfg, resolvedValue }) => {
      return (0, _accounts.setWeComAccountMulti)(cfg, { botId: resolvedValue });
    }
  },
  {
    inputKey: "privateKey",
    providerHint: "企业微信",
    credentialLabel: "Secret",
    envPrompt: "使用环境变量中的 Secret？",
    keepPrompt: "Secret 已配置，保留当前值？",
    inputPrompt: "企业微信机器人 Secret",
    inspect: ({ cfg }) => {
      const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
      const hasValue = Boolean(account.secret?.trim());
      return {
        accountConfigured: hasValue,
        hasConfiguredValue: hasValue,
        resolvedValue: account.secret || undefined
      };
    },
    applySet: ({ cfg, resolvedValue }) => {
      return (0, _accounts.setWeComAccountMulti)(cfg, { secret: resolvedValue });
    }
  }],

  // ── 完成后的最终处理 ──────────────────────────────────────────────────
  finalize: async ({ cfg }) => {
    // 确保配置完成后 channel 处于启用状态
    const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
    if (account.botId?.trim() && account.secret?.trim() && !account.enabled) {
      return { cfg: (0, _accounts.setWeComAccountMulti)(cfg, { enabled: true }) };
    }
    return undefined;
  },
  // ── 完成提示 ──────────────────────────────────────────────────────────
  completionNote: {
    title: "企业微信配置完成",
    lines: [
    "企业微信机器人已配置完成。",
    "运行 `openclaw start` 启动服务。"],

    shouldShow: ({ cfg }) => {
      const account = (0, _accounts.resolveWeComAccountMulti)({ cfg });
      return Boolean(account.botId?.trim() && account.secret?.trim());
    }
  },
  // ── DM 策略 ──────────────────────────────────────────────────────────
  dmPolicy,
  // ── 禁用 ─────────────────────────────────────────────────────────────
  disable: (cfg) => {
    return (0, _accounts.setWeComAccountMulti)(cfg, { enabled: false });
  }
}; /* v9-1fd0325596ded29b */
