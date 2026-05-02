"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { ArrowUpRight, Globe2, Radio, Route, Warehouse } from "lucide-react";
import type { Group, Mesh } from "three";
import { CatmullRomCurve3, Color, Vector3 } from "three";

import type {
  GlobeArc,
  GlobeDepot,
  GlobeHotspot,
  GlobeNode,
  GlobeSelection,
  GlobeViewModel,
} from "@/lib/network-map";

const GLOBE_RADIUS = 1.72;
const OCEAN = "#dfe9f0";
const LAND = "#cfc8bc";
const LAND_HIGHLIGHT = "#e9e3d7";
const IRIS = "#5f7da1";
const IRIS_SOFT = "#9db2c9";
const CRITICAL = "#c6513b";
const WARN = "#d08938";
const INK = "#1c1917";

const severityColors: Record<string, string> = {
  critical: CRITICAL,
  high: CRITICAL,
  medium: WARN,
  low: IRIS,
};

export function PulseNetworkMap({ model }: { model: GlobeViewModel }) {
  const [selectedId, setSelectedId] = useState(model.defaultSelectionId);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setSelectedId(model.defaultSelectionId);
  }, [model.defaultSelectionId]);

  const selected = model.selections.find((selection) => selection.id === selectedId) ?? null;

  if (model.nodes.length === 0) {
    return (
      <div
        className="rounded-[28px] px-8 py-14 text-center"
        style={{
          border: "1px solid var(--border)",
          background:
            "radial-gradient(circle at top, rgba(95,125,161,0.08), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f2efeb 100%)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <Globe2 className="mx-auto h-8 w-8" style={{ color: "var(--iris)" }} />
        <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>
          No network to map yet
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm" style={{ color: "var(--ink-3)" }}>
          Add suppliers with coordinates and Iris will project supplier nodes, supply depots, and red
          alert glows here.
        </p>
      </div>
    );
  }

  return (
    <section
      className="rounded-[28px] overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,241,236,0.96) 100%)",
      }}
    >
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[640px] overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 22% 18%, rgba(95,125,161,0.16), transparent 28%), radial-gradient(circle at 78% 18%, rgba(198,81,59,0.11), transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(241,237,232,0.68) 100%)",
            }}
          />

          <div className="absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-4 p-5">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{
                  border: "1px solid var(--iris-border)",
                  background: "var(--iris-bg)",
                  color: "var(--iris)",
                }}
              >
                <Radio className="h-3 w-3" />
                Network map
              </div>
              <h2 className="mt-3 text-[28px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                Supplier routes, depot hubs, and live alert pressure.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--ink-3)" }}>
                Every supplier stays tied to a common real-world depot lane. High-severity incidents add
                red glows and alert corridors without breaking the rest of the dashboard’s visual system.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricPill label="Suppliers" value={String(model.nodes.length)} />
              <MetricPill label="Depots" value={String(model.depots.length)} />
              <MetricPill label="Lanes" value={String(model.arcs.length)} />
            </div>
          </div>

          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0.15, 7.8], fov: 38 }}
              dpr={[1, 1.75]}
              gl={{ antialias: true, alpha: true }}
            >
              <color attach="background" args={["#f8f6f2"]} />
              <ambientLight intensity={1.55} color="#ffffff" />
              <directionalLight position={[4, 3, 5]} intensity={2.35} color="#fffefb" />
              <directionalLight position={[-4, -2, -5]} intensity={0.7} color="#d7dee6" />
              <SceneBackdrop />
              <GlobeScene
                depots={model.depots}
                arcs={model.arcs}
                hotspots={model.hotspots}
                nodes={model.nodes}
                reducedMotion={reducedMotion}
                selectedId={selectedId}
                setHoveredLabel={setHoveredLabel}
                onSelect={setSelectedId}
              />
              <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={4.9}
                maxDistance={8.2}
                rotateSpeed={0.52}
                zoomSpeed={0.7}
                autoRotate={!reducedMotion}
                autoRotateSpeed={0.28}
              />
            </Canvas>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 p-5">
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                border: "1px solid rgba(95,125,161,0.18)",
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-4)" }}>
                Interaction
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--ink-3)" }}>
                Drag to rotate, zoom in for node separation, click suppliers or depots to inspect the network.
              </p>
            </div>
            <div
              className="rounded-full px-3 py-2 text-xs"
              style={{
                border: "1px solid rgba(95,125,161,0.18)",
                background: "rgba(255,255,255,0.82)",
                color: "var(--ink-3)",
                backdropFilter: "blur(8px)",
              }}
            >
              {hoveredLabel ?? "Hover a supplier, depot, or glow for location detail"}
            </div>
          </div>
        </div>

        <aside
          className="border-t xl:border-t-0 xl:border-l"
          style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.72)" }}
        >
          <div className="flex h-full flex-col">
            <div className="border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-4)" }}>
                Selected node
              </div>
              <div className="mt-2 text-lg font-semibold" style={{ color: "var(--ink)" }}>
                {selected?.supplierName ?? "No location selected"}
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--ink-3)" }}>
                {selected ? `${selected.country} · ${selected.region}` : "Choose a supplier or depot"}
              </div>
            </div>

            {selected ? (
              <div className="flex flex-1 flex-col px-5 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <InspectorStat
                    label="Open alerts"
                    value={String(selected.openAlertCount)}
                    tone={selected.openAlertCount > 0 ? "critical" : "neutral"}
                  />
                  <InspectorStat label="Risk level" value={selected.riskLevel} tone={selected.riskLevel} />
                </div>

                {selected.kind === "depot" && (
                  <div
                    className="mt-4 rounded-2xl px-4 py-4 text-sm"
                    style={{
                      border: "1px solid rgba(95,125,161,0.14)",
                      background: "rgba(95,125,161,0.06)",
                      color: "var(--ink-3)",
                    }}
                  >
                    This depot aggregates {selected.relatedSuppliers?.length ?? 0} supplier
                    {selected.relatedSuppliers?.length === 1 ? "" : "s"} in the route model.
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-4)" }}>
                    {selected.kind === "depot" ? <Warehouse className="h-3.5 w-3.5" /> : <Route className="h-3.5 w-3.5" />}
                    {selected.kind === "depot" ? "Connected suppliers" : "Alert context"}
                  </div>
                  {selected.alerts.length === 0 ? (
                    <div
                      className="mt-3 rounded-2xl px-4 py-4 text-sm"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--ink-3)",
                      }}
                    >
                      {selected.kind === "depot"
                        ? "Depot nodes are operational anchors. They provide the common route context that links suppliers into a believable network."
                        : "No open incidents at this supplier. Its route remains visible as a neutral dependency lane."}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-3">
                      {selected.alerts.map((alert) => (
                        <article
                          key={alert.id}
                          className="rounded-2xl px-4 py-4"
                          style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div
                                className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
                                style={{
                                  background: `${severityColors[alert.severity] ?? IRIS}18`,
                                  color: severityColors[alert.severity] ?? IRIS,
                                }}
                              >
                                {alert.severity}
                              </div>
                              <h3 className="mt-2 text-sm font-medium leading-5" style={{ color: "var(--ink)" }}>
                                {alert.title}
                              </h3>
                            </div>
                            <span className="text-xs" style={{ color: "var(--ink-4)" }}>
                              {formatRelative(alert.createdAt)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-6" style={{ color: "var(--ink-3)" }}>
                            {alert.recommendation}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs" style={{ color: "var(--ink-4)" }}>
                              status · {alert.status}
                            </span>
                            <Link
                              href={alert.href}
                              className="inline-flex items-center gap-1 text-sm font-medium"
                              style={{ color: "var(--iris)" }}
                            >
                              Open alert
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-6 text-sm" style={{ color: "var(--ink-3)" }}>
                Select a supplier, depot, or alert glow to open the inspector.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function GlobeScene({
  depots,
  arcs,
  hotspots,
  nodes,
  reducedMotion,
  selectedId,
  setHoveredLabel,
  onSelect,
}: {
  depots: GlobeDepot[];
  arcs: GlobeArc[];
  hotspots: GlobeHotspot[];
  nodes: GlobeNode[];
  reducedMotion: boolean;
  selectedId: string | null;
  setHoveredLabel: (label: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const group = useRef<Group>(null);
  const landDots = useMemo(generateLandDots, []);

  useFrame((_state, delta) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y += delta * 0.038;
  });

  return (
    <group ref={group} position={[0.35, -0.24, 0]}>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial
          color={OCEAN}
          roughness={0.92}
          metalness={0.02}
          emissive="#edf4f8"
          emissiveIntensity={0.28}
        />
      </mesh>
      <mesh scale={1.016}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial color={IRIS_SOFT} transparent opacity={0.12} />
      </mesh>

      {landDots.map((dot, index) => (
        <mesh key={index} position={latLngToVector3(dot.lat, dot.lng, GLOBE_RADIUS + dot.altitude)}>
          <sphereGeometry args={[dot.size, 10, 10]} />
          <meshStandardMaterial
            color={dot.variant === "highlight" ? LAND_HIGHLIGHT : LAND}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}

      {arcs.map((arc) => (
        <ArcTrail key={arc.id} arc={arc} reducedMotion={reducedMotion} />
      ))}

      {depots.map((depot) => (
        <DepotNode
          key={depot.id}
          depot={depot}
          selected={selectedId === `depot:${depot.id}`}
          reducedMotion={reducedMotion}
          onSelect={() => onSelect(`depot:${depot.id}`)}
          onHover={setHoveredLabel}
        />
      ))}

      {nodes.map((node) => (
        <SupplierNode
          key={node.id}
          node={node}
          selected={selectedId === `supplier:${node.id}`}
          reducedMotion={reducedMotion}
          onSelect={() => onSelect(`supplier:${node.id}`)}
          onHover={setHoveredLabel}
        />
      ))}

      {hotspots.map((hotspot) => (
        <HotspotGlow
          key={hotspot.id}
          hotspot={hotspot}
          reducedMotion={reducedMotion}
          selected={selectedId === `supplier:${hotspot.supplierId}`}
          onSelect={() => onSelect(`supplier:${hotspot.supplierId}`)}
          onHover={setHoveredLabel}
        />
      ))}
    </group>
  );
}

function SupplierNode({
  node,
  selected,
  reducedMotion,
  onSelect,
  onHover,
}: {
  node: GlobeNode;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
  onHover: (label: string | null) => void;
}) {
  const marker = useRef<Mesh>(null);
  const position = useMemo(
    () => latLngToVector3(node.latitude, node.longitude, GLOBE_RADIUS + 0.03),
    [node.latitude, node.longitude],
  );

  useFrame(({ clock }) => {
    if (!marker.current) return;
    const scale = selected ? 1.45 : node.openAlertCount > 0 ? 1.18 : 1;
    const pulse = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 1.8) * 0.06;
    marker.current.scale.setScalar(scale + pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={marker}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(`${node.name} · ${node.country}`);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.048, 20, 20]} />
        <meshStandardMaterial
          color={node.openAlertCount > 0 ? severityColors.high : IRIS}
          emissive={node.openAlertCount > 0 ? severityColors.high : IRIS}
          emissiveIntensity={selected ? 1.1 : 0.55}
        />
      </mesh>
      {selected && (
        <Html distanceFactor={10} center>
          <div
            className="max-w-[140px] rounded-2xl px-2.5 py-1.5 text-[10.5px] font-medium leading-snug"
            style={{
              border: "1px solid rgba(95,125,161,0.18)",
              background: "rgba(255,255,255,0.9)",
              color: INK,
              backdropFilter: "blur(8px)",
            }}
          >
            {node.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function DepotNode({
  depot,
  selected,
  reducedMotion,
  onSelect,
  onHover,
}: {
  depot: GlobeDepot;
  selected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
  onHover: (label: string | null) => void;
}) {
  const marker = useRef<Mesh>(null);
  const position = useMemo(
    () => latLngToVector3(depot.latitude, depot.longitude, GLOBE_RADIUS + 0.04),
    [depot.latitude, depot.longitude],
  );

  useFrame(({ clock }) => {
    if (!marker.current) return;
    const pulse = reducedMotion ? 0 : Math.sin(clock.getElapsedTime() * 1.2 + depot.latitude) * 0.04;
    marker.current.scale.setScalar((selected ? 1.35 : 1) + pulse);
  });

  return (
    <group position={position}>
      <mesh
        ref={marker}
        rotation={[Math.PI / 4, 0, Math.PI / 4]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(`${depot.name} · ${depot.supplierIds.length} suppliers`);
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial color={LAND} emissive={IRIS_SOFT} emissiveIntensity={selected ? 0.65 : 0.22} />
      </mesh>
      {selected && (
        <Html distanceFactor={10} center>
          <div
            className="max-w-[140px] rounded-2xl px-2.5 py-1.5 text-[10.5px] font-medium leading-snug"
            style={{
              border: "1px solid rgba(95,125,161,0.18)",
              background: "rgba(255,255,255,0.9)",
              color: INK,
              backdropFilter: "blur(8px)",
            }}
          >
            {depot.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function HotspotGlow({
  hotspot,
  reducedMotion,
  selected,
  onSelect,
  onHover,
}: {
  hotspot: GlobeHotspot;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: () => void;
  onHover: (label: string | null) => void;
}) {
  const pulse = useRef<Mesh>(null);
  const position = useMemo(
    () => latLngToVector3(hotspot.latitude, hotspot.longitude, GLOBE_RADIUS + 0.028),
    [hotspot.latitude, hotspot.longitude],
  );

  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const wave = reducedMotion ? 1.1 : 1.08 + Math.sin(clock.getElapsedTime() * 2.2) * 0.18;
    pulse.current.scale.setScalar(selected ? wave * 1.12 : wave);
    const material = pulse.current.material;
    if ("opacity" in material) {
      material.opacity = reducedMotion ? 0.22 : 0.16 + (Math.sin(clock.getElapsedTime() * 2.2) + 1) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={pulse}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHover(`${hotspot.supplierName} · ${hotspot.alertCount} alert${hotspot.alertCount === 1 ? "" : "s"}`);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshBasicMaterial color={severityColors[hotspot.severity] ?? CRITICAL} transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

function ArcTrail({ arc, reducedMotion }: { arc: GlobeArc; reducedMotion: boolean }) {
  const points = useMemo(() => buildArcPoints(arc), [arc]);
  const curve = useMemo(() => new CatmullRomCurve3(points), [points]);
  const color = arc.kind === "supply" ? IRIS : severityColors[arc.severity] ?? CRITICAL;
  const runner = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!runner.current) return;
    const speed = arc.kind === "supply" ? 0.1 : 0.18;
    const t = reducedMotion ? 0.5 : (clock.getElapsedTime() * speed + hashString(arc.id) * 0.07) % 1;
    runner.current.position.copy(curve.getPoint(t));
  });

  return (
    <group>
      <Line
        points={points}
        color={new Color(color)}
        lineWidth={arc.kind === "supply" ? 1.2 : 1.8}
        transparent
        opacity={arc.kind === "supply" ? 0.52 : 0.82}
      />
      <mesh ref={runner}>
        <sphereGeometry args={[arc.kind === "supply" ? 0.022 : 0.028, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function SceneBackdrop() {
  return (
    <>
      <mesh position={[0, 0, -7]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color="#f8f6f2" />
      </mesh>
      {[
        { position: [4.6, 2.8, -2.8], color: "#d9e5ef", scale: 1.8 },
        { position: [-4.1, -1.7, -2.2], color: "#f0d6cf", scale: 1.35 },
        { position: [0.8, -3.1, -2.5], color: "#ede8df", scale: 2 },
      ].map((orb, index) => (
        <mesh key={index} position={orb.position as [number, number, number]}>
          <sphereGeometry args={[orb.scale, 24, 24]} />
          <meshBasicMaterial color={orb.color} transparent opacity={0.22} />
        </mesh>
      ))}
    </>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl px-3 py-2"
      style={{
        border: "1px solid rgba(95,125,161,0.16)",
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-4)" }}>
        {label}
      </div>
      <div className="mt-1 text-right text-lg font-semibold" style={{ color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function InspectorStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  const color = severityColors[tone] ?? IRIS;
  return (
    <div className="rounded-2xl px-4 py-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--ink-4)" }}>
        {label}
      </div>
      <div className="mt-2 text-sm font-medium" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function buildArcPoints(arc: GlobeArc) {
  const start = latLngToVector3(arc.fromLat, arc.fromLng, GLOBE_RADIUS + 0.02);
  const end = latLngToVector3(arc.toLat, arc.toLng, GLOBE_RADIUS + 0.02);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const lift = (arc.kind === "supply" ? 0.3 : 0.48) + start.distanceTo(end) * (arc.kind === "supply" ? 0.05 : 0.07);
  mid.normalize().multiplyScalar(GLOBE_RADIUS + lift);
  return new CatmullRomCurve3([start, mid, end]).getPoints(36);
}

function latLngToVector3(latitude: number, longitude: number, radius: number) {
  const lat = (latitude * Math.PI) / 180;
  const lng = ((longitude - 90) * Math.PI) / 180;
  return new Vector3(
    radius * Math.cos(lat) * Math.cos(lng),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.sin(lng),
  );
}

function generateLandDots() {
  const clusters = [
    { lat: 48, lng: -105, width: 38, height: 18, spacing: 8 },
    { lat: -16, lng: -60, width: 22, height: 28, spacing: 8 },
    { lat: 52, lng: 15, width: 22, height: 12, spacing: 6 },
    { lat: 12, lng: 20, width: 26, height: 36, spacing: 8 },
    { lat: 32, lng: 92, width: 64, height: 24, spacing: 8 },
    { lat: -24, lng: 135, width: 22, height: 14, spacing: 7 },
    { lat: 72, lng: -40, width: 10, height: 7, spacing: 5 },
  ];

  return clusters.flatMap((cluster) => {
    const dots: Array<{ lat: number; lng: number; size: number; altitude: number; variant: "base" | "highlight" }> = [];
    for (let lat = -cluster.height; lat <= cluster.height; lat += cluster.spacing) {
      for (let lng = -cluster.width; lng <= cluster.width; lng += cluster.spacing) {
        const withinEllipse =
          (lat * lat) / (cluster.height * cluster.height) +
            (lng * lng) / (cluster.width * cluster.width) <=
          1;
        if (!withinEllipse) continue;
        dots.push({
          lat: cluster.lat + lat,
          lng: cluster.lng + lng,
          size: 0.028 + ((Math.abs(lat) + Math.abs(lng)) % 3) * 0.004,
          altitude: 0.002 + (Math.abs(lng) % 2) * 0.0015,
          variant: Math.abs(lat + lng) % 4 === 0 ? "highlight" : "base",
        });
      }
    }
    return dots;
  });
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function formatRelative(value: string) {
  const date = new Date(value);
  const diffHours = Math.max(1, Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60)));
  return `${diffHours}h ago`;
}
