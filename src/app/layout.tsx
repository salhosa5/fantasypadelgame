// src/app/layout.tsx
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "UAE Pro League Fantasy",
  description: "Fantasy UAE League",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
