"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, 
  Calendar, 
  Trophy, 
  Settings, 
  BarChart3, 
  Zap,
  Shield,
  Database
} from "lucide-react";

type DashboardStats = {
  totalPlayers: number;
  totalTeams: number;
  totalGameweeks: number;
  activeFixtures: number;
  completedFixtures: number;
  totalUsers: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGw, setActiveGw] = useState<any>(null);
  const [gameweeks, setGameweeks] = useState<any[]>([]);
  const [showGwModal, setShowGwModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load dashboard stats
      const statsR = await fetch('/api/admin/dashboard', { cache: 'no-store' });
      if (statsR.ok) {
        const statsData = await statsR.json();
        setStats(statsData);
      }

      // Load active gameweek info
      const gwR = await fetch('/api/admin/active-gw', { cache: 'no-store' });
      if (gwR.ok) {
        const gwData = await gwR.json();
        console.log('Gameweek data:', gwData); // Debug log
        setActiveGw(gwData.activeGameweek);
        setGameweeks(gwData.gameweeks || []);
      } else {
        console.error('Failed to load active gameweek data', gwR.status);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setActiveGameweek = async (gameweekId: number) => {
    try {
      const r = await fetch('/api/admin/active-gw', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_ACTIVE', gameweekId })
      });
      const data = await r.json();
      if (r.ok) {
        alert(data.message);
        // Reload data
        await loadData();
        setShowGwModal(false);
      } else {
        alert(data.error || 'Failed to set active gameweek');
      }
    } catch (e) {
      alert('Failed to set active gameweek');
    }
  };

  const resetDeadlines = async () => {
    if (!confirm('Reset all gameweek deadlines to the original weekly schedule? This will fix any deadline changes made during testing.')) {
      return;
    }
    
    try {
      const r = await fetch('/api/admin/reset-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await r.json();
      if (r.ok) {
        alert(data.message);
        await loadData();
      } else {
        alert(data.error || 'Failed to reset deadlines');
      }
    } catch (e) {
      alert('Failed to reset deadlines');
    }
  };

  const adminActions = [
    {
      title: "Fixtures Management",
      description: "Create fixtures, enter match results, and generate round-robin tournaments",
      href: "/admin/fixtures",
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Player Database",
      description: "Add, edit, and manage player information across all teams",
      href: "/admin/players",
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Team Management",
      description: "Manage team information, squad composition, and team statistics",
      href: "/admin/teams", 
      icon: Shield,
      color: "bg-purple-500",
    },
    {
      title: "Gameweeks",
      description: "Set up gameweeks, deadlines, and manage the fantasy calendar",
      href: "/admin/gws",
      icon: Trophy,
      color: "bg-orange-500",
    },
  ];

  const deleteAllUsers = async () => {
    if (!confirm('Delete ALL users and their data? This cannot be undone!')) {
      return;
    }
    
    try {
      const r = await fetch('/api/admin/delete-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await r.json();
      if (r.ok) {
        alert(data.message);
        await loadData();
      } else {
        alert(data.error || 'Failed to delete users');
      }
    } catch (e) {
      alert('Failed to delete users');
    }
  };

  const quickActions = [
    {
      title: "Generate League Fixtures",
      action: "Create proper league fixtures (7 games per week)",
      href: "/admin/fixtures",
      urgent: true,
    },
    {
      title: "Switch Active Gameweek",
      action: "Force change the active gameweek for testing",
      onClick: () => setShowGwModal(true),
      urgent: false,
    },
    {
      title: "Delete All Users",
      action: "Remove all users and their data (for testing/reset)",
      onClick: deleteAllUsers,
      urgent: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Fantasy UAE League Management System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { label: "Total Players", value: stats?.totalPlayers ?? 0, color: "text-blue-600" },
          { label: "Teams", value: stats?.totalTeams ?? 0, color: "text-green-600" },
          { label: "Gameweeks", value: stats?.totalGameweeks ?? 0, color: "text-purple-600" },
          { label: "Active Fixtures", value: stats?.activeFixtures ?? 0, color: "text-orange-600" },
          { label: "Completed", value: stats?.completedFixtures ?? 0, color: "text-gray-600" },
          { label: "Users", value: stats?.totalUsers ?? 0, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {loading ? "..." : stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Component = action.href ? Link : 'div';
              const props = action.href 
                ? { href: action.href } 
                : { onClick: action.onClick };
              
              return (
                <Component
                  key={action.title}
                  {...props}
                  className={`block p-4 rounded-lg border-2 border-dashed transition-all hover:shadow-md cursor-pointer ${
                    action.urgent
                      ? "border-red-300 bg-red-50 hover:border-red-400"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <div className={`font-medium ${action.urgent ? "text-red-800" : "text-gray-800"}`}>
                    {action.title}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{action.action}</div>
                </Component>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Admin Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group"
            >
              <div className="p-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            System Status
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Database</span>
                  <span className="text-green-600 font-medium">✓ Connected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Fixture Update</span>
                  <span className="text-gray-900">Just now</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active Sessions</span>
                  <span className="text-gray-900">{stats?.totalUsers ?? 0} users</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Next Actions</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Generate fixtures for upcoming gameweeks</div>
                <div>• Review player statistics and performance</div>
                <div>• Update team information if needed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Gameweek Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            Active Gameweek
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {activeGw ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activeGw.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Deadline: {new Date(activeGw.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activeGw.deadline) > new Date() ? 'Upcoming' : 'Active/Past'}
                  </p>
                </div>
              ) : (
                <div className="text-gray-600">No active gameweek found</div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={resetDeadlines}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                Reset Deadlines
              </button>
              <button
                onClick={() => setShowGwModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Switch Gameweek
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gameweek Selection Modal */}
      {showGwModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Switch Active Gameweek</h2>
              <p className="text-gray-600 mt-1">Force change the active gameweek for simulation/testing purposes</p>
            </div>
            <div className="p-6 space-y-3">
              {gameweeks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No gameweeks found.</p>
                  <p className="text-sm mt-2">Generate gameweeks first using the "Generate Season" button.</p>
                </div>
              ) : (
                gameweeks.map((gw) => {
                  const isActive = activeGw?.id === gw.id;
                  const isPast = new Date(gw.deadline) < new Date();
                  return (
                  <div 
                    key={gw.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isActive 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{gw.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(gw.deadline).toLocaleString()}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{gw._count?.fixtures || 0} fixtures</span>
                          <span>{gw._count?.userSquads || 0} squads</span>
                          <span className={isPast ? 'text-green-600' : 'text-blue-600'}>
                            {isPast ? 'Past' : 'Upcoming'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isActive && (
                          <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">
                            Active
                          </span>
                        )}
                        <button
                          onClick={() => setActiveGameweek(gw.id)}
                          disabled={isActive}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
                        >
                          Set Active
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setShowGwModal(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}