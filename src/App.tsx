import React from "react";
import { AnimatePresence } from "motion/react";
import { MOCK_CLIENTS } from "./data.ts";
import { Client, DeletedClient } from "./types.ts";
import StatsOverview from "./components/StatsOverview.tsx";
import FilterBar from "./components/FilterBar.tsx";
import ClientCard from "./components/ClientCard.tsx";
import {
  Building2,
  SearchX,
  RefreshCcw,
  Plus,
  X,
  Trash2,
  Clock,
  Undo2,
  Inbox,
} from "lucide-react";

export default function App() {
  // Backed by localStorage state for high-fidelity persistence
  const [clients, setClients] = React.useState<Client[]>(() => {
    const saved = localStorage.getItem("trycon_clients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            ...c,
            quantityUnit: c.quantityUnit || "rft",
          }));
        }
      } catch (e) {
        console.error(
          "Failed to load clients state, reverting to mock database",
          e,
        );
      }
    }
    return MOCK_CLIENTS.map((c) => ({
      ...c,
      quantityUnit: c.quantityUnit || "rft",
    }));
  });

  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState("");

  // Extra detailed live query items
  const [minRateSearch, setMinRateSearch] = React.useState("");
  const [minQtySearch, setMinQtySearch] = React.useState("");
  const [selectedUnitType, setSelectedUnitType] = React.useState<
    "all" | "rft" | "panels"
  >("all");

  // Form states under Editorial Aesthetic guidelines
  const [isAdding, setIsAdding] = React.useState(false);
  const [formName, setFormName] = React.useState("");
  const [formMobile, setFormMobile] = React.useState("");
  const [formLocation, setFormLocation] = React.useState("");
  const [formQuantity, setFormQuantity] = React.useState("");
  const [formQuantityUnit, setFormQuantityUnit] = React.useState<
    "rft" | "panels"
  >("rft");
  const [formRate, setFormRate] = React.useState("");
  const [formNotes, setFormNotes] = React.useState("");
  const [formError, setFormError] = React.useState("");

  // Delete modal dialog state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Edit client state
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);

  // Bin Vault state details
  const [deletedClients, setDeletedClients] = React.useState<DeletedClient[]>(
    () => {
      const saved = localStorage.getItem("trycon_deleted_clients");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to load deleted clients state", e);
        }
      }
      return [];
    },
  );

  const [isBinOpen, setIsBinOpen] = React.useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = React.useState(false);

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem("trycon_clients", JSON.stringify(clients));
  }, [clients]);

  React.useEffect(() => {
    localStorage.setItem(
      "trycon_deleted_clients",
      JSON.stringify(deletedClients),
    );
  }, [deletedClients]);

  // Purge any deleted clients older than 30 days based on their deletedAt stamp
  React.useEffect(() => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const activeBinClients = deletedClients.filter((c) => {
      const deletedTime = new Date(c.deletedAt).getTime();
      return now - deletedTime <= thirtyDaysInMs;
    });
    if (activeBinClients.length !== deletedClients.length) {
      setDeletedClients(activeBinClients);
    }
  }, [clients]);

  // Normalize site location text to title-case for dropdown and match cases
  const sortedUniqueLocations = React.useMemo(() => {
    const locations = clients.map((c) => {
      const loc = c.siteLocation.trim();
      return loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
    });
    return Array.from(new Set(locations)).sort();
  }, [clients]);

  // Sync lower-case inputs for simultaneous filtering
  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      // Name match (case-insensitive)
      const matchesName = client.buyerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Location match
      const clientLocationTitle =
        client.siteLocation.charAt(0).toUpperCase() +
        client.siteLocation.slice(1).toLowerCase();
      const matchesLocation = selectedLocation
        ? clientLocationTitle === selectedLocation
        : true;

      // Rate match
      const rateVal = parseFloat(minRateSearch);
      const matchesRate = isNaN(rateVal) ? true : client.rate >= rateVal;

      // Quantity match
      const qtyVal = parseFloat(minQtySearch);
      const matchesQty = isNaN(qtyVal) ? true : client.quantity >= qtyVal;

      // Unit match
      const registeredUnit = client.quantityUnit || "rft";
      const matchesUnit =
        selectedUnitType === "all" ? true : registeredUnit === selectedUnitType;

      return (
        matchesName &&
        matchesLocation &&
        matchesRate &&
        matchesQty &&
        matchesUnit
      );
    });
  }, [
    clients,
    searchTerm,
    selectedLocation,
    minRateSearch,
    minQtySearch,
    selectedUnitType,
  ]);

  // Next Client ID algorithm
  const generateNextId = () => {
    let maxNum = 100;
    clients.forEach((c) => {
      const match = c.id.match(/^TC-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `TC-${maxNum + 1}`;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Buyer name is required.");
      return;
    }
    if (!formMobile.trim()) {
      setFormError("Mobile number is required.");
      return;
    }
    if (!formLocation.trim()) {
      setFormError("Site location is required.");
      return;
    }

    const qty = parseFloat(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError(
        `Quantity (${formQuantityUnit === "panels" ? "Panels" : "Rft"}) must be a positive number.`,
      );
      return;
    }

    const r = parseFloat(formRate);
    if (isNaN(r) || r <= 0) {
      setFormError("Rate sold (₹) must be a positive number.");
      return;
    }

    if (editingClient) {
      // Edit mode: replace the client preserving id
      setClients((prev) =>
        prev.map((c) => {
          if (c.id === editingClient.id) {
            return {
              ...c,
              buyerName: formName.trim(),
              mobile: formMobile.trim(),
              siteLocation: formLocation.trim(),
              quantity: qty,
              quantityUnit: formQuantityUnit,
              rate: r,
              notes: formNotes.trim() || undefined,
            };
          }
          return c;
        }),
      );
    } else {
      // Create mode
      const newClient: Client = {
        id: generateNextId(),
        buyerName: formName.trim(),
        mobile: formMobile.trim(),
        siteLocation: formLocation.trim(),
        quantity: qty,
        quantityUnit: formQuantityUnit,
        rate: r,
        notes: formNotes.trim() || undefined,
      };
      setClients((prev) => [newClient, ...prev]);
    }

    // Reset Form
    setFormName("");
    setFormMobile("");
    setFormLocation("");
    setFormQuantity("");
    setFormQuantityUnit("rft");
    setFormRate("");
    setFormNotes("");
    setFormError("");
    setIsAdding(false);
    setEditingClient(null);
  };

  const handleCancelClick = () => {
    setFormName("");
    setFormMobile("");
    setFormLocation("");
    setFormQuantity("");
    setFormQuantityUnit("rft");
    setFormRate("");
    setFormNotes("");
    setFormError("");
    setIsAdding(false);
    setEditingClient(null);
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setFormName(client.buyerName);
    setFormMobile(client.mobile);
    setFormLocation(client.siteLocation);
    setFormQuantity(client.quantity.toString());
    setFormQuantityUnit(client.quantityUnit || "rft");
    setFormRate(client.rate.toString());
    setFormNotes(client.notes || "");
    setFormError("");
    setIsAdding(true);
  };

  const triggerDeletion = (id: string) => {
    setDeletingId(id);
  };

  const confirmDeletion = () => {
    if (deletingId) {
      const clientToDelete = clients.find((c) => c.id === deletingId);
      if (clientToDelete) {
        const newDeletedClient: DeletedClient = {
          ...clientToDelete,
          deletedAt: new Date().toISOString(),
        };
        setDeletedClients((prev) => [newDeletedClient, ...prev]);
      }
      setClients((prev) => prev.filter((c) => c.id !== deletingId));
      setDeletingId(null);
    }
  };

  const handleRestoreClient = (id: string) => {
    const toRestore = deletedClients.find((c) => c.id === id);
    if (toRestore) {
      const restoredClient: Client = {
        id: toRestore.id,
        buyerName: toRestore.buyerName,
        mobile: toRestore.mobile,
        siteLocation: toRestore.siteLocation,
        quantity: toRestore.quantity,
        quantityUnit: toRestore.quantityUnit,
        rate: toRestore.rate,
        notes: toRestore.notes,
      };

      setClients((prev) => [restoredClient, ...prev]);
      setDeletedClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handlePermanentDelete = (id: string) => {
    setDeletedClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEmptyBin = () => {
    setDeletedClients([]);
    setShowEmptyConfirm(false);
  };

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedLocation("");
    setMinRateSearch("");
    setMinQtySearch("");
    setSelectedUnitType("all");
  };

  const totalFootage = React.useMemo(() => {
    return filteredClients.reduce((sum, item) => {
      const unit = item.quantityUnit || "rft";
      const eqRft = unit === "panels" ? item.quantity * 8 : item.quantity;
      return sum + eqRft;
    }, 0);
  }, [filteredClients]);

  const totalValuation = React.useMemo(() => {
    return filteredClients.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );
  }, [filteredClients]);

  const formatRupee = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDeletedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getRemainingTime = (deletedAtStr: string) => {
    const deletedTime = new Date(deletedAtStr).getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expiryTime = deletedTime + thirtyDaysInMs;
    const msLeft = expiryTime - Date.now();

    if (msLeft <= 0) {
      return "Purged";
    }

    const seconds = Math.floor(msLeft / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} days, ${hours % 24} hrs`;
    } else if (hours > 0) {
      return `${hours} hrs, ${minutes % 60} mins`;
    } else {
      return `${minutes} mins remaining`;
    }
  };

  const binTotalFootage = React.useMemo(() => {
    return deletedClients.reduce((sum, item) => {
      const unit = item.quantityUnit || "rft";
      const eqRft = unit === "panels" ? item.quantity * 8 : item.quantity;
      return sum + eqRft;
    }, 0);
  }, [deletedClients]);

  const binTotalValuation = React.useMemo(() => {
    return deletedClients.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0,
    );
  }, [deletedClients]);

  return (
    <div
      id="dashboard-app"
      className="min-h-screen bg-[#F3F4F6] flex flex-col justify-between font-sans text-[#1A1A1A] relative overflow-hidden"
    >
      {/* Soft atmospheric blurred color gradient blobs in the background to amplify the glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#00FF7F]/6 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/8 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[10%] w-[35%] h-[35%] rounded-full bg-teal-200/5 blur-[100px] pointer-events-none z-0" />

      <div className="z-10 flex flex-col justify-between min-h-screen">
        {/* Sticky wrapper that keeps navigation bar beautifully at the top of viewport and dynamically reserves layout space */}
        <div
          id="app-nav-sticky-wrapper"
          className="sticky top-0 z-50 w-full bg-transparent py-4 pb-2"
        >
          <header
            id="app-nav-header"
            className="max-w-[1640px] mx-auto w-full px-4 sm:px-6 md:px-10"
          >
            <div className="relative bg-white/45 backdrop-blur-md border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.04)] hover:bg-white/55 rounded-2xl md:rounded-full px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 z-10">
              {/* Pure text brand identity */}
              <div
                id="brand-identity-block"
                className="text-center sm:text-left flex items-center gap-3"
              >
                <span className="w-3 h-3 rounded-full bg-[#00FF7F] shadow-[0_0_10px_#00FF7F] animate-pulse shrink-0" />
                <div>
                  <h1 className="text-base font-black tracking-tight uppercase leading-none text-[#1A1A1A] flex items-center gap-1.5">
                    Trycon Builtcare
                  </h1>
                  <p className="text-[9px] uppercase tracking-widest text-[#666666] font-extrabold mt-1">
                    Client Dashboard — All Clients Information
                  </p>
                </div>
              </div>

              {/* Quick Administrator Account and Liquid Glass Add Client Button */}
              <div className="flex gap-3 sm:gap-4 items-center">
                <button
                  id="header-bin-vault-btn"
                  onClick={() => {
                    setIsBinOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-blue-100 bg-white/80 hover:bg-white text-gray-700 hover:text-black hover:border-[#00FF7F]/40 hover:shadow-xs rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-200 cursor-pointer whitespace-nowrap"
                  title="Open Recycle Bin Vault"
                >
                  <Inbox className="w-3.5 h-3.5 text-gray-400" />
                  <span>Bin Vault</span>
                  {deletedClients.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[8.5px] font-black leading-none">
                      {deletedClients.length}
                    </span>
                  )}
                </button>

                <button
                  id="header-add-client-btn"
                  onClick={() => {
                    setIsAdding(true);
                    setEditingClient(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white hover:text-[#00FF7F] rounded-full font-bold text-[10px] uppercase tracking-widest transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap hover:scale-[1.02] active:scale-[0.98]"
                  title="Register New Client"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Client
                </button>

                <div className="h-4 w-[1px] bg-gray-200 hidden sm:block" />

                <div
                  className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200/50 shadow-xs flex items-center justify-center font-extrabold text-xs text-emerald-800 shrink-0 select-none cursor-help"
                  title="Administrator Account Account: JD"
                >
                  JD
                </div>
              </div>
            </div>
          </header>
        </div>

        {/* Main Content Sections */}
        <main
          id="main-section"
          className="max-w-[1640px] mx-auto w-full px-4 sm:px-6 md:px-10 pt-8 sm:pt-12 pb-8"
        >
          {/* Add Client Form Section rendered as a stunning overlay modal with blurred backdrop */}
          {isAdding && (
            <div
              id="add-client-form-modal-overlay"
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md overflow-y-auto"
              onClick={handleCancelClick}
            >
              <div
                id="add-client-form-container"
                className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl overflow-hidden border-t-8 border-t-[#00FF7F] animate-in zoom-in-95 duration-200 my-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]">
                      {editingClient
                        ? `Modify Contract — ID: ${editingClient.id}`
                        : "Register New Client Contract"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {editingClient
                        ? "Update current client details and recalculate totals"
                        : "Complete the form below to register the precast construction order"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                    title="Close Form"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 border-l-4 border-l-red-500 text-xs font-bold rounded">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label
                        id="form-label-name"
                        className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                      >
                        Buyer Name / Enterprise
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Landmark Developers"
                        className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium transition-all outline-none text-[#1A1A1A]"
                      />
                    </div>
                    <div>
                      <label
                        id="form-label-mobile"
                        className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                      >
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={formMobile}
                        onChange={(e) => setFormMobile(e.target.value)}
                        placeholder="e.g. +91 91234 56789"
                        className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium transition-all outline-none text-[#1A1A1A]"
                      />
                    </div>
                    <div>
                      <label
                        id="form-label-location"
                        className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                      >
                        Site Location / City
                      </label>
                      <input
                        type="text"
                        required
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        placeholder="e.g. Coimbatore"
                        className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium transition-all outline-none text-[#1A1A1A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Quantity & Unit Toggle split block */}
                    <div>
                      <label
                        id="form-label-quantity"
                        className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                      >
                        Quantity Choice
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          min="1"
                          value={formQuantity}
                          onChange={(e) => setFormQuantity(e.target.value)}
                          placeholder={
                            formQuantityUnit === "panels"
                              ? "e.g. 15 Panels"
                              : "e.g. 120 Rft"
                          }
                          className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium transition-all outline-none text-[#1A1A1A]"
                        />
                        <select
                          value={formQuantityUnit}
                          onChange={(e) =>
                            setFormQuantityUnit(
                              e.target.value as "rft" | "panels",
                            )
                          }
                          className="bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg px-3 text-xs font-bold transition-all outline-none text-[#1A1A1A] cursor-pointer"
                        >
                          <option value="rft">Rft</option>
                          <option value="panels">Panels</option>
                        </select>
                      </div>
                    </div>

                    {/* Rate Sold (₹) replaces per rft constraint */}
                    <div>
                      <label
                        id="form-label-rate"
                        className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                      >
                        Rate Sold (₹) — per{" "}
                        {formQuantityUnit === "panels" ? "Panel" : "Rft"}
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formRate}
                        onChange={(e) => setFormRate(e.target.value)}
                        placeholder="e.g. 1400"
                        className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium transition-all outline-none text-[#1A1A1A]"
                      />
                    </div>

                    {/* Equivalent estimations informational panel */}
                    <div className="bg-[#F9FAFB] border border-gray-200/50 rounded-lg p-3 flex flex-col justify-center">
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">
                        Equivalent Estimation
                      </span>
                      <span className="text-xs font-semibold text-gray-600">
                        {formQuantity && !isNaN(parseFloat(formQuantity)) ? (
                          formQuantityUnit === "rft" ? (
                            <span>
                              ~{" "}
                              <strong>
                                {Math.ceil(parseFloat(formQuantity) / 8)} Panels
                              </strong>{" "}
                              (at 8 Rft per Panel-Bay)
                            </span>
                          ) : (
                            <span>
                              ~{" "}
                              <strong>
                                {parseFloat(formQuantity) * 8} Rft
                              </strong>{" "}
                              active span equivalent
                            </span>
                          )
                        ) : (
                          <span className="italic text-gray-400 text-xs">
                            Enter quantity
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      id="form-label-notes"
                      className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2"
                    >
                      Order Remarks / Installation Notes (Optional)
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Requires heavy crane setup due to high slope gradient..."
                      className="w-full bg-[#F5F5F5] border-2 border-transparent focus:border-[#00FF7F] focus:bg-white rounded-lg py-2.5 px-4 text-sm font-medium outline-none transition-all h-20 resize-none text-[#1A1A1A]"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCancelClick}
                      className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#00FF7F] hover:brightness-105 text-[#1A1A1A] font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      {editingClient ? "Save Changes" : "Register Contract"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Real-time calculated Overview Cards */}
          <StatsOverview
            filteredClients={filteredClients}
            totalLocations={sortedUniqueLocations.length}
          />

          {/* Dynamic Filtering Panel */}
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            minRateSearch={minRateSearch}
            setMinRateSearch={setMinRateSearch}
            minQtySearch={minQtySearch}
            setMinQtySearch={setMinQtySearch}
            selectedUnitType={selectedUnitType}
            setSelectedUnitType={setSelectedUnitType}
            uniqueLocations={sortedUniqueLocations}
            clients={clients}
            filteredCount={filteredClients.length}
          />

          {/* Dynamic wider split workspace to maximize screen space and avoid white spaces */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
            {/* Main Left Region - Client Cards Board (takes 9/12 = 75% width on widescreen desktops) */}
            <div className="lg:col-span-9 space-y-6">
              {/* High-Fidelity Results Header Strip */}
              <div className="px-5 py-3.5 bg-white/45 backdrop-blur-md border border-white/60 rounded-xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-3xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-emerald-800 bg-[#00FF7F]/15 px-2.5 py-0.5 rounded-full border border-[#00FF7F]/25 shrink-0">
                    {filteredClients.length}{" "}
                    {filteredClients.length === 1 ? "Client" : "Clients"} Found
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    Current Location context:{" "}
                    <span className="font-bold text-gray-800">
                      {selectedLocation || "All Sites"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Responsive Grid Listing of dynamic client cards */}
              <section id="grid-listing-section">
                {filteredClients.length > 0 ? (
                  <div
                    id="clients-grid"
                    className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredClients.map((client) => {
                        // Ensure Pune or any mixed case location displays as titlecase
                        const normalizedLocation =
                          client.siteLocation.charAt(0).toUpperCase() +
                          client.siteLocation.slice(1).toLowerCase();
                        const displayClient = {
                          ...client,
                          siteLocation: normalizedLocation,
                        };

                        return (
                          <ClientCard
                            key={displayClient.id}
                            client={displayClient}
                            onDelete={triggerDeletion}
                            onEdit={handleEditClick}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Empty Search Results State Layout block */
                  <div
                    id="empty-results-pane"
                    className="flex flex-col items-center justify-center bg-white border border-[#EAEAEA] rounded-xl p-12 text-center shadow-xs"
                  >
                    <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-4 border border-gray-100">
                      <SearchX className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                      No matching clients discovered
                    </h3>
                    <p className="text-sm text-[#555555] mt-1.5 max-w-sm mx-auto">
                      No manufacturing accounts match the specified criteria or
                      location choice. Try resetting the criteria.
                    </p>
                    <div className="flex gap-3 mt-5 flex-wrap justify-center font-sans">
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm active:scale-95 transition-all focus:outline-none cursor-pointer"
                      >
                        Reset Filters
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAdding(true);
                          setEditingClient(null);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#00FF7F] hover:bg-[#00E672] text-[#1A1A1A] font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-sm active:scale-95 transition-all focus:outline-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Client
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Right Region - Precast Live Analytics (takes 3/12 = 25% width on widescreen desktops) */}
            <div className="lg:col-span-3 space-y-6">
              {/* 1. Top Location Distribution Shares */}
              <div className="bg-white/45 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm hover:border-[#00FF7F]/40 transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF7F] shadow-[0_0_8px_#00FF7F] shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]">
                    Regional Priorities
                  </h3>
                </div>

                <div className="space-y-4 font-sans">
                  {sortedUniqueLocations.slice(0, 4).map((loc) => {
                    const locClients = clients.filter((c) => {
                      const clientLocTitle =
                        c.siteLocation.charAt(0).toUpperCase() +
                        c.siteLocation.slice(1).toLowerCase();
                      return clientLocTitle === loc;
                    });
                    const locRft = locClients.reduce((sum, item) => {
                      const unit = item.quantityUnit || "rft";
                      return (
                        sum +
                        (unit === "panels" ? item.quantity * 8 : item.quantity)
                      );
                    }, 0);

                    const maxRftAcrossAll =
                      clients.reduce((sum, item) => {
                        const unit = item.quantityUnit || "rft";
                        return (
                          sum +
                          (unit === "panels"
                            ? item.quantity * 8
                            : item.quantity)
                        );
                      }, 0) || 1;

                    const percentageOfTotal = Math.round(
                      (locRft / maxRftAcrossAll) * 100,
                    );

                    return (
                      <div key={loc} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-750 truncate capitalize">
                            {loc}
                          </span>
                          <span className="text-gray-400 font-mono text-[11px] tabular-nums">
                            {locRft.toLocaleString()} Rft ({percentageOfTotal}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden border border-gray-200/40">
                          <div
                            className="bg-[#00FF7F] h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(5, Math.min(100, percentageOfTotal))}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {sortedUniqueLocations.length === 0 && (
                    <p className="text-[11px] text-gray-400 italic">
                      No locations configured.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Editorial Aesthetic Glassmorphic Footer Status */}
      <footer
        id="app-footer"
        className="bg-white/70 backdrop-blur-md border-t border-white/60 py-5 mt-16 shadow-3xs"
      >
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-500 lowercase tracking-normal">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center sm:self-auto text-center sm:text-left">
            © {new Date().getFullYear()} Trycon Builtcare — Production Grade MVP
            Dashboard
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                TOTAL FOOTAGE
              </span>
              <span className="text-sm font-black text-[#1A1A1A] tabular-nums">
                {totalFootage.toLocaleString()} Rft
              </span>
            </div>
            <div className="w-[1px] h-4 bg-[#EAEAEA]/80 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                VALUATION
              </span>
              <span className="text-sm font-black text-[#008040] font-mono">
                {formatRupee(totalValuation)}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal Overlay */}
      {deletingId && (
        <div
          id="delete-confirmation-overlay"
          className="fixed inset-0 bg-[#1A1A1A]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            id="delete-confirmation-dialog"
            className="bg-white/85 backdrop-blur-lg border-t-8 border-t-red-500 border border-white/60 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-black uppercase text-[#1A1A1A] tracking-tight mb-2">
              Confirm Account Deletion
            </h3>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              ID under review: {deletingId}
            </p>
            <p className="text-sm text-gray-600 mb-6 font-medium">
              Are you sure you want to remove this client registration? This
              action is immediate and will remove the buyer from the
              manufacturing queue.
            </p>
            <div className="flex justify-end gap-3 text-sm font-bold">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded text-xs font-bold text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                Delete Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recycle Bin Vault Overlay Modal */}
      {isBinOpen && (
        <div
          id="bin-vault-overlay"
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            id="bin-vault-dialog"
            className="relative bg-white border border-gray-150 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-650 rounded-xl border border-rose-100/50">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-[#1A1A1A]">
                    Recycle Bin Vault
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Contracts here are retrievable for 30 days after deletion.
                    Once the timer expires, they are permanently purged.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBinOpen(false)}
                className="p-1.5 hover:bg-gray-150 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                title="Close Vault"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[250px]">
              {/* If there are items, show stats summary inside space */}
              {deletedClients.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 block mb-0.5">
                      VAULT COUNT
                    </span>
                    <span className="text-xl font-extrabold text-[#1A1A1A]">
                      {deletedClients.length} Pending purge
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 block mb-0.5">
                      TOTAL BIN SPAN
                    </span>
                    <span className="text-xl font-extrabold text-[#1A1A1A]">
                      {binTotalFootage.toLocaleString()} Rft
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-105 rounded-xl p-3.5">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 block mb-0.5">
                      RECOVERABLE VALUE
                    </span>
                    <span className="text-xl font-extrabold text-emerald-800 font-mono">
                      {formatRupee(binTotalValuation)}
                    </span>
                  </div>
                </div>
              )}

              {deletedClients.length > 0 ? (
                <div className="space-y-3">
                  {deletedClients.map((client) => {
                    const remainingStr = getRemainingTime(client.deletedAt);
                    return (
                      <div
                        key={client.id}
                        className="p-4 bg-white hover:bg-gray-50/50 border border-gray-150 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all duration-200"
                      >
                        {/* Client details context */}
                        <div className="space-y-1 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-105 text-gray-500 rounded border border-gray-150">
                              {client.id}
                            </span>
                            <span
                              className="text-sm font-bold text-gray-950 truncate max-w-[200px]"
                              title={client.buyerName}
                            >
                              {client.buyerName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-400">
                            <span className="font-medium text-gray-500 capitalize">
                              {client.siteLocation}
                            </span>
                            <span>•</span>
                            <span className="font-mono text-gray-500">
                              {client.mobile}
                            </span>
                          </div>
                          {client.notes && (
                            <p className="text-[11px] text-gray-400 italic font-medium line-clamp-1 mt-0.5">
                              &ldquo;{client.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* Mid Section: Deletion Info */}
                        <div className="flex flex-wrap gap-4 items-stretch md:items-center">
                          <div className="text-left md:text-right">
                            <span className="text-[9.5px] font-extrabold text-gray-400 uppercase tracking-widest block">
                              FOOTAGE & TOTAL
                            </span>
                            <span className="text-xs font-bold text-gray-700">
                              {client.quantity}{" "}
                              {client.quantityUnit === "panels"
                                ? "Panels"
                                : "Rft"}{" "}
                              •
                              <strong className="text-emerald-850 ml-1">
                                {formatRupee(client.quantity * client.rate)}
                              </strong>
                            </span>
                          </div>

                          <div className="w-[1px] bg-gray-150 hidden md:block self-stretch" />

                          <div className="text-left md:text-right min-w-[130px]">
                            <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">
                              DELETED AT
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              {formatDeletedDate(client.deletedAt)}
                            </span>
                          </div>

                          <div className="w-[1px] bg-gray-150 hidden md:block self-stretch" />

                          {/* Remaining Countdown indicator */}
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/65 border border-amber-200/50 text-amber-800 rounded-lg min-w-[145px] select-none justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-xs font-extrabold font-mono tracking-tight whitespace-nowrap">
                              {remainingStr}
                            </span>
                          </div>
                        </div>

                        {/* Recovery Action operations */}
                        <div className="flex items-center gap-2 shrink-0 justify-end pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <button
                            type="button"
                            onClick={() => handleRestoreClient(client.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00FF7F]/10 hover:bg-[#00FF7F]/20 text-emerald-950 font-bold text-xs uppercase tracking-wider rounded-lg border border-[#00FF7F]/25 hover:border-[#00FF7F]/65 transition-all cursor-pointer shadow-3xs"
                            title="Restore contract instantly"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-emerald-750" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(client.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all cursor-pointer"
                            title="Purge permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="p-4 bg-gray-50 text-gray-400 rounded-full mb-4 border border-gray-150">
                    <Inbox className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight">
                    Recycle Vault Is Empty
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Any registered constructor accounts you remove from the live
                    dashboard will store here for 30 days before getting
                    automatically purged.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/60 flex justify-between items-center flex-wrap gap-4">
              <div>
                {deletedClients.length > 0 && !showEmptyConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(true)}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                  >
                    Empty Bin Vault
                  </button>
                )}

                {showEmptyConfirm && (
                  <div className="flex items-center gap-2.5 animate-in slide-in-from-left-2 duration-150">
                    <span className="text-xs text-rose-700 font-bold">
                      Permanently empty all?
                    </span>
                    <button
                      type="button"
                      onClick={handleEmptyBin}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Yes, Empty All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmptyConfirm(false)}
                      className="px-3 py-1.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsBinOpen(false)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
