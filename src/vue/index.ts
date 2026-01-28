/**
 * Avatar Plugin - Vue Implementation
 *
 * Full Vue plugin with UI components.
 * Import from "@gui-chat-plugin/avatar/vue"
 */

// Import styles for Vue components
import "../style.css";

import type { ToolPlugin } from "gui-chat-protocol/vue";
import type { AvatarData, AvatarArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import View from "./View.vue";
import Preview from "./Preview.vue";

// ============================================================================
// Vue Plugin (with components)
// ============================================================================

/**
 * Avatar plugin instance with Vue components
 */
export const plugin: ToolPlugin<AvatarData, never, AvatarArgs> = {
  ...pluginCore,
  viewComponent: View,
  previewComponent: Preview,
};

// Avatar-specific types
export type { AvatarEmotion, AvatarData, AvatarArgs } from "../core/types";

// Core plugin utilities
export { pluginCore, executeAvatar } from "../core/plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "../core/definition";
export { SAMPLES } from "../core/samples";

// Export components for direct use
export { View, Preview };

// Default export for MulmoChat compatibility: { plugin }
export default { plugin };
