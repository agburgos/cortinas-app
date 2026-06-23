export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--warm-white)] rounded-2xl p-4 mb-3 border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)]">
      {title && (
        <div className="text-[13px] font-semibold text-[var(--mid)] uppercase tracking-wide mb-3">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function Empty({ icon, text, sub }: { icon?: string; text: string; sub?: string }) {
  return (
    <div className="text-center py-10 px-5 text-[var(--mid)]">
      {icon && <div className="text-5xl mb-3">{icon}</div>}
      <div className="text-[15px] font-medium">{text}</div>
      {sub && <div className="text-[13px] mt-1">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "green" | "yellow" | "red" | "gray";
}) {
  const colors: Record<string, string> = {
    green: "bg-[var(--green-bg)] text-[var(--green)]",
    yellow: "bg-[var(--yellow-bg)] text-[var(--yellow)]",
    red: "bg-[var(--red-bg)] text-[var(--red)]",
    gray: "bg-[var(--accent-bg)] text-[var(--accent)]",
  };
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-1 rounded-full tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "green" | "sm-secondary" | "sm-green" | "sm-primary";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--accent)] text-white py-3.5 text-base font-bold rounded-lg w-full",
    secondary: "bg-[var(--accent-bg)] text-[var(--accent)] py-3.5 text-base font-bold rounded-lg w-full",
    ghost: "bg-transparent border-[1.5px] border-[var(--border)] text-[var(--charcoal)] py-2.5 text-sm font-bold rounded-lg w-full",
    danger: "bg-[var(--red-bg)] text-[var(--red)] py-2.5 text-sm font-bold rounded-lg w-full",
    green: "bg-[var(--green-bg)] text-[var(--green)] py-3.5 text-base font-bold rounded-lg w-full",
    "sm-secondary": "bg-[var(--accent-bg)] text-[var(--accent)] py-2 px-3.5 text-[13px] font-bold rounded-lg",
    "sm-green": "bg-[var(--green-bg)] text-[var(--green)] py-2 px-3.5 text-[13px] font-bold rounded-lg",
    "sm-primary": "bg-[var(--accent)] text-white py-2 px-3.5 text-[13px] font-bold rounded-lg",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`active:opacity-80 transition-opacity disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
