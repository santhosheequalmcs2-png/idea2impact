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

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      group.rotation.y += 0.003;
      group.rotation.x += 0.0015;
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
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (renderer.domElement && renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="orb" ref={ref} aria-label="Animated 3D innovation core" />;
}
