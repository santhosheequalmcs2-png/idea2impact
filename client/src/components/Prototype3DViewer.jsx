import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, RotateCw, Layers, Palette, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

export default function Prototype3DViewer({ title = 'Prototype', category = 'Inventions' }) {
  const mountRef = useRef(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [exploded, setExploded] = useState(0); // 0 to 100
  const [colorTheme, setColorTheme] = useState('cyan'); // cyan, emerald, purple, gold

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const groupRef = useRef(null);
  const partsRef = useRef([]);
  const animFrameIdRef = useRef(null);
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });

  const colors = {
    cyan: { primary: 0x00d4ff, accent: 0x0077ff, core: 0x38bdf8 },
    emerald: { primary: 0x10b981, accent: 0x059669, core: 0x34d399 },
    purple: { primary: 0xa855f7, accent: 0x7c3aed, core: 0xc084fc },
    gold: { primary: 0xf59e0b, accent: 0xd97706, core: 0xfcd34d }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = 400;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(colors[colorTheme].accent, 1.0);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // 3. Grid Platform
    const grid = new THREE.GridHelper(16, 20, 0x3b82f6, 0x1e293b);
    grid.position.y = -3;
    scene.add(grid);

    // 4. Build Model Parts
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    const parts = [];
    const matColor = colors[colorTheme].primary;

    const mainMat = new THREE.MeshStandardMaterial({
      color: matColor,
      metalness: 0.6,
      roughness: 0.2,
      wireframe: wireframe
    });

    const coreMat = new THREE.MeshStandardMaterial({
      color: colors[colorTheme].core,
      emissive: colors[colorTheme].accent,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.1,
      wireframe: wireframe
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.3,
      wireframe: wireframe
    });

    // Central Core Hub (Part 0)
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);
    parts.push({ mesh: coreMesh, basePos: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(0, 0, 0) });

    // Outer Gyro Rings (Parts 1 & 2)
    const ringGeo1 = new THREE.TorusGeometry(2.4, 0.12, 16, 64);
    const ringMesh1 = new THREE.Mesh(ringGeo1, mainMat);
    group.add(ringMesh1);
    parts.push({ mesh: ringMesh1, basePos: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(0, 1.5, 0) });

    const ringGeo2 = new THREE.TorusGeometry(3.2, 0.12, 16, 64);
    const ringMesh2 = new THREE.Mesh(ringGeo2, frameMat);
    ringMesh2.rotation.x = Math.PI / 2;
    group.add(ringMesh2);
    parts.push({ mesh: ringMesh2, basePos: new THREE.Vector3(0, 0, 0), dir: new THREE.Vector3(0, -1.5, 0) });

    // Lateral Sensor / Motor Pods (Parts 3, 4, 5, 6)
    const podGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
    const podPositions = [
      { pos: new THREE.Vector3(2.8, 0, 0), dir: new THREE.Vector3(2, 0, 0) },
      { pos: new THREE.Vector3(-2.8, 0, 0), dir: new THREE.Vector3(-2, 0, 0) },
      { pos: new THREE.Vector3(0, 0, 2.8), dir: new THREE.Vector3(0, 0, 2) },
      { pos: new THREE.Vector3(0, 0, -2.8), dir: new THREE.Vector3(0, 0, -2) }
    ];

    podPositions.forEach(({ pos, dir }) => {
      const podMesh = new THREE.Mesh(podGeo, mainMat);
      podMesh.position.copy(pos);
      group.add(podMesh);
      parts.push({ mesh: podMesh, basePos: pos.clone(), dir });
    });

    partsRef.current = parts;

    // 5. Mouse Interaction (Orbiting)
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current || !groupRef.current) return;
      const deltaX = e.clientX - prevMouseRef.current.x;
      const deltaY = e.clientY - prevMouseRef.current.y;
      groupRef.current.rotation.y += deltaX * 0.01;
      groupRef.current.rotation.x += deltaY * 0.01;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (autoRotate && groupRef.current && !isDraggingRef.current) {
        groupRef.current.rotation.y += 0.008;
      }

      // Rotate gyro rings independently for high-tech effect
      if (partsRef.current[1]?.mesh) partsRef.current[1].mesh.rotation.z = elapsedTime * 0.5;
      if (partsRef.current[2]?.mesh) partsRef.current[2].mesh.rotation.y = elapsedTime * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
    };
  }, [colorTheme]);

  // Update wireframe mode
  useEffect(() => {
    if (!partsRef.current) return;
    partsRef.current.forEach(({ mesh }) => {
      if (mesh.material) {
        mesh.material.wireframe = wireframe;
      }
    });
  }, [wireframe]);

  // Update exploded view positions
  useEffect(() => {
    if (!partsRef.current) return;
    const factor = exploded / 100;
    partsRef.current.forEach(({ mesh, basePos, dir }) => {
      mesh.position.x = basePos.x + dir.x * factor * 2;
      mesh.position.y = basePos.y + dir.y * factor * 2;
      mesh.position.z = basePos.z + dir.z * factor * 2;
    });
  }, [exploded]);

  const handleZoom = (inOut) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z = Math.max(5, Math.min(22, cameraRef.current.position.z + inOut * 2));
  };

  return (
    <div className="prototype-3d-card">
      <div className="prototype-3d-header">
        <div className="prototype-title-row">
          <Eye size={18} className="text-cyan" />
          <span className="prototype-title">Interactive 3D CAD & Prototype Explorer</span>
          <span className="prototype-badge">WebGL · Three.js</span>
        </div>
        <div className="prototype-actions">
          <button
            className={`btn-toggle-icon ${autoRotate ? 'active' : ''}`}
            onClick={() => setAutoRotate(!autoRotate)}
            title="Toggle Auto-Rotation"
          >
            <RotateCw size={15} />
          </button>
          <button
            className={`btn-toggle-icon ${wireframe ? 'active' : ''}`}
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Hologram Wireframe"
          >
            <Layers size={15} />
          </button>
          <button className="btn-toggle-icon" onClick={() => handleZoom(-1)} title="Zoom In">
            <ZoomIn size={15} />
          </button>
          <button className="btn-toggle-icon" onClick={() => handleZoom(1)} title="Zoom Out">
            <ZoomOut size={15} />
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="prototype-canvas-container" ref={mountRef} />

      {/* Controls Footer */}
      <div className="prototype-controls-footer">
        <div className="exploded-slider-box">
          <span className="exploded-label">Exploded CAD View:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={exploded}
            onChange={(e) => setExploded(Number(e.target.value))}
            className="exploded-range-slider"
          />
          <span className="exploded-value">{exploded}%</span>
        </div>

        <div className="color-theme-box">
          <span className="theme-label">Finish:</span>
          {['cyan', 'emerald', 'purple', 'gold'].map((th) => (
            <button
              key={th}
              className={`theme-dot ${colorTheme === th ? 'active' : ''}`}
              style={{ backgroundColor: colors[th].primary }}
              onClick={() => setColorTheme(th)}
              title={th}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
