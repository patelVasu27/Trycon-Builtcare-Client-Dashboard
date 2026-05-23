export type UnitType = "rft" | "panels" | "rmt" | "cement" | "post"; // Running Feet, Panels, Running Meters, Cement (bags), or Posts

export interface Client {
  id: string;
  buyerName: string;
  mobile: string;
  siteLocation: string;
  quantity: number; // raw value in specified unit
  quantityUnit?: UnitType; // quantity unit
  rate: number; // rate it was sold (₹)
  boundaryHeight?: number; // optional, deprecated boundary height
  notes?: string; // quick order specific descriptions
}

export interface DeletedClient extends Client {
  deletedAt: string; // ISO string when it was deleted
}

export interface DashboardMetrics {
  totalClients: number;
  totalVolumeRft: number;
  totalEstimatedValue: number;
  uniqueLocationsCount: number;
}

