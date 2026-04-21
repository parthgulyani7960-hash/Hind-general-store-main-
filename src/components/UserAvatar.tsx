import React from 'react';
import { cn } from '../types';

interface UserAvatarProps {
  user: {
    name?: string;
    profile_photo?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getInitials = (name: string) => {
    if (!name || name === 'Firebase User') return 'U';
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className={cn(
        "rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border-2 border-stone-200", 
        sizeClasses[size],
        className
      )}>
        ?
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-primary shadow-sm transition-transform hover:scale-105",
      sizeClasses[size],
      className
    )}>
      {user.profile_photo ? (
        <img 
          src={user.profile_photo} 
          alt={user.name || 'User'} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-primary flex items-center justify-center p-1">
          <span className="font-black text-white uppercase tracking-tighter leading-none">
            {getInitials(user.name || 'User')}
          </span>
        </div>
      )}
    </div>
  );
}
