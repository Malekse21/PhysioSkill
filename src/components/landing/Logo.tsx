export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="PhysioSkill"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function LogoMark({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="PhysioSkill"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}