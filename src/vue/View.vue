<template>
  <div class="size-full bg-gradient-to-b from-slate-800 to-slate-900 relative">
    <!-- Three.js Canvas Container -->
    <div ref="containerRef" class="size-full" />

    <!-- Loading Indicator -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center bg-slate-900/80"
    >
      <div class="text-white text-lg">Loading Avatar...</div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="absolute inset-0 flex items-center justify-center bg-slate-900/80"
    >
      <div class="text-red-400 text-lg text-center p-4">{{ errorMessage }}</div>
    </div>

    <!-- Audio Playing Indicator (for debugging) -->
    <div
      v-if="isAudioPlaying"
      class="absolute top-4 right-4 px-3 py-1 bg-green-600 text-white text-sm rounded-full"
    >
      Speaking...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import type { ToolResult } from "gui-chat-protocol";
import type { AvatarData, AvatarEmotion, AvatarAction } from "../core/types";
import { TOOL_NAME } from "../core/definition";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from "@pixiv/three-vrm";

const props = defineProps<{
  selectedResult: ToolResult;
  sendTextMessage: (text?: string) => void;
  isAudioPlaying?: boolean;
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

// Three.js objects
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let currentVrm: VRM | null = null;
let clock: THREE.Clock | null = null;
let animationFrameId: number | null = null;

// Lip sync state
let lipSyncTime = 0;

// Emotion and action state
let currentEmotion: AvatarEmotion = "neutral";
let currentAction: AvatarAction = "none";
let actionStartTime = 0;
let lastActionTimestamp = 0;
let currentLoadedUrl = "";

// Map emotion to VRM expression
const emotionToExpression: Record<AvatarEmotion, VRMExpressionPresetName | null> = {
  neutral: null,
  happy: VRMExpressionPresetName.Happy,
  sad: VRMExpressionPresetName.Sad,
  angry: VRMExpressionPresetName.Angry,
  surprised: VRMExpressionPresetName.Surprised,
};

// Initialize Three.js scene
function initScene(): void {
  if (!containerRef.value) return;

  const container = containerRef.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  scene = new THREE.Scene();

  // Camera - positioned for bust-up view
  camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  camera.position.set(0, 1.3, 1.5);
  camera.lookAt(0, 1.2, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Clock for animation
  clock = new THREE.Clock();

  // Handle resize
  window.addEventListener("resize", handleResize);

  // Start render loop
  animate();
}

function handleResize(): void {
  if (!containerRef.value || !camera || !renderer) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

async function loadVRM(url: string): Promise<void> {
  if (!scene) return;

  isLoading.value = true;
  errorMessage.value = null;

  // Remove existing VRM
  if (currentVrm) {
    scene.remove(currentVrm.scene);
    currentVrm = null;
  }

  try {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(url);
    const vrm = gltf.userData.vrm as VRM;

    if (!vrm) {
      throw new Error("Failed to load VRM data");
    }

    // VRM 1.0 models face -Z by default (towards camera at +Z position)
    // No rotation needed for standard setup

    scene.add(vrm.scene);
    currentVrm = vrm;

    isLoading.value = false;
  } catch (error) {
    console.error("Failed to load VRM:", error);
    errorMessage.value = `Failed to load avatar: ${error instanceof Error ? error.message : "Unknown error"}`;
    isLoading.value = false;
  }
}

function animate(): void {
  animationFrameId = requestAnimationFrame(animate);

  if (!clock || !renderer || !scene || !camera) return;

  const deltaTime = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  if (currentVrm) {
    // Update VRM
    currentVrm.update(deltaTime);

    // Lip sync animation when audio is playing
    if (props.isAudioPlaying) {
      lipSyncTime += deltaTime * 10;
      // Simple sine wave for mouth movement
      const mouthOpen = (Math.sin(lipSyncTime) + 1) * 0.3;
      currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, mouthOpen);

      // Body movement while speaking (nodding, slight sway)
      const headBone = currentVrm.humanoid?.getNormalizedBoneNode("head");
      const neckBone = currentVrm.humanoid?.getNormalizedBoneNode("neck");
      const spineBone = currentVrm.humanoid?.getNormalizedBoneNode("spine");

      if (headBone) {
        // Gentle nodding motion (increased amplitude for visibility)
        headBone.rotation.x = Math.sin(elapsedTime * 2) * 0.08;
        // Slight tilt
        headBone.rotation.z = Math.sin(elapsedTime * 1.5) * 0.05;
      }

      if (neckBone) {
        // Subtle neck movement
        neckBone.rotation.y = Math.sin(elapsedTime * 0.8) * 0.05;
      }

      if (spineBone) {
        // Body sway
        spineBone.rotation.z = Math.sin(elapsedTime * 0.5) * 0.03;
      }

      // Arm gestures while speaking
      const leftShoulder = currentVrm.humanoid?.getNormalizedBoneNode("leftShoulder");
      const rightShoulder = currentVrm.humanoid?.getNormalizedBoneNode("rightShoulder");
      const leftUpperArm = currentVrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
      const rightUpperArm = currentVrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
      const leftLowerArm = currentVrm.humanoid?.getNormalizedBoneNode("leftLowerArm");
      const rightLowerArm = currentVrm.humanoid?.getNormalizedBoneNode("rightLowerArm");

      if (leftShoulder) {
        leftShoulder.rotation.z = 0.1;
      }
      if (rightShoulder) {
        rightShoulder.rotation.z = -0.1;
      }

      if (leftUpperArm) {
        // Arm down and forward with gesture
        leftUpperArm.rotation.z = -0.8 + Math.sin(elapsedTime * 1.2) * 0.1;
        leftUpperArm.rotation.x = 0.4 + Math.sin(elapsedTime * 0.9) * 0.15; // Forward
        leftUpperArm.rotation.y = Math.sin(elapsedTime * 0.7) * 0.1;
      }

      if (rightUpperArm) {
        // Arm down and forward with gesture
        rightUpperArm.rotation.z = 0.8 + Math.sin(elapsedTime * 1.3) * 0.1;
        rightUpperArm.rotation.x = 0.4 + Math.sin(elapsedTime * 1.0) * 0.15; // Forward
        rightUpperArm.rotation.y = Math.sin(elapsedTime * 0.8) * 0.1;
      }

      if (leftLowerArm) {
        // Elbow bent, forearm forward with gesture
        leftLowerArm.rotation.y = -1.0 - Math.sin(elapsedTime * 1.5) * 0.2;
        leftLowerArm.rotation.z = Math.sin(elapsedTime * 1.1) * 0.1;
      }

      if (rightLowerArm) {
        // Elbow bent, forearm forward with gesture
        rightLowerArm.rotation.y = 1.0 + Math.sin(elapsedTime * 1.4) * 0.2;
        rightLowerArm.rotation.z = Math.sin(elapsedTime * 1.2) * 0.1;
      }
    } else {
      // Close mouth when not speaking
      lipSyncTime = 0;
      currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, 0);

      // Idle breathing animation when not speaking
      const spineBone = currentVrm.humanoid?.getNormalizedBoneNode("spine");
      const headBone = currentVrm.humanoid?.getNormalizedBoneNode("head");

      if (spineBone) {
        // Gentle breathing motion (increased for visibility)
        spineBone.rotation.x = Math.sin(elapsedTime * 0.8) * 0.02;
      }

      if (headBone) {
        // Subtle idle movement (increased for visibility)
        headBone.rotation.x = Math.sin(elapsedTime * 0.3) * 0.03;
        headBone.rotation.z = Math.sin(elapsedTime * 0.2) * 0.02;
      }

      // Natural arm position when idle (lowered from T-pose)
      const leftShoulder = currentVrm.humanoid?.getNormalizedBoneNode("leftShoulder");
      const rightShoulder = currentVrm.humanoid?.getNormalizedBoneNode("rightShoulder");
      const leftUpperArm = currentVrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
      const rightUpperArm = currentVrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
      const leftLowerArm = currentVrm.humanoid?.getNormalizedBoneNode("leftLowerArm");
      const rightLowerArm = currentVrm.humanoid?.getNormalizedBoneNode("rightLowerArm");

      if (leftShoulder) {
        leftShoulder.rotation.z = 0.1;
      }
      if (rightShoulder) {
        rightShoulder.rotation.z = -0.1;
      }

      if (leftUpperArm) {
        // Arms in natural resting position, slightly forward
        leftUpperArm.rotation.z = -0.9;
        leftUpperArm.rotation.x = 0.2; // Slightly forward
        leftUpperArm.rotation.y = 0;
      }

      if (rightUpperArm) {
        // Arms in natural resting position, slightly forward
        rightUpperArm.rotation.z = 0.9;
        rightUpperArm.rotation.x = 0.2; // Slightly forward
        rightUpperArm.rotation.y = 0;
      }

      if (leftLowerArm) {
        // Elbow bent, hands in front
        leftLowerArm.rotation.y = -0.8;
      }

      if (rightLowerArm) {
        // Elbow bent, hands in front
        rightLowerArm.rotation.y = 0.8;
      }
    }

    // Blink animation
    const blinkCycle = elapsedTime % 4;
    if (blinkCycle < 0.1) {
      currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 1);
    } else {
      currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 0);
    }

    // Apply emotion expression
    const emotionExpression = emotionToExpression[currentEmotion];
    // Reset all emotion expressions first
    currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Happy, 0);
    currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Sad, 0);
    currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Angry, 0);
    currentVrm.expressionManager?.setValue(VRMExpressionPresetName.Surprised, 0);
    // Set current emotion
    if (emotionExpression) {
      currentVrm.expressionManager?.setValue(emotionExpression, 0.8);
    }

    // Apply action animation (one-shot gestures)
    if (currentAction !== "none") {
      const actionElapsed = elapsedTime - actionStartTime;
      const actionDuration = 1.5; // seconds

      if (actionElapsed < actionDuration) {
        const progress = actionElapsed / actionDuration;
        const headBone = currentVrm.humanoid?.getNormalizedBoneNode("head");
        const rightUpperArm = currentVrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
        const rightLowerArm = currentVrm.humanoid?.getNormalizedBoneNode("rightLowerArm");
        const spineBone = currentVrm.humanoid?.getNormalizedBoneNode("spine");

        // Ease in-out function
        const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const eased = ease(progress < 0.5 ? progress * 2 : (1 - progress) * 2);

        switch (currentAction) {
          case "nod":
            if (headBone) {
              headBone.rotation.x = Math.sin(progress * Math.PI * 3) * 0.2;
            }
            break;

          case "shake":
            if (headBone) {
              headBone.rotation.y = Math.sin(progress * Math.PI * 4) * 0.3;
            }
            break;

          case "wave":
            if (rightUpperArm) {
              rightUpperArm.rotation.z = 1.5 * eased;
              rightUpperArm.rotation.x = -0.3 * eased;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.y = 0.5 + Math.sin(progress * Math.PI * 6) * 0.3;
            }
            break;

          case "think":
            if (headBone) {
              headBone.rotation.x = 0.1 * eased;
              headBone.rotation.z = 0.1 * eased;
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.z = 0.3 * eased;
              rightUpperArm.rotation.x = 0.8 * eased;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.y = 1.5 * eased;
            }
            break;

          case "bow":
            if (spineBone) {
              spineBone.rotation.x = 0.4 * eased;
            }
            if (headBone) {
              headBone.rotation.x = 0.2 * eased;
            }
            break;
        }
      } else {
        // Action completed
        currentAction = "none";
      }
    }
  }

  renderer.render(scene, camera);
}

function cleanup(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  window.removeEventListener("resize", handleResize);

  if (renderer && containerRef.value) {
    containerRef.value.removeChild(renderer.domElement);
    renderer.dispose();
    renderer = null;
  }

  if (currentVrm) {
    currentVrm = null;
  }

  scene = null;
  camera = null;
  clock = null;
}

// Watch for result changes
watch(
  () => props.selectedResult,
  (newResult) => {
    if (newResult?.toolName === TOOL_NAME && newResult.data) {
      const avatarData = newResult.data as AvatarData;

      // Load VRM only if URL changed (avoid reload on emotion/action update)
      if (avatarData.avatarUrl && avatarData.avatarUrl !== currentLoadedUrl) {
        currentLoadedUrl = avatarData.avatarUrl;
        loadVRM(avatarData.avatarUrl);
      }

      // Update emotion (no reload needed)
      if (avatarData.emotion && avatarData.emotion !== currentEmotion) {
        console.log("[Avatar Debug] Emotion changed to:", avatarData.emotion);
        currentEmotion = avatarData.emotion;
      }

      // Trigger action (only if timestamp is new)
      if (avatarData.action && avatarData.action !== "none") {
        const timestamp = avatarData.actionTimestamp || 0;
        if (timestamp > lastActionTimestamp) {
          console.log("[Avatar Debug] Action triggered:", avatarData.action);
          currentAction = avatarData.action;
          actionStartTime = clock?.getElapsedTime() || 0;
          lastActionTimestamp = timestamp;
        }
      }
    }
  },
  { deep: true },
);

onMounted(() => {
  initScene();

  // Initial VRM load
  if (props.selectedResult?.toolName === TOOL_NAME && props.selectedResult.data) {
    const avatarData = props.selectedResult.data as AvatarData;
    if (avatarData.avatarUrl) {
      currentLoadedUrl = avatarData.avatarUrl;
      loadVRM(avatarData.avatarUrl);
    }
    if (avatarData.emotion) {
      currentEmotion = avatarData.emotion;
    }
  }
});

onUnmounted(() => {
  cleanup();
});
</script>
