import "./globals.css";
import Providers from "@/components/Providers";

export const metadata = {
  title: "FUL",
  description: "Fantasy UAE League",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
