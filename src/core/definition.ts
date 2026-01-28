/**
 * Avatar Tool Definition (Schema)
 *
 * Defines the tool interface for LLM function calling.
 * The avatar displays a 3D VRM model that lip-syncs with AI speech.
 */

import type { ToolDefinition } from "gui-chat-protocol";

// Tool name: namespace_toolname format
// Uses receptron namespace for official plugins
export const TOOL_NAME = "receptron_avatar";

export const TOOL_DEFINITION: ToolDefinition = {
  type: "function",
  name: TOOL_NAME,
  description:
    "Display and control a 3D avatar that speaks and reacts during conversation. " +
    "The avatar automatically lip-syncs when you speak. " +
    "Call this tool to change the avatar's emotion or trigger actions/gestures. " +
    "Example: When the user says something funny, call with emotion='happy'. " +
    "When agreeing, call with action='nod'. When greeting, call with action='wave'.",
  parameters: {
    type: "object",
    properties: {
      avatarUrl: {
        type: "string",
        description:
          "URL to a VRM avatar file. If not provided, a default avatar will be used. Only needed on first call.",
      },
      emotion: {
        type: "string",
        enum: ["neutral", "happy", "sad", "angry", "surprised"],
        description:
          "The emotion to display. Use 'happy' when pleased or joking, 'sad' when sympathizing, " +
          "'angry' when frustrated, 'surprised' when amazed. Defaults to neutral.",
      },
      action: {
        type: "string",
        enum: ["none", "nod", "shake", "wave", "think", "bow"],
        description:
          "Trigger a gesture. 'nod' for agreement, 'shake' for disagreement, " +
          "'wave' for greeting/goodbye, 'think' when pondering, 'bow' for formal greeting.",
      },
    },
    required: [],
  },
};
