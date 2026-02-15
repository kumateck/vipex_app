import type { LucideProps } from 'lucide-react';
import { icons } from 'lucide-react';

export interface IconProps extends LucideProps {
  name: keyof typeof icons;
}

export type LucideIconProps = keyof typeof icons;
export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[name];

  return <LucideIcon {...props} />;
}

// export default Icon;
