import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Product } from '../../types';
import {
  BuiltProceduralModel,
  CATEGORY_3D_TEMPLATES,
  normalizeCategorySlug,
  PartSpecCallout,
  resolvePartCallout,
  resolveProductModelSource,
  buildCategoryTemplateGroup,
} from './templates3d';

interface ScreenHotspot {
  partName: string;
  label: string;
  xPercent: number;
  yPercent: number;
  occluded: boolean;
}

const _projVec = new THREE.Vector3();
const _worldPos = new THREE.Vector3();
const _camToPart = new THREE.Vector3();

const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

export interface ProductViewer3DProps {
  product: Product;
  reducedMotion?: boolean;
  adminPreview?: boolean;
  onFallbackToGallery?: () => void;
}

export const ProductViewer3D: React.FC<ProductViewer3DProps> = ({
  product,
  reducedMotion = false,
  adminPreview = false,
  onFallbackToGallery,
}) => {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const categorySlug = normalizeCategorySlug(product.categoryId);
  const templateDef = CATEGORY_3D_TEMPLATES[categorySlug];
  const resolvedSource = useMemo(() => resolveProductModelSource(product), [product]);

  const [selectedPart, setSelectedPart] = useState<string>(
    () => templateDef.namedParts[0]?.partName || 'base'
  );
  const [lidOpen, setLidOpen] = useState<boolean>(categorySlug === 'laptops');
  const [portsOpen, setPortsOpen] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const [hotspots, setHotspots] = useState<ScreenHotspot[]>([]);
  const [viewerStatus, setViewerStatus] = useState<'ready' | 'loading' | 'fallback'>('ready');
  const [activeSourceBadge, setActiveSourceBadge] = useState<string>(
    resolvedSource.sourceLabel
  );

  // Sync selectedPart when category changes
  useEffect(() => {
    const firstPart = CATEGORY_3D_TEMPLATES[categorySlug].namedParts[0]?.partName;
    if (firstPart) {
      setSelectedPart(firstPart);
    }
    setLidOpen(categorySlug === 'laptops');
    setPortsOpen(false);
  }, [categorySlug]);

  const activeCallout: PartSpecCallout = useMemo(
    () => resolvePartCallout(product, selectedPart),
    [product, selectedPart]
  );

  // Store mutable refs for WebGL loop without tearing down canvas
  const lidTargetRef = useRef<number>(categorySlug === 'laptops' ? 1 : 0);
  const portsTargetRef = useRef<number>(0);
  const resetTriggerRef = useRef<() => void>(() => {});
  const requestRenderRef = useRef<() => void>(() => {});

  useEffect(() => {
    lidTargetRef.current = lidOpen ? 1 : 0;
    requestRenderRef.current();
  }, [lidOpen]);

  useEffect(() => {
    portsTargetRef.current = portsOpen ? 1 : 0;
    requestRenderRef.current();
  }, [portsOpen]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setViewerStatus('fallback');
      onFallbackToGallery?.();
      return;
    }

    const width = Math.max(300, container.clientWidth || 640);
    const height = Math.max(260, container.clientHeight || 420);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#070b14');
    scene.fog = new THREE.FogExp2('#070b14', 0.065);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    const defaultCamPos = new THREE.Vector3(2.9, 2.05, 3.35);
    const defaultTarget = new THREE.Vector3(0, 0.62, 0);
    camera.position.copy(defaultCamPos);
    camera.lookAt(defaultTarget);

    // Studio IBL Environment via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Studio Lighting Rig: Warm Key Light + Cool Rim Light + Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight('#dbeafe', '#0f172a', 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fff7ed', 2.1);
    keyLight.position.set(4.2, 6.5, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    keyLight.shadow.camera.left = -3.5;
    keyLight.shadow.camera.right = 3.5;
    keyLight.shadow.camera.top = 3.5;
    keyLight.shadow.camera.bottom = -3.5;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 1.35);
    rimLight.position.set(-4.5, 3.2, -3.8);
    scene.add(rimLight);

    // Soft radial contact shadow plane beneath model
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const grad = sctx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.68)');
      grad.addColorStop(0.6, 'rgba(37, 99, 255, 0.14)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.4, 4.4);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = 0.005;
    scene.add(shadowMesh);

    // Build Procedural Category Template immediately (and optionally upgrade if custom GLB is present)
    const builtTemplate: BuiltProceduralModel = buildCategoryTemplateGroup(
      product.categoryId,
      {
        colorway: product.colorway,
        finish: product.finish,
        dimensions: product.dimensions,
      }
    );
    scene.add(builtTemplate.root);
    setActiveSourceBadge(resolvedSource.sourceLabel);

    let customGlbRoot: THREE.Object3D | null = null;
    if (resolvedSource.type === 'glb' && resolvedSource.url) {
      setViewerStatus('loading');
      const gltfLoader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      gltfLoader.setDRACOLoader(dracoLoader);

      gltfLoader.load(
        resolvedSource.url,
        (gltf) => {
          customGlbRoot = gltf.scene;
          const box = new THREE.Box3().setFromObject(customGlbRoot);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          const scale = 2.2 / maxDim;
          customGlbRoot.scale.setScalar(scale);

          const centeredBox = new THREE.Box3().setFromObject(customGlbRoot);
          const center = centeredBox.getCenter(new THREE.Vector3());
          customGlbRoot.position.x -= center.x;
          customGlbRoot.position.z -= center.z;
          customGlbRoot.position.y -= centeredBox.min.y;

          // Keep procedural anchors for any named parts not present in the custom GLB
          customGlbRoot.traverse((child) => {
            if (child.name && builtTemplate.partAnchors.has(child.name)) {
              builtTemplate.partAnchors.set(child.name, child);
            }
            if ((child as THREE.Mesh).isMesh) {
              builtTemplate.interactables.push(child);
            }
          });

          builtTemplate.root.visible = false;
          scene.add(customGlbRoot);
          setViewerStatus('ready');
          setActiveSourceBadge(
            `${product.model3d?.source || 'Product 3D Model'} · ${
              product.model3d?.license || 'Licensed'
            }`
          );
          dracoLoader.dispose();
          requestRender();
        },
        undefined,
        () => {
          // Automatic fallback to Category Template per Section 1
          builtTemplate.root.visible = true;
          setViewerStatus('ready');
          setActiveSourceBadge('Template view');
          dracoLoader.dispose();
          requestRender();
        }
      );
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTarget);
    controls.enableDamping = !isSoftwareGl && !reducedMotion;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.6;
    controls.maxDistance = 6.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.update();

    let currentLid = lidTargetRef.current;
    let currentPorts = portsTargetRef.current;
    builtTemplate.setOpenStates(currentLid, currentPorts);

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastHotspotUpdate = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function computeScreenHotspots(force: boolean) {
      const now = performance.now();
      if (!force && now - lastHotspotUpdate < 90) return;
      lastHotspotUpdate = now;

      const next: ScreenHotspot[] = [];
      const currentTemplate = CATEGORY_3D_TEMPLATES[categorySlug];

      for (const part of currentTemplate.namedParts) {
        const anchor = builtTemplate.partAnchors.get(part.partName);
        if (!anchor) continue;
        anchor.getWorldPosition(_worldPos);
        _projVec.copy(_worldPos).project(camera);

        // Zero-occlusion screen-space projection clamped so labels never hide off-screen or behind body
        const rawX = (_projVec.x * 0.5 + 0.5) * 100;
        const rawY = (-_projVec.y * 0.5 + 0.5) * 100;
        const xPercent = THREE.MathUtils.clamp(rawX, 12, 88);
        const yPercent = THREE.MathUtils.clamp(rawY, 14, 74);

        _camToPart.copy(_worldPos).sub(camera.position);
        const occluded = _projVec.z > 1 || _camToPart.z > 0.6;

        next.push({
          partName: part.partName,
          label: part.partName,
          xPercent: Math.round(xPercent * 10) / 10,
          yPercent: Math.round(yPercent * 10) / 10,
          occluded,
        });
      }
      setHotspots(next);
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;

        const targetLid = lidTargetRef.current;
        const targetPorts = portsTargetRef.current;

        if (reducedMotion || isSoftwareGl) {
          currentLid = targetLid;
          currentPorts = targetPorts;
        } else {
          currentLid = THREE.MathUtils.lerp(currentLid, targetLid, 0.22);
          currentPorts = THREE.MathUtils.lerp(currentPorts, targetPorts, 0.22);
        }

        builtTemplate.setOpenStates(currentLid, currentPorts);
        controls.update();
        renderer.render(scene, camera);

        const stillAnimating =
          Math.abs(currentLid - targetLid) > 0.01 ||
          Math.abs(currentPorts - targetPorts) > 0.01;

        computeScreenHotspots(!stillAnimating);

        const done = () => {
          renderBusy = false;
          if (renderDirty || stillAnimating) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestRenderRef.current = requestRender;

    resetTriggerRef.current = () => {
      camera.position.copy(defaultCamPos);
      controls.target.copy(defaultTarget);
      controls.update();
      requestRender();
    };

    controls.addEventListener('change', requestRender);

    // Raycast click on named parts + double-click to reset camera
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (dist > 6) return; // Dragged orbit, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(builtTemplate.interactables, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.partName) {
          obj = obj.parent;
        }
        if (obj?.userData?.partName) {
          setSelectedPart(String(obj.userData.partName));
        }
      }
    };

    const onDoubleClick = () => {
      resetTriggerRef.current();
    };

    const onResize = () => {
      if (!container) return;
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(260, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerup', onPointerUp);
    domEl.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', onResize);

    // Initial render
    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('change', requestRender);
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerup', onPointerUp);
      domEl.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      builtTemplate.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, [
    categorySlug,
    product.categoryId,
    product.colorway,
    product.finish,
    product.dimensions?.widthCm,
    product.dimensions?.depthCm,
    product.dimensions?.heightCm,
    resolvedSource.type,
    resolvedSource.url,
    resolvedSource.sourceLabel,
    reducedMotion,
    onFallbackToGallery,
  ]);

  return (
    <div
      data-testid="product-viewer-3d"
      data-source-type={resolvedSource.type}
      data-selected-part={selectedPart}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/12 bg-[#070b14] select-none ${
        adminPreview ? 'h-[320px]' : 'h-[380px] sm:h-[460px]'
      }`}
    >
      {/* Dedicated WebGL Mount Ref (isolated from sibling React HUD overlays) */}
      <div
        ref={canvasMountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        aria-label={`Interactive 3D view of ${product.name}`}
      />

      {/* Top-Left Minimal Spec & Source Badge */}
      <div className="pointer-events-none absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-start justify-between gap-2">
        <div className="pointer-events-auto rounded-xl border border-white/12 bg-[#05070d]/90 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[#f4f6fb]">
              {activeSourceBadge}
            </span>
            <span className="text-[#9aa3b8]">&middot;</span>
            <span className="text-[#38bdf8] font-medium capitalize">
              {product.finish || templateDef.defaultFinish} finish
            </span>
          </div>
          <p className="text-[11px] text-[#9aa3b8] mt-0.5">
            Drag to rotate &middot; Scroll/pinch to zoom &middot; Double-tap to reset
          </p>
        </div>

        {/* Selected Part Spec Callout Card */}
        <div
          role="region"
          aria-live="polite"
          aria-label="Selected 3D part specification callout"
          className="pointer-events-auto max-w-[260px] sm:max-w-[300px] rounded-xl border border-[#38bdf8]/40 bg-[#05070d]/92 p-3 text-xs shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#f5b93a] font-semibold uppercase tracking-wider">
            <span>Part: {activeCallout.partName}</span>
            <span>{activeCallout.partLabel}</span>
          </div>
          <div className="mt-1.5 font-display text-sm font-bold text-[#f4f6fb]">
            {activeCallout.specLabel}:{' '}
            <span className="text-[#38bdf8]">{activeCallout.specValue}</span>
          </div>
          {activeCallout.secondarySpecs.length > 0 && (
            <div className="mt-1 text-[11px] text-[#9aa3b8]">
              {activeCallout.secondarySpecs.map((s) => `${s.label}: ${s.value}`).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* Zero-Occlusion Screen-Space Hotspot Labels */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {hotspots.map((h) => {
          const isSelected = h.partName === selectedPart;
          return (
            <button
              key={h.partName}
              type="button"
              onClick={() => setSelectedPart(h.partName)}
              aria-label={`Inspect ${h.partName} specification`}
              style={{
                left: `${h.xPercent}%`,
                top: `${h.yPercent}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`pointer-events-auto absolute rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#2563ff] text-white border border-[#38bdf8] shadow-lg'
                  : h.occluded
                  ? 'bg-[#05070d]/85 text-[#9aa3b8] border border-white/15 hover:text-white'
                  : 'bg-[#0a0e18]/90 text-[#f4f6fb] border border-white/20 hover:border-[#38bdf8]'
              }`}
            >
              {h.label}
            </button>
          );
        })}
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        style={{
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'min(920px, 94%)',
        }}
        className="pointer-events-auto absolute z-20 flex flex-col items-center w-full"
      >
        <button
          type="button"
          onClick={() => setControlsCollapsed((prev) => !prev)}
          aria-expanded={!controlsCollapsed}
          className="mb-1 rounded-full border border-white/15 bg-[#05070d]/90 px-3 py-0.5 text-[11px] font-medium text-[#9aa3b8] hover:text-white cursor-pointer"
        >
          {controlsCollapsed ? '▴ Show 3D Controls' : '▾ Hide Controls'}
        </button>

        {!controlsCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#05070d]/95 px-3.5 py-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setLidOpen((prev) => !prev)}
              aria-pressed={lidOpen}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                lidOpen
                  ? 'bg-[#2563ff] text-white'
                  : 'border border-white/15 bg-[#0a0e18] text-[#f4f6fb] hover:border-[#38bdf8]'
              }`}
            >
              {templateDef.openLidLabel}
            </button>

            <button
              type="button"
              onClick={() => setPortsOpen((prev) => !prev)}
              aria-pressed={portsOpen}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                portsOpen
                  ? 'bg-[#2563ff] text-white'
                  : 'border border-white/15 bg-[#0a0e18] text-[#f4f6fb] hover:border-[#38bdf8]'
              }`}
            >
              {templateDef.openPortsLabel}
            </button>

            <button
              type="button"
              onClick={() => resetTriggerRef.current()}
              className="rounded-full border border-white/15 bg-[#0a0e18] px-3 py-1.5 text-xs font-medium text-[#9aa3b8] hover:text-white cursor-pointer whitespace-nowrap"
            >
              Reset view
            </button>

            {viewerStatus === 'loading' && (
              <span className="text-[11px] text-[#38bdf8] px-2">Loading 3D model...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
