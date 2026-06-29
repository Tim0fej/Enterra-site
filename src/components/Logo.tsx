import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  framed?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = false, framed = false, className = '' }: LogoProps) {
  const image = (
    <img
      src="/logo.png"
      alt="Enterra"
      width={256}
      height={60}
      className={`logo-mark__img logo-mark__img--${size}`}
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
