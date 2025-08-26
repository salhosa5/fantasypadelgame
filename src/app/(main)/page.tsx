// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp, 
  Calendar, 
  Star,
  ChevronRight,
  Target,
  Zap
} from "lucide-react";

type User = {
  id: string;
  email: string;
  teamName: string;
} | null;

type DashboardData = {
  currentGameweek: string;
  deadline: string;
  timeLeft: string;
  userPoints: number;
  gameweekPoints: number;
  leagueRank: number;
  totalPlayers: number;
  transfersLeft: number;
  upcomingFixtures: Array<{
    player: string;
    opponent: string;
    difficulty: number;
    home: boolean;
  }>;
};

export default function HomePage() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        const j = await r.json();
        setUser(j.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      // Load multiple data sources in parallel
      const [gwResponse, leaderboardResponse] = await Promise.all([
        fetch("/api/admin/active-gw", { cache: "no-store" }),
        fetch("/api/leaderboard", { cache: "no-store" })
      ]);

      const gwData = gwResponse.ok ? await gwResponse.json() : null;
      const leaderboardData = leaderboardResponse.ok ? await leaderboardResponse.json() : null;

      if (gwData?.activeGameweek) {
        const deadline = new Date(gwData.activeGameweek.deadline);
        const now = new Date();
        const timeLeft = deadline > now 
          ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + " days"
          : "Past";

        const userRank = leaderboardData?.leaderboard?.findIndex((entry: { userId: string }) => 
          entry.userId === user?.id
        ) + 1 || 0;

        const userEntry = leaderboardData?.leaderboard?.find((entry: { userId: string; totalPoints: number; gameweekPoints: number }) => 
          entry.userId === user?.id
        );

        setDashboardData({
          currentGameweek: gwData.activeGameweek.name,
          deadline: deadline.toLocaleDateString(),
          timeLeft,
          userPoints: userEntry?.totalPoints || 0,
          gameweekPoints: userEntry?.gameweekPoints || 0,
          leagueRank: userRank,
          totalPlayers: leaderboardData?.leaderboard?.length || 0,
          transfersLeft: 1, // TODO: Calculate from actual transfers
          upcomingFixtures: [] // TODO: Load from fixtures API
        });
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setDataLoading(false);
    }
  };

  const DashboardSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto"></div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              UAE Pro League Fantasy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Create your dream team and compete with friends in the UAE&apos;s premier fantasy football experience.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full px-8 py-3 bg-black text-white text-center font-medium rounded-lg hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="block w-full px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-center font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Account
            </Link>
          </div>
          
          <div className="pt-4">
            <Link
              href="/rules"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
            >
              Learn the Rules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {user.teamName || "Manager"}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {dashboardData ? `Ready for ${dashboardData.currentGameweek}` : "Loading your dashboard..."}
          </p>
        </div>

        {dataLoading ? (
          <DashboardSkeleton />
        ) : dashboardData ? (
          <>
            {/* Gameweek Status Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-xl p-6 text-white">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-blue-100">Current Gameweek</span>
                  </div>
                  <h3 className="text-2xl font-bold">{dashboardData.currentGameweek}</h3>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Clock className="h-5 w-5" />
                    <span className="text-blue-100">Time Left</span>
                  </div>
                  <p className="text-xl font-semibold">{dashboardData.timeLeft}</p>
                  <p className="text-sm text-blue-200">Until deadline</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="flex items-center gap-2 justify-center md:justify-end mb-2">
                    <Target className="h-5 w-5" />
                    <span className="text-blue-100">Deadline</span>
                  </div>
                  <p className="text-lg font-medium">{dashboardData.deadline}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.userPoints.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  +{dashboardData.gameweekPoints} this gameweek
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">League Rank</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {dashboardData.leagueRank > 0 ? `#${dashboardData.leagueRank}` : "N/A"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  of {dashboardData.totalPlayers} managers
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Transfers Left</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboardData.transfersLeft}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This gameweek</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Team Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">£100.0m</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">+£0.0m this week</p>
              </div>
            </div>
          </>
        ) : null}

        {/* Main Navigation Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/my-team"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">My Team</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your squad, set lineup and captain</p>
          </Link>

          <Link
            href="/transfers"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Transfers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Buy and sell players to improve your team</p>
          </Link>

          <Link
            href="/leaderboard"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leaderboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">See how you rank against other managers</p>
          </Link>

          <Link
            href="/leagues"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Leagues</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join private leagues with friends</p>
          </Link>

          <Link
            href="/my-team/live"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <Zap className="h-6 w-6 text-red-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Live Scores</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Follow your players' performance live</p>
          </Link>

          <Link
            href="/rules"
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                <Calendar className="h-6 w-6 text-gray-600" />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Rules & Help</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to play and scoring system</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/my-team/lineup"
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            >
              <Target className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">Set Lineup</span>
            </Link>
            <Link
              href="/transfers"
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            >
              <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">Make Transfer</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            >
              <Trophy className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">View Ranks</span>
            </Link>
            <Link
              href="/my-team/live"
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
            >
              <Zap className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">Live Scores</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}