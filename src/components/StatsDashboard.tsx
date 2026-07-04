import React from "react";
import { Repository } from "../types";
import { motion } from "motion/react";
import { TrendingUp, Code2, Award, Sparkles, AreaChart as ChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatsDashboardProps {
  repositories: Repository[];
  onSelectRepo: (repo: Repository) => void;
  selectedRepoId: number | null;
}

export default function StatsDashboard({
  repositories,
  onSelectRepo,
  selectedRepoId,
}: StatsDashboardProps) {
  if (repositories.length === 0) return null;

  // 1. Language Breakdown
  const languageCounts = repositories.reduce((acc, repo) => {
    const lang = repo.language || "Other";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalRepos = repositories.length;
  const languageStats = Object.entries(languageCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalRepos) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 2. High Velocity Stars
  const sortedByStars = [...repositories]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  const maxStars = sortedByStars[0]?.stars || 1;

  // 3. Average Explosion Score
  const avgExplosionScore = Math.round(
    repositories.reduce((acc, repo) => acc + repo.analysis.explosionScore, 0) /
      totalRepos
  );

  // 4. Trend Data Calculation
  const now = new Date().getTime();
  const trendData = [...repositories]
    .map((repo) => {
      const createdDate = new Date(repo.created).getTime();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      // Daily growth rate in stars
      const dailyStarsGrowth = Math.round((repo.stars / diffDays) * 10) / 10;

      return {
        id: repo.id,
        name: repo.name,
        date: new Date(repo.created).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        timestamp: createdDate,
        "Growth Velocity": dailyStarsGrowth,
        "Explosion Index": repo.analysis.explosionScore,
      };
    })
    // Sort chronologically by creation timestamp
    .sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-6" id="stats-dashboard">
      {/* Summary Score Card */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute right-3 top-3 opacity-10">
          <Sparkles className="w-16 h-16 text-indigo-600" />
        </div>
        <div className="flex items-center gap-3 mb-1">
          <Award className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Scanner Diagnostic
          </span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
          {avgExplosionScore}
          <span className="text-sm font-medium text-slate-500">
            Avg AI Explosion Index
          </span>
        </h3>
        <p className="text-xs text-slate-600 mt-2">
          Based on structural innovation, viral stargazers, and immediate developer utility.
        </p>
      </div>

      {/* Recharts Daily Growth Trend Line Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-900">Repository Growth Trend</h4>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            ★ Stars/Day vs Impact
          </span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={9}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 text-white border border-slate-800 p-3 rounded-xl shadow-xl text-[11px] space-y-1 max-w-[190px]">
                        <p className="font-bold text-slate-100 truncate">{data.name}</p>
                        <p className="text-[9px] text-slate-400">Created: {data.date}</p>
                        <div className="h-px bg-slate-800 my-1" />
                        <p className="flex justify-between gap-4">
                          <span className="text-indigo-400">Stars/Day:</span>
                          <span className="font-mono font-bold text-indigo-300">★ {data["Growth Velocity"]}</span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-pink-400">Explosion Index:</span>
                          <span className="font-mono font-bold text-pink-300">{data["Explosion Index"]}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="Growth Velocity"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#4f46e5" }}
              />
              <Line
                type="monotone"
                dataKey="Explosion Index"
                stroke="#db2777"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ r: 2, fill: "#db2777", strokeWidth: 0 }}
                activeDot={{ r: 4, fill: "#db2777" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] font-medium text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-indigo-600 inline-block"></span>
            <span>Stars / Day</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-pink-500 border-t border-dashed border-pink-500 inline-block"></span>
            <span>Explosion Index</span>
          </div>
        </div>
      </div>

      {/* Language Popularity Bar Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-slate-700" />
          <h4 className="text-sm font-bold text-slate-900">Dominant AI Stack</h4>
        </div>
        <div className="space-y-3">
          {languageStats.map((stat, i) => (
            <div key={stat.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{stat.name}</span>
                <span className="text-slate-500">
                  {stat.count} {stat.count > 1 ? "repos" : "repo"} ({stat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${
                    i === 0
                      ? "bg-indigo-600"
                      : i === 1
                      ? "bg-violet-500"
                      : i === 2
                      ? "bg-purple-400"
                      : "bg-slate-400"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Star Leaders Velocity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-slate-700" />
          <h4 className="text-sm font-bold text-slate-900">Star Leaders Velocity</h4>
        </div>
        <div className="space-y-3.5">
          {sortedByStars.map((repo, i) => {
            const ratio = (repo.stars / maxStars) * 100;
            const isSelected = selectedRepoId === repo.id;

            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className={`group cursor-pointer p-1.5 rounded-lg transition-all ${
                  isSelected
                    ? "bg-indigo-50 border-l-4 border-indigo-600 pl-2"
                    : "hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[150px] group-hover:text-indigo-600 transition-colors">
                    {repo.name}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    ★ {repo.stars.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    className="bg-indigo-500 h-full rounded-full group-hover:bg-indigo-600 transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
