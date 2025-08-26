import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    console.log('Deleting all users and related data...');
    
    // Delete in proper order to handle foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete user-related data first
      await tx.playerStat.deleteMany({});
      await tx.userPoints.deleteMany({});
      await tx.leagueStanding.deleteMany({});
      await tx.transfer.deleteMany({});
      await tx.userPick.deleteMany({});
      await tx.userSquad.deleteMany({});
      
      // Finally delete users
      const deletedCount = await tx.user.deleteMany({});
      console.log(`Deleted ${deletedCount.count} users and all related data`);
      
      return deletedCount.count;
    });

    return NextResponse.json({ 
      ok: true, 
      message: "All users and related data deleted successfully"
    });
  } catch (e: any) {
    console.error('Delete users error:', e);
    return NextResponse.json({ 
      error: e?.message || "Failed to delete users"
    }, { status: 500 });
  }
}