/**
 * Avatar View Component (React)
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ViewComponentProps } from "gui-chat-protocol";
import type { AvatarData } from "../core/types";
import { TOOL_NAME } from "../core/definition";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM, VRMExpressionPresetName } from "@pixiv/three-vrm";

type ViewProps = ViewComponentProps<AvatarData, never>;

export function View({ selectedResult, isAudioPlaying }: ViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vrmRef = useRef<VRM | null>(null);
  const clockRef = useRef<THREE.Clock | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lipSyncTimeRef = useRef(0);
  const isAudioPlayingRef = useRef(isAudioPlaying);

  // Keep isAudioPlaying ref in sync
  useEffect(() => {
    isAudioPlayingRef.current = isAudioPlaying;
  }, [isAudioPlaying]);

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    sceneRef.current = new THREE.Scene();

    // Camera - positioned for bust-up view
    cameraRef.current = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    cameraRef.current.position.set(0, 1.3, 1.5);
    cameraRef.current.lookAt(0, 1.2, 0);

    // Renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(rendererRef.current.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    sceneRef.current.add(directionalLight);

    // Clock for animation
    clockRef.current = new THREE.Clock();
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    animationFrameRef.current = requestAnimationFrame(animate);

    const clock = clockRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const vrm = vrmRef.current;

    if (!clock || !renderer || !scene || !camera) return;

    const deltaTime = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    if (vrm) {
      // Update VRM
      vrm.update(deltaTime);

      // Lip sync animation when audio is playing
      if (isAudioPlayingRef.current) {
        lipSyncTimeRef.current += deltaTime * 10;
        // Simple sine wave for mouth movement
        const mouthOpen = (Math.sin(lipSyncTimeRef.current) + 1) * 0.3;
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, mouthOpen);

        // Body movement while speaking (nodding, slight sway)
        const headBone = vrm.humanoid?.getNormalizedBoneNode("head");
        const neckBone = vrm.humanoid?.getNormalizedBoneNode("neck");
        const spineBone = vrm.humanoid?.getNormalizedBoneNode("spine");

        // Debug: log bone availability (only once per speaking session)
        if (lipSyncTimeRef.current < 0.2) {
          console.log("[Avatar Debug] Body animation - Bones found:", {
            head: !!headBone,
            neck: !!neckBone,
            spine: !!spineBone,
            humanoid: !!vrm.humanoid,
          });
        }

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
        const leftShoulder = vrm.humanoid?.getNormalizedBoneNode("leftShoulder");
        const rightShoulder = vrm.humanoid?.getNormalizedBoneNode("rightShoulder");
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
        const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode("leftLowerArm");
        const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode("rightLowerArm");

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
        lipSyncTimeRef.current = 0;
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, 0);

        // Idle breathing animation when not speaking
        const spineBone = vrm.humanoid?.getNormalizedBoneNode("spine");
        const headBone = vrm.humanoid?.getNormalizedBoneNode("head");

        // Debug: log bones availability periodically (every 5 seconds)
        if (Math.floor(elapsedTime) % 5 === 0 && elapsedTime - Math.floor(elapsedTime) < deltaTime) {
          console.log("[Avatar Debug] Idle animation - Bones found:", {
            head: !!headBone,
            neck: !!vrm.humanoid?.getNormalizedBoneNode("neck"),
            spine: !!spineBone,
          });
        }

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
        const leftShoulder = vrm.humanoid?.getNormalizedBoneNode("leftShoulder");
        const rightShoulder = vrm.humanoid?.getNormalizedBoneNode("rightShoulder");
        const leftUpperArm = vrm.humanoid?.getNormalizedBoneNode("leftUpperArm");
        const rightUpperArm = vrm.humanoid?.getNormalizedBoneNode("rightUpperArm");
        const leftLowerArm = vrm.humanoid?.getNormalizedBoneNode("leftLowerArm");
        const rightLowerArm = vrm.humanoid?.getNormalizedBoneNode("rightLowerArm");

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
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 1);
      } else {
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 0);
      }
    }

    renderer.render(scene, camera);
  }, []);

  // Load VRM
  const loadVRM = useCallback(async (url: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Remove existing VRM
    if (vrmRef.current) {
      scene.remove(vrmRef.current.scene);
      vrmRef.current = null;
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
      vrmRef.current = vrm;

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load VRM:", error);
      setErrorMessage(`Failed to load avatar: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    window.removeEventListener("resize", handleResize);

    if (rendererRef.current && containerRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
      rendererRef.current = null;
    }

    vrmRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    clockRef.current = null;
  }, [handleResize]);

  // Initialize on mount
  useEffect(() => {
    initScene();
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      cleanup();
    };
  }, [initScene, handleResize, animate, cleanup]);

  // Load VRM when result changes
  useEffect(() => {
    if (selectedResult?.toolName === TOOL_NAME && selectedResult.data) {
      const avatarData = selectedResult.data as AvatarData;
      if (avatarData.avatarUrl) {
        loadVRM(avatarData.avatarUrl);
      }
    }
  }, [selectedResult, loadVRM]);

  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 relative">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-white text-lg">Loading Avatar...</div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="text-red-400 text-lg text-center p-4">{errorMessage}</div>
        </div>
      )}

      {/* Audio Playing Indicator (for debugging) */}
      {isAudioPlaying && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
          Speaking...
        </div>
      )}
    </div>
  );
}

export default View;
