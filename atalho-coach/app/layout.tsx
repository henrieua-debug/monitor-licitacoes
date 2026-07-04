import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { Nav } from "./nav";

export const metadata: Metadata = {
  title: "Atalho Coach — seu consultor de automação para iPhone e Mac",
  description:
    "Propostas personalizadas e geração com IA de atalhos para o app Atalhos da Apple, validados e prontos para instalar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <I18nProvider>
          <div className="container">
            <Nav />
            {children}
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
