/**
 * Avatar Preview Component (React)
 */

import React from "react";
import type { PreviewComponentProps } from "gui-chat-protocol";
import type { AvatarData } from "../core/types";

type PreviewProps = PreviewComponentProps<AvatarData, never>;

export function Preview({ result }: PreviewProps): React.JSX.Element {
  const avatarData = result.data as AvatarData | null;
  const emotion = avatarData?.emotion || "neutral";

  return (
    <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md">
      <div className="flex flex-col items-center gap-2">
        {/* Avatar Icon */}
        <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Label */}
        <div className="text-sm font-semibold text-white text-center">
          3D Avatar
        </div>

        {/* Emotion Badge */}
        {emotion && emotion !== "neutral" && (
          <div className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
            {emotion}
          </div>
        )}
      </div>
    </div>
  );
}

export default Preview;
