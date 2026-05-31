import React from 'react';
import { Link } from 'react-router-dom';

export default function SmartLink({ to, children, className, onClick }: any) {
  if (!to) {
    return <button onClick={onClick} className={className}>{children}</button>;
  }

  // Detect external URLs
  const isExternal = to.startsWith('http') || to.startsWith('www') || to.startsWith('//');
  
  // Explicitly check for backend API paths to prevent React Router interception
  const isApi = to.startsWith('/api') || to.includes('/api/') || to.startsWith('api/');

  if (isExternal || isApi) {
    let href = to;
    if (to.startsWith('www')) {
      href = `https://${to}`;
    } else if (to.startsWith('api/')) {
      href = `/${to}`;
    }
    
    return (
      <a 
        href={href} 
        target={isApi ? undefined : "_blank"} 
        rel={isApi ? undefined : "noopener noreferrer"} 
        className={className} 
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  // Ensure internal routing paths are clean, hardcoded absolute paths
  let resolvedTo = to;
  if (!resolvedTo.startsWith('/') && !resolvedTo.startsWith('#') && !resolvedTo.startsWith('mailto:') && !resolvedTo.startsWith('tel:')) {
    resolvedTo = '/' + resolvedTo;
  }

  return (
    <Link to={resolvedTo} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
