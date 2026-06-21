import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  framed?: boolean;
  className?: string;
}

const heights = { sm: 26, md: 38, lg: 96 };

export function Logo({ size = 'md', showText = false, framed = false, className = '' }: LogoProps) {
  const h = heights[size];

  const image = (
    <img
      src="/logo.png"
      alt="Enterra"
      className="logo-mark__img"
      style={{ height: h }}
      draggable={false}
    />
  );

  return (
    <span className={`logo-mark ${className}`.trim()}>
      {framed ? <span className="logo-mark__frame">{image}</span> : image}
      {showText && <span className="logo-mark__text">Enterra</span>}
    </span>
  );
}

export function LogoLink({ size = 'md', onClick }: { size?: LogoProps['size']; onClick?: () => void }) {
  return (
    <Link to="/" className="logo" onClick={onClick} aria-label="Enterra — на главную">
      <Logo size={size} />
    </Link>
  );
}
