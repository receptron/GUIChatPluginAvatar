# @gui-chat-plugin/avatar

[![npm version](https://badge.fury.io/js/@gui-chat-plugin%2Favatar.svg)](https://www.npmjs.com/package/@gui-chat-plugin/avatar)

A 3D avatar plugin for [MulmoChat](https://github.com/receptron/MulmoChat) - displays a VRM avatar that lip-syncs during voice conversations.

## What this plugin does

- Displays a 3D VRM avatar in the chat interface
- Automatic lip-sync when the AI is speaking
- Body animations (nodding, gestures) during conversation
- Emotion expressions (happy, sad, angry, surprised)
- Action gestures (nod, shake, wave, think, bow)

## Installation

```bash
yarn add @gui-chat-plugin/avatar
```

## Usage

### Vue Implementation (for MulmoChat)

```typescript
// In src/tools/index.ts
import Plugin from "@gui-chat-plugin/avatar/vue";

const pluginList = [
  // ... other plugins
  Plugin,
];

// In src/main.ts
import "@gui-chat-plugin/avatar/style.css";
```

### React Implementation

```typescript
import Plugin from "@gui-chat-plugin/avatar/react";
import "@gui-chat-plugin/avatar/style.css";

// Named exports
import { plugin, View, Preview } from "@gui-chat-plugin/avatar/react";
```

### Core Only (Framework-agnostic)

```typescript
import { pluginCore, TOOL_NAME } from "@gui-chat-plugin/avatar";
// or
import pluginCore from "@gui-chat-plugin/avatar";
```

## Package Exports

| Export | Description |
|--------|-------------|
| `@gui-chat-plugin/avatar` | Core (framework-agnostic) |
| `@gui-chat-plugin/avatar/vue` | Vue implementation with UI components |
| `@gui-chat-plugin/avatar/react` | React implementation with UI components |
| `@gui-chat-plugin/avatar/style.css` | Tailwind CSS styles |

## Development

```bash
# Install dependencies
yarn install

# Start dev server - Vue (http://localhost:5173/)
yarn dev

# Start dev server - React (http://localhost:5173/)
yarn dev:react

# Build
yarn build

# Type check
yarn typecheck

# Lint
yarn lint
```

## Test Prompts

Try these prompts to test the plugin:

1. "Display an avatar"
2. "Nod your head"
3. "Show a happy expression"
4. "Wave at me"

## License

MIT
