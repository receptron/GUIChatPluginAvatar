<template>
  <div class="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md">
    <div class="flex flex-col items-center gap-2">
      <!-- Avatar Icon -->
      <div class="size-12 bg-slate-600 rounded-full flex items-center justify-center">
        <svg
          class="size-8 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>

      <!-- Label -->
      <div class="text-sm font-semibold text-white text-center">
        3D Avatar
      </div>

      <!-- Emotion Badge -->
      <div
        v-if="emotion && emotion !== 'neutral'"
        class="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full"
      >
        {{ emotion }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { AvatarData } from "../core/types";

const props = defineProps<{
  result: ToolResult;
}>();

const avatarData = computed(() => props.result.data as AvatarData | null);
const emotion = computed(() => avatarData.value?.emotion || "neutral");
</script>
