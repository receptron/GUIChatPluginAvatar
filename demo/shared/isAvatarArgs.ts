import type { AvatarAction, AvatarArgs, AvatarEmotion } from "../../src/core/types";

// Records (not arrays) so a value added to or removed from the union fails typecheck here.
const AVATAR_EMOTIONS: Record<AvatarEmotion, true> = {
  neutral: true,
  happy: true,
  sad: true,
  angry: true,
  surprised: true,
};

const AVATAR_ACTIONS: Record<AvatarAction, true> = {
  none: true,
  nod: true,
  shake: true,
  wave: true,
  think: true,
  bow: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isOptionalKeyOf = (value: unknown, keys: Record<string, true>): boolean =>
  value === undefined || (typeof value === "string" && Object.keys(keys).includes(value));

const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === "string";

export const isAvatarArgs = (args: unknown): args is AvatarArgs =>
  isRecord(args) &&
  isOptionalString(args["avatarUrl"]) &&
  isOptionalKeyOf(args["emotion"], AVATAR_EMOTIONS) &&
  isOptionalKeyOf(args["action"], AVATAR_ACTIONS);
