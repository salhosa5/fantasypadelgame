import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FixturesPage() {
  const fixtures = await prisma.fixture.findMany({
    orderBy: [{ gameweekId: "asc" }, { kickoff: "asc" }],
    include: { homeTeam: true, awayTeam: true, gameweek: true },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Fixtures</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">GW</th>
            <th>Kickoff</th>
            <th>Home</th>
            <th>Away</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map((f) => (
            <tr key={f.id} className="border-b">
              <td className="py-2">{f.gameweek.number}</td>
              <td>{new Date(f.kickoff).toLocaleString()}</td>
              <td>{f.homeTeam.name}</td>
              <td>{f.awayTeam.name}</td>
              <td>{f.status}{f.scored ? " ✓" : ""}</td>
              <td>
                <Link className="text-blue-600 underline" href={`/admin/match/${f.id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
