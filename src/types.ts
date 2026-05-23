export interface Client {
  id: string;
  buyerName: string;
  mobile: string;
  siteLocation: string;
  quantity: number; // raw value in specified unit
  quantityUnit?: "rft" | "panels"; // optional quantity unit, defaults to 'rft'
  rate: number; // rate it was sold (₹)
  boundaryHeight?: number; // optional, deprecated boundary height
  notes?: string; // quick order specific descriptions
}

export interface DeletedClient extends Client {
  deletedAt: string; // ISO string when it was deleted
}

export type UnitType = "rft" | "panels"; // Rft (running feet) or Panels (individual panels)

export interface DashboardMetrics {
  totalClients: number;
  totalVolumeRft: number;
  totalEstimatedValue: number;
  uniqueLocationsCount: number;
}
