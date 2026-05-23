import React from "react";
import { Users, IndianRupee } from "lucide-react";
import { Client } from "../types.ts";

interface StatsOverviewProps {
  filteredClients: Client[];
  totalLocations: number;
}

export default function StatsOverview({
  filteredClients,
  totalLocations,
}: StatsOverviewProps) {
  const stats = React.useMemo(() => {
    let totalRft = 0;
    let totalPanels = 0;
    let totalVal = 0;

    filteredClients.forEach((c) => {
      const unit = c.quantityUnit || "rft";
      const eqRft = unit === "panels" ? c.quantity * 8 : c.quantity;
      const eqPanels =
        unit === "panels" ? c.quantity : Math.ceil(c.quantity / 8);
      totalRft += eqRft;
      totalPanels += eqPanels;
      totalVal += c.quantity * c.rate;
    });

    const averageRate =
      filteredClients.length > 0 ? Math.round(totalVal / totalRft) : 0;

    return {
      count: filteredClients.length,
      totalRft,
      totalPanels,
      totalVal,
      averageRate,
    };
  }, [filteredClients]);

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      id="stats-overview-container"
      className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8"
    >
      {/* 1. Active Contracts Card */}
      <div
        id="stat-active-accounts"
        className="bg-white/45 backdrop-blur-md border border-white/60 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4 hover:shadow-md hover:border-[#00FF7F]/40 transition-all duration-300"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-white/60 text-gray-900 rounded-lg border border-white/80 shadow-3xs shrink-0">
            <Users className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block p-0.5">
              Active Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-[#1A1A1A] tabular-nums leading-none">
                {stats.count}
              </span>
              <span
                className="text-[9px] text-[#008040] font-black uppercase tracking-widest bg-[#00FF7F]/15 px-2 py-0.5 rounded-full border border-[#00FF7F]/25 select-none shrink-0"
                title="Locations in queue"
              >
                {totalLocations} Sites
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Complete Valuation */}
      <div
        id="stat-order-valuation"
        className="bg-white/45 backdrop-blur-md border border-white/60 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4 hover:shadow-md hover:border-[#00FF7F]/40 transition-all duration-300 border-r-4 border-r-[#00FF7F]"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#00FF7F]/15 text-emerald-800 rounded-lg border border-[#00FF7F]/20 shadow-3xs shrink-0">
            <IndianRupee className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block p-0.5">
              Cumulative Valuation
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-emerald-800 leading-none">
                {formatRupee(stats.totalVal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
