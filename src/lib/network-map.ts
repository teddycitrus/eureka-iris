export type GlobeNode = {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  openAlertCount: number;
  activeAlertIds: string[];
};

export type GlobeDepot = {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  supplierIds: string[];
};

export type GlobeHotspot = {
  id: string;
  supplierId: string;
  supplierName: string;
  latitude: number;
  longitude: number;
  severity: string;
  alertCount: number;
  alertIds: string[];
};

export type GlobeArc = {
  id: string;
  kind: "supply" | "alert";
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromLabel: string;
  toLabel: string;
  severity: string;
  alertId?: string;
  supplierId: string;
  depotId?: string;
};

export type GlobeAlertBrief = {
  id: string;
  severity: string;
  status: string;
  title: string;
  recommendation: string;
  supplierId: string;
  supplierName: string;
  supplierCountry: string;
  supplierRegion: string;
  href: string;
  createdAt: string;
};

export type GlobeSelection = {
  id: string;
  kind: "supplier" | "hotspot" | "depot";
  supplierId?: string;
  supplierName: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  openAlertCount: number;
  alerts: GlobeAlertBrief[];
  relatedSuppliers?: string[];
};

export type GlobeViewModel = {
  nodes: GlobeNode[];
  depots: GlobeDepot[];
  hotspots: GlobeHotspot[];
  arcs: GlobeArc[];
  selections: GlobeSelection[];
  defaultSelectionId: string | null;
};

export type SupplierForMap = {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: string;
  alerts: Array<{
    id: string;
    severity: string;
    status: string;
    recommendation: string;
    createdAt: Date | string;
    news: {
      title: string;
    };
  }>;
};

const ACTIVE_ALERT_STATUSES = new Set(["pending", "calling", "escalated"]);
const HOTSPOT_SEVERITIES = new Set(["high", "critical"]);
const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const SUPPLIER_COORDINATE_FALLBACKS: Array<{
  match: (supplier: Pick<SupplierForMap, "name" | "country" | "region">) => boolean;
  latitude: number;
  longitude: number;
}> = [
  {
    match: (supplier) => /hsinchu/i.test(supplier.name) || supplier.country === "Taiwan",
    latitude: 24.8138,
    longitude: 120.9675,
  },
  {
    match: (supplier) => /rotterdam/i.test(supplier.name) || supplier.country === "Netherlands",
    latitude: 51.9244,
    longitude: 4.4777,
  },
  {
    match: (supplier) => /hai phong/i.test(supplier.name) || supplier.country === "Vietnam",
    latitude: 20.8449,
    longitude: 106.6881,
  },
  {
    match: (supplier) => /atacama/i.test(supplier.name) || supplier.country === "Chile",
    latitude: -23.8634,
    longitude: -68.1323,
  },
];

const DEPOT_BLUEPRINTS: Array<{
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  matches: (supplier: Pick<SupplierForMap, "country" | "region" | "name">) => boolean;
}> = [
  {
    id: "depot_kaohsiung",
    name: "Kaohsiung Export Depot",
    region: "East Asia",
    latitude: 22.6273,
    longitude: 120.3014,
    matches: (supplier) => supplier.country === "Taiwan" || supplier.region === "East Asia",
  },
  {
    id: "depot_singapore",
    name: "Singapore Consolidation Depot",
    region: "Southeast Asia",
    latitude: 1.2903,
    longitude: 103.8519,
    matches: (supplier) => supplier.region === "Southeast Asia" || /assembly/i.test(supplier.name),
  },
  {
    id: "depot_rotterdam",
    name: "Rotterdam Port Depot",
    region: "Western Europe",
    latitude: 51.95,
    longitude: 4.14,
    matches: (supplier) => supplier.country === "Netherlands" || supplier.region === "Western Europe",
  },
  {
    id: "depot_panama",
    name: "Panama Canal Materials Depot",
    region: "Americas",
    latitude: 8.9824,
    longitude: -79.5199,
    matches: (supplier) => supplier.region === "South America" || supplier.country === "Chile",
  },
];

export function buildNetworkMapModel(suppliers: SupplierForMap[]): GlobeViewModel {
  const normalizedSuppliers = suppliers.map((supplier) => {
    const coordinates = resolveSupplierCoordinates(supplier);
    return {
      ...supplier,
      ...coordinates,
    };
  });

  const nodes = normalizedSuppliers
    .map((supplier) => {
      const activeAlerts = supplier.alerts.filter((alert) => ACTIVE_ALERT_STATUSES.has(alert.status));
      return {
        id: supplier.id,
        name: supplier.name,
        country: supplier.country,
        region: supplier.region,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        riskLevel: supplier.riskLevel,
        openAlertCount: activeAlerts.length,
        activeAlertIds: activeAlerts.map((alert) => alert.id),
      } satisfies GlobeNode;
    })
    .sort((a, b) => b.openAlertCount - a.openAlertCount || a.name.localeCompare(b.name));

  const depots = DEPOT_BLUEPRINTS.flatMap((blueprint) => {
    const matchingSuppliers = normalizedSuppliers.filter((supplier) => blueprint.matches(supplier));
    if (matchingSuppliers.length === 0) return [];
    return [
      {
        id: blueprint.id,
        name: blueprint.name,
        region: blueprint.region,
        latitude: blueprint.latitude,
        longitude: blueprint.longitude,
        supplierIds: matchingSuppliers.map((supplier) => supplier.id),
      } satisfies GlobeDepot,
    ];
  });

  const depotBySupplierId = new Map<string, GlobeDepot>();
  for (const depot of depots) {
    for (const supplierId of depot.supplierIds) {
      depotBySupplierId.set(supplierId, depot);
    }
  }

  const hotspots = normalizedSuppliers
    .flatMap((supplier) => {
      const hotspotAlerts = supplier.alerts.filter(
        (alert) => ACTIVE_ALERT_STATUSES.has(alert.status) && HOTSPOT_SEVERITIES.has(alert.severity),
      );
      if (hotspotAlerts.length === 0) return [];
      return [
        {
          id: `hotspot:${supplier.id}`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          latitude: supplier.latitude,
          longitude: supplier.longitude,
          severity: hotspotAlerts.reduce(
            (worst, alert) =>
              severityRank[alert.severity] < severityRank[worst] ? alert.severity : worst,
            hotspotAlerts[0].severity,
          ),
          alertCount: hotspotAlerts.length,
          alertIds: hotspotAlerts.map((alert) => alert.id),
        } satisfies GlobeHotspot,
      ];
    })
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || b.alertCount - a.alertCount);

  const supplyArcs = normalizedSuppliers
    .flatMap((supplier) => {
      const depot = depotBySupplierId.get(supplier.id);
      if (!depot) return [];
      const hasActiveAlert = supplier.alerts.some((alert) => ACTIVE_ALERT_STATUSES.has(alert.status));
      return [
        {
          id: `supply:${depot.id}:${supplier.id}`,
          kind: "supply",
          fromLat: depot.latitude,
          fromLng: depot.longitude,
          toLat: supplier.latitude,
          toLng: supplier.longitude,
          fromLabel: depot.name,
          toLabel: supplier.name,
          severity: hasActiveAlert ? "high" : "low",
          supplierId: supplier.id,
          depotId: depot.id,
        } satisfies GlobeArc,
      ];
    });

  const alertArcs = normalizedSuppliers.flatMap((supplier) => {
    const alertSource = deriveAlertOrigin(supplier, depotBySupplierId.get(supplier.id));
    if (!alertSource) return [];
    return supplier.alerts
      .filter((alert) => ACTIVE_ALERT_STATUSES.has(alert.status))
      .map((alert) => ({
        id: `alert:${alert.id}`,
        kind: "alert",
        fromLat: alertSource.latitude,
        fromLng: alertSource.longitude,
        toLat: supplier.latitude,
        toLng: supplier.longitude,
        fromLabel: alertSource.label,
        toLabel: supplier.name,
        severity: alert.severity,
        alertId: alert.id,
        supplierId: supplier.id,
        depotId: alertSource.depotId,
      } satisfies GlobeArc));
  });

  const arcs = [...supplyArcs, ...alertArcs].sort((a, b) => {
    const byKind = a.kind === b.kind ? 0 : a.kind === "supply" ? -1 : 1;
    if (byKind !== 0) return byKind;
    return severityRank[a.severity] - severityRank[b.severity] || a.id.localeCompare(b.id);
  });

  const supplierSelections = normalizedSuppliers
    .map((supplier) => {
      const activeAlerts = supplier.alerts
        .filter((alert) => ACTIVE_ALERT_STATUSES.has(alert.status))
        .sort((a, b) => {
          const bySeverity = severityRank[a.severity] - severityRank[b.severity];
          if (bySeverity !== 0) return bySeverity;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      return {
        id: `supplier:${supplier.id}`,
        kind: "supplier",
        supplierId: supplier.id,
        supplierName: supplier.name,
        country: supplier.country,
        region: supplier.region,
        latitude: supplier.latitude,
        longitude: supplier.longitude,
        riskLevel: supplier.riskLevel,
        openAlertCount: activeAlerts.length,
        alerts: activeAlerts.map((alert) => ({
          id: alert.id,
          severity: alert.severity,
          status: alert.status,
          title: alert.news.title,
          recommendation: alert.recommendation,
          supplierId: supplier.id,
          supplierName: supplier.name,
          supplierCountry: supplier.country,
          supplierRegion: supplier.region,
          href: `/alerts#${alert.id}`,
          createdAt: toIsoString(alert.createdAt),
        })),
      } satisfies GlobeSelection;
    })
    .sort((a, b) => b.openAlertCount - a.openAlertCount || a.supplierName.localeCompare(b.supplierName));

  const depotSelections = depots.map((depot) => ({
    id: `depot:${depot.id}`,
    kind: "depot",
    supplierName: depot.name,
    country: "Supply depot",
    region: depot.region,
    latitude: depot.latitude,
    longitude: depot.longitude,
    riskLevel: "low",
    openAlertCount: depot.supplierIds.filter((supplierId) =>
      supplierSelections.some((selection) => selection.supplierId === supplierId && selection.openAlertCount > 0),
    ).length,
    alerts: [],
    relatedSuppliers: depot.supplierIds,
  } satisfies GlobeSelection));

  const selections = [...supplierSelections, ...depotSelections];

  return {
    nodes,
    depots,
    hotspots,
    arcs,
    selections,
    defaultSelectionId: supplierSelections[0]?.id ?? depotSelections[0]?.id ?? null,
  };
}

export function resolveSupplierCoordinates(
  supplier: Pick<SupplierForMap, "name" | "country" | "region" | "latitude" | "longitude">,
) {
  if (supplier.latitude !== 0 || supplier.longitude !== 0) {
    return { latitude: supplier.latitude, longitude: supplier.longitude };
  }

  const match = SUPPLIER_COORDINATE_FALLBACKS.find((candidate) =>
    candidate.match({
      name: supplier.name,
      country: supplier.country,
      region: supplier.region,
    }),
  );

  if (match) {
    return { latitude: match.latitude, longitude: match.longitude };
  }

  return { latitude: supplier.latitude, longitude: supplier.longitude };
}

function deriveAlertOrigin(supplier: SupplierForMap, depot?: GlobeDepot) {
  const hasActiveAlert = supplier.alerts.some((alert) => ACTIVE_ALERT_STATUSES.has(alert.status));
  if (!hasActiveAlert) return null;
  if (depot) {
    return {
      latitude: depot.latitude,
      longitude: depot.longitude,
      label: depot.name,
      depotId: depot.id,
    };
  }
  const lngOffset = supplier.longitude >= 0 ? -18 : 18;
  const latOffset = supplier.latitude >= 0 ? 10 : -10;
  return {
    latitude: clampLatitude(supplier.latitude + latOffset),
    longitude: wrapLongitude(supplier.longitude + lngOffset),
    label: `${supplier.region} alert corridor`,
    depotId: undefined,
  };
}

function clampLatitude(value: number) {
  return Math.max(-72, Math.min(72, value));
}

function wrapLongitude(value: number) {
  if (value > 180) return value - 360;
  if (value < -180) return value + 360;
  return value;
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
