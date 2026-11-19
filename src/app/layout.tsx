import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-geist-mono",
});

const descripcion =
  "Consorcio AI ordena opciones de crédito para el analista. Compara el perfil con la política vigente y deja la decisión final en la persona.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3001"),
  title: {
    default: "Consorcio AI | Preanálisis crediticio para analistas",
    template: "%s | Consorcio AI",
  },
  description: descripcion,
  applicationName: "Consorcio AI",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png" },
  authors: [{ name: "Consorcio Finance" }],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Consorcio AI",
    title: "Consorcio AI | Preanálisis crediticio para analistas",
    description: descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: "Consorcio AI | Preanálisis crediticio para analistas",
    description: descripcion,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#eef0f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:text-sm focus:font-medium focus:text-primary-foreground"
        >
          Saltar al contenido
        </a>
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
