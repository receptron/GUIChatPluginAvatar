/**
 * Avatar Sample Data
 */

import type { ToolSample } from "gui-chat-protocol";

export const SAMPLES: ToolSample[] = [
  {
    name: "Default Avatar",
    args: {},
  },
  {
    name: "Happy Avatar",
    args: {
      emotion: "happy",
    },
  },
  {
    name: "Sad Avatar",
    args: {
      emotion: "sad",
    },
  },
];
