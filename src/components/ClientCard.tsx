import React from "react";
import { Phone, Info, Trash2, Pencil, RotateCw } from "lucide-react";
import { motion } from "motion/react";
import { Client, UnitType } from "../types.ts";

interface ClientCardProps {
  key?: string;
  client: Client;
  onDelete?: (id: string) => void;
  onEdit?: (client: Client) => void;
}

export default function ClientCard({
  client,
  onDelete,
  onEdit,
}: ClientCardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const registeredUnit = client.quantityUnit || "rft";
  const [unitType, setUnitType] = React.useState<UnitType>(registeredUnit);

  React.useEffect(() => {
    setUnitType(client.quantityUnit || "rft");
  }, [client.quantityUnit]);

  // Custom precast panel dimension: 1 panel bay standard partition is 8 Running Feet
  const BAY_LENGTH_RFT = 8;

  // Compute actual RFT value and panels value dynamically based on registered unit
  const rftVal =
    registeredUnit === "rft"
      ? client.quantity
      : client.quantity * BAY_LENGTH_RFT;
  const panelsVal =
    registeredUnit === "panels"
      ? client.quantity
      : Math.ceil(client.quantity / BAY_LENGTH_RFT);

  const displayedQuantity = unitType === "rft" ? rftVal : panelsVal;
  const currentUnitLabel = unitType === "rft" ? "Rft" : "Panels";

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Don't flip the card if the user is clicking on active buttons inside
    if (
      target.closest("button") ||
      target.closest("select") ||
      target.closest("input") ||
      target.closest("a")
    ) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  // High precision 3D rotation inline styles
  const cardContainerStyle: React.CSSProperties = {
    perspective: "1000px",
    minHeight: "340px",
  };

  const cardInnerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    transformStyle: "preserve-3d",
    transform: isFlipped ? "rotateY(180deg)" : "none",
  };

  const faceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  const frontFaceStyle: React.CSSProperties = {
    ...faceStyle,
  };

  const backFaceStyle: React.CSSProperties = {
    ...faceStyle,
    transform: "rotateY(180deg)",
  };

  return (
    <motion.div
      layout
      id={`client-card-container-${client.id}`}
      style={cardContainerStyle}
      onClick={handleCardClick}
      className="group cursor-pointer select-none"
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.2 } }}
      transition={{
        opacity: { duration: 0.25 },
        scale: { type: "spring", stiffness: 220, damping: 25 },
        y: { type: "spring", stiffness: 220, damping: 25 },
        layout: { type: "spring", stiffness: 260, damping: 28 },
      }}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20, mass: 0.8 }}
        className="w-full h-full relative"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* ==================== FRONT OF CARD ==================== */}
        <div
          id={`client-card-front-${client.id}`}
          style={frontFaceStyle}
          className="relative bg-white/45 border border-white/60 hover:border-transparent rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden h-full z-10 shadow-sm hover:shadow-md"
        >
          {/* Animated 360 rotating glow border container */}
          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 w-[250%] h-[250%] -translate-x-1/2 -translate-y-1/2 aspect-square bg-[conic-gradient(from_0deg,#00FF7F,transparent_30%,transparent_70%,#00FF7F_100%)] group-hover:animate-[spin_4s_linear_infinite] [will-change:transform]" />
          </div>

          {/* Radiant underlay blur shadow on hover */}
          <div className="absolute -inset-4 transition-opacity duration-300 opacity-0 group-hover:opacity-40 pointer-events-none z-0 blur-xl">
            <div className="absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 aspect-square bg-[conic-gradient(from_0deg,#00FF7F,transparent_30%,transparent_70%,#00FF7F_100%)] group-hover:animate-[spin_4s_linear_infinite] [will-change:transform]" />
          </div>

          {/* Elegant Content Body Mask Container */}
          <div className="absolute inset-[1.5px] bg-white rounded-[10px] p-5 flex flex-col justify-between overflow-hidden z-10 font-sans">
            {/* Top Half */}
            <div>
              <div className="flex justify-between items-start gap-2 mb-3 font-sans">
                <h3
                  className="text-[17px] font-bold text-[#1A1A1A] tracking-tight truncate max-w-[60%]"
                  title={client.buyerName}
                >
                  {client.buyerName}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200"
                    title="Client ID"
                  >
                    {client.id}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100/60 shadow-3xs transition-colors hover:bg-emerald-100">
                    <RotateCw className="w-2.5 h-2.5 animate-pulse" />
                    FLIP
                  </span>
                </div>
              </div>

              {/* Contact info element */}
              <div className="flex items-center gap-2 text-xs text-[#555555] font-medium mt-1 mb-3">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono">{client.mobile}</span>
              </div>

              {/* Location aspect with green dot design indicator */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00FF7F]" />
                  <span className="text-[11px] font-extrabold text-[#555555] uppercase tracking-wider">
                    {client.siteLocation}
                  </span>
                </div>
              </div>

              {/* Order Details & Segmented switch toggles */}
              <div className="border-t border-[#EAEAEA] pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400 font-sans">
                    Quantity
                  </span>

                  {/* Embedded custom high precision spring green interactive toggle */}
                  <div
                    id={`toggle-group-${client.id}`}
                    className="flex bg-[#F5F5F5] rounded p-0.5 border border-gray-100"
                  >
                    <button
                      type="button"
                      id={`toggle-rft-${client.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnitType("rft");
                      }}
                      className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded select-none transition-all duration-200 cursor-pointer ${
                        unitType === "rft"
                          ? "bg-[#00FF7F] text-[#1A1A1A] shadow-xs"
                          : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      RFT
                    </button>
                    <button
                      type="button"
                      id={`toggle-panels-${client.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnitType("panels");
                      }}
                      className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded select-none transition-all duration-200 cursor-pointer ${
                        unitType === "panels"
                          ? "bg-[#00FF7F] text-[#1A1A1A] shadow-xs"
                          : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      PANELS
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-black text-[#1A1A1A] tracking-tight tabular-nums flex items-baseline gap-1">
                  {displayedQuantity.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400 uppercase tracking-wider">
                    {currentUnitLabel}
                  </span>
                </div>

                {unitType === "panels" && (
                  <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />1
                    Precast unit (Panel Bay) = 8 Rft span
                  </p>
                )}
              </div>
            </div>

            {/* Pricing / Valuation Block */}
            <div className="border-t border-[#EAEAEA] pt-4 mt-auto">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-gray-400 mb-2">
                <span>Rate Sold</span>
                <span className="font-semibold text-[#1A1A1A] font-mono">
                  {formatRupee(client.rate)} /{" "}
                  {registeredUnit === "panels" ? "Panel" : "Rft"}
                </span>
              </div>
              <div className="pt-3 border-t border-[#EAEAEA] flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase text-gray-400">
                  Total Contract Rate
                </span>
                <span className="text-sm font-bold text-emerald-800">
                  {formatRupee(client.quantity * client.rate)}
                </span>
              </div>
              {client.notes && (
                <p
                  className="text-[11px] text-gray-400 italic line-clamp-1 mt-2.5 mb-0 border-t border-gray-50 pt-2"
                  title={client.notes}
                >
                  &ldquo;{client.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ==================== BACK OF CARD ==================== */}
        <div
          id={`client-card-back-${client.id}`}
          style={backFaceStyle}
          className="relative bg-white/45 border border-white/60 hover:border-transparent rounded-xl transition-all duration-300 flex flex-col justify-between overflow-hidden h-full z-10 shadow-sm hover:shadow-md"
        >
          {/* Animated 360 rotating glow border container */}
          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 w-[250%] h-[250%] -translate-x-1/2 -translate-y-1/2 aspect-square bg-[conic-gradient(from_0deg,#00FF7F,transparent_30%,transparent_70%,#00FF7F_100%)] group-hover:animate-[spin_4s_linear_infinite] [will-change:transform]" />
          </div>

          {/* Radiant underlay blur shadow on hover */}
          <div className="absolute -inset-4 transition-opacity duration-300 opacity-0 group-hover:opacity-40 pointer-events-none z-0 blur-xl">
            <div className="absolute top-1/2 left-1/2 w-[220%] h-[220%] -translate-x-1/2 -translate-y-1/2 aspect-square bg-[conic-gradient(from_0deg,#00FF7F,transparent_30%,transparent_70%,#00FF7F_100%)] group-hover:animate-[spin_4s_linear_infinite] [will-change:transform]" />
          </div>

          {/* Elegant Content Body Mask Container */}
          <div className="absolute inset-[1.5px] bg-gradient-to-br from-emerald-50/80 via-white to-rose-50/80 rounded-[10px] p-5 flex flex-col justify-between overflow-hidden z-10 font-sans">
            {/* Subtle elegant radial bloom overlays */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-200/20 rounded-full blur-2xl pointer-events-none" />

            {/* Minimal visual label header */}
            <div className="relative z-10 text-center border-b border-gray-200/60 pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
                Contract Controls
              </span>
            </div>

            {/* Just the two options centered beautifully */}
            <div className="relative z-10 flex flex-col gap-4 my-auto">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(client);
                  }}
                  className="w-full py-3 bg-white/90 hover:bg-emerald-500/10 active:scale-[0.98] text-emerald-800 hover:text-emerald-900 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all border border-emerald-200/60 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs hover:shadow-sm"
                  title="Edit Client Contract"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-650" />
                  Edit Client
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(client.id);
                  }}
                  className="w-full py-3 bg-white/90 hover:bg-rose-500/10 active:scale-[0.98] text-rose-700 hover:text-rose-800 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all border border-rose-200/60 flex items-center justify-center gap-2.5 cursor-pointer shadow-xs hover:shadow-sm"
                  title="Delete Registration Account"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Remove Client
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
