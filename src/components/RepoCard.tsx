import React from "react";
import { Repository } from "../types";
import { motion } from "motion/react";
import { Star, GitFork, ArrowUpRight, Award, ShieldAlert, Sparkles, Terminal } from "lucide-react";

interface RepoCardProps {
  repo: Repository;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RepoCard({ repo, isSelected, onSelect }: RepoCardProps) {
  // Determine explosion rating colors
  const score = repo.analysis.explosionScore;
  let scoreColorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
  let scoreProgressClass = "bg-emerald-500";
  let scoreStatusLabel = "High Growth";

  if (score >= 90) {
    scoreColorClass = "text-rose-600 bg-rose-50 border-rose-200";
    scoreProgressClass = "bg-rose-500";
    scoreStatusLabel = "Hyper Critical";
  } else if (score >= 80) {
    scoreColorClass = "text-indigo-600 bg-indigo-50 border-indigo-200";
    scoreProgressClass = "bg-indigo-500";
    scoreStatusLabel = "Viral Breakthrough";
  } else if (score >= 70) {
    scoreColorClass = "text-violet-600 bg-violet-50 border-violet-200";
    scoreProgressClass = "bg-violet-500";
    scoreStatusLabel = "Accelerating";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onSelect}
      className={`relative flex flex-col p-5 bg-white border rounded-2xl cursor-pointer transition-all ${
        isSelected
          ? "border-indigo-600 ring-2 ring-indigo-50/80 shadow-md"
          : "border-slate-200 shadow-sm hover:shadow hover:border-slate-300"
      }`}
      id={`repo-card-${repo.id}`}
    >
      {/* Top Header Row with Repo Identity */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {repo.ownerAvatar ? (
            <img
              src={repo.ownerAvatar}
              alt={repo.owner}
              className="w-8 h-8 rounded-lg border border-slate-100 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">
              {repo.owner.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-slate-400 block tracking-tight truncate">
              {repo.owner}
            </span>
            <h3 className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600">
              {repo.name}
            </h3>
          </div>
        </div>

        {/* Explosion Indicator Badge */}
        <div className={`flex flex-col items-end flex-shrink-0 text-right`}>
          <div className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold tracking-wide uppercase ${scoreColorClass}`}>
            Index: {score}
          </div>
          <span className="text-[9px] font-medium text-slate-400 mt-1">
            {scoreStatusLabel}
          </span>
        </div>
      </div>

      {/* Repository Description */}
      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed min-h-[32px]">
        {repo.description}
      </p>

      {/* Dynamic Sub-Category Pill */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-full">
          <Sparkles className="w-2.5 h-2.5" />
          {repo.analysis.subCategory}
        </span>
        {repo.language && (
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
            {repo.language}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-[1px] bg-slate-100 w-full mb-3.5" />

      {/* AI Review Snippet */}
      <div className="bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl text-[11px] mb-4 space-y-1">
        <div className="flex items-center gap-1 text-slate-500 font-bold">
          <Award className="w-3 h-3 text-amber-500" />
          <span>Core Innovation:</span>
        </div>
        <p className="text-slate-700 italic leading-snug">
          "{repo.analysis.keyInnovation}"
        </p>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-slate-400 fill-slate-100" />
            {repo.stars.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            {repo.forks.toLocaleString()}
          </span>
        </div>

        <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-0.5 group-hover:underline">
          Deep Scan
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
}
