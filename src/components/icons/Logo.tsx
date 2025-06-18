import React from 'react';

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`font-headline text-3xl ${className}`}>
      <span className="text-primary">Tesla</span>
      <span className="text-foreground">Tech</span>
    </div>
  );
};

export default Logo;
