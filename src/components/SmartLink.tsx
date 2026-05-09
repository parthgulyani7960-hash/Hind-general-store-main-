import React from 'react';
import { Link } from 'react-router-dom';

export default function SmartLink({ to, children, className, onClick }: any) {
  if (!to) {
    return <button onClick={onClick} className={className}>{children}</button>;
  }
  const isExternal = to.startsWith('http') || to.startsWith('www') || to.startsWith('//');
  if (isExternal) {
    return (
      <a href={to.startsWith('www') ? `https://${to}` : to} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
