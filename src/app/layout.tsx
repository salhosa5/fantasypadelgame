// src/app/layout.tsx
import "./globals.css";
import Providers from "@/components/Providers";
import UserMenu from "@/components/UserMenu";

export const metadata = {
  title: "FUL",
  description: "Fantasy UAE League",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="w-full border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-semibold">ADNOC Pro League Fantasy</a>
            <UserMenu />
          </div>
        </header>
        <Providers>
          <main className="mx-auto max-w-6xl px-4 py-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
