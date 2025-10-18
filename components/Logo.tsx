import Image from 'next/image';

interface LogoProps {
  variant?: 'icon' | 'text' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Logo({ variant = 'full', size = 'md', className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 80 },
    md: { icon: 32, text: 120 },
    lg: { icon: 48, text: 160 },
    xl: { icon: 64, text: 200 }
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <Image
        src="/logos/pot.png"
        alt="SolPot Logo"
        width={currentSize.icon}
        height={currentSize.icon}
        className={`object-contain ${className}`}
        priority
      />
    );
  }

  if (variant === 'text') {
    return (
      <Image
        src="/logos/name.png"
        alt="SolPot"
        width={currentSize.text}
        height={currentSize.icon}
        className={`object-contain ${className}`}
        priority
      />
    );
  }

  // Full logo with icon + text
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/logos/pot.png"
        alt="SolPot Logo"
        width={currentSize.icon}
        height={currentSize.icon}
        className="object-contain"
        priority
      />
      <Image
        src="/logos/name.png"
        alt="SolPot"
        width={currentSize.text}
        height={currentSize.icon}
        className="object-contain"
        priority
      />
    </div>
  );
}
