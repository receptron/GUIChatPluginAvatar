/**
 * Avatar Plugin Core Exports
 *
 * Framework-agnostic types and plugin logic.
 * Import from "@gui-chat-plugin/avatar/core"
 */

// Avatar-specific types
export type { AvatarEmotion, AvatarData, AvatarArgs } from "./types";

// Core plugin
export { pluginCore, executeAvatar } from "./plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "./definition";
export { SAMPLES } from "./samples";
