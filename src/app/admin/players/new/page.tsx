import { prisma } from "@/lib/prisma";
import PlayerForm from "@/components/PlayerForm";

export default async function NewPlayerPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Add Player</h1>
      <PlayerForm teams={teams} />
    </div>
  );
}
