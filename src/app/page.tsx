"use client";
import React, { useState, useEffect, useRef } from "react";
import { NoiseBackground } from "@/components/ui/noise-background";
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
          <div className="h-px bg-gradient-to-r from-[#00e5ff]/50 to-transparent flex-1 opacity-50"></div>
          <h4 className="text-[#00e5ff] uppercase tracking-widest text-[0.7rem] font-bold flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/20">
            <Atom className="w-3.5 h-3.5" /> {splitCamelCase(title)}
          </h4>
          <div className="h-px bg-gradient-to-l from-[#00e5ff]/50 to-transparent flex-1 opacity-50"></div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
          {Array.from({ length: multiplier }).map((_, m) => (
            <div key={m} className="overflow-hidden bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-white/[0.02] border-b border-white/10">
                    <tr>
                      {baseCols.map((c) => (
                        <th key={c} className="px-6 py-4 font-semibold tracking-wider text-[0.75rem] uppercase text-slate-400">
                          {splitCamelCase(c)} 
                          {subVal[c].Unit && <span className="text-slate-500 normal-case ml-1.5 tracking-normal">({subVal[c].Unit})</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {Array.from({ length: R }).map((_, i) => {
                      let dataIndex = m * R + i;
                      if (dataIndex >= totalRows) return null;
                      return (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors duration-200 group">
                          {baseCols.map((c, index) => (
                            <td key={c} className={`px-6 py-3.5 text-slate-200 ${index === 0 ? 'font-medium text-white/90 group-hover:text-[#00e5ff] transition-colors' : 'font-light font-mono text-[0.9rem]'}`}>
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
            className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-3xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.08] hover:border-[#00e5ff]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all duration-300 group"
          >
            <span className="text-slate-400 text-[0.7rem] font-bold uppercase tracking-widest mb-3 group-hover:text-[#00e5ff] transition-colors">{splitCamelCase(key)}</span>
            <span className="text-2xl font-semibold text-white tracking-tight" dangerouslySetInnerHTML={{ __html: formatVal(val) }}></span>
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
          className="w-full text-slate-300"
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
        className="w-full text-slate-300"
      >
        {standardProps.length > 0 && renderStandardProps(standardProps)}
        {tempProps.map(([subKey, subVal]: [string, any]) => renderTempTable(subKey, subVal))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#03050c] text-white font-sans relative overflow-x-hidden selection:bg-[#00e5ff]/30">
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
      
      <AnimatePresence mode="wait">
        {!selectedMaterial ? (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="min-h-screen flex flex-col items-center justify-center relative z-10 px-6 pointer-events-none"
          >
            <div className="w-full max-w-3xl text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="pointer-events-auto"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                  <span className="flex w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">Data Platform</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00e5ff] to-white tracking-tight pointer-events-auto leading-[1.1] animate-text-shine glow-text">
                  ASME PLUS
                </h1>
                <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Search, analyze, and extract <span className="text-white font-medium">precise material properties</span> from asme database.
                </p>
              </motion.div>

              <motion.div 
                ref={searchRef} 
                className="relative w-full mx-auto pointer-events-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <NoiseBackground gradientColors={["#00e5ff", "#9d00ff", "#050814"]} className="p-[1px] rounded-[16px] group-focus-within:shadow-[0_0_40px_rgba(0,229,255,0.3)] transition-all duration-500">
                  <div className="flex items-center bg-[#060913]/90 backdrop-blur-3xl px-3 py-1.5 rounded-[15px] group">
                    <Search className="w-6 h-6 text-slate-400 ml-4 shrink-0 transition-colors group-focus-within:text-[#00e5ff] group-focus-within:scale-110 duration-300" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full bg-transparent text-white px-5 py-4 outline-none text-[1.15rem] font-medium placeholder-slate-500/80 tracking-wide"
                      placeholder="Search material parameters (e.g., SA 516 Gr 60)..."
                      autoComplete="off"
                      spellCheck="false"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                        className="p-2.5 mr-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </NoiseBackground>
                
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%+12px)] left-0 right-0 bg-[#0a0f1d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 z-50"
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onClick={() => selectMaterial(s)}
                          className="px-6 py-4 text-slate-200 hover:bg-[#00e5ff]/10 hover:text-[#00e5ff] cursor-pointer border-b border-white/5 last:border-none flex items-center justify-between group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-[#00e5ff] transition-colors shadow-[0_0_10px_transparent] group-hover:shadow-[#00e5ff]"></span>
                            <span className="font-medium text-lg tracking-wide">{s.Name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#00e5ff]" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Suggestions */}
                
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen p-4 md:p-8 relative z-10 pointer-events-none"
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e5ff] to-[#9d00ff] flex items-center justify-center shadow-lg shadow-[#00e5ff]/20">
                    <Atom className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white group-hover:text-[#00e5ff] transition-colors tracking-tight">
                    Material<span className="font-light text-slate-400">DB</span>
                  </h1>
                </div>

                <div ref={searchRef} className="relative w-full lg:w-[200px] z-50 pointer-events-auto">
                  <div className="flex items-center bg-[#0a0f1d]/80 backdrop-blur-xl px-2 py-0.5 rounded-xl border border-white/10 focus-within:border-[#00e5ff]/50 transition-colors shadow-inner">
                    <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      className="w-full bg-transparent text-slate-100 px-3 py-2.5 outline-none text-sm font-medium placeholder-slate-500"
                      placeholder="Search another material..."
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(""); setSuggestions([]); }}
                        className="p-1 mr-1 rounded-full hover:bg-white/10 text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0a0f1d]/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                      >
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => selectMaterial(s)}
                            className="px-4 py-3 text-slate-300 hover:bg-[#00e5ff]/10 hover:text-[#00e5ff] cursor-pointer border-b border-white/5 last:border-none text-sm font-medium transition-colors flex items-center justify-between"
                          >
                            <span>{s.Name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
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
                  className="flex flex-col bg-gradient-to-b from-[#0a0f1d]/90 to-[#0a0f1d]/40 backdrop-blur-3xl border border-white/10 border-t-white/20 rounded-3xl p-5 sticky top-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] pointer-events-auto"
                >
                  <div className="mb-8 px-3 pt-2">
                    <p className="text-[0.65rem] font-bold text-[#00e5ff] tracking-widest uppercase mb-2">Selected Material</p>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight">{selectedMaterial.Name}</h2>
                  </div>
                  <div className="flex flex-col gap-1">
                    {Object.keys(selectedMaterial)
                      .filter((k) => k !== "Name" && typeof selectedMaterial[k] === "object")
                      .map((key) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={`text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-all relative group flex items-center justify-between overflow-hidden ${
                            activeTab === key
                              ? "bg-gradient-to-r from-[#00e5ff]/15 to-transparent text-white border border-[#00e5ff]/20 shadow-[inset_4px_0_0_#00e5ff]"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className={`w-4 h-4 ${activeTab === key ? "text-[#00e5ff]" : "text-slate-500 group-hover:text-slate-300"}`}>
                              {getTabIcon(key)}
                            </div>
                            <span>{splitCamelCase(key)}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === key ? "text-[#00e5ff]" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
                        </button>
                      ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleDownloadAnsys}
                        className="w-full bg-[#FFB71B] hover:bg-[#ECA918] active:bg-[#D99A15] text-black font-semibold text-sm py-2.5 px-4 rounded-md border border-[#D99A15] transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="18" 
                          height="18" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="flex-shrink-0"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                          <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <span>Export to Ansys</span>
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Main Content */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0a0f1d]/60 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-3xl shadow-2xl min-h-[600px] pointer-events-auto"
                >
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#00e5ff]/20 to-transparent border border-[#00e5ff]/30 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                      <div className="w-6 h-6 text-[#00e5ff]">
                        {getTabIcon(activeTab)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">
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
