import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface EarthGlobe3DProps {
  className?: string;
}

// Convert lat/lon in degrees to Vector3 on sphere with radius R
function latLonToVec3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Simplified continent outlines (lat, lon pairs)
const CONTINENT_OUTLINES: Array<Array<[number, number]>> = [
  // South America
  [
    [12, -72], [10, -75], [8, -77], [2, -79], [-4, -81], [-14, -76], [-23, -70], [-38, -73],
    [-54, -68], [-55, -66], [-48, -66], [-38, -58], [-34, -53], [-24, -46], [-13, -38], [-5, -35],
    [-2, -44], [3, -51], [6, -58], [10, -62], [11, -71], [12, -72]
  ],
  // North America
  [
    [15, -92], [20, -105], [28, -112], [34, -120], [48, -125], [60, -140], [65, -168], [71, -156],
    [70, -128], [60, -94], [52, -80], [58, -64], [48, -53], [42, -70], [30, -81], [25, -80],
    [22, -97], [18, -96], [15, -92]
  ],
  // Europe
  [
    [36, -5], [37, -9], [43, -9], [44, -1], [48, -4], [54, 8], [58, 6], [62, 5], [71, 28],
    [66, 40], [55, 38], [46, 30], [42, 28], [37, 24], [36, 14], [38, 0], [36, -5]
  ],
  // Africa
  [
    [37, 10], [32, 32], [22, 37], [12, 44], [-1, 41], [-11, 40], [-26, 33], [-34, 18],
    [-33, 26], [-20, 12], [-5, 11], [4, 7], [5, -4], [6, -11], [14, -17], [21, -17],
    [33, -9], [36, -1], [37, 10]
  ],
  // Asia
  [
    [70, 70], [72, 130], [64, 170], [52, 142], [44, 145], [35, 129], [22, 114], [10, 107],
    [1, 104], [8, 77], [20, 73], [24, 57], [13, 48], [30, 35], [40, 38], [42, 50],
    [54, 58], [60, 60], [70, 70]
  ],
  // Australia
  [
    [-12, 136], [-15, 124], [-22, 114], [-32, 115], [-35, 118], [-35, 150], [-28, 153],
    [-19, 146], [-12, 142], [-12, 136]
  ],
  // Antarctica loop
  [
    [-70, -160], [-68, -120], [-65, -60], [-64, -20], [-68, 40], [-66, 90], [-67, 140],
    [-70, 180], [-70, -160]
  ]
];

// Rich worldwide survey PIN locations across all continents
interface PinLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tier: 'primary' | 'secondary' | 'sensor';
  responses?: number;
}

const WORLDWIDE_SURVEY_PINS: PinLocation[] = [
  // SOUTH AMERICA & CARIBBEAN
  { id: 'bogota-kennedy', name: 'Kennedy (Bogotá)', lat: 4.62, lon: -74.15, tier: 'primary', responses: 420 },
  { id: 'bogota-chapinero', name: 'Chapinero (Bogotá)', lat: 4.65, lon: -74.06, tier: 'secondary', responses: 124 },
  { id: 'bogota-suba', name: 'Suba (Bogotá)', lat: 4.74, lon: -74.08, tier: 'secondary', responses: 88 },
  { id: 'medellin', name: 'Medellín', lat: 6.25, lon: -75.56, tier: 'primary', responses: 210 },
  { id: 'cali', name: 'Cali', lat: 3.45, lon: -76.53, tier: 'secondary', responses: 145 },
  { id: 'barranquilla', name: 'Barranquilla', lat: 10.96, lon: -74.80, tier: 'sensor', responses: 67 },
  { id: 'cartagena', name: 'Cartagena', lat: 10.39, lon: -75.48, tier: 'sensor', responses: 54 },
  { id: 'bucaramanga', name: 'Bucaramanga', lat: 7.12, lon: -73.12, tier: 'sensor', responses: 43 },
  { id: 'lima', name: 'Lima', lat: -12.04, lon: -77.04, tier: 'primary', responses: 310 },
  { id: 'cusco', name: 'Cusco', lat: -13.53, lon: -71.96, tier: 'sensor', responses: 35 },
  { id: 'quito', name: 'Quito', lat: -0.18, lon: -78.46, tier: 'secondary', responses: 98 },
  { id: 'guayaquil', name: 'Guayaquil', lat: -2.18, lon: -79.92, tier: 'sensor', responses: 62 },
  { id: 'santiago', name: 'Santiago de Chile', lat: -33.44, lon: -70.66, tier: 'primary', responses: 240 },
  { id: 'buenosaires', name: 'Buenos Aires', lat: -34.60, lon: -58.38, tier: 'primary', responses: 380 },
  { id: 'cordoba', name: 'Córdoba', lat: -31.42, lon: -64.18, tier: 'sensor', responses: 56 },
  { id: 'saopaulo', name: 'São Paulo', lat: -23.55, lon: -46.63, tier: 'primary', responses: 490 },
  { id: 'riodejaneiro', name: 'Rio de Janeiro', lat: -22.90, lon: -43.17, tier: 'secondary', responses: 175 },
  { id: 'brasilia', name: 'Brasília', lat: -15.79, lon: -47.88, tier: 'sensor', responses: 82 },
  { id: 'montevideo', name: 'Montevideo', lat: -34.90, lon: -56.16, tier: 'secondary', responses: 70 },
  { id: 'asuncion', name: 'Asunción', lat: -25.26, lon: -57.57, tier: 'sensor', responses: 48 },
  { id: 'lapaz', name: 'La Paz', lat: -16.50, lon: -68.15, tier: 'sensor', responses: 52 },
  { id: 'caracas', name: 'Caracas', lat: 10.48, lon: -66.90, tier: 'secondary', responses: 89 },
  { id: 'sanjuan', name: 'San Juan', lat: 18.46, lon: -66.10, tier: 'sensor', responses: 40 },
  { id: 'santodomingo', name: 'Santo Domingo', lat: 18.48, lon: -69.93, tier: 'sensor', responses: 58 },

  // NORTH AMERICA & CENTRAL AMERICA
  { id: 'mexico-cdmx', name: 'Ciudad de México', lat: 19.43, lon: -99.13, tier: 'primary', responses: 440 },
  { id: 'guadalajara', name: 'Guadalajara', lat: 20.65, lon: -103.34, tier: 'secondary', responses: 115 },
  { id: 'monterrey', name: 'Monterrey', lat: 25.68, lon: -100.31, tier: 'secondary', responses: 95 },
  { id: 'panama', name: 'Ciudad de Panamá', lat: 8.98, lon: -79.51, tier: 'secondary', responses: 86 },
  { id: 'sanjose', name: 'San José', lat: 9.92, lon: -84.09, tier: 'sensor', responses: 45 },
  { id: 'newyork', name: 'New York', lat: 40.71, lon: -74.00, tier: 'primary', responses: 520 },
  { id: 'losangeles', name: 'Los Angeles', lat: 34.05, lon: -118.24, tier: 'primary', responses: 390 },
  { id: 'chicago', name: 'Chicago', lat: 41.87, lon: -87.62, tier: 'secondary', responses: 180 },
  { id: 'miami', name: 'Miami', lat: 25.76, lon: -80.19, tier: 'primary', responses: 220 },
  { id: 'sanfrancisco', name: 'San Francisco', lat: 37.77, lon: -122.41, tier: 'secondary', responses: 195 },
  { id: 'houston', name: 'Houston', lat: 29.76, lon: -95.36, tier: 'sensor', responses: 90 },
  { id: 'seattle', name: 'Seattle', lat: 47.60, lon: -122.33, tier: 'sensor', responses: 85 },
  { id: 'toronto', name: 'Toronto', lat: 43.65, lon: -79.38, tier: 'primary', responses: 230 },
  { id: 'vancouver', name: 'Vancouver', lat: 49.28, lon: -123.12, tier: 'secondary', responses: 110 },
  { id: 'montreal', name: 'Montreal', lat: 45.50, lon: -73.56, tier: 'sensor', responses: 75 },

  // EUROPE
  { id: 'madrid', name: 'Madrid', lat: 40.41, lon: -3.70, tier: 'primary', responses: 310 },
  { id: 'barcelona', name: 'Barcelona', lat: 41.38, lon: 2.17, tier: 'secondary', responses: 160 },
  { id: 'valencia', name: 'Valencia', lat: 39.46, lon: -0.37, tier: 'sensor', responses: 55 },
  { id: 'sevilla', name: 'Sevilla', lat: 37.38, lon: -5.98, tier: 'sensor', responses: 48 },
  { id: 'paris', name: 'Paris', lat: 48.85, lon: 2.35, tier: 'primary', responses: 360 },
  { id: 'london', name: 'London', lat: 51.50, lon: -0.12, tier: 'primary', responses: 410 },
  { id: 'berlin', name: 'Berlin', lat: 52.52, lon: 13.40, tier: 'secondary', responses: 190 },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.11, lon: 8.68, tier: 'sensor', responses: 75 },
  { id: 'rome', name: 'Roma', lat: 41.90, lon: 12.49, tier: 'secondary', responses: 170 },
  { id: 'milan', name: 'Milano', lat: 45.46, lon: 9.19, tier: 'sensor', responses: 88 },
  { id: 'amsterdam', name: 'Amsterdam', lat: 52.36, lon: 4.90, tier: 'secondary', responses: 140 },
  { id: 'brussels', name: 'Bruselas', lat: 50.85, lon: 4.35, tier: 'sensor', responses: 65 },
  { id: 'zurich', name: 'Zúrich', lat: 47.37, lon: 8.54, tier: 'sensor', responses: 70 },
  { id: 'vienna', name: 'Viena', lat: 48.20, lon: 16.37, tier: 'sensor', responses: 80 },
  { id: 'lisbon', name: 'Lisboa', lat: 38.72, lon: -9.13, tier: 'secondary', responses: 110 },
  { id: 'stockholm', name: 'Estocolmo', lat: 59.32, lon: 18.06, tier: 'sensor', responses: 65 },
  { id: 'oslo', name: 'Oslo', lat: 59.91, lon: 10.75, tier: 'sensor', responses: 50 },
  { id: 'warsaw', name: 'Varsovia', lat: 52.22, lon: 21.01, tier: 'sensor', responses: 72 },
  { id: 'athens', name: 'Atenas', lat: 37.98, lon: 23.72, tier: 'sensor', responses: 58 },

  // ASIA & MIDDLE EAST
  { id: 'tokyo', name: 'Tokyo', lat: 35.67, lon: 139.65, tier: 'primary', responses: 480 },
  { id: 'osaka', name: 'Osaka', lat: 34.69, lon: 135.50, tier: 'sensor', responses: 95 },
  { id: 'seoul', name: 'Seúl', lat: 37.56, lon: 126.97, tier: 'primary', responses: 320 },
  { id: 'beijing', name: 'Beijing', lat: 39.90, lon: 116.40, tier: 'primary', responses: 370 },
  { id: 'shanghai', name: 'Shanghai', lat: 31.23, lon: 121.47, tier: 'primary', responses: 420 },
  { id: 'hongkong', name: 'Hong Kong', lat: 22.31, lon: 114.16, tier: 'secondary', responses: 160 },
  { id: 'singapore', name: 'Singapur', lat: 1.35, lon: 103.81, tier: 'primary', responses: 210 },
  { id: 'bangkok', name: 'Bangkok', lat: 13.75, lon: 100.50, tier: 'secondary', responses: 135 },
  { id: 'jakarta', name: 'Jakarta', lat: -6.20, lon: 106.84, tier: 'secondary', responses: 150 },
  { id: 'manila', name: 'Manila', lat: 14.59, lon: 120.98, tier: 'sensor', responses: 75 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.07, lon: 72.87, tier: 'primary', responses: 310 },
  { id: 'delhi', name: 'Nueva Delhi', lat: 28.61, lon: 77.20, tier: 'secondary', responses: 220 },
  { id: 'bangalore', name: 'Bangalore', lat: 12.97, lon: 77.59, tier: 'sensor', responses: 98 },
  { id: 'dubai', name: 'Dubái', lat: 25.20, lon: 55.27, tier: 'primary', responses: 240 },
  { id: 'doha', name: 'Doha', lat: 25.28, lon: 51.53, tier: 'sensor', responses: 60 },
  { id: 'istanbul', name: 'Estambul', lat: 41.00, lon: 28.97, tier: 'secondary', responses: 180 },
  { id: 'riyadh', name: 'Riad', lat: 24.71, lon: 46.67, tier: 'sensor', responses: 85 },
  { id: 'telaviv', name: 'Tel Aviv', lat: 32.08, lon: 34.78, tier: 'sensor', responses: 92 },

  // AFRICA
  { id: 'cairo', name: 'El Cairo', lat: 30.04, lon: 31.23, tier: 'primary', responses: 250 },
  { id: 'casablanca', name: 'Casablanca', lat: 33.57, lon: -7.58, tier: 'secondary', responses: 120 },
  { id: 'lagos', name: 'Lagos', lat: 6.52, lon: 3.37, tier: 'primary', responses: 210 },
  { id: 'nairobi', name: 'Nairobi', lat: -1.29, lon: 36.82, tier: 'secondary', responses: 130 },
  { id: 'johannesburg', name: 'Johannesburgo', lat: -26.20, lon: 28.04, tier: 'primary', responses: 230 },
  { id: 'capetown', name: 'Ciudad del Cabo', lat: -33.92, lon: 18.42, tier: 'secondary', responses: 115 },
  { id: 'dakar', name: 'Dakar', lat: 14.71, lon: -17.46, tier: 'sensor', responses: 50 },
  { id: 'addis', name: 'Adís Abeba', lat: 9.03, lon: 38.74, tier: 'sensor', responses: 60 },

  // OCEANIA
  { id: 'sydney', name: 'Sídney', lat: -33.86, lon: 151.20, tier: 'primary', responses: 280 },
  { id: 'melbourne', name: 'Melbourne', lat: -37.81, lon: 144.96, tier: 'secondary', responses: 140 },
  { id: 'brisbane', name: 'Brisbane', lat: -27.46, lon: 153.02, tier: 'sensor', responses: 65 },
  { id: 'auckland', name: 'Auckland', lat: -36.84, lon: 174.76, tier: 'secondary', responses: 90 },
];

// Telemetry connection flight arcs between global survey hub pairs
const NETWORK_LINKS: Array<[string, string]> = [
  ['bogota-kennedy', 'mexico-cdmx'],
  ['bogota-kennedy', 'madrid'],
  ['bogota-kennedy', 'lima'],
  ['bogota-kennedy', 'buenosaires'],
  ['bogota-kennedy', 'miami'],
  ['newyork', 'london'],
  ['london', 'paris'],
  ['paris', 'madrid'],
  ['london', 'tokyo'],
  ['tokyo', 'singapore'],
  ['singapore', 'sydney'],
  ['cairo', 'dubai'],
  ['dubai', 'mumbai'],
  ['saopaulo', 'johannesburg'],
];

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // Responsive Camera Distance helper
    const getResponsiveCameraZ = (w: number, h: number) => {
      const aspect = w / (h || 1);
      if (w < 440) return 4.95;
      if (w < 640) return 4.65;
      if (aspect < 0.95) return 4.75;
      if (w < 1024) return 4.35;
      return 4.15;
    };

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, getResponsiveCameraZ(width, height));

    // 2. WebGL Renderer with High Dynamic Contrast
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Clear background to full transparent so it blends with dark UI
    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    // 3. Root Globe Group tilted 23.44° (Earth's real axial tilt)
    const earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = 23.44 * (Math.PI / 180);
    scene.add(earthTiltGroup);

    // Rotating globe inner group
    const globeSpinGroup = new THREE.Group();
    earthTiltGroup.add(globeSpinGroup);

    // Balanced globe radius for responsive viewports
    const GLOBE_RADIUS = 1.38;

    // 4. Central Dark Absorbing Sphere
    const baseSphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.992, 40, 40);
    const baseSphereMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.94,
    });
    const baseSphere = new THREE.Mesh(baseSphereGeo, baseSphereMat);
    globeSpinGroup.add(baseSphere);

    // 5. White Geodesic Triangulation Wireframe (Subtle & Crisp)
    const wireGeo = new THREE.IcosahedronGeometry(GLOBE_RADIUS, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeSpinGroup.add(wireMesh);

    // 6. Latitude Parallels
    const latitudeAngles = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
    latitudeAngles.forEach((latDeg) => {
      const isEquator = latDeg === 0;
      const phi = (90 - latDeg) * (Math.PI / 180);
      const ringRadius = GLOBE_RADIUS * Math.sin(phi);
      const y = GLOBE_RADIUS * Math.cos(phi);

      const segments = 64;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(ringRadius * Math.cos(theta), y, ringRadius * Math.sin(theta)));
      }

      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: isEquator ? 0.65 : 0.20,
      });
      const lineLoop = new THREE.LineLoop(lineGeo, lineMat);
      globeSpinGroup.add(lineLoop);
    });

    // 7. Longitude Meridians (24 lines)
    const meridianCount = 24;
    for (let m = 0; m < meridianCount; m++) {
      const lonAngle = (m / meridianCount) * Math.PI * 2;
      const segments = 64;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const phi = (i / segments) * Math.PI;
        const x = GLOBE_RADIUS * Math.sin(phi) * Math.cos(lonAngle);
        const y = GLOBE_RADIUS * Math.cos(phi);
        const z = GLOBE_RADIUS * Math.sin(phi) * Math.sin(lonAngle);
        points.push(new THREE.Vector3(x, y, z));
      }
      const mGeo = new THREE.BufferGeometry().setFromPoints(points);
      const mMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: m % 6 === 0 ? 0.35 : 0.15,
      });
      const meridian = new THREE.Line(mGeo, mMat);
      globeSpinGroup.add(meridian);
    }

    // 8. Continent Outlines in Bright Crisp White
    CONTINENT_OUTLINES.forEach((polygon) => {
      const points: THREE.Vector3[] = [];
      polygon.forEach(([lat, lon]) => {
        points.push(latLonToVec3(lat, lon, GLOBE_RADIUS * 1.003));
      });
      const polyGeo = new THREE.BufferGeometry().setFromPoints(points);
      const polyMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.88,
      });
      const outline = new THREE.LineLoop(polyGeo, polyMat);
      globeSpinGroup.add(outline);
    });

    // 9. Procedural Landmass Dot Matrix
    const landDotsPoints: THREE.Vector3[] = [];
    const landDotsColors: number[] = [];
    CONTINENT_OUTLINES.forEach((polygon) => {
      let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
      polygon.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });

      const step = 4.2;
      for (let lat = minLat; lat <= maxLat; lat += step) {
        for (let lon = minLon; lon <= maxLon; lon += step) {
          const jitterLat = lat + (Math.sin(lat * 12 + lon) * 0.4);
          const jitterLon = lon + (Math.cos(lon * 12 + lat) * 0.4);
          landDotsPoints.push(latLonToVec3(jitterLat, jitterLon, GLOBE_RADIUS * 1.002));
          const brightness = 0.4 + (Math.sin(lat * 0.1) * 0.3);
          landDotsColors.push(brightness, brightness, brightness);
        }
      }
    });

    const landDotsGeo = new THREE.BufferGeometry().setFromPoints(landDotsPoints);
    landDotsGeo.setAttribute('color', new THREE.Float32BufferAttribute(landDotsColors, 3));
    const landDotsMat = new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });
    const landDotsMesh = new THREE.Points(landDotsGeo, landDotsMat);
    globeSpinGroup.add(landDotsMesh);

    // 10. Glowing Atmospheric Halo
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float intensity = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.2);
        gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * 0.85);
      }
    `;

    const atmosphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.13, 48, 48);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthTiltGroup.add(atmosphereMesh);

    // Inner rim glow on the globe surface
    const innerGlowGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 36, 36);
    const innerGlowMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.8);
          gl_FragColor = vec4(1.0, 1.0, 1.0, rim * 0.45);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    earthTiltGroup.add(innerGlowMesh);

    // 11. Symmetrical Concentric Orbital Telemetry Rings (Aligned with Planet's Equatorial Plane)
    const ringsGroup = new THREE.Group();
    earthTiltGroup.add(ringsGroup);

    // Inner Primary Ring (Clean Solid Circle)
    const innerRadius = GLOBE_RADIUS * 1.25;
    const innerRingGeo = new THREE.BufferGeometry();
    const innerRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      innerRingPoints.push(new THREE.Vector3(innerRadius * Math.cos(theta), 0, innerRadius * Math.sin(theta)));
    }
    innerRingGeo.setFromPoints(innerRingPoints);
    const innerRingMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.38,
    });
    const innerRing = new THREE.LineLoop(innerRingGeo, innerRingMat);
    ringsGroup.add(innerRing);

    // Middle Telemetry Dashed Ring (Concentric)
    const orbitRadius = GLOBE_RADIUS * 1.40;
    const midRingGeo = new THREE.BufferGeometry();
    const midRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      midRingPoints.push(new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta)));
    }
    midRingGeo.setFromPoints(midRingPoints);
    const midRingMat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 0.12,
      gapSize: 0.06,
      transparent: true,
      opacity: 0.28,
    });
    const midRing = new THREE.LineLoop(midRingGeo, midRingMat);
    midRing.computeLineDistances();
    ringsGroup.add(midRing);

    // Outer Boundary Ring (Concentric)
    const outerRadius = GLOBE_RADIUS * 1.55;
    const outerRingGeo = new THREE.BufferGeometry();
    const outerRingPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      outerRingPoints.push(new THREE.Vector3(outerRadius * Math.cos(theta), 0, outerRadius * Math.sin(theta)));
    }
    outerRingGeo.setFromPoints(outerRingPoints);
    const outerRingMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
    });
    const outerRing = new THREE.LineLoop(outerRingGeo, outerRingMat);
    ringsGroup.add(outerRing);

    // Symmetrical Radial Telemetry Ticks (16 equidistant markers between inner & mid rings)
    const ticksGeo = new THREE.BufferGeometry();
    const tickPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 16; i++) {
      const theta = (i / 16) * Math.PI * 2;
      tickPoints.push(
        new THREE.Vector3(innerRadius * Math.cos(theta), 0, innerRadius * Math.sin(theta)),
        new THREE.Vector3(orbitRadius * Math.cos(theta), 0, orbitRadius * Math.sin(theta))
      );
    }
    ticksGeo.setFromPoints(tickPoints);
    const ticksMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
    });
    const ticksLine = new THREE.LineSegments(ticksGeo, ticksMat);
    ringsGroup.add(ticksLine);

    // Orbiting Satellite Beacon Point on the concentric orbital plane
    const satGeo = new THREE.SphereGeometry(0.024, 12, 12);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const satMesh = new THREE.Mesh(satGeo, satMat);
    ringsGroup.add(satMesh);

    // 12. Worldwide 3D Survey PINs
    const pinGroups: Array<{ group: THREE.Group; beaconRing: THREE.Mesh; id: string; name: string }> = [];
    const pinLookup = new Map<string, THREE.Vector3>();

    WORLDWIDE_SURVEY_PINS.forEach((pinData) => {
      const pinGroup = new THREE.Group();
      const pos = latLonToVec3(pinData.lat, pinData.lon, GLOBE_RADIUS);
      pinGroup.position.copy(pos);
      pinLookup.set(pinData.id, pos);

      // Orient pin normal to surface
      const normal = pos.clone().normalize();
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      const isPrimary = pinData.tier === 'primary';
      const isSecondary = pinData.tier === 'secondary';

      if (isPrimary || isSecondary) {
        // Needle stem
        const stemHeight = isPrimary ? 0.12 : 0.07;
        const stemGeo = new THREE.CylinderGeometry(0.005, 0.002, stemHeight, 6);
        stemGeo.translate(0, stemHeight / 2, 0);
        const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        pinGroup.add(stem);

        // Pin Head (Octahedron Diamond)
        const headRadius = isPrimary ? 0.034 : 0.020;
        const headGeo = new THREE.OctahedronGeometry(headRadius, 0);
        headGeo.translate(0, stemHeight + headRadius, 0);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        pinGroup.add(head);

        // Pulsating Beacon Ring
        const ringRadius = isPrimary ? 0.038 : 0.024;
        const ringBaseGeo = new THREE.RingGeometry(ringRadius * 0.5, ringRadius, 20);
        ringBaseGeo.rotateX(-Math.PI / 2);
        const ringBaseMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isPrimary ? 0.85 : 0.5,
          blending: THREE.AdditiveBlending,
        });
        const beaconRing = new THREE.Mesh(ringBaseGeo, ringBaseMat);
        pinGroup.add(beaconRing);

        globeSpinGroup.add(pinGroup);
        pinGroups.push({ group: pinGroup, beaconRing, id: pinData.id, name: pinData.name });
      } else {
        // Sensor Pin (Compact luminous dot + micro ring)
        const dotGeo = new THREE.SphereGeometry(0.012, 8, 8);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        pinGroup.add(dotMesh);

        const ringBaseGeo = new THREE.RingGeometry(0.014, 0.024, 16);
        ringBaseGeo.rotateX(-Math.PI / 2);
        const ringBaseMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
        });
        const beaconRing = new THREE.Mesh(ringBaseGeo, ringBaseMat);
        pinGroup.add(beaconRing);

        globeSpinGroup.add(pinGroup);
        pinGroups.push({ group: pinGroup, beaconRing, id: pinData.id, name: pinData.name });
      }
    });

    // 13. Telemetry Flight / Network Arcs between Key Global Hubs
    NETWORK_LINKS.forEach(([startId, endId]) => {
      const startPos = pinLookup.get(startId);
      const endPos = pinLookup.get(endId);
      if (!startPos || !endPos) return;

      // Calculate midpoint elevated above globe surface for high arc
      const mid = startPos.clone().add(endPos).multiplyScalar(0.5);
      const distance = startPos.distanceTo(endPos);
      const elevation = GLOBE_RADIUS + Math.min(0.45, distance * 0.28);
      mid.normalize().multiplyScalar(elevation);

      // Quadratic bezier curve
      const curve = new THREE.QuadraticBezierCurve3(startPos, mid, endPos);
      const curvePoints = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeSpinGroup.add(arcLine);
    });

    // Initial rotation facing the Americas & transatlantic surveys
    globeSpinGroup.rotation.y = 1.35;

    // 14. Interactive Dragging Controls (smooth damping)
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      dragVelocityX = 0;
      dragVelocityY = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;

      globeSpinGroup.rotation.y += deltaX * 0.008;
      earthTiltGroup.rotation.x = Math.max(-0.5, Math.min(0.5, earthTiltGroup.rotation.x + deltaY * 0.005));

      dragVelocityX = deltaX * 0.008;
      dragVelocityY = deltaY * 0.005;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 15. Smooth Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();
    let satAngle = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous gentle rotation when not dragging
      if (!isDragging) {
        globeSpinGroup.rotation.y += delta * 0.20;
      }

      // Momentum damping after manual drag
      if (!isDragging) {
        if (Math.abs(dragVelocityX) > 0.0001) {
          globeSpinGroup.rotation.y += dragVelocityX;
          dragVelocityX *= 0.94;
        }
        if (Math.abs(dragVelocityY) > 0.0001) {
          earthTiltGroup.rotation.x += dragVelocityY;
          earthTiltGroup.rotation.x = Math.max(-0.5, Math.min(0.5, earthTiltGroup.rotation.x));
          dragVelocityY *= 0.94;
        }
      }

      // Move Orbiting Satellite along concentric orbital ring
      satAngle += delta * 0.45;
      satMesh.position.set(
        orbitRadius * Math.cos(satAngle),
        0,
        orbitRadius * Math.sin(satAngle)
      );

      // Rotate concentric telemetry ring smoothly around planet's polar axis (Zero asymmetry)
      ringsGroup.rotation.y += delta * 0.05;

      // Pulsate PIN beacon rings in wave rhythm
      pinGroups.forEach((pin, idx) => {
        const pulse = (Math.sin(elapsed * 3.5 + idx * 0.35) + 1) * 0.5;
        const scale = 1 + pulse * 0.55;
        pin.beaconRing.scale.set(scale, scale, scale);
        const mat = pin.beaconRing.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 + (1 - pulse) * 0.60;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler with responsive camera positioning
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 360;
      camera.aspect = newW / newH;
      camera.position.z = getResponsiveCameraZ(newW, newH);
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      baseSphereGeo.dispose();
      baseSphereMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      landDotsGeo.dispose();
      landDotsMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      innerGlowGeo.dispose();
      innerGlowMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      midRingGeo.dispose();
      midRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      ticksGeo.dispose();
      ticksMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-[340px] xs:h-[380px] sm:h-[460px] md:h-[500px] lg:h-[560px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none bg-transparent overflow-visible ${className}`}>
      <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
    </div>
  );
};
