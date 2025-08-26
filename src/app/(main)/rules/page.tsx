import { 
  Shield, 
  Target, 
  TrendingUp, 
  Zap, 
  Users, 
  Calendar,
  Award,
  AlertTriangle 
} from "lucide-react";

export default function Rules() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">How to Play</h1>
              <p className="text-gray-600 dark:text-gray-300">Simple rules for UAE Pro League Fantasy</p>
            </div>
          </div>
        </div>

        {/* Basic Rules */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" />
            Basic Rules
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Squad</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Pick 15 players total</li>
                <li>• 2 Goalkeepers</li>
                <li>• 5 Defenders</li>
                <li>• 5 Midfielders</li>
                <li>• 3 Forwards</li>
                <li>• Maximum 3 players from same team</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Each Week</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Pick 11 players to start</li>
                <li>• Choose 1 captain (gets double points)</li>
                <li>• Choose 1 vice-captain (backup if captain doesn't play)</li>
                <li>• 4 players stay on your bench</li>
                <li>• You get 1 free transfer each week</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Scoring System */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Target className="h-6 w-6 text-yellow-600" />
            How Players Score Points
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Positive Points */}
            <div className="space-y-4">
              <h3 className="font-semibold text-green-600 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ways to Score Points
              </h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Playing Time</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>1 point</strong> - Playing less than 60 minutes</li>
                    <li>• <strong>2 points</strong> - Playing 60 minutes or more</li>
                  </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Goals</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>6 points</strong> - Goalkeeper or Defender scores</li>
                    <li>• <strong>5 points</strong> - Midfielder scores</li>
                    <li>• <strong>4 points</strong> - Forward scores</li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Other Good Stuff</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>3 points</strong> - Assist (helping a teammate score)</li>
                    <li>• <strong>5 points</strong> - Goalkeeper saves a penalty</li>
                    <li>• <strong>1 point</strong> - Goalkeeper gets 1 point for every 3 saves made</li>
                    <li>• <strong>2 points</strong> - Man of the Match award</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Clean Sheets (No Goals Conceded)</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>4 points</strong> - Goalkeeper or Defender</li>
                    <li>• <strong>1 point</strong> - Midfielder (must play 60+ minutes)</li>
                    <li>• <strong>0 points</strong> - Forward</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Negative Points */}
            <div className="space-y-4">
              <h3 className="font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Ways to Lose Points
              </h3>
              
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Goals Against Team</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>-1 point</strong> - Goalkeeper/Defender loses 1 point for every 2 goals their team concedes</li>
                  </ul>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Bad Behavior</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li>• <strong>-1 point</strong> - Yellow card</li>
                    <li>• <strong>-3 points</strong> - Red card</li>
                    <li>• <strong>-2 points</strong> - Own goal</li>
                    <li>• <strong>-2 points</strong> - Missing a penalty</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Transfers
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Transfers */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Free Transfers</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>1 free transfer</strong> granted each gameweek</li>
                  <li>• <strong>Bank up to 5</strong> - unused transfers carry over to next gameweek</li>
                  <li>• Use free transfers to change players without penalty</li>
                  <li>• Maximum 5 free transfers at any time</li>
                </ul>
              </div>
            </div>

            {/* Transfer Hits */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Transfer Hits (Point Deductions)</h3>
              <div className="bg-red-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>-4 points</strong> for each transfer beyond your free transfers</li>
                  <li>• Example: 2 transfers with 1 free = -4 points</li>
                  <li>• Example: 3 transfers with 1 free = -8 points</li>
                </ul>
              </div>
            </div>

            {/* Transfer Strategy */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-semibold text-gray-900">Transfer Strategy</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Plan ahead:</strong> Sometimes it's better to take a -4 hit if the new player will score more than 4 extra points</li>
                  <li>• <strong>Injured players:</strong> Replace injured players even for a hit to avoid 0 points</li>
                  <li>• <strong>Wildcard:</strong> Use your wildcard to make unlimited transfers without hits</li>
                  <li>• <strong>Deadline:</strong> Transfers must be made before the gameweek deadline</li>
                </ul>
              </div>
            </div>

            {/* Banking Example */}
            <div className="space-y-4 md:col-span-2">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Banking Examples</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      <strong>Example 1:</strong> You have 2 free transfers, make 0 transfers → Next GW you have 3 free transfers<br/>
                      <strong>Example 2:</strong> You have 5 free transfers, make 0 transfers → Next GW you still have 5 (max limit)<br/>
                      <strong>Example 3:</strong> You have 3 free transfers, make 2 transfers → Next GW you have 2 free transfers (1 remaining + 1 new)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Power-ups (Chips) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            Power-ups (Chips)
          </h2>
          
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Important:</strong> You get each power-up twice per season - once in the first half (weeks 1-13) and once in the second half (weeks 14-26). You can only use one power-up per week.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🃏 Wildcard</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Make unlimited transfers for free this week. Great for completely changing your team!</p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">🚀 Bench Boost</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">All 4 players on your bench also score points this week (normally they don't count).</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">⚡ Triple Captain</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Your captain gets triple points instead of double. Risky but can be huge!</p>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">👥 Two Captains</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">Pick 2 captains who both get double points. No vice-captain backup though!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Season Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Season Structure
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">First Half Season</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Gameweeks 1-13</li>
                <li>• You get one of each power-up to use</li>
                <li>• Build your squad and learn the game</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Second Half Season</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Gameweeks 14-26</li>
                <li>• You get fresh power-ups again!</li>
                <li>• Time to make your final push for the top</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-green-600" />
            Quick Tips for Success
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Check injury news before each deadline</li>
              <li>• Don't waste transfers - you only get 1 free per week</li>
              <li>• Captain players with good fixtures</li>
              <li>• Save power-ups for good opportunities</li>
            </ul>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>• Goalkeepers from good defensive teams score well</li>
              <li>• Midfielders who take penalties are valuable</li>
              <li>• Watch for players who consistently get bonus points</li>
              <li>• Plan transfers over multiple weeks</li>
            </ul>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
