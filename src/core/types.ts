/**
 * Avatar Plugin Types
 *
 * Avatar-specific type definitions only.
 * Common types should be imported directly from gui-chat-protocol.
 */

// ============================================================================
// Avatar-specific Types
// ============================================================================

/** Emotion types for avatar expression */
export type AvatarEmotion = "neutral" | "happy" | "sad" | "angry" | "surprised";

/** Action types for avatar gestures */
export type AvatarAction = "none" | "nod" | "shake" | "wave" | "think" | "bow";

/** Avatar data stored in result.data (for View, not visible to LLM) */
export interface AvatarData {
  avatarUrl?: string;
  emotion: AvatarEmotion;
  action: AvatarAction;
  /** Timestamp to trigger action even if same action is repeated */
  actionTimestamp?: number;
}

/** Arguments passed to the avatar tool from LLM */
export interface AvatarArgs {
  avatarUrl?: string;
  emotion?: AvatarEmotion;
  action?: AvatarAction;
}
