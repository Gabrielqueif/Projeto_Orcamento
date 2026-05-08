"use client";

import { WizardProvider } from "@/contexts/WizardContext";

export default function NovoObraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WizardProvider>{children}</WizardProvider>;
}
