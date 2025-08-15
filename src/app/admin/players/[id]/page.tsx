import { prisma } from "@/lib/prisma";
import PlayerForm from "@/components/PlayerForm";
import Link from "next/link";

export default async function EditPlayerPage(
  { params }: { params: Promise<{ id: string }> }  // 👈 awaitable params
) {
  const { id } = await params;                      // 👈 await it
  const numericId = Number(id);

  const [teams, player] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.player.findUnique({ where: { id: numericId } }),
  ]);

  if (!player) {
    return (
      <div className="p-6">
        <p>Player not found.</p>
        <Link href="/admin/players" className="text-blue-600 underline">Back to Players</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Edit Player</h1>
      <PlayerForm
        teams={teams}
        defaults={{
          id: player.id,
          name: player.name,
          teamId: player.teamId,
          position: player.position as any,
          price: Number(player.price),
          status: player.status as any,
        }}
      />
    </div>
  );
}
