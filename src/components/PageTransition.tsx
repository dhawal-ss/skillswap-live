import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  keyProp: string | number;
}

export function PageTransition({ children }: Props) {
  return <>{children}</>;
}
