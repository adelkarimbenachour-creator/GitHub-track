import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  TrendingUp,
  Code2,
  Award,
  Sparkles,
  GitFork,
  Star,
  ExternalLink,
  MessageSquare,
  Send,
  Zap,
  Activity,
  Compass,
  CheckCircle2,
  Cpu,
  Bookmark,
  Calendar,
  AlertCircle,
  Scale,
  ArrowLeftRight,
  X,
  Layers,
  Check,
  Settings,
  Sliders,
  Github,
  LogOut,
  Download,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Repository, ScanCategory, ScanResult, IntelligenceInsights, ComparisonResult } from "./types";

const SUGGESTED_QUESTIONS = [
  "How can I quickly integrate this repository into my local workflow?",
  "What are the main target use cases and target audience for this project?",
  "Are there any open-source or commercial alternatives to this?",
  "How does this project address security, performance, or scalability concerns?"
];

export default function App() {
  const [category, setCategory] = useState<ScanCategory>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("cat") || params.get("category");
      if (cat && ["all", "agents", "llms", "multimedia", "infra"].includes(cat)) {
        return cat as ScanCategory;
      }
    }
    return "all";
  });
  const [customKeyword, setCustomKeyword] = useState<string>("");
  const [coreDirective, setCoreDirective] = useState<string>(() => localStorage.getItem("research_core_directive") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempDirective, setTempDirective] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [insights, setInsights] = useState<IntelligenceInsights | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("q") || "";
    }
    return "";
  });
  
  // GitHub Authentication States
  const [githubUser, setGithubUser] = useState<{
    username: string;
    avatarUrl: string;
    name: string;
    token: string;
  } | null>(() => {
    const saved = localStorage.getItem("github_user_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for success message from popup (after callback completes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }
      
      if (event.data?.type === "OAUTH_AUTH_SUCCESS") {
        const { token, username, avatarUrl, name } = event.data;
        const newUser = { token, username, avatarUrl, name };
        setGithubUser(newUser);
        localStorage.setItem("github_user_session", JSON.stringify(newUser));
        setAuthLoading(false);
        setAuthError(null);
        // Trigger scan update with new token
        fetchScan(category, searchQuery, coreDirective, token);
      }
    };
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [category, searchQuery, coreDirective]);
  
  // Repo Q&A state
  const [question, setQuestion] = useState<string>("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [asking, setAsking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Comparison States
  const [compareRepo1, setCompareRepo1] = useState<Repository | null>(null);
  const [compareRepo2, setCompareRepo2] = useState<Repository | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparingLoading, setComparingLoading] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Floating Overlays & Drawer States
  const [isSectorSynthesisOpen, setIsSectorSynthesisOpen] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Export analysis functions
  const handleExportMarkdown = (repo: Repository) => {
    const customQA = answers[repo.id] ? `\n\n## 💬 Interactive AI Consultation\n${answers[repo.id]}\n` : '';
    const mdContent = `# AI Deep-Dive Analysis: ${repo.fullName}

## 📊 Repository Metadata
- **URL**: ${repo.url}
- **Language**: ${repo.language || "Not specified"}
- **Stars**: ${repo.stars.toLocaleString()}
- **Forks**: ${repo.forks.toLocaleString()}
- **Created**: ${repo.created}
- **Description**: ${repo.description || "No description provided."}

## 🧠 Core Innovation
${repo.analysis?.keyInnovation || "N/A"}

## 🎯 Target Audience
${repo.analysis?.targetAudience || "N/A"}

## 🏷️ Category Classification
- **Sub-Domain**: ${repo.analysis?.subCategory || "N/A"}

## ⚡ Adoption Catalyst (Why It's Booming)
${repo.analysis?.whyBooming || "N/A"}

## 🛠️ Primary Use Cases
${(repo.analysis?.primaryUseCases || []).map(uc => `- ${uc}`).join("\n")}${customQA}

---
*Generated by Velocity Track - Live AI Intelligence Platform on ${new Date().toLocaleDateString()}*
`;

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${repo.name}-analysis.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = (repo: Repository) => {
    const exportData = {
      repository: {
        id: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        stars: repo.stars,
        forks: repo.forks,
        language: repo.language,
        topics: repo.topics,
        url: repo.url,
        owner: repo.owner,
        created: repo.created,
      },
      aiAnalysis: repo.analysis,
      customConsultation: answers[repo.id] || null,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${repo.name}-analysis.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalRepos = repositories.length;
  const avgExplosionScore = totalRepos
    ? Math.round(repositories.reduce((acc: number, repo: Repository) => acc + (repo.analysis?.explosionScore || 0), 0) / totalRepos)
    : 0;

  const languageCounts = repositories.reduce((acc, repo) => {
    const lang = repo.language || "Other";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageStats = Object.entries(languageCounts)
    .map(([name, count]) => ({
      name,
      count: count as number,
      percentage: totalRepos ? Math.round(((count as number) / totalRepos) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const starLeaders = [...repositories]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  const fetchScan = async (cat: ScanCategory, keyword: string = "", directive: string = coreDirective, token: string = githubUser?.token || "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, customKeyword: keyword, coreDirective: directive, githubToken: token }),
      });

      if (!response.ok) {
        throw new Error(`Failed to scan: ${response.statusText}`);
      }

      const data: ScanResult = await response.json();
      setRepositories(data.repositories || []);
      setInsights(data.insights || null);
      
      // Auto-select first repository as default detail
      if (data.repositories && data.repositories.length > 0) {
        setSelectedRepo(data.repositories[0]);
      } else {
        setSelectedRepo(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while scanning GitHub.");
    } finally {
      setLoading(false);
    }
  };

  // Run scan on initial mount and when category changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q") || "";
    fetchScan(category, urlQuery || searchQuery, coreDirective, githubUser?.token || "");
  }, [category]);

  const handleCategoryChange = (newCat: ScanCategory) => {
    setCategory(newCat);
    const params = new URLSearchParams(window.location.search);
    params.set("cat", newCat);
    const newRelativePathQuery = window.location.pathname + "?" + params.toString();
    window.history.pushState(null, "", newRelativePathQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    const newRelativePathQuery = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
    window.history.pushState(null, "", newRelativePathQuery);
    fetchScan(category, searchQuery, coreDirective, githubUser?.token || "");
  };

  const handleGithubConnect = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await fetch(`/api/auth/github/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        throw new Error(`Failed to request authentication URL: ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.error === "GITHUB_CLIENT_ID_MISSING" || !data.url) {
        setAuthError("GITHUB_CLIENT_ID is missing from server environment variables. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in the Secrets panel in the AI Studio settings menu to connect your real account.");
        setAuthLoading(false);
        return;
      }

      // Open OAuth provider directly in popup
      const authWindow = window.open(
        data.url,
        "github_oauth_popup",
        "width=600,height=700"
      );

      if (!authWindow) {
        setAuthError("Popup window blocked. Please enable popups for this origin to connect your GitHub account.");
        setAuthLoading(false);
      }
    } catch (err: any) {
      console.error("GitHub Auth Error:", err);
      setAuthError(err.message || "An error occurred during GitHub integration.");
      setAuthLoading(false);
    }
  };

  const handleGithubDisconnect = () => {
    setGithubUser(null);
    localStorage.removeItem("github_user_session");
    fetchScan(category, searchQuery, coreDirective, "");
  };

  const handleAskQuestion = async (qText: string) => {
    if (!selectedRepo || !qText.trim() || asking) return;
    setAsking(true);
    try {
      const response = await fetch("/api/ask-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: selectedRepo.fullName,
          description: selectedRepo.description,
          question: qText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to consult Gemini advisor.");
      }

      const data = await response.json();
      setAnswers((prev) => ({
        ...prev,
        [selectedRepo.id]: data.answer,
      }));
      setQuestion("");
    } catch (err: any) {
      setAnswers((prev) => ({
        ...prev,
        [selectedRepo.id]: `Error: ${err.message || "Could not generate answer."}`,
      }));
    } finally {
      setAsking(false);
    }
  };

  // Run side-by-side AI comparative analysis
  const runComparativeAnalysis = async () => {
    if (!compareRepo1 || !compareRepo2) return;
    setComparingLoading(true);
    setCompareError(null);
    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo1: compareRepo1, repo2: compareRepo2 }),
      });

      if (!response.ok) {
        throw new Error("Comparative API failed.");
      }

      const data = await response.json();
      setComparisonResult(data);
    } catch (err: any) {
      console.error(err);
      setCompareError("Could not retrieve AI comparative intelligence report.");
    } finally {
      setComparingLoading(false);
    }
  };

  const handleAddToCompare = (repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation();
    // If already in Slot 1, remove it
    if (compareRepo1?.id === repo.id) {
      setCompareRepo1(null);
      setComparisonResult(null);
      return;
    }
    // If already in Slot 2, remove it
    if (compareRepo2?.id === repo.id) {
      setCompareRepo2(null);
      setComparisonResult(null);
      return;
    }

    if (!compareRepo1) {
      setCompareRepo1(repo);
    } else if (!compareRepo2) {
      setCompareRepo2(repo);
    } else {
      // Both are full, cycle Slot 2 out
      setCompareRepo2(repo);
      setComparisonResult(null);
    }
  };

  const clearComparison = () => {
    setCompareRepo1(null);
    setCompareRepo2(null);
    setComparisonResult(null);
    setIsComparing(false);
  };

  // Automatically trigger comparative evaluation if both slots are full
  useEffect(() => {
    if (compareRepo1 && compareRepo2) {
      runComparativeAnalysis();
    } else {
      setComparisonResult(null);
    }
  }, [compareRepo1?.id, compareRepo2?.id]);

  return (
    <div className="min-h-screen bg-indigo-950 text-white font-sans flex flex-col selection:bg-pink-500 selection:text-white overflow-x-hidden pb-24">
      {/* Dynamic Glow Accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-10 w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Header Section */}
      <header className="h-20 px-6 md:px-12 flex items-center justify-between bg-white/5 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-pink-500/20">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                Velocity-Track
              </h1>
              <span className="text-[9px] font-bold bg-pink-500/20 text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/30 uppercase tracking-widest">
                v2.1
              </span>
            </div>
            <p className="text-[9px] text-indigo-300 font-bold tracking-[0.2em] uppercase">
              AI Velocity Scanner & Compare
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Comparison Status Indicator */}
          {(compareRepo1 || compareRepo2) && (
            <button
              onClick={() => {
                if (compareRepo1 && compareRepo2) {
                  setIsComparing(!isComparing);
                }
              }}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-bold transition-all ${
                compareRepo1 && compareRepo2
                  ? "bg-pink-500/20 border-pink-500/40 text-pink-300 animate-pulse cursor-pointer hover:bg-pink-500/30"
                  : "bg-white/5 border-white/15 text-indigo-200 cursor-default"
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-pink-400" />
              <span>
                {compareRepo1 && compareRepo2
                  ? "Comparison Ready (2/2)"
                  : compareRepo1
                  ? "Select one more to compare (1/2)"
                  : "Compare Slots Empty"}
              </span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">
              Live GitHub API Connected
            </span>
          </div>

          <button
            onClick={() => fetchScan(category, searchQuery, coreDirective, githubUser?.token || "")}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-indigo-200 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
            title="Force refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              setTempDirective(coreDirective);
              setIsSettingsOpen(true);
            }}
            className="p-2 bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 text-indigo-200 hover:text-white transition-all flex items-center gap-2"
            title="Configure Research Agent"
          >
            <Settings className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 md:px-8 py-6 grid grid-cols-12 gap-6">
        
        {/* Left Side: Stats & Metrics Dashboard */}
        <section className="col-span-12 lg:col-span-3 order-2 lg:order-1 flex flex-col gap-6">
          
          {/* Sector Synthesis Action Button */}
          {insights && (
            <button
              onClick={() => setIsSectorSynthesisOpen(true)}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-3xl border border-indigo-400/30 flex items-center justify-between gap-3 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer group shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-yellow-300 group-hover:rotate-45 transition-transform" />
                </div>
                <div className="text-left">
                  <div className="text-[9px] font-extrabold uppercase text-yellow-300 tracking-wider">Macro Outlook</div>
                  <div className="text-sm font-black uppercase tracking-tight">Sector Synthesis</div>
                </div>
              </div>
              <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
            </button>
          )}

          {/* Quick Scanner Metric */}
          <div className="p-6 bg-indigo-900/40 border border-white/10 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute right-3 top-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-16 h-16 text-yellow-300" />
            </div>
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-pink-500" />
              Scanner Diagnostics
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-400 tracking-tighter">
                  Best {repositories.length} Projects
                </p>
                <p className="text-xs text-white/60">Scanned & Enriched In Category</p>
              </div>
              <div className="h-[1px] bg-white/10"></div>
              <div>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-tighter">
                  {avgExplosionScore || "--"}/100
                </p>
                <p className="text-xs text-white/60">Avg AI Growth Velocity Index</p>
              </div>
            </div>
          </div>

          {/* Technology Stack Chart */}
          <div className="p-6 bg-indigo-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Dominant Language Stack
            </h3>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-6 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : languageStats.length > 0 ? (
              <div className="space-y-3">
                {languageStats.map((stat, i) => (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{stat.name}</span>
                      <span className="text-white/60 font-mono text-[11px]">
                        {stat.count} {stat.count > 1 ? "repos" : "repo"} ({stat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          i === 0
                            ? "bg-gradient-to-r from-pink-500 to-rose-500"
                            : i === 1
                            ? "bg-gradient-to-r from-cyan-400 to-indigo-400"
                            : "bg-indigo-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-indigo-300/60 italic">No technology metrics parsed.</p>
            )}
          </div>

          {/* Star Leaders List */}
          <div className="p-6 bg-indigo-900/30 border border-white/10 rounded-3xl backdrop-blur-sm flex-1">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              Leaderboard Velocity
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : starLeaders.length > 0 ? (
              <div className="space-y-3">
                {starLeaders.map((repo) => {
                  const isSelected = selectedRepo?.id === repo.id;
                  return (
                    <button
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepo(repo);
                        setIsComparing(false);
                        setIsPreviewOpen(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                        isSelected
                          ? "bg-pink-500/20 border-pink-500/50"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold truncate text-white block max-w-[150px]">
                          {repo.name}
                        </span>
                        <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded-md font-bold text-yellow-300 border border-white/10 shrink-0">
                          ★ {repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-300 truncate mt-1">
                        {repo.owner}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-indigo-300/60 italic">No items trending.</p>
            )}

            {/* Trending Tags Decoration */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2.5">
                Trending AI Vectors
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-bold bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full text-white cursor-pointer transition-colors">
                  #agents
                </span>
                <span className="text-[9px] font-bold bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full text-pink-300 cursor-pointer transition-colors">
                  #vlm-multimodal
                </span>
                <span className="text-[9px] font-bold bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full text-white cursor-pointer transition-colors">
                  #deep-reasoning
                </span>
                <span className="text-[9px] font-bold bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded-full text-cyan-300 cursor-pointer transition-colors">
                  #rag-optimization
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Panel: Switches between Repository List/Detail or Side-by-Side Comparison */}
        {isComparing && compareRepo1 && compareRepo2 ? (
          /* =================== FULL-WIDTH SIDE-BY-SIDE COMPARISON PANEL =================== */
          <section className="col-span-12 lg:col-span-9 flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-900/40 border border-white/10 rounded-[32px] p-6 backdrop-blur-sm shadow-2xl relative overflow-hidden"
            >
              {/* Comparison Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Scale className="w-5 h-5 text-pink-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-400">
                      Vibrant Spec Comparison Sandbox
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black italic tracking-tight uppercase">
                    Comparative Matrix
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={runComparativeAnalysis}
                    disabled={comparingLoading}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:opacity-90 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${comparingLoading ? "animate-spin" : ""}`} />
                    Refresh AI Specs
                  </button>
                  <button
                    onClick={() => setIsComparing(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Close Compare
                  </button>
                </div>
              </div>

              {/* Side-by-Side Specifications Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 relative">
                {/* Visual Connector / Versus badge */}
                <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-pink-500 text-white font-black text-xs items-center justify-center border-4 border-indigo-950 shadow-xl shadow-pink-500/30 z-10">
                  VS
                </div>

                {/* Left Repository Column */}
                <div className="bg-indigo-950/80 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      {compareRepo1.ownerAvatar ? (
                        <img
                          src={compareRepo1.ownerAvatar}
                          alt={compareRepo1.owner}
                          className="w-12 h-12 rounded-xl border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-900 flex items-center justify-center font-bold text-indigo-300">
                          {compareRepo1.owner.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase">{compareRepo1.owner}</span>
                        <h3 className="text-xl font-black text-white">{compareRepo1.name}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-pink-400">+{compareRepo1.analysis?.explosionScore * 8.5}%</div>
                      <span className="text-[9px] text-indigo-200 uppercase font-bold">Growth Velocity</span>
                    </div>
                  </div>

                  {/* Specification Table Fields */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Explosion Velocity Index</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-yellow-400">{compareRepo1.analysis?.explosionScore}</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full"
                            style={{ width: `${compareRepo1.analysis?.explosionScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">AI Sub-Domain</span>
                      <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-xs font-black inline-block uppercase border border-pink-500/25">
                        {compareRepo1.analysis?.subCategory || "General AI"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Dominant Language</span>
                      <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-black inline-block">
                        {compareRepo1.language || "Multi-Language"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1.5">Primary Innovation Spec</span>
                      <p className="text-xs text-slate-200 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3.5 font-medium">
                        "{compareRepo1.analysis?.keyInnovation}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Adoption Catalyst Summary</span>
                      <p className="text-xs text-indigo-100 leading-relaxed italic">
                        {compareRepo1.analysis?.whyBooming}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-2">Target End Users</span>
                      <span className="text-xs bg-indigo-900 border border-white/10 px-3 py-1.5 rounded-xl font-bold text-white">
                        {compareRepo1.analysis?.targetAudience}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-2">Primary Use Cases</span>
                      <div className="flex flex-wrap gap-1.5">
                        {compareRepo1.analysis?.primaryUseCases.map((useCase, i) => (
                          <span key={i} className="text-[10px] bg-white/10 hover:bg-white/15 text-white px-2.5 py-1 rounded-md font-bold">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-between text-xs text-indigo-200">
                      <span>★ {compareRepo1.stars.toLocaleString()} Stars</span>
                      <span>⑂ {compareRepo1.forks.toLocaleString()} Forks</span>
                    </div>
                  </div>
                </div>

                {/* Right Repository Column */}
                <div className="bg-indigo-950/80 border border-white/5 rounded-3xl p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      {compareRepo2.ownerAvatar ? (
                        <img
                          src={compareRepo2.ownerAvatar}
                          alt={compareRepo2.owner}
                          className="w-12 h-12 rounded-xl border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-900 flex items-center justify-center font-bold text-indigo-300">
                          {compareRepo2.owner.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-indigo-300 font-bold uppercase">{compareRepo2.owner}</span>
                        <h3 className="text-xl font-black text-white">{compareRepo2.name}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-pink-400">+{compareRepo2.analysis?.explosionScore * 8.5}%</div>
                      <span className="text-[9px] text-indigo-200 uppercase font-bold">Growth Velocity</span>
                    </div>
                  </div>

                  {/* Specification Table Fields */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Explosion Velocity Index</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-yellow-400">{compareRepo2.analysis?.explosionScore}</span>
                        <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-full rounded-full"
                            style={{ width: `${compareRepo2.analysis?.explosionScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">AI Sub-Domain</span>
                      <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-lg text-xs font-black inline-block uppercase border border-pink-500/25">
                        {compareRepo2.analysis?.subCategory || "General AI"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Dominant Language</span>
                      <span className="px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-black inline-block">
                        {compareRepo2.language || "Multi-Language"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1.5">Primary Innovation Spec</span>
                      <p className="text-xs text-slate-200 leading-relaxed bg-white/5 border border-white/5 rounded-xl p-3.5 font-medium">
                        "{compareRepo2.analysis?.keyInnovation}"
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-1">Adoption Catalyst Summary</span>
                      <p className="text-xs text-indigo-100 leading-relaxed italic">
                        {compareRepo2.analysis?.whyBooming}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-2">Target End Users</span>
                      <span className="text-xs bg-indigo-900 border border-white/10 px-3 py-1.5 rounded-xl font-bold text-white">
                        {compareRepo2.analysis?.targetAudience}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-indigo-300 font-bold uppercase block mb-2">Primary Use Cases</span>
                      <div className="flex flex-wrap gap-1.5">
                        {compareRepo2.analysis?.primaryUseCases.map((useCase, i) => (
                          <span key={i} className="text-[10px] bg-white/10 hover:bg-white/15 text-white px-2.5 py-1 rounded-md font-bold">
                            {useCase}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-between text-xs text-indigo-200">
                      <span>★ {compareRepo2.stars.toLocaleString()} Stars</span>
                      <span>⑂ {compareRepo2.forks.toLocaleString()} Forks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gemini AI Synergy & Differentiator Synthesis */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-pink-300">
                    Gemini AI Comparative Synthesis
                  </h3>
                </div>

                {comparingLoading ? (
                  <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
                    <p className="text-xs text-indigo-200 animate-pulse mt-2 font-bold uppercase tracking-widest">
                      Evaluating Market Positions, Synergy, and Architecture Trees...
                    </p>
                  </div>
                ) : compareError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-300">
                    {compareError}
                  </div>
                ) : comparisonResult ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <span className="text-[9px] text-pink-400 font-extrabold uppercase block mb-1">
                          Market Positioning Analysis
                        </span>
                        <p className="text-xs text-slate-100 leading-relaxed">
                          {comparisonResult.comparisonSummary}
                        </p>
                      </div>

                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <span className="text-[9px] text-pink-400 font-extrabold uppercase block mb-1">
                          Key Technical Differentiator
                        </span>
                        <p className="text-xs text-slate-100 leading-relaxed">
                          {comparisonResult.keyDifferentiator}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                        <span className="text-[9px] text-yellow-400 font-extrabold uppercase block mb-1">
                          Strategic Decision Tree Guide
                        </span>
                        <p className="text-xs text-slate-100 leading-relaxed">
                          {comparisonResult.recommendedScenario}
                        </p>
                      </div>

                      <div className="bg-indigo-600/20 border border-indigo-400/20 p-4 rounded-2xl">
                        <span className="text-[9px] text-cyan-300 font-extrabold uppercase block mb-1">
                          Integration & Synergy Potential
                        </span>
                        <p className="text-xs text-cyan-100 leading-relaxed font-semibold">
                          {comparisonResult.synergyPotential}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-indigo-300/60 italic text-center p-4">
                    Comparison analytical scan not initialized. Fill slots to scan automatically.
                  </div>
                )}
              </div>
            </motion.div>
          </section>
        ) : (
          /* =================== REGULAR BROWSE & ANALYSIS VIEW =================== */
          <>
            {/* Center: Repositories list & Filter bar */}
            <section className="col-span-12 lg:col-span-9 order-1 lg:order-2 flex flex-col gap-6">
              
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-black italic tracking-tight uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Exploding Repos
                </h2>
                
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
                  <input
                    type="text"
                    placeholder="Search custom keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-xs rounded-xl pl-9 pr-8 py-2 text-white outline-none placeholder-indigo-300 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-indigo-300 absolute left-3 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        const params = new URLSearchParams(window.location.search);
                        params.delete("q");
                        const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
                        window.history.pushState(null, "", newUrl);
                        fetchScan(category, "");
                      }}
                      className="text-indigo-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </form>
              </div>

              {/* Real-time Category Selector */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-indigo-900/45 rounded-2xl border border-white/10">
                {[
                  { id: "all", label: "All AI" },
                  { id: "agents", label: "🤖 Agents" },
                  { id: "llms", label: "🧠 LLMs" },
                  { id: "multimedia", label: "🎨 Multimedia" },
                  { id: "infra", label: "🗄️ Infra / RAG" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleCategoryChange(tab.id as ScanCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      category === tab.id
                        ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/25"
                        : "text-indigo-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Loader or Error states */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-h-[400px] flex flex-col items-center justify-center gap-3 bg-indigo-900/20 rounded-3xl border border-white/10"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-pink-500 animate-spin" />
                      <Cpu className="w-5 h-5 text-pink-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-sm font-bold text-white uppercase tracking-wider">
                        Scanning GitHub API...
                      </p>
                      <p className="text-[11px] text-indigo-300">
                        Applying AI Growth Algorithms with Gemini
                      </p>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-center space-y-3"
                  >
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <h3 className="text-sm font-extrabold text-red-400 uppercase tracking-wider">
                      Scan Diagnostics Failure
                    </h3>
                    <p className="text-xs text-red-200">{error}</p>
                    <button
                      onClick={() => fetchScan(category, searchQuery)}
                      className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors inline-block"
                    >
                      Retry Scan
                    </button>
                  </motion.div>
                ) : repositories.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 min-h-[350px] flex flex-col items-center justify-center text-center p-6 bg-indigo-900/10 rounded-3xl border border-white/10"
                  >
                    <Zap className="w-8 h-8 text-indigo-400/60 mb-2" />
                    <h4 className="text-sm font-extrabold text-white uppercase">No Breakouts Detected</h4>
                    <p className="text-xs text-indigo-300 max-w-xs mt-1">
                      No newly-created repositories in this category match our high-velocity parameters.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full p-2 pr-4"
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-8">
                      {repositories.map((repo, idx) => {
                      const isSelected = selectedRepo?.id === repo.id;
                      const score = repo.analysis?.explosionScore || 50;
                      
                      const isInCompare1 = compareRepo1?.id === repo.id;
                      const isInCompare2 = compareRepo2?.id === repo.id;
                      const isAnyCompare = isInCompare1 || isInCompare2;

                      // Vary background theme colors to match Vibrant Palette's high-impact cards
                      let cardBg = "bg-white text-slate-900";
                      let badgeBg = "bg-pink-500 text-white";
                      let subBadgeBg = "bg-indigo-950 text-white";
                      let growthColor = "text-rose-600";
                      let descColor = "text-slate-600";

                      if (idx % 4 === 1) {
                        cardBg = "bg-yellow-400 text-slate-950";
                        badgeBg = "bg-black text-yellow-400";
                        subBadgeBg = "bg-black/10 text-slate-900";
                        growthColor = "text-black";
                        descColor = "text-slate-800 font-semibold";
                      } else if (idx % 4 === 2) {
                        cardBg = "bg-cyan-400 text-slate-950";
                        badgeBg = "bg-black/25 text-slate-950";
                        subBadgeBg = "bg-slate-900/10 text-slate-900";
                        growthColor = "text-indigo-950";
                        descColor = "text-slate-900 font-medium";
                      } else if (idx % 4 === 3) {
                        cardBg = "bg-indigo-600 text-white border-2 border-indigo-400";
                        badgeBg = "bg-yellow-400 text-indigo-950";
                        subBadgeBg = "bg-indigo-950 text-white";
                        growthColor = "text-yellow-300";
                        descColor = "text-indigo-100 italic";
                      }

                      return (
                        <motion.div
                          key={repo.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          onClick={() => {
                            setSelectedRepo(repo);
                            setIsPreviewOpen(true);
                          }}
                          className={`rounded-[32px] p-6 flex flex-col justify-between cursor-pointer transition-all relative ${cardBg} ${
                            isSelected && isPreviewOpen ? "ring-4 ring-pink-500 shadow-2xl scale-[1.01]" : "hover:scale-[1.005]"
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${badgeBg}`}>
                                  Score: {score} Index
                                </span>
                                <h4 className="text-xl md:text-2xl font-black tracking-tight mt-2.5 truncate max-w-[280px]">
                                  {repo.name}
                                </h4>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-xl font-black tracking-tighter ${growthColor}`}>
                                  +{Math.round(score * 8.5)}%
                                </p>
                                <p className="text-[9px] font-extrabold uppercase opacity-80">
                                  Velocity Index
                                </p>
                              </div>
                            </div>

                            <p className={`text-xs mt-2 line-clamp-2 leading-relaxed ${descColor}`}>
                              {repo.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between mt-6 pt-3 border-t border-black/5 gap-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${subBadgeBg}`}>
                                {repo.analysis?.subCategory || "AI Tool"}
                              </span>
                              <span className="text-xs font-black flex items-center gap-1 opacity-90">
                                ★ {repo.stars.toLocaleString()}
                              </span>
                            </div>

                            <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedRepo(repo);
                                  setIsPreviewOpen(true);
                                }}
                                className="px-3.5 py-1.5 bg-indigo-950 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                              >
                                <Eye className="w-3.5 h-3.5 text-pink-400" />
                                Aperçu
                              </button>

                              <button
                                onClick={(e) => handleAddToCompare(repo, e)}
                                className={`px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shadow-md ${
                                  isAnyCompare
                                    ? "bg-pink-600 text-white hover:bg-pink-700"
                                    : "bg-black/10 text-slate-800 hover:bg-black/20"
                                }`}
                              >
                                {isAnyCompare ? "Selected" : "Compare"}
                                <Scale className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

          </>
        )}

      </main>

      {/* Floating Comparison Drawer/Bench */}
      {(compareRepo1 || compareRepo2) && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-4xl w-[92%] bg-indigo-950/95 border border-pink-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md z-40 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-pink-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-indigo-200">
                Spec Comparison Bench:
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Slot 1 */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                {compareRepo1 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <span className="font-bold max-w-[120px] truncate">{compareRepo1.name}</span>
                    <button onClick={() => setCompareRepo1(null)} className="text-indigo-400 hover:text-white ml-1 font-bold">✕</button>
                  </>
                ) : (
                  <span className="text-indigo-300/40 italic">Slot 1 Empty</span>
                )}
              </div>

              <div className="text-indigo-400 text-xs font-black">VS</div>

              {/* Slot 2 */}
              <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                {compareRepo2 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-bold max-w-[120px] truncate">{compareRepo2.name}</span>
                    <button onClick={() => setCompareRepo2(null)} className="text-indigo-400 hover:text-white ml-1 font-bold">✕</button>
                  </>
                ) : (
                  <span className="text-indigo-300/40 italic">Slot 2 Empty</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {compareRepo1 && compareRepo2 ? (
              <button
                onClick={() => setIsComparing(!isComparing)}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-pink-500/25 cursor-pointer flex items-center gap-1"
              >
                {isComparing ? "Exit Matrix" : "Launch Comparison Matrix 🚀"}
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2 bg-white/10 text-indigo-300/40 rounded-xl text-xs font-black uppercase tracking-wider cursor-not-allowed"
              >
                Select {compareRepo1 ? "1 more" : "2"} repos to compare
              </button>
            )}

            <button
              onClick={clearComparison}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-indigo-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Clear Comparison Bench"
            >
              Clear Bench
            </button>
          </div>
        </motion.div>
      )}

      {/* Sector Synthesis Modal Overlay */}
      <AnimatePresence>
        {isSectorSynthesisOpen && insights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setIsSectorSynthesisOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-indigo-950 to-indigo-900 border border-white/10 rounded-[32px] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative flex flex-col gap-4"
            >
              {/* Dynamic Glow */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Compass className="w-4 h-4 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight uppercase text-white">Sector Synthesis</h3>
                    <p className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider">Macro Outlook Report</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSectorSynthesisOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-indigo-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6 relative z-10 text-white">
                <div>
                  <h4 className="text-xl font-black tracking-tight mb-2">
                    {insights.trendTitle}
                  </h4>
                  <p className="text-xs text-indigo-200 leading-relaxed font-semibold">
                    {insights.trendSummary}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-[10px] font-black text-yellow-300 uppercase tracking-widest mb-2">
                    Market Growth Catalysts
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.growthDrivers.map((driver, index) => (
                      <div key={index} className="flex items-start gap-2.5 p-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-indigo-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="font-medium">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl">
                  <p className="text-[10px] font-black text-yellow-300 uppercase tracking-widest">
                    6-Month Macro Outlook
                  </p>
                  <p className="text-xs italic text-yellow-100 mt-1.5 leading-relaxed font-medium">
                    "{insights.keyTakeaway}"
                  </p>
                </div>
              </div>

              {/* Close Action */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-white/10 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsSectorSynthesisOpen(false)}
                  className="px-5 py-2.5 bg-yellow-400 text-indigo-950 hover:bg-yellow-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-yellow-400/20 cursor-pointer"
                >
                  Got It, Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repository Detail Preview Drawer Overlay */}
      <AnimatePresence>
        {isPreviewOpen && selectedRepo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-end"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-slate-900 w-full max-w-xl h-full shadow-2xl relative flex flex-col justify-between overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  {selectedRepo.ownerAvatar ? (
                    <img
                      src={selectedRepo.ownerAvatar}
                      alt={selectedRepo.owner}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-500 flex-shrink-0">
                      {selectedRepo.owner.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-widest">
                      Repository Analytics Aperçu
                    </div>
                    <h3 className="text-xl font-black text-slate-900 truncate leading-tight">
                      {selectedRepo.name}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Core Innovation & Target */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Core Innovation
                    </span>
                    <p className="text-xs text-slate-800 font-semibold bg-slate-50 border border-slate-100 rounded-2xl p-3.5 leading-relaxed">
                      {selectedRepo.analysis?.keyInnovation}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                        Target User
                      </span>
                      <span className="font-extrabold text-slate-800">{selectedRepo.analysis?.targetAudience}</span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                        Sub-Domain
                      </span>
                      <span className="font-extrabold text-pink-600">{selectedRepo.analysis?.subCategory}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Adoption Catalyst
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedRepo.analysis?.whyBooming}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Primary Applications
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRepo.analysis?.primaryUseCases.map((useCase, index) => (
                        <span
                          key={index}
                          className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/60"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Consult Interactive AI Advisor */}
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-3">
                    <MessageSquare className="w-4 h-4 text-pink-500" />
                    <span>Consult Gemini Tech Analyst</span>
                  </div>

                  {/* Predefined Questions */}
                  <div className="grid grid-cols-1 gap-1.5 mb-4 font-sans">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuestion(q);
                          handleAskQuestion(q);
                        }}
                        disabled={asking}
                        className="w-full text-left p-2.5 hover:bg-slate-50 active:bg-slate-100 rounded-xl text-[10px] text-slate-600 border border-slate-200/60 hover:border-slate-300 transition-all font-semibold leading-relaxed block cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Question Answers Display */}
                  {answers[selectedRepo.id] && (
                    <div className="mb-4 bg-indigo-50/50 border border-indigo-100/60 rounded-2xl p-4 text-xs text-slate-700 max-h-[180px] overflow-y-auto leading-relaxed">
                      <p className="font-extrabold text-[10px] text-indigo-600 uppercase mb-1">
                        Gemini Insight:
                      </p>
                      <div className="whitespace-pre-wrap font-medium">{answers[selectedRepo.id]}</div>
                    </div>
                  )}

                  {/* Ask Question Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskQuestion(question);
                    }}
                    className="relative flex items-center"
                  >
                    <input
                      type="text"
                      placeholder="Ask the analyst anything about this repo..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      disabled={asking}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs rounded-xl pl-3 pr-10 py-2.5 text-slate-900 outline-none font-medium"
                    />
                    <button
                      type="submit"
                      disabled={asking || !question.trim()}
                      className="absolute right-1.5 p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Export Actions Panel */}
                <div className="pt-6 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Export AI Insights & Analysis
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleExportMarkdown(selectedRepo)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 rounded-xl text-xs font-bold text-indigo-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Markdown
                    </button>
                    <button
                      onClick={() => handleExportJSON(selectedRepo)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
                <a
                  href={selectedRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-950 text-white hover:bg-black font-black text-xs uppercase tracking-widest text-center py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Source
                </a>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-indigo-950 border border-white/10 rounded-[32px] p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative flex flex-col gap-4"
            >
              {/* Dynamic Glow inside Settings */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                    <Sliders className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight uppercase">Agent Directives</h3>
                    <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Configure Gemini Research Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-indigo-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5 relative z-10">

                <div>
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-2">
                    Research Agent Custom Directive
                  </label>
                  <p className="text-[11px] text-white/70 leading-relaxed mb-3">
                    Modifying this directive guides Gemini's analysis, score calculations, technical reviews, and category tagging for trending repositories.
                  </p>
                  
                  <textarea
                    rows={4}
                    value={tempDirective}
                    onChange={(e) => setTempDirective(e.target.value)}
                    placeholder="e.g., Focus strictly on deep-learning performance, raw execution speed, memory footprint, and edge compilation support."
                    className="w-full bg-indigo-900/40 border border-white/10 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-2xl p-4 text-xs text-white outline-none placeholder-indigo-300/40 font-mono resize-none transition-all leading-relaxed"
                  />
                </div>

                {/* Predefined Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-2.5">
                    Select Quick Preset Directives
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        name: "Venture Capital Focus",
                        desc: "Analyze commercial readiness, user onboarding, and enterprise scaling.",
                        directive: "Prioritize product-market fit, commercialization potential, enterprise scalability, security compliance, and direct business integration models."
                      },
                      {
                        name: "Hardcore Engineer Focus",
                        desc: "Prioritize raw performance, developer ergonomics, and code architecture.",
                        directive: "Focus strictly on advanced code design, execution efficiency, framework modularity, tooling ergonomics, compilation pipelines, and benchmark performance."
                      },
                      {
                        name: "Open Source & Privacy First",
                        desc: "Highlight community freedom, decentralized data, and local operations.",
                        directive: "Prioritize strict data privacy, local/offline model execution, permissive open-source licenses, accessibility, and community-driven ethical AI patterns."
                      },
                      {
                        name: "Default System Analyst",
                        desc: "Reset to default balanced Silicon Valley advisory parameters.",
                        directive: ""
                      }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setTempDirective(preset.directive)}
                        className={`text-left p-3 rounded-2xl border text-xs transition-all ${
                          tempDirective === preset.directive
                            ? "bg-pink-500/10 border-pink-500/40 text-pink-300"
                            : "bg-white/5 border-transparent hover:bg-white/10 text-white"
                        }`}
                      >
                        <div className="font-extrabold uppercase tracking-wider text-[10px] mb-0.5 flex items-center justify-between">
                          <span>{preset.name}</span>
                          {tempDirective === preset.directive && (
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                          )}
                        </div>
                        <p className="text-[10px] text-indigo-300 leading-normal line-clamp-2">
                          {preset.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-white/10 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-indigo-300 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const directiveValue = tempDirective.trim();
                    setCoreDirective(directiveValue);
                    if (directiveValue) {
                      localStorage.setItem("research_core_directive", directiveValue);
                    } else {
                      localStorage.removeItem("research_core_directive");
                    }
                    setIsSettingsOpen(false);
                    fetchScan(category, searchQuery, directiveValue);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-pink-500/25 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply Directives
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Section */}
      <footer className="h-12 px-6 md:px-12 flex items-center justify-between bg-black/40 text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-indigo-300 mt-auto border-t border-white/5 fixed bottom-0 left-0 right-0 z-30">
        <div className="flex gap-4 md:gap-8 items-center overflow-x-auto whitespace-nowrap">
          <span>Live API Session</span>
          <span>Global AI Sentiment: <span className="text-green-400">Hyper Bullish</span></span>
          <span>Fastest Fork: <span className="text-pink-400">Agentic-OS</span></span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white hidden sm:inline">System Live</span>
        </div>
      </footer>
    </div>
  );
}
