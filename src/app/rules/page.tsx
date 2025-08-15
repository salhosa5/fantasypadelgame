export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Rules & Scoring</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Scoring (V1)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Appearance: 1 point for &lt;60 mins, 2 points for ≥60 mins</li>
          <li>Goals: GK/DEF 6, MID 5, FWD 4</li>
          <li>Assists: 3</li>
          <li>Clean sheet: GK/DEF 4, MID 1 (must play 60+), FWD 0</li>
          <li>Goals conceded (GK/DEF): -1 per 2 goals</li>
          <li>Penalty saved (GK): 5</li>
          <li>Penalty missed: -2</li>
          <li>Yellow card: -1 · Red card: -3 · Own goal: -2</li>
          <li>Man of the Match: +2 (one player per match)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Chips</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Wildcard (×2/season)</strong>: Unlimited transfers that week; permanent.</li>
          <li><strong>Bench Boost (×1)</strong>: Bench points count this gameweek.</li>
          <li><strong>Triple Captain (×1)</strong>: Captain’s points ×3.</li>
          <li><strong>Two Captains (×1)</strong>: Two captains, both ×2. No vice-captain safety.</li>
          <li>Only one chip per gameweek. Must be played before the deadline.</li>
        </ul>
      </section>
    </div>
  );
}
