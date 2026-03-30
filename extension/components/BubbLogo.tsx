import logoUrl from '/bubb-logo.png';

interface BubbLogoProps {
  size?: number;
  className?: string;
}

export function BubbLogo({ size = 32, className }: BubbLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="bubb"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
