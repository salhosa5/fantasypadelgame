import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; // disables caching so the query runs fresh every time

export default async function PlayersPage() {
  console.log("➡️ Fetching players from DB...");
  const players = await prisma.player.findMany({
    include: { team: true },
    orderBy: [
      { team: { name: "asc" } },
      { position: "asc" },
      { name: "asc" }
    ],
  });
  console.log(`✅ Got ${players.length} players`);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Players</h1>
        <Link
          href="/admin/players/new"
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          + Add player
        </Link>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Name</th>
            <th>Team</th>
            <th>Pos</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">{p.name}</td>
              <td>{p.team.name}</td>
              <td>{p.position}</td>
              <td>{p.price.toString()}</td>
              <td>{p.status}</td>
              <td>
                <Link
                  href={`/admin/players/${p.id}`}
                  className="text-blue-600 underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-gray-500">
                No players yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
