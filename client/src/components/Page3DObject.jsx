import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Page3DObject({ type = 'marketplace', size = 220 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    // Detect theme
    const checkIsDark = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      return themeAttr === 'dark';
    };
    let isDark = checkIsDark();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    host.appendChild(renderer.domElement);

    // Root Group: Manipulated by drag & inertia
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Theme Color Palettes
    const getColors = (dark) => ({
      primary: dark ? 0x54e6f5 : 0x7041c7,
      secondary: dark ? 0x6485ff : 0x2563ff,
      accent: dark ? 0x5ce9c1 : 0xb99aff,
      metal: dark ? 0x1a263d : 0xe0d6f7,
      glow: dark ? 0x23a6d5 : 0x7041c7
    });
    let colors = getColors(isDark);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.6 : 2.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDark ? 2.5 : 3.0);
    dirLight.position.set(4, 5, 4);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(colors.primary, 15, 10);
    pointLight.position.set(-2, 2, 3);
    scene.add(pointLight);

    // Internal model animatables
    const animatables = [];

    // =========================================================================
    // 1. MARKETPLACE: 3D Glowing Idea Lightbulb + Floating Gear Ring
    // =========================================================================
    if (type === 'marketplace') {
      const bulbGroup = new THREE.Group();

      const glassGeo = new THREE.SphereGeometry(1.0, 32, 24);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: colors.primary,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: isDark ? 0.75 : 0.85
      });
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.y = 0.35;
      bulbGroup.add(glassMesh);

      const taperGeo = new THREE.CylinderGeometry(1.0, 0.48, 0.75, 24);
      const taperMesh = new THREE.Mesh(taperGeo, glassMat);
      taperMesh.position.y = -0.22;
      bulbGroup.add(taperMesh);

      const filamentGeo = new THREE.TorusGeometry(0.35, 0.05, 12, 32, Math.PI * 1.6);
      const filamentMat = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        emissive: colors.primary,
        emissiveIntensity: 1.8,
        roughness: 0.2
      });
      const filament = new THREE.Mesh(filamentGeo, filamentMat);
      filament.position.y = 0.3;
      filament.rotation.z = Math.PI * 0.2;
      bulbGroup.add(filament);

      const baseGeo = new THREE.CylinderGeometry(0.44, 0.38, 0.5, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: colors.metal,
        metalness: 0.85,
        roughness: 0.25
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.85;
      bulbGroup.add(baseMesh);

      const tipGeo = new THREE.SphereGeometry(0.24, 16, 12);
      const tipMesh = new THREE.Mesh(tipGeo, baseMat);
      tipMesh.position.y = -1.15;
      bulbGroup.add(tipMesh);

      const gearRing = new THREE.Group();
      const ringGeo = new THREE.TorusGeometry(1.65, 0.04, 12, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        emissive: colors.secondary,
        emissiveIntensity: 0.5,
        metalness: 0.7
      });
      gearRing.add(new THREE.Mesh(ringGeo, ringMat));

      for (let i = 0; i < 6; i++) {
        const toothGeo = new THREE.BoxGeometry(0.12, 0.2, 0.08);
        const tooth = new THREE.Mesh(toothGeo, ringMat);
        const angle = (i / 6) * Math.PI * 2;
        tooth.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.65, 0);
        tooth.rotation.z = angle;
        gearRing.add(tooth);
      }
      gearRing.rotation.x = 1.15;
      bulbGroup.add(gearRing);

      rootGroup.add(bulbGroup);

      animatables.push((time) => {
        gearRing.rotation.z = -time * 0.6;
        filamentMat.emissiveIntensity = 1.4 + Math.sin(time * 3) * 0.45;
      });
    }

    // =========================================================================
    // 2. TALENTS: 3D Interconnected Human Collaboration Network
    // =========================================================================
    else if (type === 'talents') {
      const netGroup = new THREE.Group();

      const centerGeo = new THREE.IcosahedronGeometry(0.55, 2);
      const centerMat = new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.primary,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2
      });
      const centerMesh = new THREE.Mesh(centerGeo, centerMat);
      netGroup.add(centerMesh);

      const wireGeo = new THREE.IcosahedronGeometry(1.6, 1);
      const wireMat = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        wireframe: true,
        transparent: true,
        opacity: isDark ? 0.35 : 0.45
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      netGroup.add(wireMesh);

      const nodesData = [
        { pos: new THREE.Vector3(1.2, 0.7, 0.5), col: colors.primary },
        { pos: new THREE.Vector3(-1.1, 0.8, -0.6), col: colors.secondary },
        { pos: new THREE.Vector3(0.5, -1.2, 0.7), col: colors.accent },
        { pos: new THREE.Vector3(-0.8, -0.9, -0.8), col: colors.secondary }
      ];

      const satellites = [];
      nodesData.forEach(({ pos, col }) => {
        const satGeo = new THREE.SphereGeometry(0.24, 16, 16);
        const satMat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.9,
          metalness: 0.6
        });
        const sat = new THREE.Mesh(satGeo, satMat);
        sat.position.copy(pos);
        netGroup.add(sat);
        satellites.push({ mesh: sat, basePos: pos.clone() });

        const linePoints = [new THREE.Vector3(0, 0, 0), pos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.75
        });
        const line = new THREE.Line(lineGeo, lineMat);
        netGroup.add(line);
      });

      const ringGeo = new THREE.TorusGeometry(1.7, 0.025, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color: colors.accent, transparent: true, opacity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.35;
      netGroup.add(ring);

      rootGroup.add(netGroup);

      animatables.push((time) => {
        ring.rotation.z = time * 0.5;
        satellites.forEach(({ mesh, basePos }, i) => {
          mesh.position.y = basePos.y + Math.sin(time * 2 + i) * 0.08;
        });
      });
    }

    // =========================================================================
    // 3. AI STUDIO: 3D Cybernetic Neural Brain with Active Synapse Pulse
    // =========================================================================
    else if (type === 'ai-studio') {
      const brainGroup = new THREE.Group();

      [-0.45, 0.45].forEach((offset) => {
        const hemiGeo = new THREE.IcosahedronGeometry(0.85, 2);
        hemiGeo.scale(0.72, 1.1, 0.88);
        const hemiMat = new THREE.MeshStandardMaterial({
          color: colors.primary,
          wireframe: true,
          transparent: true,
          opacity: isDark ? 0.7 : 0.85
        });
        const hemi = new THREE.Mesh(hemiGeo, hemiMat);
        hemi.position.x = offset;
        brainGroup.add(hemi);

        const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
          color: colors.secondary,
          emissive: colors.primary,
          emissiveIntensity: 1.1,
          roughness: 0.3
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.x = offset;
        brainGroup.add(core);
      });

      const synapseCount = 36;
      const posArray = new Float32Array(synapseCount * 3);
      for (let i = 0; i < synapseCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const r = 0.95 + Math.random() * 0.25;
        posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = r * Math.cos(phi) * 1.15;
        posArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const synapseGeo = new THREE.BufferGeometry();
      synapseGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      const synapseMat = new THREE.PointsMaterial({
        color: colors.accent,
        size: 0.08,
        transparent: true,
        opacity: 0.95
      });
      const synapsePoints = new THREE.Points(synapseGeo, synapseMat);
      brainGroup.add(synapsePoints);

      const scanRingGeo = new THREE.TorusGeometry(1.25, 0.025, 8, 48);
      const scanRingMat = new THREE.MeshBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.85
      });
      const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
      scanRing.rotation.x = Math.PI * 0.5;
      brainGroup.add(scanRing);

      rootGroup.add(brainGroup);

      animatables.push((time) => {
        scanRing.position.y = Math.sin(time * 2.2) * 0.9;
        synapseMat.size = 0.07 + Math.sin(time * 4) * 0.025;
      });
    }

    // =========================================================================
    // 4. PRICING: 3D Minted Impact Coin / Token
    // =========================================================================
    else if (type === 'pricing') {
      const coinGroup = new THREE.Group();

      const coinGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.2, 36);
      const coinMat = new THREE.MeshStandardMaterial({
        color: colors.primary,
        metalness: 0.88,
        roughness: 0.2,
        emissive: colors.primary,
        emissiveIntensity: 0.35
      });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI * 0.5;
      coinGroup.add(coinMesh);

      const rimGeo = new THREE.TorusGeometry(1.25, 0.08, 16, 48);
      const rimMat = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        metalness: 0.9,
        roughness: 0.15
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      coinGroup.add(rimMesh);

      [-0.12, 0.12].forEach((zPos) => {
        const emblemGeo = new THREE.OctahedronGeometry(0.55, 0);
        emblemGeo.scale(1, 1, 0.3);
        const emblemMat = new THREE.MeshStandardMaterial({
          color: colors.accent,
          emissive: colors.accent,
          emissiveIntensity: 0.8,
          metalness: 0.7,
          roughness: 0.2
        });
        const emblem = new THREE.Mesh(emblemGeo, emblemMat);
        emblem.position.z = zPos;
        coinGroup.add(emblem);
      });

      const haloGeo = new THREE.TorusGeometry(1.6, 0.02, 8, 48);
      const haloMat = new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.6 });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = 0.8;
      coinGroup.add(halo);

      rootGroup.add(coinGroup);

      animatables.push((time) => {
        halo.rotation.z = -time * 0.4;
      });
    }

    // =========================================================================
    // 5. AUTH: 3D Cyber Security Shield & Lock Vault
    // =========================================================================
    else if (type === 'auth') {
      const shieldGroup = new THREE.Group();

      const shape = new THREE.Shape();
      shape.moveTo(0, 1.25);
      shape.quadraticCurveTo(0.9, 1.2, 1.0, 0.5);
      shape.quadraticCurveTo(0.9, -0.6, 0, -1.35);
      shape.quadraticCurveTo(-0.9, -0.6, -1.0, 0.5);
      shape.quadraticCurveTo(-0.9, 1.2, 0, 1.25);

      const extrudeSettings = {
        depth: 0.16,
        bevelEnabled: true,
        bevelSegments: 4,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
      };
      const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      shieldGeo.center();
      const shieldMat = new THREE.MeshStandardMaterial({
        color: colors.primary,
        metalness: 0.8,
        roughness: 0.22,
        emissive: colors.primary,
        emissiveIntensity: 0.35
      });
      const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldGroup.add(shieldMesh);

      const lockBodyGeo = new THREE.BoxGeometry(0.55, 0.45, 0.18);
      const lockMat = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        emissive: colors.secondary,
        emissiveIntensity: 0.8,
        metalness: 0.7
      });
      const lockBody = new THREE.Mesh(lockBodyGeo, lockMat);
      lockBody.position.set(0, -0.15, 0.18);
      shieldGroup.add(lockBody);

      const shackleGeo = new THREE.TorusGeometry(0.22, 0.06, 12, 24, Math.PI);
      const shackleMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        metalness: 0.9,
        roughness: 0.2
      });
      const shackle = new THREE.Mesh(shackleGeo, shackleMat);
      shackle.position.set(0, 0.1, 0.18);
      shieldGroup.add(shackle);

      const orbitGeo = new THREE.TorusGeometry(1.65, 0.025, 8, 48);
      const orbitMat = new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.55 });
      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = Math.PI * 0.4;
      shieldGroup.add(orbit);

      rootGroup.add(shieldGroup);

      animatables.push((time) => {
        orbit.rotation.z = time * 0.8;
      });
    }

    // =========================================================================
    // 6. DASHBOARD: 3D Growing Analytics Pillars with Upward Launch Trajectory
    // =========================================================================
    else if (type === 'dashboard') {
      const dashGroup = new THREE.Group();

      const baseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.08, 32);
      const baseMat = new THREE.MeshStandardMaterial({
        color: colors.metal,
        metalness: 0.8,
        roughness: 0.3
      });
      const basePlatform = new THREE.Mesh(baseGeo, baseMat);
      basePlatform.position.y = -1.0;
      dashGroup.add(basePlatform);

      const heights = [0.65, 1.15, 1.7, 2.35];
      const xPositions = [-0.9, -0.3, 0.3, 0.9];
      const pillarMeshes = [];

      heights.forEach((h, i) => {
        const pillarGeo = new THREE.BoxGeometry(0.38, h, 0.38);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: i === 3 ? colors.secondary : colors.primary,
          emissive: i === 3 ? colors.secondary : colors.primary,
          emissiveIntensity: 0.4 + i * 0.18,
          metalness: 0.65,
          roughness: 0.25
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(xPositions[i], -1.0 + h / 2, 0);
        dashGroup.add(pillar);
        pillarMeshes.push({ mesh: pillar, baseH: h });

        const capGeo = new THREE.BoxGeometry(0.4, 0.05, 0.4);
        const capMat = new THREE.MeshBasicMaterial({ color: colors.accent });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(xPositions[i], -1.0 + h + 0.025, 0);
        dashGroup.add(cap);
      });

      const curvePoints = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        const x = -1.1 + t * 2.3;
        const y = -0.7 + Math.pow(t, 1.6) * 2.4;
        const z = Math.sin(t * Math.PI) * 0.3;
        curvePoints.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.accent,
        emissiveIntensity: 1.2
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      dashGroup.add(tube);

      const arrowGeo = new THREE.ConeGeometry(0.14, 0.3, 16);
      const arrowMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.accent,
        emissiveIntensity: 1.5
      });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(1.2, 1.7, 0);
      arrow.rotation.z = -Math.PI * 0.32;
      dashGroup.add(arrow);

      rootGroup.add(dashGroup);

      animatables.push((time) => {
        pillarMeshes.forEach(({ mesh, baseH }, idx) => {
          const wave = Math.sin(time * 2 + idx * 0.8) * 0.08;
          mesh.scale.y = 1 + wave;
          mesh.position.y = -1.0 + (baseH * (1 + wave)) / 2;
        });
      });
    }

    // =========================================================================
    // 7. INTERACTIVE DRAG TO ROTATE (POINTER EVENTS & INERTIAL PHYSICS)
    // =========================================================================
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let autoSpinSpeed = 0.007;

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

      // Soft clamp on vertical pitch so object doesn't turn upside down
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

    // Double click to smoothly re-center object
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

    // Animation Loop
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Check for theme switches dynamically
      const currentDark = checkIsDark();
      if (currentDark !== isDark) {
        isDark = currentDark;
        colors = getColors(isDark);
        pointLight.color.setHex(colors.primary);
        ambientLight.intensity = isDark ? 1.6 : 2.0;
        dirLight.intensity = isDark ? 2.5 : 3.0;
      }

      // Physics & Inertia dampening
      if (!isDragging) {
        targetRotationY += velocityX;
        targetRotationX += velocityY;
        velocityX *= 0.92;
        velocityY *= 0.92;

        // Idle continuous auto-spin when released
        targetRotationY += autoSpinSpeed;
      }

      // Silky smooth lerp interpolation
      currentRotationX += (targetRotationX - currentRotationX) * 0.12;
      currentRotationY += (targetRotationY - currentRotationY) * 0.12;

      rootGroup.rotation.x = currentRotationX;
      rootGroup.rotation.y = currentRotationY;

      // Run internal model animations
      animatables.forEach((fn) => fn(elapsedTime));

      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!host) return;
      const w = host.clientWidth || size;
      const h = host.clientHeight || size;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(host);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      host.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      host.removeEventListener('dblclick', onDoubleClick);
      renderer.dispose();
      scene.clear();
      if (renderer.domElement && host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [type, size]);

  return (
    <div
      ref={containerRef}
      className={`page-3d-canvas-wrapper page-3d-${type}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'grab',
        touchAction: 'none'
      }}
      title="Click and drag to rotate in 3D (Double-click to reset)"
      aria-label={`Interactive 3D model representing ${type}. Click and drag to rotate.`}
    />
  );
}
