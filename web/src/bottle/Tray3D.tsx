/* Le plateau de fioles en 3D : une fiole par note proposée.
   Celle qu'on est en train de sentir se soulève ; celles qu'on écarte s'estompent. */
import { Canvas } from '@react-three/fiber';

export type Vial = {
  label: string;
  color: string;
  state: 'current' | 'kept' | 'left' | 'waiting';
};

const GAP = 0.82;

function VialMesh({ vial, x }: { vial: Vial; x: number }) {
  const lifted = vial.state === 'current' ? 0.35 : 0;
  const faded = vial.state === 'left';
  return (
    <group
      position={[x, lifted, 0]}
      scale={vial.state === 'current' ? 1.12 : 1}
    >
      {/* Le verre */}
      <mesh>
        <cylinderGeometry args={[0.24, 0.24, 1.3, 48]} />
        <meshPhysicalMaterial
          color="#F4EEF2"
          transparent
          opacity={faded ? 0.12 : 0.28}
          roughness={0.08}
        />
      </mesh>
      {/* La matière : aux deux tiers pour une fiole gardée ou en cours, un fond pour les autres */}
      <mesh position={[0, faded ? -0.5 : -0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, faded ? 0.2 : 0.8, 48]} />
        <meshStandardMaterial
          color={vial.color}
          transparent
          opacity={faded ? 0.35 : 0.95}
          roughness={0.35}
        />
      </mesh>
      {/* Le bouchon */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.26, 32]} />
        <meshStandardMaterial color="#17090F" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function Tray3D({ vials }: { vials: Vial[] }) {
  const width = (vials.length - 1) * GAP;
  return (
    <Canvas
      camera={{ position: [0, 1.5, 6.4], fov: 34 }}
      dpr={[1, 2]}
      aria-label="Votre plateau de fioles"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-4, 2, 2]} intensity={0.7} />
      {vials.map((vial, index) => (
        <VialMesh key={vial.label} vial={vial} x={index * GAP - width / 2} />
      ))}
      {/* Le plateau */}
      <mesh position={[0, -0.76, 0]}>
        <boxGeometry args={[width + 1.2, 0.14, 1.3]} />
        <meshStandardMaterial color="#3A2A36" roughness={0.6} />
      </mesh>
    </Canvas>
  );
}
