interface SectionHeaderProps {
  number: string;
  title: string;
}

export function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div
      className="font-mono text-[10px] tracking-[0.14em] uppercase pb-[10px] border-b"
      style={{ color: "#2f6dff", borderColor: "rgba(255,255,255,0.08)" }}
    >
      {number} — {title}
    </div>
  );
}
