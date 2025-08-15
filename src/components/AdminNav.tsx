"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `hover:underline ${pathname === path ? "font-bold text-blue-600" : ""}`;

  return (
    <nav className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex gap-4 text-sm font-medium">
      <Link href="/admin/fixtures" className={linkClasses("/admin/fixtures")}>
        Fixtures
      </Link>
      <Link href="/admin/players" className={linkClasses("/admin/players")}>
        Players
      </Link>
      <Link href="/admin/teams" className={linkClasses("/admin/teams")}>
        Teams
      </Link>
    </nav>
  );
}
