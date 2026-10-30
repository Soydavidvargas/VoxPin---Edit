import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as prescribed by Three.js skill
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup - Perspective with wide view to cover screen plane
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 300;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Calculate visible dimensions at z = 0
    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;

    // Grid configuration: Topographic particle matrix
    const step = 22; // Grid spacing
    const cols = Math.ceil(visibleWidth / step) + 6;
    const rows = Math.ceil(visibleHeight / step) + 6;
    const count = cols * rows;

    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const alphas = new Float32Array(count);

    let idx = 0;
    const startX = -((cols - 1) * step) / 2;
    const startY = -((rows - 1) * step) / 2;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = startX + i * step;
        const y = startY + j * step;
        const z = 0;

        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = z;

        originalPositions[idx * 3] = x;
        originalPositions[idx * 3 + 1] = y;
        originalPositions[idx * 3 + 2] = z;

        velocities[idx * 3] = 0;
        velocities[idx * 3 + 1] = 0;
        velocities[idx * 3 + 2] = 0;

        alphas[idx] = 0.35 + Math.random() * 0.3; // Subtle varying brightness
        idx++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom circular particle texture generated procedurally (Zero 404 directive)
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 32, 32);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(16, 16, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const particleTexture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3.2,
      map: particleTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    // Mouse and interaction tracking
    const mouse3D = new THREE.Vector3(9999, 9999, 0);
    const targetMouse3D = new THREE.Vector3(9999, 9999, 0);
    const raycasterPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(9999, 9999);

    // Shockwave click physics
    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      strength: number;
      speed: number;
    }
    const shockwaves: Shockwave[] = [];

    const handlePointerMove = (e: MouseEvent) => {
      mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(raycasterPlane, intersection);
      if (intersection) {
        targetMouse3D.copy(intersection);
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      // Add shockwave on click/pointerdown
      const clickNDC = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      raycaster.setFromCamera(clickNDC, camera);
      const clickPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(raycasterPlane, clickPoint);

      if (clickPoint) {
        shockwaves.push({
          x: clickPoint.x,
          y: clickPoint.y,
          radius: 0,
          maxRadius: 180,
          strength: 45,
          speed: 6.5,
        });
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // Window resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with Spring Kinematics (Hooke's Law + Damping)
    let animationFrameId = 0;
    const repulsionRadius = 36; // Minimal cursor influence radius
    const repulsionForce = 3.2;  // Subtle, minimal scattering force

    const animate = () => {
      // Smoothly damp mouse position to prevent jerky movement
      mouse3D.x += (targetMouse3D.x - mouse3D.x) * 0.15;
      mouse3D.y += (targetMouse3D.y - mouse3D.y) * 0.15;

      const pos = geometry.attributes.position.array as Float32Array;

      // Update shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += sw.speed;
        sw.strength *= 0.95;
        if (sw.radius > sw.maxRadius || sw.strength < 0.2) {
          shockwaves.splice(s, 1);
        }
      }

      // Physics calculation for each particle
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const px = pos[i3];
        const py = pos[i3 + 1];
        const pz = pos[i3 + 2];

        const ox = originalPositions[i3];
        const oy = originalPositions[i3 + 1];
        const oz = originalPositions[i3 + 2];

        // 1. Mouse Repulsion Force (Minimal & Delicate)
        const dx = px - mouse3D.x;
        const dy = py - mouse3D.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < repulsionRadius * repulsionRadius && distSq > 0.001) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / repulsionRadius) * repulsionForce;
          const nx = dx / dist;
          const ny = dy / dist;

          // Subtle 2D nudge with minimal Z depth
          velocities[i3] += nx * force;
          velocities[i3 + 1] += ny * force;
          velocities[i3 + 2] += (Math.random() - 0.5) * force * 0.3;
        }

        // 2. Shockwave Impulse from clicks
        for (let s = 0; s < shockwaves.length; s++) {
          const sw = shockwaves[s];
          const sdx = px - sw.x;
          const sdy = py - sw.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          const waveDelta = Math.abs(sDist - sw.radius);

          if (waveDelta < 30) {
            const factor = (1 - waveDelta / 30) * sw.strength;
            const snx = sdx / (sDist || 1);
            const sny = sdy / (sDist || 1);

            velocities[i3] += snx * factor;
            velocities[i3 + 1] += sny * factor;
            velocities[i3 + 2] += (Math.random() - 0.5) * factor * 2;
          }
        }

        // 3. Spring Return Force to Home Position (Hooke's Law: F = -k * x)
        const springK = 0.065;
        const damping = 0.86;

        const fHomeX = (ox - px) * springK;
        const fHomeY = (oy - py) * springK;
        const fHomeZ = (oz - pz) * springK;

        velocities[i3] = (velocities[i3] + fHomeX) * damping;
        velocities[i3 + 1] = (velocities[i3 + 1] + fHomeY) * damping;
        velocities[i3 + 2] = (velocities[i3 + 2] + fHomeZ) * damping;

        // Apply velocities
        pos[i3] += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        pos[i3 + 2] += velocities[i3 + 2];
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup resources strictly as required by Three.js skill
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);

      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
