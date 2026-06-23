interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      width="96"
      height="32"
      viewBox="0 0 96 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MOOV by Grupo Huerpel"
    >
      <text
        x="0"
        y="24"
        fontFamily="Montserrat, system-ui, sans-serif"
        fontWeight="800"
        fontSize="28"
        fill="#eef1f6"
        letterSpacing="-1"
      >
        MOOV
      </text>
    </svg>
  );
}
