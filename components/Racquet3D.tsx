"use client";
import React, { useEffect, useRef } from "react";

/**
 * Precision wireframe tennis racquet — slow auto-rotate + pointer drag.
 * Ported from the design project's racquet-3d.js (Three.js), bundled locally
 * (no CDN) so it works on flaky in-store networks. Transparent background.
 */
export default function Racquet3D({
  color = "#FF4D00",
  width = 212,
  height = 344,
}: {
  color?: string;
  width?: number;
  height?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed || !host) return;

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const w = host.clientWidth || width;
      const h = host.clientHeight || height;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
      camera.position.set(0, 0.35, 8.9);
      camera.lookAt(0, 0.35, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.cssText =
        "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
      host.appendChild(renderer.domElement);

      const group = new THREE.Group();
      scene.add(group);

      const frameMats: any[] = [];
      const segMat = (c: number | string, opacity: number, add?: boolean) => {
        const m = new THREE.LineBasicMaterial({ color: c as any, transparent: true, opacity });
        if (add) m.blending = THREE.AdditiveBlending;
        return m;
      };
      const accMat = segMat(color, 0.96); frameMats.push(accMat);
      const glowMat = segMat(color, 0.3, true); frameMats.push(glowMat);
      const dimMat = segMat(0xffffff, 0.28);
      const stringMat = segMat(0xffffff, 0.16);
      const V = (x: number, y: number, z?: number) => new THREE.Vector3(x, y, z || 0);
      const loop = (pts: any[], mat: any) =>
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      const segs = (pts: any[], mat: any) =>
        group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat));
      const qbez = (p0: number[], p1: number[], p2: number[], n: number) => {
        const a = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, u = 1 - t;
          a.push(V(u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]));
        }
        return a;
      };

      const HY = 1.7, RX = 1.05, RY = 1.36;
      const JR = 308, JL = 232;
      const DEG = Math.PI / 180;
      const headArc = (rx: number, ry: number) => {
        const a = [], n = 90, start = JR, end = JL + 360;
        for (let i = 0; i <= n; i++) {
          const ang = (start + (i / n) * (end - start)) * DEG;
          a.push(V(rx * Math.cos(ang), HY + ry * Math.sin(ang)));
        }
        return a;
      };
      const Rj = V(RX * Math.cos(JR * DEG), HY + RY * Math.sin(JR * DEG));
      const Lj = V(RX * Math.cos(JL * DEG), HY + RY * Math.sin(JL * DEG));

      const outer2d = [
        ...headArc(RX, RY),
        ...qbez([Lj.x, Lj.y], [-0.66, 0.28], [-0.16, -0.02], 26),
        V(-0.155, -0.5), V(-0.185, -0.62), V(-0.205, -2.28), V(-0.245, -2.44),
        V(0.245, -2.44), V(0.205, -2.28), V(0.185, -0.62), V(0.155, -0.5),
        ...qbez([0.16, -0.02], [0.66, 0.28], [Rj.x, Rj.y], 26),
      ];

      const D = 0.12;
      const rail = (z: number) => loop(outer2d.map((p) => V(p.x, p.y, z)), accMat);
      rail(D); rail(-D);
      const rungs: any[] = [];
      for (let i = 0; i < outer2d.length; i += 3) { const p = outer2d[i]; rungs.push(V(p.x, p.y, D), V(p.x, p.y, -D)); }
      segs(rungs, accMat);
      loop(headArc(RX * 1.02, RY * 1.02), glowMat);
      loop(headArc(RX - 0.1, RY - 0.1), dimMat);

      const throat = [V(0, 0.16), ...qbez([0, 0.16], [-0.34, 0.32], [-0.52, 0.6], 18)];
      const RXi = 0.87, RYi = 1.16;
      for (let a = 232; a <= 308; a += 6) { const r = a * DEG; throat.push(V(RXi * Math.cos(r), HY + RYi * Math.sin(r))); }
      throat.push(...qbez([0.52, 0.6], [0.34, 0.32], [0, 0.16], 18));
      loop(throat, dimMat);

      const str: any[] = [], yFloor = 0.78;
      for (let x = -0.7; x <= 0.7 + 1e-6; x += 0.2) {
        const t = 1 - (x / RXi) ** 2; if (t <= 0) continue;
        const dy = RYi * Math.sqrt(t);
        str.push(V(x, Math.max(HY - dy, yFloor)), V(x, HY + dy));
      }
      for (let y = yFloor; y <= HY + RYi - 0.02; y += 0.235) {
        const t = 1 - ((y - HY) / RYi) ** 2; if (t <= 0) continue;
        const dx = RXi * Math.sqrt(t);
        str.push(V(-dx, y), V(dx, y));
      }
      segs(str, stringMat);

      segs([V(-0.26, HY, 0.02), V(0.26, HY, 0.02), V(0, HY - 0.26, 0.02), V(0, HY + 0.26, 0.02)], accMat);
      { const p: any[] = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; p.push(V(Math.cos(a) * 0.19, HY + Math.sin(a) * 0.19, 0.02)); } loop(p, accMat); }

      const grip: any[] = [];
      for (let y = -0.66; y >= -2.28; y -= 0.2) grip.push(V(-0.2, y), V(0.2, y));
      segs(grip, dimMat);

      group.rotation.x = -0.1;

      // pointer drag
      let dragging = false, px = 0, py = 0;
      const el = renderer.domElement;
      const onDown = (e: PointerEvent) => { dragging = true; px = e.clientX; py = e.clientY; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        group.rotation.y += (e.clientX - px) * 0.01;
        group.rotation.x = Math.max(-0.6, Math.min(0.45, group.rotation.x + (e.clientY - py) * 0.006));
        px = e.clientX; py = e.clientY;
      };
      const onUp = () => { dragging = false; el.style.cursor = "grab"; };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
      el.addEventListener("pointerleave", onUp);

      const ro = new ResizeObserver(() => {
        const nw = host.clientWidth, nh = host.clientHeight;
        if (!nw || !nh) return;
        camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
      });
      ro.observe(host);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!reduced && !dragging) group.rotation.y += 0.0045;
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        el.removeEventListener("pointerleave", onUp);
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    })();

    return () => { disposed = true; cancelAnimationFrame(raf); cleanup(); };
  }, [color, width, height]);

  return <div ref={hostRef} style={{ width, height }} />;
}
