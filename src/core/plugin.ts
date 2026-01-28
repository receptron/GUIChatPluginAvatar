/**
 * Avatar Plugin Core (Framework-agnostic)
 *
 * Contains the plugin logic without UI components.
 * Can be used by any framework (Vue, React, etc.)
 */

import type { ToolPluginCore, ToolContext, ToolResult } from "gui-chat-protocol";
import type { AvatarData, AvatarArgs } from "./types";
import { TOOL_NAME, TOOL_DEFINITION } from "./definition";
import { SAMPLES } from "./samples";

// Default VRM avatar URL (VRoid Hub sample)
const DEFAULT_AVATAR_URL =
  "https://pixiv.github.io/three-vrm/packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm";

// ============================================================================
// Execute Function
// ============================================================================

export const executeAvatar = async (
  _context: ToolContext,
  args: AvatarArgs,
): Promise<ToolResult<AvatarData, never>> => {
  const { avatarUrl, emotion = "neutral", action = "none" } = args;

  const avatarData: AvatarData = {
    avatarUrl: avatarUrl || DEFAULT_AVATAR_URL,
    emotion,
    action,
    actionTimestamp: action !== "none" ? Date.now() : undefined,
  };

  // Build message based on what was changed
  const changes: string[] = [];
  if (emotion !== "neutral") changes.push(`emotion: ${emotion}`);
  if (action !== "none") changes.push(`action: ${action}`);
  const message = changes.length > 0
    ? `Avatar updated (${changes.join(", ")})`
    : "Avatar displayed";

  return {
    toolName: TOOL_NAME,
    message,
    data: avatarData,
    updating: true, // Update existing avatar instead of creating new
    instructions:
      "The avatar is reacting. Continue the conversation naturally. " +
      "You can call this tool again anytime to change emotion or trigger gestures.",
  };
};

// ============================================================================
// Core Plugin (without UI components)
// ============================================================================

export const pluginCore: ToolPluginCore<AvatarData, never, AvatarArgs> = {
  toolDefinition: TOOL_DEFINITION,
  execute: executeAvatar,
  generatingMessage: "Loading avatar...",
  isEnabled: () => true,
  samples: SAMPLES,
};
