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
    // 2. TALENTS & PARTNERS: 3D Collaborative Builder Triad & Team Nexus
    // Distinct from Home Orb: Features 3 stylized co-founder/builder figures
    // (Founder, Engineer, Investor) arranged in a collaborative circle around
    // a glowing synergy gem, floating podium, and glowing partnership conduits.
    // =========================================================================
    else if (type === 'talents') {
      const teamGroup = new THREE.Group();

      // Elevated floating partnership dais / stage
      const daisGeo = new THREE.CylinderGeometry(1.35, 1.45, 0.12, 32);
      const daisMat = new THREE.MeshStandardMaterial({
        color: colors.metal,
        metalness: 0.8,
        roughness: 0.3
      });
      const dais = new THREE.Mesh(daisGeo, daisMat);
      dais.position.y = -0.7;
      teamGroup.add(dais);

      // Glowing perimeter ring around platform
      const daisRingGeo = new THREE.TorusGeometry(1.42, 0.03, 8, 48);
      const daisRingMat = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.7
      });
      const daisRing = new THREE.Mesh(daisRingGeo, daisRingMat);
      daisRing.rotation.x = Math.PI * 0.5;
      daisRing.position.y = -0.64;
      teamGroup.add(daisRing);

      // 3 Stylized Builder Figures (120 deg apart)
      // Member 0: The Creator / Innovator (Primary color)
      // Member 1: The Elite Engineer / Builder (Secondary color)
      // Member 2: The Investor / Growth Partner (Accent color)
      const roles = [
        { angle: 0, color: colors.primary, title: 'Creator' },
        { angle: (Math.PI * 2) / 3, color: colors.secondary, title: 'Engineer' },
        { angle: (Math.PI * 4) / 3, color: colors.accent, title: 'Partner' }
      ];

      const radius = 0.85;
      const avatarMeshes = [];
      const figureChestPositions = [];

      roles.forEach(({ angle, color }) => {
        const figure = new THREE.Group();
        const fx = Math.cos(angle) * radius;
        const fz = Math.sin(angle) * radius;
        figure.position.set(fx, -0.64, fz);

        // Turn figure to face slightly outward toward viewer
        figure.rotation.y = -angle + Math.PI * 0.5;

        // Torso / Body: sleek tapered capsule/cylinder
        const torsoGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.55, 16);
        const torsoMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.5,
          roughness: 0.25
        });
        const torso = new THREE.Mesh(torsoGeo, torsoMat);
        torso.position.y = 0.32;
        figure.add(torso);

        // Shoulders / Chest Armor Plate
        const shoulderGeo = new THREE.BoxGeometry(0.52, 0.12, 0.26);
        const shoulderMat = new THREE.MeshStandardMaterial({
          color: colors.metal,
          metalness: 0.8,
          roughness: 0.2
        });
        const shoulders = new THREE.Mesh(shoulderGeo, shoulderMat);
        shoulders.position.y = 0.52;
        figure.add(shoulders);

        // Head: Stylized sphere
        const headGeo = new THREE.SphereGeometry(0.18, 20, 20);
        const headMat = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.4,
          roughness: 0.3
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 0.74;
        figure.add(head);

        // Glowing Visor on Head
        const visorGeo = new THREE.BoxGeometry(0.22, 0.05, 0.14);
        const visorMat = new THREE.MeshBasicMaterial({
          color: color
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.74, 0.12);
        figure.add(visor);

        // Role Emblem / Badge on chest
        const badgeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12);
        badgeGeo.rotateX(Math.PI / 2);
        const badgeMat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1.2
        });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0, 0.38, 0.16);
        figure.add(badge);

        teamGroup.add(figure);
        avatarMeshes.push(figure);

        // Store chest coordinate for connection lines
        figureChestPositions.push(new THREE.Vector3(fx, -0.25, fz));
      });

      // Floating Collaboration Core / Synergy Gem in center
      const gemGroup = new THREE.Group();
      gemGroup.position.set(0, 0.15, 0);

      const gemGeo = new THREE.OctahedronGeometry(0.36, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: colors.secondary,
        emissive: colors.primary,
        emissiveIntensity: 1.2,
        roughness: 0.15,
        metalness: 0.7
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gemGroup.add(gem);

      // Inner pulsating light spark
      const gemCoreGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const gemCoreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      gemGroup.add(new THREE.Mesh(gemCoreGeo, gemCoreMat));

      // Orbiting Synergy Halo Rings around gem
      const orbitRing1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.015, 8, 32),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.8 })
      );
      orbitRing1.rotation.x = Math.PI * 0.3;
      gemGroup.add(orbitRing1);

      const orbitRing2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.015, 8, 32),
        new THREE.MeshBasicMaterial({ color: colors.accent, transparent: true, opacity: 0.8 })
      );
      orbitRing2.rotation.y = Math.PI * 0.4;
      gemGroup.add(orbitRing2);

      teamGroup.add(gemGroup);

      // Triangle of Partnership: Laser connection lines linking the 3 builders
      const triadPoints = [
        figureChestPositions[0],
        figureChestPositions[1],
        figureChestPositions[2],
        figureChestPositions[0]
      ];
      const triadGeo = new THREE.BufferGeometry().setFromPoints(triadPoints);
      const triadMat = new THREE.LineBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.75
      });
      const triadLines = new THREE.Line(triadGeo, triadMat);
      teamGroup.add(triadLines);

      // Radial Beams from each builder to the central synergy gem
      const centerPos = new THREE.Vector3(0, 0.15, 0);
      figureChestPositions.forEach((chestPos) => {
        const beamGeo = new THREE.BufferGeometry().setFromPoints([chestPos, centerPos]);
        const beamMat = new THREE.LineBasicMaterial({
          color: colors.primary,
          transparent: true,
          opacity: 0.6
        });
        teamGroup.add(new THREE.Line(beamGeo, beamMat));
      });

      rootGroup.add(teamGroup);

      animatables.push((time) => {
        gemGroup.rotation.y = time * 0.8;
        gemGroup.rotation.x = Math.sin(time * 0.5) * 0.2;
        orbitRing1.rotation.z = time * 1.2;
        orbitRing2.rotation.z = -time * 1.0;
        gemMat.emissiveIntensity = 1.0 + Math.sin(time * 3) * 0.4;

        // Subtle floating / breathing of each figure
        avatarMeshes.forEach((mesh, idx) => {
          mesh.position.y = -0.64 + Math.sin(time * 2 + idx * 2.09) * 0.025;
        });
      });
    }

    // =========================================================================
    // 3. AI STUDIO: 3D Futuristic AI Copilot Robot & Neural Sparkle
    // An autonomous AI assistant bot: sleek ceramic helmet, glossy dark visor
    // with glowing digital AI eyes that blink, magnetic side audio pods,
    // top antenna, floating 4-pointed AI Sparkle Star (✦), and hover collar.
    // =========================================================================
    else if (type === 'ai-studio') {
      const robotGroup = new THREE.Group();

      // 1. Robotic Head Chassis (Curved aerodynamic helmet)
      const headGeo = new THREE.SphereGeometry(0.85, 32, 28);
      headGeo.scale(0.96, 1.04, 0.94);
      const headMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x141b2d : 0xf2f5fc,
        metalness: 0.6,
        roughness: 0.25
      });
      const head = new THREE.Mesh(headGeo, headMat);
      robotGroup.add(head);

      // Rear/Top Accent Stripe / Helmet Shell
      const shellGeo = new THREE.SphereGeometry(0.87, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.45);
      shellGeo.scale(0.96, 1.04, 0.94);
      const shellMat = new THREE.MeshStandardMaterial({
        color: colors.primary,
        metalness: 0.8,
        roughness: 0.2
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      robotGroup.add(shell);

      // 2. Glossy Dark Front Visor Screen
      const visorGeo = new THREE.SphereGeometry(0.86, 32, 20, -Math.PI * 0.38, Math.PI * 0.76, Math.PI * 0.32, Math.PI * 0.36);
      visorGeo.scale(0.96, 1.04, 0.96);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 0x070b14,
        metalness: 0.95,
        roughness: 0.1
      });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      robotGroup.add(visor);

      // 3. Glowing Digital AI Eyes (Inside visor)
      const eyeMat = new THREE.MeshBasicMaterial({ color: colors.secondary });
      
      // Left Eye
      const eyeGeo = new THREE.CapsuleGeometry(0.065, 0.14, 8, 16);
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.25, 0.05, 0.78);
      leftEye.rotation.z = -0.08;
      robotGroup.add(leftEye);

      // Right Eye
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.25, 0.05, 0.78);
      rightEye.rotation.z = 0.08;
      robotGroup.add(rightEye);

      // 4. Side Magnetic Ear Pods / Audio Thrusters
      const podMat = new THREE.MeshStandardMaterial({
        color: colors.metal,
        metalness: 0.85,
        roughness: 0.2
      });
      const podGlowMat = new THREE.MeshBasicMaterial({ color: colors.secondary });

      [-0.88, 0.88].forEach((xSide) => {
        const pod = new THREE.Group();
        pod.position.set(xSide, 0.04, 0);

        const outerCyl = new THREE.CylinderGeometry(0.24, 0.26, 0.14, 24);
        outerCyl.rotateZ(Math.PI * 0.5);
        pod.add(new THREE.Mesh(outerCyl, podMat));

        const innerRing = new THREE.TorusGeometry(0.16, 0.02, 8, 24);
        innerRing.rotateY(Math.PI * 0.5);
        pod.add(new THREE.Mesh(innerRing, podGlowMat));

        robotGroup.add(pod);
      });

      // 5. Top Sensor Spire / Antenna
      const stemGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.28, 12);
      const stem = new THREE.Mesh(stemGeo, podMat);
      stem.position.y = 0.98;
      robotGroup.add(stem);

      const beaconGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const beaconMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.accent,
        emissiveIntensity: 1.5
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 1.14;
      robotGroup.add(beacon);

      // 6. Floating 3D AI Sparkle Star (✦) Above Antenna
      const starGroup = new THREE.Group();
      starGroup.position.y = 1.45;

      const starMat = new THREE.MeshStandardMaterial({
        color: colors.accent,
        metalness: 0.9,
        roughness: 0.15,
        emissive: colors.accent,
        emissiveIntensity: 0.9
      });

      // Vertical diamond ray
      const vertRayGeo = new THREE.OctahedronGeometry(0.24, 0);
      vertRayGeo.scale(0.35, 1.25, 0.35);
      starGroup.add(new THREE.Mesh(vertRayGeo, starMat));

      // Horizontal diamond ray
      const horizRayGeo = new THREE.OctahedronGeometry(0.24, 0);
      horizRayGeo.scale(1.25, 0.35, 0.35);
      starGroup.add(new THREE.Mesh(horizRayGeo, starMat));

      // Center glowing core
      const starCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      starGroup.add(starCore);

      robotGroup.add(starGroup);

      // 7. Anti-Gravity Floating Collar / Propulsion Ring
      const collarGroup = new THREE.Group();
      collarGroup.position.y = -0.72;

      const collarGeo = new THREE.TorusGeometry(0.68, 0.05, 12, 48);
      collarGeo.rotateX(Math.PI * 0.5);
      collarGroup.add(new THREE.Mesh(collarGeo, podMat));

      const collarGlowGeo = new THREE.TorusGeometry(0.64, 0.018, 8, 36);
      collarGlowGeo.rotateX(Math.PI * 0.5);
      collarGroup.add(new THREE.Mesh(collarGlowGeo, podGlowMat));

      robotGroup.add(collarGroup);

      // 8. Tilted Orbiting Neural Ring
      const haloGeo = new THREE.TorusGeometry(1.22, 0.015, 8, 64);
      const haloMat = new THREE.MeshBasicMaterial({
        color: colors.secondary,
        transparent: true,
        opacity: 0.65
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI * 0.38;
      robotGroup.add(halo);

      rootGroup.add(robotGroup);

      // Idle Hover & Pulse Animations
      animatables.push((time) => {
        // Floating hover bobbing
        robotGroup.position.y = Math.sin(time * 2.0) * 0.06;

        // AI Sparkle spinning and bobbing
        starGroup.rotation.y = time * 1.5;
        starGroup.rotation.z = Math.sin(time * 2) * 0.15;
        starGroup.position.y = 1.45 + Math.sin(time * 3) * 0.04;

        // Neural halo continuous orbit
        halo.rotation.z = time * 0.6;

        // Gentle eye blink / pulse
        const blinkCycle = time % 4;
        if (blinkCycle > 3.85) {
          leftEye.scale.y = 0.1;
          rightEye.scale.y = 0.1;
        } else {
          leftEye.scale.y = 1.0;
          rightEye.scale.y = 1.0;
        }

        // Pulsating antenna beacon
        beaconMat.emissiveIntensity = 1.2 + Math.sin(time * 4) * 0.6;
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
