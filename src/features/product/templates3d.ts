import * as THREE from 'three';
import {
  CategorySlug,
  Product,
  ProductDimensions,
  ProductFinish,
} from '../../types';
import { SEED_SPEC_SCHEMAS } from '../../content/seedData';

export interface NamedPartMetadata {
  partName: string;
  label: string;
  linkedSpecField: string;
  secondarySpecFields?: string[];
  description: string;
}

export interface CategoryTemplateDefinition {
  categoryId: CategorySlug;
  title: string;
  defaultColorway: string;
  defaultFinish: ProductFinish;
  defaultDimensions: ProductDimensions;
  openLidLabel: string;
  openPortsLabel: string;
  namedParts: NamedPartMetadata[];
  linkedSpecFields: string[];
}

export const CATEGORY_3D_TEMPLATES: Record<CategorySlug, CategoryTemplateDefinition> = {
  laptops: {
    categoryId: 'laptops',
    title: 'Laptop Procedural 3D Template',
    defaultColorway: '#cbd5e1',
    defaultFinish: 'metal',
    defaultDimensions: { widthCm: 31.5, depthCm: 22.4, heightCm: 1.9 },
    openLidLabel: 'Open lid',
    openPortsLabel: 'Open ports',
    linkedSpecFields: ['processor', 'ramGb', 'storageGb', 'display', 'ports', 'weightKg'],
    namedParts: [
      {
        partName: 'base',
        label: 'Unibody Base Chassis',
        linkedSpecField: 'processor',
        secondarySpecFields: ['ramGb', 'storageGb'],
        description: 'Main compute deck housing processor, thermal pipes, and battery.',
      },
      {
        partName: 'lid',
        label: 'Top Display Lid',
        linkedSpecField: 'weightKg',
        secondarySpecFields: ['display'],
        description: 'Protective top enclosure milled for rigidity and low carry weight.',
      },
      {
        partName: 'screen',
        label: 'Display Panel',
        linkedSpecField: 'display',
        secondarySpecFields: ['graphics'],
        description: 'High-resolution anti-glare display panel.',
      },
      {
        partName: 'keyboard',
        label: 'Backlit Keyboard Deck',
        linkedSpecField: 'ramGb',
        secondarySpecFields: ['processor'],
        description: 'Spill-resistant tactile keyboard over high-speed system memory.',
      },
      {
        partName: 'trackpad',
        label: 'Precision Glass Trackpad',
        linkedSpecField: 'storageGb',
        secondarySpecFields: ['storageType'],
        description: 'Multi-touch glass surface positioned above NVMe storage bay.',
      },
      {
        partName: 'hinge',
        label: 'Torque Hinge Assembly',
        linkedSpecField: 'weightKg',
        description: 'Precision-damped hinge tested for 25,000+ open/close cycles.',
      },
      {
        partName: 'ports-left',
        label: 'Left I/O Ports',
        linkedSpecField: 'ports',
        description: 'Primary high-speed Thunderbolt / USB-C power and display ports.',
      },
      {
        partName: 'ports-right',
        label: 'Right I/O Ports',
        linkedSpecField: 'ports',
        description: 'USB-A, HDMI, Ethernet, and audio peripheral ports.',
      },
    ],
  },
  desktops: {
    categoryId: 'desktops',
    title: 'Desktop Tower Procedural 3D Template',
    defaultColorway: '#1e293b',
    defaultFinish: 'matte',
    defaultDimensions: { widthCm: 15.4, depthCm: 29.2, heightCm: 32.4 },
    openLidLabel: 'Open lid',
    openPortsLabel: 'Open ports',
    linkedSpecFields: ['processor', 'ramGb', 'storageGb', 'graphics', 'ports'],
    namedParts: [
      {
        partName: 'tower',
        label: 'Main Tower Chassis',
        linkedSpecField: 'processor',
        secondarySpecFields: ['ramGb'],
        description: 'Full-airflow commercial workstation chassis and CPU core.',
      },
      {
        partName: 'front-ports',
        label: 'Front High-Speed I/O Bay',
        linkedSpecField: 'ports',
        description: 'Front-access USB 3.2, Type-C, and audio ports.',
      },
      {
        partName: 'side-panel',
        label: 'Serviceable Side Panel',
        linkedSpecField: 'graphics',
        secondarySpecFields: ['ramGb', 'storageGb'],
        description: 'Tool-less side access panel opening to PCIe graphics and RAM slots.',
      },
      {
        partName: 'power',
        label: 'Power & Drive Module',
        linkedSpecField: 'storageGb',
        secondarySpecFields: ['storageType'],
        description: 'High-efficiency power supply and NVMe/SATA storage bays.',
      },
    ],
  },
  printers: {
    categoryId: 'printers',
    title: 'Laser / Tank Printer Procedural 3D Template',
    defaultColorway: '#e2e8f0',
    defaultFinish: 'matte',
    defaultDimensions: { widthCm: 38.1, depthCm: 35.7, heightCm: 21.6 },
    openLidLabel: 'Open lid',
    openPortsLabel: 'Open ports',
    linkedSpecFields: ['printType', 'colorMode', 'maxPaperSize', 'printSpeedPpm', 'duplex'],
    namedParts: [
      {
        partName: 'body',
        label: 'Printer Engine Body',
        linkedSpecField: 'printType',
        secondarySpecFields: ['tonerOrInk'],
        description: 'Core imaging drum, fuser assembly, and cartridge bay.',
      },
      {
        partName: 'paper-tray',
        label: 'Input Paper Cassette',
        linkedSpecField: 'maxPaperSize',
        description: 'High-capacity sheet cassette for A4, Legal, and Foolscap media.',
      },
      {
        partName: 'output-tray',
        label: 'Top Output Bin',
        linkedSpecField: 'printSpeedPpm',
        description: 'Face-down output tray rated for rapid continuous printing.',
      },
      {
        partName: 'control-panel',
        label: 'Operator Control Panel',
        linkedSpecField: 'colorMode',
        secondarySpecFields: ['connectivity'],
        description: 'Status LCD, network indicators, and quick job controls.',
      },
      {
        partName: 'duplex-unit',
        label: 'Rear Duplex & Network Bay',
        linkedSpecField: 'duplex',
        secondarySpecFields: ['connectivity'],
        description: 'Automatic two-sided sheet reversing module and Gigabit Ethernet.',
      },
    ],
  },
  scanners: {
    categoryId: 'scanners',
    title: 'Document Scanner Procedural 3D Template',
    defaultColorway: '#334155',
    defaultFinish: 'gloss',
    defaultDimensions: { widthCm: 29.1, depthCm: 25.3, heightCm: 23.1 },
    openLidLabel: 'Open lid',
    openPortsLabel: 'Open ports',
    linkedSpecFields: ['scanType', 'dpi', 'sheetFeeder', 'dutyCycle'],
    namedParts: [
      {
        partName: 'body',
        label: 'Optical Transport Body',
        linkedSpecField: 'scanType',
        description: 'Dual-CIS single-pass optical transport and precision rollers.',
      },
      {
        partName: 'feeder',
        label: 'Auto Document Feeder (ADF)',
        linkedSpecField: 'sheetFeeder',
        description: 'Multi-sheet chute for mixed paper batches, IDs, and passports.',
      },
      {
        partName: 'glass',
        label: 'Optical CIS Imaging Glass',
        linkedSpecField: 'dpi',
        description: 'High-resolution dual-sided optical imaging array.',
      },
      {
        partName: 'control-button',
        label: 'One-Touch Job Button',
        linkedSpecField: 'dutyCycle',
        secondarySpecFields: ['connectivity'],
        description: 'Start/Stop scan controls rated for high daily duty cycles.',
      },
    ],
  },
};

export interface ResolvedModelSource {
  type: 'glb' | 'template' | 'gallery';
  url?: string;
  sourceLabel: string;
  licenseLabel?: string;
  categoryId: CategorySlug;
}

export function normalizeCategorySlug(cat: string): CategorySlug {
  if (cat === 'desktops' || cat === 'printers' || cat === 'scanners' || cat === 'laptops') {
    return cat;
  }
  return 'laptops';
}

/**
 * Resolves a product to one of three model sources in exact spec order:
 * 1. Product model (licensed glTF/GLB uploaded to the product)
 * 2. Category template (procedural model built in code)
 * 3. Photo fallback (if category is unsupported or viewer fails)
 */
export function resolveProductModelSource(product: Product): ResolvedModelSource {
  const categoryId = normalizeCategorySlug(product.categoryId);
  if (
    product.model3d &&
    product.model3d.url &&
    product.model3d.url.trim().length > 0 &&
    product.model3d.source &&
    product.model3d.license
  ) {
    return {
      type: 'glb',
      url: product.model3d.url.trim(),
      sourceLabel: product.model3d.source,
      licenseLabel: product.model3d.license,
      categoryId,
    };
  }

  if (CATEGORY_3D_TEMPLATES[categoryId]) {
    return {
      type: 'template',
      sourceLabel: 'Template view',
      categoryId,
    };
  }

  return {
    type: 'gallery',
    sourceLabel: 'Photo fallback',
    categoryId,
  };
}

export interface PartSpecCallout {
  partName: string;
  partLabel: string;
  description: string;
  specFieldId: string;
  specLabel: string;
  specValue: string;
  secondarySpecs: { label: string; value: string }[];
}

function formatSpecFieldValue(
  categoryId: CategorySlug,
  fieldId: string,
  rawVal: unknown
): { label: string; value: string } {
  const schema = SEED_SPEC_SCHEMAS[categoryId];
  const fieldDef = schema?.fields.find((f) => f.id === fieldId);
  const label = fieldDef?.label || fieldId;

  if (typeof rawVal === 'boolean') {
    return { label, value: rawVal ? 'Yes (Supported)' : 'No' };
  }
  if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
    const unit = fieldDef?.unit ? ` ${fieldDef.unit}` : '';
    return { label, value: `${rawVal}${unit}` };
  }
  return { label, value: 'Standard Factory Configuration' };
}

/**
 * Reads the linked spec field and value directly from the Product record.
 */
export function resolvePartCallout(product: Product, partName: string): PartSpecCallout {
  const categoryId = normalizeCategorySlug(product.categoryId);
  const template = CATEGORY_3D_TEMPLATES[categoryId];
  const partMeta =
    template.namedParts.find((p) => p.partName === partName) || template.namedParts[0];

  const primary = formatSpecFieldValue(
    categoryId,
    partMeta.linkedSpecField,
    product.specs[partMeta.linkedSpecField]
  );

  const secondarySpecs = (partMeta.secondarySpecFields || [])
    .map((secId) => formatSpecFieldValue(categoryId, secId, product.specs[secId]))
    .filter((item) => item.value !== 'Standard Factory Configuration');

  return {
    partName: partMeta.partName,
    partLabel: partMeta.label,
    description: partMeta.description,
    specFieldId: partMeta.linkedSpecField,
    specLabel: primary.label,
    specValue: primary.value,
    secondarySpecs,
  };
}

export function getFinishPbrParams(finish: ProductFinish = 'metal'): {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
} {
  switch (finish) {
    case 'matte':
      return { roughness: 0.72, metalness: 0.18, clearcoat: 0.05, clearcoatRoughness: 0.5 };
    case 'gloss':
      return { roughness: 0.16, metalness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.1 };
    case 'metal':
    default:
      return { roughness: 0.24, metalness: 0.88, clearcoat: 0.35, clearcoatRoughness: 0.2 };
  }
}

export interface BuiltProceduralModel {
  root: THREE.Group;
  partAnchors: Map<string, THREE.Object3D>;
  interactables: THREE.Object3D[];
  setOpenStates: (lidOpenProgress: number, portsOpenProgress: number) => void;
  dispose: () => void;
}

function registerNamedPart(
  meshOrGroup: THREE.Object3D,
  partName: string,
  partAnchors: Map<string, THREE.Object3D>,
  interactables: THREE.Object3D[],
  anchorOffset?: THREE.Vector3
) {
  meshOrGroup.name = partName;
  meshOrGroup.userData.partName = partName;
  meshOrGroup.traverse((child) => {
    child.userData.partName = partName;
    if ((child as THREE.Mesh).isMesh) {
      interactables.push(child);
    }
  });

  if (anchorOffset) {
    const anchor = new THREE.Object3D();
    anchor.position.copy(anchorOffset);
    anchor.name = `${partName}-anchor`;
    meshOrGroup.add(anchor);
    partAnchors.set(partName, anchor);
  } else {
    partAnchors.set(partName, meshOrGroup);
  }
}

/**
 * Builds a studio-ready composite Three.js procedural model for any supported category,
 * driven by product.colorway, product.finish, and product.dimensions.
 */
export function buildCategoryTemplateGroup(
  rawCategoryId: string,
  options?: {
    colorway?: string;
    finish?: ProductFinish;
    dimensions?: ProductDimensions;
  }
): BuiltProceduralModel {
  const categoryId = normalizeCategorySlug(rawCategoryId);
  const template = CATEGORY_3D_TEMPLATES[categoryId];
  const hexColor = options?.colorway || template.defaultColorway;
  const finish = options?.finish || template.defaultFinish;
  const dims = options?.dimensions || template.defaultDimensions;

  const pbr = getFinishPbrParams(finish);
  const primaryColor = new THREE.Color(hexColor);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const bodyMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      clearcoat: pbr.clearcoat,
      clearcoatRoughness: pbr.clearcoatRoughness,
    })
  );

  const darkTrimMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f172a'),
      roughness: Math.min(0.95, pbr.roughness + 0.25),
      metalness: 0.25,
    })
  );

  const accentMetalMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'),
      roughness: 0.2,
      metalness: 0.85,
      emissive: new THREE.Color('#1d4ed8'),
      emissiveIntensity: 0.25,
    })
  );

  const screenMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0b132b'),
      roughness: 0.12,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      emissive: new THREE.Color('#1e3a8a'),
      emissiveIntensity: 0.45,
    })
  );

  const root = new THREE.Group();
  root.name = `template-${categoryId}`;

  // Normalize scale relative to default dimensions (bounded 0.78..1.25 so it always frames nicely)
  const scaleX = THREE.MathUtils.clamp(
    dims.widthCm / template.defaultDimensions.widthCm,
    0.78,
    1.25
  );
  const scaleY = THREE.MathUtils.clamp(
    dims.heightCm / template.defaultDimensions.heightCm,
    0.78,
    1.25
  );
  const scaleZ = THREE.MathUtils.clamp(
    dims.depthCm / template.defaultDimensions.depthCm,
    0.78,
    1.25
  );
  root.scale.set(scaleX, scaleY, scaleZ);

  const partAnchors = new Map<string, THREE.Object3D>();
  const interactables: THREE.Object3D[] = [];

  let setOpenStates = (_lid: number, _ports: number) => {};

  if (categoryId === 'laptops') {
    // 1. Base deck (width 2.4, height 0.11, depth 1.65)
    const baseGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.11, 1.65));
    const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
    baseMesh.position.set(0, 0.055, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    root.add(baseMesh);
    registerNamedPart(
      baseMesh,
      'base',
      partAnchors,
      interactables,
      new THREE.Vector3(0.75, 0.04, 0.55)
    );

    // 2. Keyboard recessed well (width 2.05, height 0.025, depth 0.78)
    const kbGeo = trackGeo(new THREE.BoxGeometry(2.05, 0.025, 0.78));
    const kbMesh = new THREE.Mesh(kbGeo, darkTrimMat);
    kbMesh.position.set(0, 0.115, -0.18);
    root.add(kbMesh);
    registerNamedPart(
      kbMesh,
      'keyboard',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.03, 0)
    );

    // 3. Trackpad (width 0.72, height 0.018, depth 0.44)
    const tpGeo = trackGeo(new THREE.BoxGeometry(0.72, 0.018, 0.44));
    const tpMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: primaryColor.clone().multiplyScalar(0.88),
        roughness: 0.18,
        metalness: 0.3,
        clearcoat: 0.6,
      })
    );
    const tpMesh = new THREE.Mesh(tpGeo, tpMat);
    tpMesh.position.set(0, 0.114, 0.47);
    root.add(tpMesh);
    registerNamedPart(
      tpMesh,
      'trackpad',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.03, 0.12)
    );

    // 4. Hinge barrel at rear edge
    const hingeGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 1.5, 20));
    hingeGeo.rotateZ(Math.PI / 2);
    const hingeMesh = new THREE.Mesh(hingeGeo, darkTrimMat);
    hingeMesh.position.set(0, 0.11, -0.78);
    root.add(hingeMesh);
    registerNamedPart(
      hingeMesh,
      'hinge',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.06, -0.05)
    );

    // 5. Left & Right Ports modules (animatable on "Open ports")
    const portsLeftGroup = new THREE.Group();
    portsLeftGroup.position.set(-1.21, 0.058, -0.15);
    const portBarGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.055, 0.75));
    const leftPortMesh = new THREE.Mesh(portBarGeo, accentMetalMat);
    portsLeftGroup.add(leftPortMesh);
    root.add(portsLeftGroup);
    registerNamedPart(
      portsLeftGroup,
      'ports-left',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.08, 0.03, 0)
    );

    const portsRightGroup = new THREE.Group();
    portsRightGroup.position.set(1.21, 0.058, -0.15);
    const rightPortMesh = new THREE.Mesh(portBarGeo, accentMetalMat);
    portsRightGroup.add(rightPortMesh);
    root.add(portsRightGroup);
    registerNamedPart(
      portsRightGroup,
      'ports-right',
      partAnchors,
      interactables,
      new THREE.Vector3(0.08, 0.03, 0)
    );

    // 6. Lid Pivot at rear hinge (y = 0.11, z = -0.8)
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.11, -0.8);
    root.add(lidPivot);

    // Lid shell (when open, extends upward; we build it in open orientation and rotate around X)
    const lidGeo = trackGeo(new THREE.BoxGeometry(2.4, 1.56, 0.065));
    const lidMesh = new THREE.Mesh(lidGeo, bodyMat);
    lidMesh.position.set(0, 0.78, -0.02);
    lidMesh.castShadow = true;
    lidPivot.add(lidMesh);
    registerNamedPart(
      lidMesh,
      'lid',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.85, 0.65, 0)
    );

    // 7. Screen panel inside lid
    const scrGeo = trackGeo(new THREE.PlaneGeometry(2.22, 1.38));
    const scrMesh = new THREE.Mesh(scrGeo, screenMat);
    scrMesh.position.set(0, 0.79, 0.016);
    lidPivot.add(scrMesh);
    registerNamedPart(
      scrMesh,
      'screen',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.15, 0.04)
    );

    setOpenStates = (lidOpenProgress: number, portsOpenProgress: number) => {
      // lidOpenProgress = 1 => open studio angle (-0.22 rad tilt back)
      // lidOpenProgress = 0 => closed flat onto keyboard (+1.48 rad forward)
      const angle = THREE.MathUtils.lerp(1.48, -0.22, lidOpenProgress);
      lidPivot.rotation.x = angle;

      // portsOpenProgress slides port connector callout bars outward so user sees I/O layout
      const offset = THREE.MathUtils.lerp(0, 0.18, portsOpenProgress);
      portsLeftGroup.position.x = -1.21 - offset;
      portsRightGroup.position.x = 1.21 + offset;
      accentMetalMat.emissiveIntensity = THREE.MathUtils.lerp(0.22, 0.9, portsOpenProgress);
    };
    setOpenStates(1, 0);
  } else if (categoryId === 'desktops') {
    // 1. Tower main body (width 1.05, height 2.15, depth 1.95)
    const towerGeo = trackGeo(new THREE.BoxGeometry(1.05, 2.15, 1.95));
    const towerMesh = new THREE.Mesh(towerGeo, bodyMat);
    towerMesh.position.set(0, 1.075, 0);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    root.add(towerMesh);
    registerNamedPart(
      towerMesh,
      'tower',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 1.0, -0.7)
    );

    // 2. Front ports bezel strip
    const frontPortsGroup = new THREE.Group();
    frontPortsGroup.position.set(0.26, 1.45, 0.99);
    const fpGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.95, 0.08));
    const fpMesh = new THREE.Mesh(fpGeo, accentMetalMat);
    frontPortsGroup.add(fpMesh);
    root.add(frontPortsGroup);
    registerNamedPart(
      frontPortsGroup,
      'front-ports',
      partAnchors,
      interactables,
      new THREE.Vector3(0.1, 0, 0.08)
    );

    // 3. Side panel (opens outward on "Open lid")
    const sidePanelGroup = new THREE.Group();
    sidePanelGroup.position.set(-0.55, 1.08, 0);
    const spGeo = trackGeo(new THREE.BoxGeometry(0.06, 1.92, 1.72));
    const spMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: primaryColor.clone().offsetHSL(0, 0, 0.06),
        roughness: Math.max(0.12, pbr.roughness - 0.25),
        metalness: Math.min(0.95, pbr.metalness + 0.2),
        clearcoat: 0.5,
      })
    );
    const spMesh = new THREE.Mesh(spGeo, spMat);
    sidePanelGroup.add(spMesh);
    root.add(sidePanelGroup);
    registerNamedPart(
      sidePanelGroup,
      'side-panel',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.08, 0.1, 0)
    );

    // 4. Power button & PSU shroud
    const powerGroup = new THREE.Group();
    powerGroup.position.set(-0.22, 1.85, 0.99);
    const pwrGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24));
    pwrGeo.rotateX(Math.PI / 2);
    const pwrMesh = new THREE.Mesh(pwrGeo, darkTrimMat);
    powerGroup.add(pwrMesh);
    root.add(powerGroup);
    registerNamedPart(
      powerGroup,
      'power',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.1, 0.1, 0.08)
    );

    setOpenStates = (lidOpenProgress: number, portsOpenProgress: number) => {
      sidePanelGroup.position.x = -0.55 - THREE.MathUtils.lerp(0, 0.42, lidOpenProgress);
      sidePanelGroup.rotation.z = THREE.MathUtils.lerp(0, 0.16, lidOpenProgress);
      frontPortsGroup.position.z = 0.99 + THREE.MathUtils.lerp(0, 0.2, portsOpenProgress);
      accentMetalMat.emissiveIntensity = THREE.MathUtils.lerp(0.25, 0.9, portsOpenProgress);
    };
    setOpenStates(0, 0);
  } else if (categoryId === 'printers') {
    // 1. Main printer body
    const bodyGeo = trackGeo(new THREE.BoxGeometry(2.1, 1.15, 1.85));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.68, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);
    registerNamedPart(
      bodyMesh,
      'body',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.85, 0.35, 0)
    );

    // 2. Lower slide-out paper-tray
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, 0.22, 0.18);
    const trayGeo = trackGeo(new THREE.BoxGeometry(1.75, 0.26, 1.65));
    const trayMesh = new THREE.Mesh(trayGeo, darkTrimMat);
    trayGroup.add(trayMesh);
    root.add(trayGroup);
    registerNamedPart(
      trayGroup,
      'paper-tray',
      partAnchors,
      interactables,
      new THREE.Vector3(0, -0.05, 0.85)
    );

    // 3. Top output-tray + scanner/access cover (animates on "Open lid")
    const outTrayGroup = new THREE.Group();
    outTrayGroup.position.set(0, 1.28, -0.1);
    const outGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.08, 1.15));
    const outMesh = new THREE.Mesh(outGeo, screenMat);
    outTrayGroup.add(outMesh);
    root.add(outTrayGroup);
    registerNamedPart(
      outTrayGroup,
      'output-tray',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.12, 0.2)
    );

    // 4. Angled control-panel on front-right
    const ctrlGroup = new THREE.Group();
    ctrlGroup.position.set(0.68, 1.18, 0.88);
    ctrlGroup.rotation.x = -0.45;
    const ctrlGeo = trackGeo(new THREE.BoxGeometry(0.55, 0.06, 0.34));
    const ctrlMesh = new THREE.Mesh(ctrlGeo, accentMetalMat);
    ctrlGroup.add(ctrlMesh);
    root.add(ctrlGroup);
    registerNamedPart(
      ctrlGroup,
      'control-panel',
      partAnchors,
      interactables,
      new THREE.Vector3(0.15, 0.1, 0.1)
    );

    // 5. Rear duplex-unit
    const duplexGroup = new THREE.Group();
    duplexGroup.position.set(0, 0.65, -0.96);
    const dupGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.78, 0.18));
    const dupMesh = new THREE.Mesh(dupGeo, darkTrimMat);
    duplexGroup.add(dupMesh);
    root.add(duplexGroup);
    registerNamedPart(
      duplexGroup,
      'duplex-unit',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.1, -0.15)
    );

    setOpenStates = (lidOpenProgress: number, portsOpenProgress: number) => {
      outTrayGroup.rotation.x = THREE.MathUtils.lerp(0, -0.45, lidOpenProgress);
      outTrayGroup.position.y = 1.28 + THREE.MathUtils.lerp(0, 0.18, lidOpenProgress);
      trayGroup.position.z = 0.18 + THREE.MathUtils.lerp(0, 0.55, portsOpenProgress);
      duplexGroup.position.z = -0.96 - THREE.MathUtils.lerp(0, 0.28, portsOpenProgress);
    };
    setOpenStates(0, 0);
  } else {
    // Scanners: body, feeder, glass, control-button
    // 1. Main angled scanner body
    const bodyGeo = trackGeo(new THREE.BoxGeometry(1.85, 0.78, 1.35));
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.42, 0);
    bodyMesh.rotation.x = 0.14;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    root.add(bodyMesh);
    registerNamedPart(
      bodyMesh,
      'body',
      partAnchors,
      interactables,
      new THREE.Vector3(-0.85, 0.15, 0)
    );

    // 2. Auto Document Feeder (ADF) chute at top-rear
    const feederGroup = new THREE.Group();
    feederGroup.position.set(0, 0.85, -0.35);
    feederGroup.rotation.x = -0.48;
    const feederGeo = trackGeo(new THREE.BoxGeometry(1.45, 0.88, 0.08));
    const feederMesh = new THREE.Mesh(feederGeo, darkTrimMat);
    feederMesh.position.set(0, 0.35, 0);
    feederGroup.add(feederMesh);
    root.add(feederGroup);
    registerNamedPart(
      feederMesh,
      'feeder',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.42, 0)
    );

    // 3. Optical CIS scanning glass slot
    const glassGroup = new THREE.Group();
    glassGroup.position.set(0, 0.82, 0.16);
    glassGroup.rotation.x = 0.14;
    const glassGeo = trackGeo(new THREE.BoxGeometry(1.48, 0.05, 0.62));
    const glassMesh = new THREE.Mesh(glassGeo, screenMat);
    glassGroup.add(glassMesh);
    root.add(glassGroup);
    registerNamedPart(
      glassGroup,
      'glass',
      partAnchors,
      interactables,
      new THREE.Vector3(0, 0.08, 0.1)
    );

    // 4. Front control-button cluster
    const btnGroup = new THREE.Group();
    btnGroup.position.set(0.66, 0.68, 0.66);
    const btnGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 24));
    btnGeo.rotateX(Math.PI / 2);
    const btnMesh = new THREE.Mesh(btnGeo, accentMetalMat);
    btnGroup.add(btnMesh);
    root.add(btnGroup);
    registerNamedPart(
      btnGroup,
      'control-button',
      partAnchors,
      interactables,
      new THREE.Vector3(0.14, 0.08, 0.08)
    );

    setOpenStates = (lidOpenProgress: number, portsOpenProgress: number) => {
      feederGroup.rotation.x = THREE.MathUtils.lerp(-0.48, -0.95, lidOpenProgress);
      glassGroup.position.z = 0.16 + THREE.MathUtils.lerp(0, 0.35, portsOpenProgress);
      accentMetalMat.emissiveIntensity = THREE.MathUtils.lerp(0.25, 0.9, portsOpenProgress);
    };
    setOpenStates(0, 0);
  }

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    root,
    partAnchors,
    interactables,
    setOpenStates,
    dispose,
  };
}
