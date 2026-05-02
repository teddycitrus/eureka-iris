import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNetworkMapModel,
  resolveSupplierCoordinates,
  type SupplierForMap,
} from "@/lib/network-map";

function makeSupplier(overrides: Partial<SupplierForMap> = {}): SupplierForMap {
  return {
    id: overrides.id ?? "sup_1",
    name: overrides.name ?? "Hsinchu Semiconductor Foundry",
    country: overrides.country ?? "Taiwan",
    region: overrides.region ?? "East Asia",
    latitude: overrides.latitude ?? 24.8138,
    longitude: overrides.longitude ?? 120.9675,
    riskLevel: overrides.riskLevel ?? "high",
    alerts: overrides.alerts ?? [],
  };
}

test("buildNetworkMapModel groups high and critical alerts into one hotspot per supplier", () => {
  const suppliers = [
    makeSupplier({
      alerts: [
        {
          id: "alert_high",
          severity: "high",
          status: "pending",
          recommendation: "Check allocations.",
          createdAt: "2026-05-01T10:00:00.000Z",
          news: { title: "Typhoon closes port lanes" },
        },
        {
          id: "alert_critical",
          severity: "critical",
          status: "calling",
          recommendation: "Escalate immediately.",
          createdAt: "2026-05-01T11:00:00.000Z",
          news: { title: "Fab outage deepens" },
        },
      ],
    }),
  ];

  const model = buildNetworkMapModel(suppliers);

  assert.equal(model.hotspots.length, 1);
  assert.equal(model.hotspots[0]?.severity, "critical");
  assert.equal(model.hotspots[0]?.alertCount, 2);
  assert.deepEqual(model.hotspots[0]?.alertIds, ["alert_high", "alert_critical"]);
});

test("buildNetworkMapModel derives deterministic arcs only for active alerts", () => {
  const suppliers = [
    makeSupplier({
      id: "sup_active",
      longitude: 170,
      alerts: [
        {
          id: "alert_active",
          severity: "high",
          status: "pending",
          recommendation: "Reroute cargo.",
          createdAt: "2026-05-01T10:00:00.000Z",
          news: { title: "Port slowdown" },
        },
        {
          id: "alert_resolved",
          severity: "medium",
          status: "resolved",
          recommendation: "No action.",
          createdAt: "2026-05-01T09:00:00.000Z",
          news: { title: "Resolved issue" },
        },
      ],
    }),
  ];

  const model = buildNetworkMapModel(suppliers);

  assert.equal(model.arcs.filter((arc) => arc.kind === "alert").length, 1);
  assert.deepEqual(model.arcs.find((arc) => arc.kind === "alert"), {
    id: "alert:alert_active",
    kind: "alert",
    fromLat: 22.6273,
    fromLng: 120.3014,
    toLat: 24.8138,
    toLng: 170,
    fromLabel: "Kaohsiung Export Depot",
    toLabel: "Hsinchu Semiconductor Foundry",
    severity: "high",
    alertId: "alert_active",
    supplierId: "sup_active",
    depotId: "depot_kaohsiung",
  });
});

test("buildNetworkMapModel creates inspector selections ordered by open alert count", () => {
  const suppliers = [
    makeSupplier({
      id: "sup_one",
      name: "Rotterdam Logistics Hub",
      country: "Netherlands",
      region: "Western Europe",
      latitude: 51.9244,
      longitude: 4.4777,
      riskLevel: "medium",
      alerts: [
        {
          id: "alert_one",
          severity: "medium",
          status: "pending",
          recommendation: "Watch rates.",
          createdAt: "2026-05-01T10:00:00.000Z",
          news: { title: "Carrier trims sailings" },
        },
      ],
    }),
    makeSupplier({
      id: "sup_two",
      name: "Atacama Lithium Mining",
      country: "Chile",
      region: "South America",
      latitude: -23.8634,
      longitude: -68.1323,
      riskLevel: "high",
      alerts: [
        {
          id: "alert_two",
          severity: "critical",
          status: "calling",
          recommendation: "Freeze new battery commitments.",
          createdAt: "2026-05-01T11:00:00.000Z",
          news: { title: "Mine strike expands" },
        },
        {
          id: "alert_three",
          severity: "high",
          status: "escalated",
          recommendation: "Escalate sourcing.",
          createdAt: "2026-05-01T12:00:00.000Z",
          news: { title: "Supply cover shrinks" },
        },
      ],
    }),
  ];

  const model = buildNetworkMapModel(suppliers);

  assert.equal(model.defaultSelectionId, "supplier:sup_two");
  assert.equal(model.selections[0]?.supplierId, "sup_two");
  assert.equal(model.selections[0]?.alerts[0]?.id, "alert_two");
  assert.equal(model.selections[0]?.alerts[0]?.href, "/alerts#alert_two");
  assert.equal(model.nodes[0]?.openAlertCount, 2);
});

test("buildNetworkMapModel creates depot lanes for every supplier and keeps alert lanes distinct", () => {
  const suppliers = [
    makeSupplier({
      id: "sup_taiwan",
      name: "Hsinchu Semiconductor Foundry",
      country: "Taiwan",
      region: "East Asia",
      latitude: 0,
      longitude: 0,
      alerts: [
        {
          id: "alert_one",
          severity: "high",
          status: "pending",
          recommendation: "Check wafer lots.",
          createdAt: "2026-05-01T10:00:00.000Z",
          news: { title: "Typhoon disrupts sailings" },
        },
      ],
    }),
    makeSupplier({
      id: "sup_chile",
      name: "Atacama Lithium Mining",
      country: "Chile",
      region: "South America",
      latitude: 0,
      longitude: 0,
      alerts: [],
    }),
  ];

  const model = buildNetworkMapModel(suppliers);

  assert.equal(model.depots.length, 2);
  assert.equal(model.arcs.filter((arc) => arc.kind === "supply").length, 2);
  assert.equal(model.arcs.filter((arc) => arc.kind === "alert").length, 1);
  assert.equal(
    model.arcs.some(
      (arc) =>
        arc.kind === "supply" &&
        arc.supplierId === "sup_taiwan" &&
        arc.fromLabel === "Kaohsiung Export Depot",
    ),
    true,
  );
});

test("resolveSupplierCoordinates falls back to known supplier-name geography", () => {
  assert.deepEqual(
    resolveSupplierCoordinates({
      name: "Atacama Lithium Mining",
      country: "Chile",
      region: "South America",
      latitude: 0,
      longitude: 0,
    }),
    { latitude: -23.8634, longitude: -68.1323 },
  );
});
