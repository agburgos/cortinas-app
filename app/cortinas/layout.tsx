import AuthGate from "@/components/AuthGate";

export default function CortinasLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
