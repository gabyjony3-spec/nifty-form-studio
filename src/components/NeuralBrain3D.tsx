import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Ring, Text } from '@react-three/drei';
import * as THREE from 'three';

// Floating Social Icon Component
const SocialIcon = ({ position, icon, color, orbitRadius, speed, offset }: {
  position: [number, number, number];
  icon: string;
  color: string;
  orbitRadius: number;
  speed: number;
  offset: number;
}) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const angle = state.clock.elapsedTime * speed + offset;
      meshRef.current.position.x = Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      meshRef.current.rotation.y = -angle;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        {/* Icon background */}
        <mesh>
          <boxGeometry args={[0.4, 0.4, 0.08]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.9}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Glow */}
        <pointLight color={color} intensity={0.5} distance={2} />
      </Float>
    </group>
  );
};

// Orbital Ring Component
const OrbitRing = ({ radius, rotation, color, opacity = 0.3 }: {
  radius: number;
  rotation: [number, number, number];
  color: string;
  opacity?: number;
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.001;
    }
  });

  return (
    <mesh ref={ringRef} rotation={rotation}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Central Neural Network
const NeuralCore = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Create organic distorted sphere for brain-like appearance
  const brainGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.8, 5);
    const positions = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      const noise = Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4) * 0.1;
      const folds = Math.sin(x * 6 + y * 5) * 0.06;
      
      positions[i] += (noise + folds) * x * 0.4;
      positions[i + 1] += (noise + folds) * y * 0.4;
      positions[i + 2] += (noise + folds) * z * 0.4;
    }
    
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Particle system around core
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.2 + Math.random() * 0.6;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      const material = coreRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group>
      {/* Main glowing brain core */}
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={coreRef} geometry={brainGeometry}>
          <meshStandardMaterial
            color="#00d2ff"
            emissive="#00d2ff"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.8}
            transparent
            opacity={0.95}
          />
        </mesh>
        
        {/* Inner glow layer */}
        <mesh geometry={brainGeometry} scale={1.08}>
          <meshStandardMaterial
            color="#00a8cc"
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
        
        {/* Bright inner core */}
        <Sphere args={[0.35, 32, 32]}>
          <meshStandardMaterial
            color="#ffffff"
            emissive="#00d2ff"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#00d2ff"
          size={0.03}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
};

// Dashboard Preview (floating panel)
const DashboardPreview = () => {
  const panelRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (panelRef.current) {
      panelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
      panelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={panelRef} position={[0, -0.5, 2]}>
      {/* Main panel */}
      <mesh>
        <planeGeometry args={[2.4, 1.4]} />
        <meshStandardMaterial
          color="#0a1628"
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Panel border glow */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshBasicMaterial
          color="#00d2ff"
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Fake chart bars */}
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
        <mesh key={i} position={[x, -0.1 + (i % 3) * 0.1, 0.02]}>
          <boxGeometry args={[0.2, 0.3 + (i % 3) * 0.2, 0.02]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#00d2ff" : "#0088aa"}
            emissive={i % 2 === 0 ? "#00d2ff" : "#0088aa"}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      
      {/* Score circle */}
      <mesh position={[0, 0.35, 0.02]}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial color="#00d2ff" />
      </mesh>
    </group>
  );
};

// Connection lines from core to orbits
const ConnectionLines = () => {
  const linesRef = useRef<THREE.Group>(null);
  
  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    
    for (let i = 0; i < 16; i++) {
      const theta = (i / 16) * Math.PI * 2;
      const startRadius = 0.8;
      const endRadius = 2.2 + Math.random() * 0.5;
      
      result.push({
        start: new THREE.Vector3(
          Math.cos(theta) * startRadius,
          (Math.random() - 0.5) * 0.4,
          Math.sin(theta) * startRadius
        ),
        end: new THREE.Vector3(
          Math.cos(theta) * endRadius,
          (Math.random() - 0.5) * 1,
          Math.sin(theta) * endRadius
        )
      });
    }
    return result;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                line.start.x, line.start.y, line.start.z,
                line.end.x, line.end.y, line.end.z
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#00d2ff"
            transparent
            opacity={0.25 + Math.random() * 0.15}
          />
        </line>
      ))}
    </group>
  );
};

// Main Scene
const Scene = () => {
  const sceneRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (sceneRef.current) {
      sceneRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  // Social media icons configuration
  const socialIcons = [
    { icon: 'TT', color: '#000000', orbitRadius: 2.2, speed: 0.4, offset: 0, y: 0.3 },
    { icon: 'YT', color: '#ff0000', orbitRadius: 2.2, speed: 0.4, offset: Math.PI * 0.5, y: -0.2 },
    { icon: 'IG', color: '#e1306c', orbitRadius: 2.5, speed: 0.3, offset: Math.PI, y: 0.1 },
    { icon: 'FB', color: '#1877f2', orbitRadius: 2.5, speed: 0.3, offset: Math.PI * 1.5, y: -0.3 },
    { icon: 'LI', color: '#0077b5', orbitRadius: 2.8, speed: 0.25, offset: Math.PI * 0.25, y: 0.5 },
    { icon: 'TW', color: '#1da1f2', orbitRadius: 2.8, speed: 0.25, offset: Math.PI * 1.25, y: -0.4 },
  ];

  return (
    <group ref={sceneRef}>
      {/* Central Neural Core */}
      <NeuralCore />
      
      {/* Connection Lines */}
      <ConnectionLines />
      
      {/* Orbital Rings */}
      <OrbitRing radius={2.2} rotation={[Math.PI / 2, 0, 0]} color="#00d2ff" opacity={0.25} />
      <OrbitRing radius={2.5} rotation={[Math.PI / 2.2, 0.2, 0]} color="#00d2ff" opacity={0.2} />
      <OrbitRing radius={2.8} rotation={[Math.PI / 2.5, -0.3, 0.1]} color="#00d2ff" opacity={0.15} />
      
      {/* Floating Social Icons */}
      {socialIcons.map((social, index) => (
        <SocialIcon
          key={index}
          position={[0, social.y, 0]}
          icon={social.icon}
          color={social.color}
          orbitRadius={social.orbitRadius}
          speed={social.speed}
          offset={social.offset}
        />
      ))}
      
      {/* Dashboard Preview */}
      <DashboardPreview />
    </group>
  );
};

const NeuralBrain3D = () => {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[500px]">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient light */}
        <ambientLight intensity={0.3} />
        
        {/* Main lights */}
        <pointLight position={[10, 10, 10]} intensity={2} color="#00d2ff" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#0066ff" />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#00d2ff" />
        
        {/* Spot light for dramatic effect */}
        <spotLight
          position={[0, 8, 5]}
          angle={0.5}
          penumbra={1}
          intensity={2}
          color="#00d2ff"
        />
        
        <Scene />
      </Canvas>
    </div>
  );
};

export default NeuralBrain3D;
