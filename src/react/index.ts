/**
 * Avatar Plugin - React Implementation
 *
 * Full React plugin with UI components.
 * Import from "@gui-chat-plugin/avatar/react"
 */

// Import styles for React components
import "../style.css";

import type { ToolPluginReact } from "gui-chat-protocol/react";
import type { AvatarData, AvatarArgs } from "../core/types";
import { pluginCore } from "../core/plugin";
import { View } from "./View";
import { Preview } from "./Preview";

// ============================================================================
// React Plugin (with components)
// ============================================================================

/**
 * Avatar plugin instance with React components
 */
export const plugin: ToolPluginReact<AvatarData, never, AvatarArgs> = {
  ...pluginCore,
  ViewComponent: View,
  PreviewComponent: Preview,
};

// Avatar-specific types
export type { AvatarEmotion, AvatarData, AvatarArgs } from "../core/types";

// Core plugin utilities
export { pluginCore, executeAvatar } from "../core/plugin";
export { TOOL_NAME, TOOL_DEFINITION } from "../core/definition";
export { SAMPLES } from "../core/samples";

// Export components for direct use
export { View, Preview };

// Default export for compatibility: { plugin }
export default { plugin };
