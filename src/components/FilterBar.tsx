import React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  ListFilter,
  IndianRupee,
  Layers,
} from "lucide-react";
import { Client } from "../types.ts";

interface FilterBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  minRateSearch: string;
  setMinRateSearch: (val: string) => void;
  minQtySearch: string;
  setMinQtySearch: (val: string) => void;
  selectedUnitType: "all" | "rft" | "panels";
  setSelectedUnitType: (val: "all" | "rft" | "panels") => void;
  uniqueLocations: string[];
  clients: Client[];
  filteredCount: number;
}

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  selectedLocation,
  setSelectedLocation,
  minRateSearch,
  setMinRateSearch,
  minQtySearch,
  setMinQtySearch,
  selectedUnitType,
  setSelectedUnitType,
  uniqueLocations,
  clients,
  filteredCount,
}: FilterBarProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close suggestions popover when clicking outside the container
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Compute autocomplete options based on search query
  const suggestions = React.useMemo(() => {
    if (!searchTerm.trim()) return [];

    const searchLower = searchTerm.toLowerCase();
    return clients
      .filter((c) => c.buyerName.toLowerCase().includes(searchLower))
      .map((c) => c.buyerName)
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 5); // Limit to top 5 matches
  }, [searchTerm, clients]);

  const handleClear = () => {
    setSearchTerm("");
    setSelectedLocation("");
    setMinRateSearch("");
    setMinQtySearch("");
    setSelectedUnitType("all");
    setShowSuggestions(false);
  };

  return (
    <div
      id="filter-wrapper"
      className="bg-white/50 backdrop-blur-md border border-white/60 rounded-xl p-6 mb-8 shadow-xs"
    >
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          <h2 className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-widest">
            Multi-field Query Controls
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      </div>

      <div ref={containerRef} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 1. Buyer Name with Autocomplete */}
          <div className="col-span-1 md:col-span-4 relative">
            <label
              htmlFor="buyer-search-input"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
            >
              Buyer Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="buyer-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search Client Name..."
                className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2 pl-9 pr-8 text-sm font-medium text-[#1A1A1A] placeholder-gray-400 focus:outline-none transition-all duration-200"
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Popover */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-[#EAEAEA] rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-gray-100 animate-in fade-in duration-100">
                <div className="px-4 py-1.5 bg-[#F9FAFB] text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Matches
                </div>
                {suggestions.map((name, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSearchTerm(name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#00FF7F]/10 flex justify-between items-center transition-colors cursor-pointer text-gray-800"
                  >
                    <span className="truncate">{name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Site Location Select */}
          <div className="col-span-1 md:col-span-3">
            <label
              htmlFor="location-filter-select"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
            >
              Site Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <select
                id="location-filter-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2 pl-9 pr-8 text-sm font-medium text-[#1A1A1A] focus:outline-none cursor-pointer appearance-none transition-all duration-200"
              >
                <option value="">All State Locations</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                <ListFilter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* 3. Min Rate Sold Input */}
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="min-rate-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
            >
              Rate Sold Filter (Min ₹)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <input
                id="min-rate-filter"
                type="number"
                value={minRateSearch}
                onChange={(e) => setMinRateSearch(e.target.value)}
                placeholder="Ex. 1200"
                className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-[#1A1A1A] placeholder-gray-400 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* 4. Min Quantity Input */}
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="min-qty-filter"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
            >
              Min Quantity Filter
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <input
                id="min-qty-filter"
                type="number"
                value={minQtySearch}
                onChange={(e) => setMinQtySearch(e.target.value)}
                placeholder="Ex. 100"
                className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2 pl-9 pr-3 text-sm font-medium text-[#1A1A1A] placeholder-gray-400 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* 5. Unit filter type dropdown */}
          <div className="col-span-1 md:col-span-1 border-t md:border-t-0 pt-3 md:pt-0">
            <label
              htmlFor="unit-filter-select"
              className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
            >
              Unit
            </label>
            <select
              id="unit-filter-select"
              value={selectedUnitType}
              onChange={(e) => setSelectedUnitType(e.target.value as any)}
              className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2 px-2.5 text-xs font-semibold text-[#1A1A1A] focus:outline-none cursor-pointer appearance-none transition-all duration-200"
            >
              <option value="all">All</option>
              <option value="rft">RFT</option>
              <option value="panels">Panels</option>
            </select>
          </div>
        </div>

        {/* Results Counter and Filter Info badge */}
        <div className="flex flex-wrap items-center justify-between text-xs font-medium text-gray-500 pt-2 border-t border-gray-100 gap-2">
          <div>
            {searchTerm ||
            selectedLocation ||
            minRateSearch ||
            minQtySearch ||
            selectedUnitType !== "all" ? (
              <span className="text-[10px] font-bold bg-[#EAEAEA] text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Active Filter parameters apply
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Viewing unfiltered manufacture dataset
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-gray-700">
            Filtered matching:{" "}
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">
              {filteredCount} matches
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
