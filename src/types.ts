export type ShipmentStatus = 'in_transit' | 'delayed' | 'delivered' | 'failed' | 'flagged';

export interface Location {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface ShipmentEvent {
  timestamp: string;
  location: string;
  type: string;
}

export interface Shipment {
  id: string; // "MTC-2026-XXXXX"
  origin: Location;
  destination: Location;
  carrier: string;
  status: ShipmentStatus;
  eta: string; // ISO date
  weight: number; // kg
  dimensions: string; // "40x30x20 cm"
  createdAt: string;
  events: ShipmentEvent[];
}

export interface CarrierStats {
  id: string;
  name: string;
  totalShipments: number;
  onTimeRate: number;
  avgTransitDays: number;
}
