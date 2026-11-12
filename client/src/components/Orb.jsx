import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Orb() {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 300, host.clientHeight || 300);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.IcosahedronGeometry(1.35, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x263f9c,
      metalness: 0.7,
      roughness: 0.22,
      wireframe: true
    });
    group.add(new THREE.Mesh(geo, mat));

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.86, 3),
      new THREE.MeshStandardMaterial({
        color: 0x0d243c,
        emissive: 0x087caa,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.25
      })
    );
    group.add(core);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.009, 8, 140),
      new THREE.MeshBasicMaterial({ color: 0x54e6f5 })
    );
    ring.rotation.x = 1.1;
    group.add(ring);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const light = new THREE.PointLight(0x54e6f5, 20);
    light.position.set(3, 3, 4);
    scene.add(light);

    // Interactive Drag to Rotate with Inertia
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    const autoSpinSpeedX = 0.001;
    const autoSpinSpeedY = 0.003;

    const onPointerDown = (e) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      velocityX = 0;
      velocityY = 0;
      host.style.cursor = 'grabbing';
      if (host.setPointerCapture) {
        try { host.setPointerCapture(e.pointerId); } catch (err) {}
      }
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevPointerX;
      const deltaY = e.clientY - prevPointerY;

      velocityX = deltaX * 0.013;
      velocityY = deltaY * 0.013;

      targetRotationY += velocityX;
      targetRotationX += velocityY;

      targetRotationX = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetRotationX));

      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const onPointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      host.style.cursor = 'grab';
      if (host.releasePointerCapture) {
        try { host.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };

    const onDoubleClick = () => {
      targetRotationX = 0;
      targetRotationY = 0;
      velocityX = 0;
      velocityY = 0;
    };

    host.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    host.addEventListener('dblclick', onDoubleClick);

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      if (!isDragging) {
        targetRotationY += velocityX;
        targetRotationX += velocityY;
        velocityX *= 0.92;
        velocityY *= 0.92;

        targetRotationY += autoSpinSpeedY;
        targetRotationX += autoSpinSpeedX;
      }

      currentRotationX += (targetRotationX - currentRotationX) * 0.12;
      currentRotationY += (targetRotationY - currentRotationY) * 0.12;

      group.rotation.x = currentRotationX;
      group.rotation.y = currentRotationY;

      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      const w = host.clientWidth || 300;
      const h = host.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('dblclick', onDoubleClick);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="orb"
      ref={ref}
      style={{ cursor: 'grab', touchAction: 'none' }}
      title="Click and drag to rotate in 3D (Double-click to reset)"
      aria-label="Animated 3D innovation core. Click and drag to rotate."
    />
  );
}
