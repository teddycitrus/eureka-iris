export type GlobeMarker = {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  severity: string;
  hasAlert: boolean;
  alertId: string | null;
  categories: string[];
};

export type GlobeArc = {
  shipmentId: string;
  ref: string;
  mode: string;
  status: string;
  segIndex: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  originLabel: string;
  destLabel: string;
  valueUSD: number | null;
};

export type GlobeIncident = {
  id: string;
  supplierId: string;
  lat: number | null;
  lng: number | null;
  severity: string;
  headline: string;
  status: string;
  recommendation: string;
  createdAt: string;
};

export type ShipmentSummary = {
  id: string;
  ref: string;
  mode: string;
  status: string;
  origin: string;
  dest: string;
  valueUSD: number | null;
  etaAt: string | null;
  supplierName: string | null;
  alertId: string | null;
};

export type GlobeSnapshot = {
  markers: GlobeMarker[];
  arcs: GlobeArc[];
  incidents: GlobeIncident[];
  shipments: ShipmentSummary[];
};
