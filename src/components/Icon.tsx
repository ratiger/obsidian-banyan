import { useLayoutEffect, useRef } from 'react';
import { setIcon } from 'obsidian';

export const Icon = ({ name, size = 's', color = 'var(--icon-color)', className }: {
  name: string;
  size?: 'xs' | 's' | 'm' | 'l' | 'xl' | number;
  color?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name);
    }
  }, [name]);

  const value = typeof size === 'string' ? `var(--icon-${size})` : `${size}px`;

  return <div ref={ref} className={`${className ?? ""}`} style={{
    '--icon-size': value,
    height: value, // 需要保留，不然div会比icon高一点
    width: value,
    color: color,
  } as React.CSSProperties} />;
}