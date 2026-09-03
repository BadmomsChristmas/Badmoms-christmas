import "./globals.css";
import { config } from "@/lib/config";

export const metadata = {
  title: config.orgName,
  description: `${config.orgName} - Christmas sponsorship program`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
