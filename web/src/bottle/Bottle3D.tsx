import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  PerformanceMonitor,
  Lightformer,
  MeshTransmissionMaterial,
  RoundedBox,
} from '@react-three/drei';

/* Une couche du flacon : nom de la note, part en pourcentage, couleur */
export type Layer = { n: string; p: number; c: string };
type Props = {
  layers: Layer[];
  title: string;
  sub: string;
  spinKey: string;
  focus: number | null;
};

const SLOTS = 5;
const INNER_H = 2.63;
const BOTTOM = -INNER_H / 2;
const FILL = 2.34;

function roundedPlane(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2,
    y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return new THREE.ShapeGeometry(s, 16);
}
const GLASS_BG = new THREE.Color('#6A4A66');

function Label({ title, sub }: { title: string; sub: string }) {
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1536;
    c.height = 960;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    return { canvas: c, tex: t };
  }, []);
  useEffect(() => {
    let live = true;
    const paint = () => {
      if (!live) return;
      const g = canvas.getContext('2d')!;
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.fillStyle = '#F2ECF0';
      g.fillRect(0, 0, 768, 480);
      g.strokeStyle = '#22101F';
      g.lineWidth = 2;
      g.strokeRect(20, 20, 728, 440);
      g.fillStyle = '#22101F';
      g.textAlign = 'center';
      g.font = "600 124px 'Bodoni Moda Variable', Didot, serif";
      g.fillText(title, 384, 250);
      g.font = "400 38px 'IBM Plex Mono', monospace";
      g.fillText(sub, 384, 345);
      tex.needsUpdate = true;
    };
    paint();
    document.fonts.ready.then(paint);
    return () => {
      live = false;
    };
  }, [canvas, tex, title, sub]);
  return (
    <mesh position={[0, -0.12, 0.525]}>
      <planeGeometry args={[1.2, 0.75]} />
      <meshStandardMaterial map={tex} roughness={0.7} />
    </mesh>
  );
}

function Bottle({ layers, title, sub, spinKey, focus }: Props) {
  const root = useRef<THREE.Group>(null);
  const spin = useRef({ y: 0 });
  const liquid = useRef<THREE.Mesh>(null);
  const clip = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    [],
  );
  const surfaceGeo = useMemo(() => roundedPlane(1.92, 0.89, 0.15), []);
  useLayoutEffect(() => {
    /* Projection plane : le dégradé suit exactement la hauteur du flacon */
    const g = liquid.current?.geometry;
    if (!g) return;
    const p = g.attributes.position,
      uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++)
      uv.setXY(i, (p.getX(i) + 0.965) / 1.93, (p.getY(i) - BOTTOM) / INNER_H);
    uv.needsUpdate = true;
  }, []);
  const glow = useRef<THREE.PointLight>(null);
  const surface = useRef<THREE.Mesh>(null);
  const grad = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 1024;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    /* Grain très fin : supprime les bandes visibles dans les dégradés */
    const n = document.createElement('canvas');
    n.width = 256;
    n.height = 1024;
    const ng = n.getContext('2d')!;
    const img = ng.createImageData(256, 1024);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 0;
    }
    ng.putImageData(img, 0, 0);
    return { c, t, g: c.getContext('2d')!, n, key: '' };
  }, []);
  const slots = useRef(
    Array.from({ length: SLOTS }, () => ({
      h: 0,
      d: 0,
      color: new THREE.Color('#B9AEBF'),
    })),
  );
  const first = useRef(true);
  const slosh = useRef({ v: 0 });
  const still = useMemo(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    const total = layers.reduce((a, l) => a + l.p, 0) || 1;
    const bottomUp = [...layers].reverse();
    slots.current.forEach((s, i) => {
      const l = bottomUp[i];
      const c = new THREE.Color(l?.c ?? '#B9AEBF');
      gsap.to(s, {
        h: l ? l.p / Math.max(total, 100) : 0,
        duration: 1.2,
        ease: 'power3.inOut',
        overwrite: 'auto',
      });
      gsap.to(s.color, {
        r: c.r,
        g: c.g,
        b: c.b,
        duration: 1.2,
        ease: 'power2.inOut',
        overwrite: 'auto',
      });
    });
    if (!still)
      gsap.fromTo(
        slosh.current,
        { v: 1 },
        { v: 0, duration: 1.8, ease: 'elastic.out(1, 0.35)', overwrite: true },
      );
  }, [layers, still]);

  useEffect(() => {
    const bottomIdx = focus === null ? -1 : layers.length - 1 - focus;
    slots.current.forEach((x, i) =>
      gsap.to(x, {
        d: focus === null || i === bottomIdx ? 0 : 0.62,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      }),
    );
  }, [focus, layers.length]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!still)
      gsap.to(spin.current, {
        y: spin.current.y + Math.PI * 2,
        duration: 1.7,
        ease: 'power4.inOut',
        overwrite: true,
      });
  }, [spinKey, still]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (root.current) {
      const float = still ? 0 : Math.sin(t * 0.7) * 0.05;
      const px = still ? 0 : state.pointer.x * 0.42;
      const py = still ? 0 : -state.pointer.y * 0.16;
      root.current.position.y = float * 0.28 - 0.42;
      root.current.rotation.y = THREE.MathUtils.damp(
        root.current.rotation.y,
        -0.28 + px,
        3.2,
        delta,
      );
      root.current.rotation.x = THREE.MathUtils.damp(
        root.current.rotation.x,
        py,
        3.2,
        delta,
      );
      const inner = root.current.children[0] as THREE.Group;
      inner.rotation.y = spin.current.y;
    }
    const list = slots.current.filter((x) => x.h > 0.003);
    const total = list.reduce((a, x) => a + x.h, 0);
    const m = liquid.current;
    if (m) {
      m.visible = total > 0.003;
      const level = BOTTOM + total * FILL;
      const tilt = slosh.current.v * 0.05;
      clip.normal.set(tilt, -1, 0).normalize();
      clip.constant = level;
      clip.applyMatrix4(m.matrixWorld);
      if (surface.current) {
        surface.current.visible = m.visible;
        surface.current.position.y = level + 0.002;
        surface.current.rotation.y = tilt;
      }
      if (total > 0.003) {
        const k = list
          .map(
            (x) =>
              `${x.h.toFixed(3)}${x.d.toFixed(2)}${x.color.getHexString()}`,
          )
          .join('|');
        if (k !== grad.key) {
          grad.key = k;
          const lg = grad.g.createLinearGradient(
            0,
            1024,
            0,
            1024 * (1 - (total * FILL) / INNER_H),
          );
          let cum = 0;
          const shade = new THREE.Color('#150A14');
          list.forEach((x) => {
            const c2 = x.color.clone().lerp(shade, x.d);
            lg.addColorStop(
              Math.min(1, (cum + x.h / 2) / total),
              `#${c2.getHexString()}`,
            );
            cum += x.h;
          });
          grad.g.globalCompositeOperation = 'source-over';
          grad.g.fillStyle = lg;
          grad.g.fillRect(0, 0, 256, 1024);
          const side = grad.g.createLinearGradient(0, 0, 256, 0);
          side.addColorStop(0, 'rgba(10,4,10,.42)');
          side.addColorStop(0.14, 'rgba(10,4,10,.06)');
          side.addColorStop(0.8, 'rgba(10,4,10,.06)');
          side.addColorStop(1, 'rgba(10,4,10,.5)');
          grad.g.fillStyle = side;
          grad.g.fillRect(0, 0, 256, 1024);
          const depth = grad.g.createLinearGradient(0, 1024, 0, 0);
          depth.addColorStop(0, 'rgba(10,4,10,.42)');
          depth.addColorStop(0.5, 'rgba(10,4,10,0)');
          grad.g.fillStyle = depth;
          grad.g.fillRect(0, 0, 256, 1024);
          grad.g.drawImage(grad.n, 0, 0);
          grad.t.needsUpdate = true;
        }
        if (surface.current) {
          (surface.current.material as THREE.MeshStandardMaterial).color
            .copy(list[list.length - 1].color)
            .lerp(new THREE.Color('#ffffff'), 0.28);
        }
        if (glow.current) {
          const top = list[list.length > 1 ? 1 : 0];
          glow.current.color.copy(top.color);
        }
      }
    }
  });

  return (
    <group ref={root} scale={1.04}>
      <group>
        <RoundedBox
          ref={liquid}
          args={[1.93, INNER_H, 0.9]}
          radius={0.16}
          smoothness={12}
        >
          <meshPhysicalMaterial
            dithering
            map={grad.t}
            side={THREE.DoubleSide}
            clippingPlanes={[clip]}
            roughness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.1}
            sheen={0.4}
            emissiveMap={grad.t}
            emissive="#ffffff"
            emissiveIntensity={0.14}
          />
        </RoundedBox>
        <RoundedBox args={[2.05, 2.75, 1.02]} radius={0.2} smoothness={16}>
          <MeshTransmissionMaterial
            backside
            samples={10}
            resolution={2048}
            backsideResolution={1024}
            transmission={1}
            roughness={0.04}
            thickness={0.2}
            ior={1.22}
            chromaticAberration={0.012}
            anisotropy={0}
            distortion={0}
            distortionScale={0}
            temporalDistortion={0}
            color="#ffffff"
            background={GLASS_BG}
          />
        </RoundedBox>
        <mesh
          ref={surface}
          geometry={surfaceGeo}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial dithering roughness={0.15} metalness={0.1} />
        </mesh>
        <pointLight
          ref={glow}
          position={[0, -2.6, 2.4]}
          intensity={0.35}
          distance={3}
          decay={2}
        />
        <Label title={title} sub={sub} />
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.32, 0.36, 0.34, 128]} />
          <meshStandardMaterial
            color="#C9A66B"
            metalness={1}
            roughness={0.22}
          />
        </mesh>
        <mesh position={[0, 2.08, 0]}>
          <cylinderGeometry args={[0.56, 0.56, 0.82, 128]} />
          <meshStandardMaterial
            color="#17090F"
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 1.66, 0]}>
          <cylinderGeometry args={[0.58, 0.58, 0.05, 128]} />
          <meshStandardMaterial
            color="#C9A66B"
            metalness={1}
            roughness={0.18}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function Bottle3D(props: Props) {
  const [dpr, setDpr] = useState(() => Math.min(devicePixelRatio || 1, 2.5));
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 1.15, 12.6], fov: 27 }}
      onCreated={({ camera, gl }) => {
        camera.lookAt(0, -0.1, 0);
        gl.localClippingEnabled = true;
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
      }}
      style={{ background: 'transparent' }}
      aria-hidden
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(1.25, d - 0.5))}
      />
      <ambientLight intensity={0.16} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <spotLight
        position={[-3.4, 6, 4]}
        angle={0.42}
        penumbra={0.9}
        intensity={70}
        color="#FFF1E0"
      />
      <mesh position={[0, -2.24, 0]}>
        <cylinderGeometry args={[1.82, 1.88, 0.62, 192]} />
        <meshPhysicalMaterial
          color="#332030"
          roughness={0.58}
          metalness={0.05}
        />
      </mesh>
      <mesh position={[0, -1.93, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.8, 0.01, 12, 128]} />
        <meshStandardMaterial color="#C9A66B" metalness={1} roughness={0.25} />
      </mesh>
      <ContactShadows
        position={[0, -1.915, 0]}
        scale={5.2}
        resolution={2048}
        blur={2.4}
        opacity={0.9}
        far={2.6}
        color="#050105"
      />
      <Environment resolution={1024} frames={1}>
        <Lightformer
          form="rect"
          intensity={5}
          position={[0, 4, 3]}
          scale={[8, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={9}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.2, 9, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#E7C9FF"
          position={[5, 0, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[1.2, 7, 1]}
        />
      </Environment>
      <Bottle {...props} />
    </Canvas>
  );
}
