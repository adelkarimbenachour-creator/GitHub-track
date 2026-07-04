import React from "react";
import { IntelligenceInsights } from "../types";
import { motion } from "motion/react";
import { Shield, Flame, Compass, Activity, CheckCircle2 } from "lucide-react";

interface IntelligenceReportProps {
  insights: IntelligenceInsights;
  loading: boolean;
}

export default function IntelligenceReport({
  insights,
  loading,
}: IntelligenceReportProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-slate-200 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-5/6" />
        </div>
        <div className="h-1 bg-slate-200 rounded w-full my-4" />
        <div className="space-y-3">
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="h-5 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6" id="intelligence-report">
      {/* Header Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-indigo-50 border border-indigo-200">
          <Activity className="w-3 h-3 text-indigo-600" />
        </div>
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
          AI Sector intelligence
        </span>
      </div>

      {/* Main Trend Title & Summary */}
      <div className="space-y-2.5">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
          {insights.trendTitle}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {insights.trendSummary}
        </p>
      </div>

      <div className="h-[1px] bg-slate-100 w-full" />

      {/* Core Market Growth Drivers */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>Core Catalyst Drivers</span>
        </div>
        <ul className="space-y-2.5">
          {insights.growthDrivers.map((driver, index) => (
            <motion.li
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              key={index}
              className="flex items-start gap-2.5 text-xs text-slate-600"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="leading-tight">{driver}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="h-[1px] bg-slate-100 w-full" />

      {/* 6-Month Strategic Takeaway */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span>6-Month Macro Outlook</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "{insights.keyTakeaway}"
        </p>
      </div>
    </div>
  );
}
