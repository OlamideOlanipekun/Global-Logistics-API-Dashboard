import { CarrierStats, Shipment, ShipmentStatus, Location } from './types';
import { addDays, subDays, addHours, subMinutes } from 'date-fns';

const CITIES: Location[] = [
  { city: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { city: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
  { city: 'Accra', country: 'Ghana', lat: 5.6037, lng: -0.1870 },
  { city: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
  { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
  { city: 'Kigali', country: 'Rwanda', lat: -1.9441, lng: 30.0619 },
  { city: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
  { city: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },
];

const CARRIERS = ['DHL', 'FedEx', 'UCP Logistics', 'Kobo360', 'Sendbox'];
const STATUSES: ShipmentStatus[] = ['in_transit', 'delayed', 'delivered', 'failed', 'flagged'];

const generateEvents = (createdAt: Date, status: ShipmentStatus, destCity: string) => {
  const events = [];
  events.push({ timestamp: createdAt.toISOString(), location: 'Warehouse', type: 'Order Created' });
  events.push({ timestamp: addHours(createdAt, 12).toISOString(), location: 'Local Hub', type: 'Picked Up' });
  
  if (status !== 'failed') {
    events.push({ timestamp: addDays(createdAt, 1).toISOString(), location: 'Regional Hub', type: 'In Transit' });
  }
  if (status === 'delayed') {
    events.push({ timestamp: addDays(createdAt, 2).toISOString(), location: 'Customs', type: 'Customs Hold' });
  }
  if (status === 'delivered') {
    events.push({ timestamp: subDays(new Date(), 1).toISOString(), location: destCity, type: 'Out for Delivery' });
    events.push({ timestamp: subMinutes(new Date(), 30).toISOString(), location: destCity, type: 'Delivered' });
  }
  return events.reverse();
};

const generateMockShipments = (count: number): Shipment[] => {
  const shipments: Shipment[] = [];
  for (let i = 0; i < count; i++) {
    const originIdx = Math.floor(Math.random() * CITIES.length);
    let destIdx = Math.floor(Math.random() * CITIES.length);
    while (destIdx === originIdx) {
      destIdx = Math.floor(Math.random() * CITIES.length);
    }
    
    const createdAt = subDays(new Date(), Math.floor(Math.random() * 10) + 1);
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const id = `MTC-2026-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    shipments.push({
      id,
      origin: CITIES[originIdx],
      destination: CITIES[destIdx],
      carrier: CARRIERS[Math.floor(Math.random() * CARRIERS.length)],
      status,
      eta: addDays(createdAt, Math.floor(Math.random() * 5) + 3).toISOString(),
      weight: Math.floor(Math.random() * 500) + 5,
      dimensions: `${Math.floor(Math.random() * 50) + 20}x${Math.floor(Math.random() * 30) + 20}x${Math.floor(Math.random() * 30) + 20} cm`,
      createdAt: createdAt.toISOString(),
      events: generateEvents(createdAt, status, CITIES[destIdx].city),
    });
  }
  return shipments;
};

export const MOCK_SHIPMENTS = generateMockShipments(50);

export const MOCK_CARRIERS: CarrierStats[] = CARRIERS.map(c => ({
  id: c.toLowerCase().replace(/\s+/g, '-'),
  name: c,
  totalShipments: Math.floor(Math.random() * 5000) + 500,
  onTimeRate: Math.floor(Math.random() * 15) + 80,
  avgTransitDays: Math.floor(Math.random() * 4) + 2,
}));
