import { useReveal } from '../../hooks/useReveal.js';

/**
 * Fade/slide-in wrapper. `as` picks the tag, `i` is the stagger index (0-2).
 * `children` may be a function receiving `seen` (used by the stats tile).
 */
export default function Reveal({ as: Tag = 'div', i = 0, className = '', style, children, ...rest }) {
  const { ref, seen } = useReveal();
  return (
    <Tag
      ref={ref}
      className={`${className} reveal${seen ? ' in' : ''}`.trim()}
      style={{ '--i': i, ...style }}
      {...rest}
    >
      {typeof children === 'function' ? children(seen) : children}
    </Tag>
  );
}
