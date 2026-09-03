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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Grandstander:wght@400;600;700;800&family=Mountains+of+Christmas:wght@700&family=Nunito:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
