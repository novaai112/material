"use client";
import React, { useState, useEffect, useRef } from "react";
import { SplashCursor } from "@/components/ui/splash-cursor";
import { Search, ChevronRight, X, Atom, Thermometer, Flame, Maximize, Activity, Shield, Info, Zap, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAnsysXML } from "@/lib/ansysExport";

export default function MaterialDashboard() {
  const [materialData, setMaterialData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/material.json")
      .then((res) => res.json())
      .then((data) => {
        const processedData = data.map((mat: any) => {
          let newMat = { ...mat };
          if (newMat.Properties) {
            if (newMat.Properties.IsotropicElasticity) newMat.IsotropicElasticity = newMat.Properties.IsotropicElasticity;
            if (newMat.Properties.CoefficientOfThermalExpansion) newMat.ThermalExpansion = newMat.Properties.CoefficientOfThermalExpansion;
            if (newMat.Properties.ThermalConductivity) newMat.ThermalConductivity = newMat.Properties.ThermalConductivity;
            if (newMat.Properties.SpecificHeat) newMat.SpecificHeat = newMat.Properties.SpecificHeat;
            if (newMat.Properties.Density) {
              if (!newMat.BaseInformation) newMat.BaseInformation = {};
              newMat.BaseInformation.Density = newMat.Properties.Density;
            }
            delete newMat.Properties;
          }
          return newMat;
        });
        setMaterialData(processedData);
      })
      .catch((err) => console.error("Error loading JSON:", err));

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalize = (str: string) => String(str).toLowerCase().replace(/[\s\-_]/g, "");
  const splitCamelCase = (text: string) => text.replace(/([A-Z])/g, " $1").trim().replace(/^./, (str) => str.toUpperCase());

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = normalize(e.target.value);
    setSearchQuery(e.target.value);
    if (!query) {
      setSuggestions([]);
      return;
    }
    const matches = materialData.filter((item) => normalize(item.Name).includes(query));
    setSuggestions(matches.slice(0, 10));
  };

  const selectMaterial = (material: any) => {
    setSearchQuery(material.Name);
    setSelectedMaterial(material);
    setSuggestions([]);
    const firstKey = Object.keys(material).find((k) => k !== "Name" && typeof material[k] === "object");
    if (firstKey) setActiveTab(firstKey);
  };

  const handleDownloadAnsys = () => {
    if (!selectedMaterial) return;
    const xml = generateAnsysXML(selectedMaterial);
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedMaterial.Name.replace(/\s+/g, '_')}_Ansys.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isTempDependentTable = (obj: any) => obj && typeof obj === "object" && obj.Temperature && obj.Temperature.Values && Array.isArray(obj.Temperature.Values);

  const formatVal = (obj: any) => {
    if (obj === null || obj === undefined) return "-";
    if (typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.length > 0 ? obj.join(", ") : "-";
    if ("Value" in obj) {
      let val = obj.Value !== null ? obj.Value : "-";
      if (obj.Unit && val !== "-") val += `<span class="text-slate-500 font-normal text-sm ml-1.5 tracking-normal">${obj.Unit}</span>`;
      return val;
    }
    return "-";
  };

  const getTabIcon = (tabName: string) => {
    const name = tabName.toLowerCase();
    if (name.includes("elasticity") || name.includes("mechanical")) return <Activity className="w-full h-full" />;
    if (name.includes("thermal") && name.includes("expansion")) return <Maximize className="w-full h-full" />;
    if (name.includes("thermal") || name.includes("temperature")) return <Thermometer className="w-full h-full" />;
    if (name.includes("heat")) return <Flame className="w-full h-full" />;
    if (name.includes("base") || name.includes("info")) return <Info className="w-full h-full" />;
    if (name.includes("electrical") || name.includes("magnetic")) return <Zap className="w-full h-full" />;
    return <Shield className="w-full h-full" />;
  };

  const renderTempTable = (title: string, subVal: any) => {
    const baseCols = Object.keys(subVal);
    const numBase = baseCols.length;
    const multiplier = numBase <= 3 ? 2 : 1;
    const totalRows = subVal[baseCols[0]].Values.length;
    const R = Math.ceil(totalRows / multiplier);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        key={title}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px bg-gradient-to-r from-slate-300/50 to-transparent flex-1 opacity-50"></div>
          <h4 className="text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[0.7rem] font-bold flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-slate-300/20">
            <Atom className="w-3.5 h-3.5" /> {splitCamelCase(title)}
          </h4>
          <div className="h-px bg-gradient-to-l from-slate-300/50 to-transparent flex-1 opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          {Array.from({ length: multiplier }).map((_, m) => (
            <div key={m} className="overflow-hidden glass-panel rounded-2xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-500/10 border-b border-slate-300/20">
                    <tr>
                      {baseCols.map((c) => (
                        <th key={c} className="px-6 py-4 font-semibold tracking-wider text-[0.75rem] uppercase text-slate-600 dark:text-slate-300">
                          {splitCamelCase(c)}
                          {subVal[c].Unit && <span className="text-slate-500 normal-case ml-1.5 tracking-normal">({subVal[c].Unit})</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300/10">
                    {Array.from({ length: R }).map((_, i) => {
                      let dataIndex = m * R + i;
                      if (dataIndex >= totalRows) return null;
                      return (
                        <tr key={i} className="hover:bg-slate-500/5 transition-colors duration-200 group">
                          {baseCols.map((c, index) => (
                            <td key={c} className={`px-6 py-3.5 text-slate-800 dark:text-slate-200 ${index === 0 ? 'font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors' : 'font-light font-mono text-[0.9rem]'}`}>
                              {subVal[c].Values[dataIndex] ?? "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderStandardProps = (standardProps: any[]) => {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12"
      >
        {standardProps.map(([key, val], i) => (
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }
            }}
            key={i}
            className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:bg-white/30 transition-all duration-300 group"
          >
            <span className="text-slate-500 text-[0.7rem] font-bold uppercase tracking-widest mb-3 group-hover:text-blue-600 transition-colors">{splitCamelCase(key)}</span>
            <span className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight" dangerouslySetInnerHTML={{ __html: formatVal(val) }}></span>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderTable = (dataObj: any, tabName: string) => {
    if (isTempDependentTable(dataObj)) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full text-slate-800 dark:text-slate-300"
        >
          {renderTempTable(tabName, dataObj)}
        </motion.div>
      );
    }

    const standardProps = Object.entries(dataObj).filter(([, v]) => !isTempDependentTable(v));
    const tempProps = Object.entries(dataObj).filter(([, v]) => isTempDependentTable(v));

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full text-slate-800 dark:text-slate-300"
      >
        {standardProps.length > 0 && renderStandardProps(standardProps)}
        {tempProps.map(([subKey, subVal]: [string, any]) => renderTempTable(subKey, subVal))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen font-outfit relative overflow-x-hidden selection:bg-blue-500/30 text-slate-800"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=3840&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
        
        .glass-panel {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        }
        .glass-search {
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.07);
        }
        .glass-dropdown {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.15);
        }
      `}} />

      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1440}
        DENSITY_DISSIPATION={3.5}
        VELOCITY_DISSIPATION={2.0}
        PRESSURE={0.1}
        CURL={3}
        SPLAT_RADIUS={0.2}
        SPLAT_FORCE={6000}
        COLOR_UPDATE_SPEED={10}
      />

      {/* Top Navbar */}
      {!selectedMaterial && (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-nav px-6 md:px-12 py-4 flex items-center justify-between pointer-events-auto transition-all">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-playfair font-bold text-[#0f172a] tracking-tight">Material<span className="font-light italic text-[#334155]">DB</span></span>
          </div>

          <div className="flex items-center gap-5 text-sm font-semibold">
            <a
              href="https://nova-analysis.vercel.app/"
              className="px-6 py-2.5 bg-[#0f172a] text-white rounded-full hover:bg-blue-600 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 tracking-wide"
            >
              Dashboard
            </a>
          </div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        {!selectedMaterial ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="min-h-screen flex flex-col items-center justify-center relative z-10 px-6 pt-20 pointer-events-none"
          >
            <div className="w-full max-w-4xl text-center flex flex-col items-center">

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="pointer-events-auto flex flex-col items-center"
              >
                <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-playfair font-bold mb-12 text-[#0f172a] tracking-tight pointer-events-auto leading-[1.05] drop-shadow-sm">
                  Find exact material properties in every moment.
                </h1>
              </motion.div>

              <motion.div
                ref={searchRef}
                className="relative w-full max-w-md mx-auto pointer-events-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="glass-search rounded-full transition-all duration-500 focus-within:shadow-[0_8px_24px_rgba(0,100,255,0.15)] focus-within:border-blue-300">
                  <div className="flex items-center px-1 py-1 group">
                    <Search className="w-5 h-5 text-slate-500 ml-4 shrink-0 transition-colors group-focus-within:text-blue-600 duration-300" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full bg-transparent text-[#0f172a] px-3 py-2.5 outline-none text-[1rem] font-medium placeholder-slate-600 tracking-wide"
                      placeholder="Search material..."
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                        className="p-2 mr-2 rounded-full hover:bg-slate-200/60 transition-colors text-slate-500 hover:text-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%+16px)] left-0 right-0 glass-dropdown rounded-2xl overflow-hidden z-50"
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onClick={() => selectMaterial(s)}
                          className="px-6 py-4 text-[#1e293b] hover:bg-blue-50/80 hover:text-blue-700 cursor-pointer border-b border-slate-200/50 last:border-none flex items-center justify-between group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                              <Atom className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                            </div>
                            <span className="font-semibold text-lg tracking-wide">{s.Name}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen p-4 md:p-8 pt-28 relative z-10 pointer-events-none"
          >
            <div className="max-w-[1400px] mx-auto flex flex-col gap-8">

              {/* Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 w-full"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer group pointer-events-auto"
                  onClick={() => setSelectedMaterial(null)}
                >
                  <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center shadow-lg group-hover:bg-white/60 transition-colors">
                    <ChevronRight className="w-6 h-6 text-[#0f172a] rotate-180" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-playfair font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors tracking-tight">
                      {selectedMaterial.Name}
                    </h1>
                    <p className="text-sm font-medium text-[#475569]">Material Database</p>
                  </div>
                </div>

                <div ref={searchRef} className="relative w-full lg:w-[300px] z-50 pointer-events-auto">
                  <div className="flex items-center glass-search px-2 py-1 rounded-2xl transition-colors focus-within:border-blue-400">
                    <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full bg-transparent text-[#0f172a] px-3 py-2.5 outline-none text-sm font-medium placeholder-slate-500"
                      placeholder="Search another material..."
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                        className="p-1.5 mr-1 rounded-full hover:bg-slate-200 text-slate-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 glass-dropdown rounded-xl overflow-hidden shadow-2xl z-50"
                      >
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => selectMaterial(s)}
                            className="px-4 py-3 text-[#1e293b] hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-slate-200/50 last:border-none text-sm font-medium transition-colors flex items-center justify-between"
                          >
                            <span>{s.Name}</span>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

                {/* Sidebar */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col glass-panel rounded-3xl p-5 sticky top-28 shadow-xl pointer-events-auto border border-white/60"
                >
                  <div className="mb-6 px-3 pt-2">
                    <p className="text-[0.7rem] font-bold text-blue-600 tracking-widest uppercase mb-2">Properties</p>
                    <div className="h-px w-full bg-slate-300/50 mt-4"></div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {Object.keys(selectedMaterial)
                      .filter((k) => k !== "Name" && typeof selectedMaterial[k] === "object")
                      .map((key) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`text-left px-4 py-3.5 rounded-2xl text-sm font-medium transition-all relative group flex items-center justify-between overflow-hidden ${activeTab === key
                              ? "bg-white/60 text-blue-700 shadow-sm border border-white"
                              : "text-slate-600 hover:bg-white/40 hover:text-slate-900 border border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-5 h-5 ${activeTab === key ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`}>
                              {getTabIcon(key)}
                            </div>
                            <span className={activeTab === key ? "font-bold" : "font-medium"}>{splitCamelCase(key)}</span>
                          </div>
                        </button>
                      ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-300/50">
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleDownloadAnsys}
                        className="w-full bg-white/40 hover:bg-white/70 active:bg-white/80 text-[#0f172a] font-bold text-sm py-3 px-4 rounded-2xl border border-white/60 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-blue-500/20 group backdrop-blur-md"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0 group-hover:-translate-y-0.5 transition-transform text-blue-600"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <span className="tracking-wide">Export to Ansys</span>
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel border border-white/60 p-6 md:p-10 rounded-3xl shadow-xl min-h-[600px] pointer-events-auto"
                >
                  <div className="flex items-center gap-5 mb-10 pb-6 border-b border-slate-300/50">
                    <div className="p-4 rounded-2xl bg-white/60 border border-white shadow-sm text-blue-600">
                      <div className="w-8 h-8">
                        {getTabIcon(activeTab)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl md:text-4xl font-playfair font-bold text-[#0f172a] tracking-tight">
                        {splitCamelCase(activeTab)}
                      </h3>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab && renderTable(selectedMaterial[activeTab], activeTab)}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
