"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * 3D hero background (three.js, lazy-loaded on the client only).
 * Prefers the WebGPURenderer when the browser supports it and falls back to
 * the universally-supported WebGLRenderer otherwise. Renders a cyan particle
 * wave with a royal wireframe core + orbiting particle shell, plus gentle
 * pointer parallax. Hidden entirely under prefers-reduced-motion (CSS).
 */
export default function HeroCanvas() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (cancelled || !wrap.isConnected) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0a0c, 9, 24);

      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.set(0, 0.5, 8.5);

      // --- renderer: WebGPU when available, WebGL otherwise ---
      const gpu = (THREE as unknown as { WebGPURenderer?: new (o: object) => { domElement: HTMLCanvasElement; setSize(w: number, h: number, u?: boolean): void; setPixelRatio(n: number): void; setClearColor(c: number, a: number): void; render(s: unknown, c: unknown): void; dispose(): void } }).WebGPURenderer;
      const webgpuOk = gpu && typeof (THREE as unknown as { WEBGPU?: { isAvailable(): boolean } }).WEBGPU?.isAvailable === "function" && (THREE as unknown as { WEBGPU: { isAvailable(): boolean } }).WEBGPU.isAvailable();
      let renderer: THREE.WebGLRenderer | { domElement: HTMLCanvasElement; setSize(w: number, h: number, u?: boolean): void; setPixelRatio(n: number): void; setClearColor(c: number, a: number): void; render(s: unknown, c: unknown): void; dispose(): void };

      if (webgpuOk) {
        renderer = new gpu!({ antialias: true }) as unknown as typeof renderer;
        renderer.setClearColor(0x0a0a0c, 0);
      } else {
        const gl = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        gl.setClearColor(0x000000, 0);
        renderer = gl;
      }
      wrap.appendChild(renderer.domElement);

      // --- particle wave floor ---
      const COLS = 90;
      const ROWS = 40;
      const count = COLS * ROWS;
      const positions = new Float32Array(count * 3);
      let idx = 0;
      for (let x = 0; x < COLS; x++) {
        for (let z = 0; z < ROWS; z++) {
          positions[idx++] = (x - COLS / 2) * 0.13;
          positions[idx++] = 0;
          positions[idx++] = (z - ROWS / 2) * 0.13;
        }
      }
      const waveGeo = new THREE.BufferGeometry();
      waveGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const waveMat = new THREE.PointsMaterial({
        color: 0x00d2ff,
        size: 0.04,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const wave = new THREE.Points(waveGeo, waveMat);
      wave.position.y = -1.9;
      scene.add(wave);

      // --- core wireframe icosahedron ---
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, 1),
        new THREE.MeshBasicMaterial({
          color: 0x005bea,
          wireframe: true,
          transparent: true,
          opacity: 0.22
        })
      );
      scene.add(core);

      // --- inner glow core ---
      const glow = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 0),
        new THREE.MeshBasicMaterial({
          color: 0x00d2ff,
          transparent: true,
          opacity: 0.08
        })
      );
      scene.add(glow);

      // --- orbiting particle shell ---
      const shellCount = 800;
      const shellPos = new Float32Array(shellCount * 3);
      for (let j = 0; j < shellCount; j++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 2.7 + Math.random() * 0.9;
        shellPos[j * 3] = r * Math.sin(phi) * Math.cos(theta);
        shellPos[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        shellPos[j * 3 + 2] = r * Math.cos(phi);
      }
      const shellGeo = new THREE.BufferGeometry();
      shellGeo.setAttribute("position", new THREE.BufferAttribute(shellPos, 3));
      const shellMat = new THREE.PointsMaterial({
        color: 0x00d2ff,
        size: 0.018,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const shell = new THREE.Points(shellGeo, shellMat);
      scene.add(shell);

      // --- pointer parallax ---
      let targetX = 0;
      let targetY = 0;
      const onPointer = (e: PointerEvent) => {
        targetX = (e.clientX / window.innerWidth - 0.5) * 0.6;
        targetY = (e.clientY / window.innerHeight - 0.5) * 0.4;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      // --- sizing ---
      const resize = () => {
        const w = wrap.clientWidth || 1;
        const h = wrap.clientHeight || 1;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);

      // --- animation ---
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      let raf = 0;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const t = clock.getElapsedTime();

        const attrs = waveGeo.attributes.position as THREE.BufferAttribute;
        const arr = attrs.array as Float32Array;
        for (let k = 1; k < arr.length; k += 3) {
          const x = arr[k - 1];
          arr[k] =
            Math.sin(x * 1.3 + t * 1.1) * 0.22 + Math.sin(x * 0.6 - t * 0.8) * 0.13;
        }
        attrs.needsUpdate = true;

        core.rotation.x = t * 0.18;
        core.rotation.y = t * 0.3;
        glow.rotation.x = -t * 0.12;
        glow.rotation.y = t * 0.2;
        shell.rotation.y = t * 0.05;
        shell.rotation.x = Math.sin(t * 0.08) * 0.2;

        if (!reduced) {
          camera.position.x += (targetX - camera.position.x) * 0.04;
          camera.position.y += (targetY - camera.position.y) * 0.04;
        }
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      tick();

      dispose = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("pointermove", onPointer);
        waveGeo.dispose();
        waveMat.dispose();
        shellGeo.dispose();
        shellMat.dispose();
        core.geometry.dispose();
        (core.material as THREE.Material).dispose();
        glow.geometry.dispose();
        (glow.material as THREE.Material).dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return <div ref={wrapRef} className="hero-canvas-wrap" aria-hidden="true" />;
}
