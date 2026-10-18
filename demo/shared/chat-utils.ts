/**
 * Shared chat utilities for Vue and React demos
 */
import OpenAI from "openai";
import type { ToolDefinition, ToolContext, ToolResult } from "gui-chat-protocol";
import type { ChatMessage, MockResponse } from "./chat-types";

/**
 * Load API key from environment variable (Vite)
 */
export const loadApiKey = (): string => {
  return import.meta.env?.VITE_OPENAI_API_KEY || "";
};

/**
 * Default mock responses for development without API key
 */
export const DEFAULT_MOCK_RESPONSES: Record<string, MockResponse> = {
  avatar: {
    toolCall: {
      name: "receptron_avatar",
      args: {},
    },
  },
  avatarHappy: {
    toolCall: {
      name: "receptron_avatar",
      args: {
        emotion: "happy",
      },
    },
  },
  avatarSad: {
    toolCall: {
      name: "receptron_avatar",
      args: {
        emotion: "sad",
      },
    },
  },
  hello: {
    content: "Hello! How can I help you today?",
  },
  default: {
    content: "I understand. Is there anything else you'd like to know?",
  },
};

/**
 * Find matching mock response based on user message
 */
export const findMockResponse = (
  userMessage: string,
  mockResponses: Record<string, MockResponse> = DEFAULT_MOCK_RESPONSES
): MockResponse => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("avatar") || lowerMessage.includes("show")) {
    if (lowerMessage.includes("happy")) {
      return mockResponses.avatarHappy || DEFAULT_MOCK_RESPONSES.avatarHappy;
    }
    if (lowerMessage.includes("sad")) {
      return mockResponses.avatarSad || DEFAULT_MOCK_RESPONSES.avatarSad;
    }
    return mockResponses.avatar || DEFAULT_MOCK_RESPONSES.avatar;
  }
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return mockResponses.hello || DEFAULT_MOCK_RESPONSES.hello;
  }

  return mockResponses.default || DEFAULT_MOCK_RESPONSES.default;
};

/**
 * Create OpenAI client
 */
export const createOpenAIClient = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
};

/**
 * Build system prompt including plugin's system prompt
 */
export const buildSystemPrompt = (basePrompt?: string, pluginPrompt?: string): string => {
  const base = basePrompt || "You are a helpful assistant.";
  const plugin = pluginPrompt || "";
  return `${base}\n\n${plugin}`.trim();
};

/**
 * Convert ChatMessage array to OpenAI API format
 */
export const convertToApiMessages = (
  messages: ChatMessage[],
  systemPrompt: string
): OpenAI.Chat.ChatCompletionMessageParam[] => {
  return [
    { role: "system", content: systemPrompt },
    ...messages.map((m): OpenAI.Chat.ChatCompletionMessageParam => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
          tool_call_id: m.toolCallId!,
        };
      }
      if (m.role === "assistant" && m.toolCalls) {
        return {
          role: "assistant",
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    }),
  ];
};

/**
 * Build tools array for OpenAI API
 */
export const buildToolsParam = (
  toolDefinition: ToolDefinition
): OpenAI.Chat.ChatCompletionTool[] => {
  return [
    {
      type: "function",
      function: {
        name: toolDefinition.name,
        description: toolDefinition.description,
        parameters: toolDefinition.parameters,
      },
    },
  ];
};

/** A rejected value can be anything; describing it must not throw in place of the rejection. */
const describeArgs = (value: unknown): string => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return typeof value;
  }
};

/**
 * Execute plugin and return result
 */
export const executePluginWithContext = async <A, R>(
  execute: (context: ToolContext, args: A) => Promise<R>,
  isArgs: (args: unknown) => args is A,
  args: unknown,
  currentResult: ToolResult | null
): Promise<R> => {
  if (!isArgs(args)) {
    throw new Error(`Invalid tool arguments: ${describeArgs(args)}`);
  }
  const context: ToolContext = {
    currentResult,
  };
  return await execute(context, args);
};

/**
 * Call OpenAI Chat API
 */
export const callOpenAI = async (
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.ChatCompletionTool[]
): Promise<OpenAI.Chat.ChatCompletion> => {
  return await client.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: "auto",
  });
};
