
import React, { memo } from 'react';

const Logo = memo(() => {
  return (
    <div className="text-2xl font-bold font-headline tracking-tight">
      <span className="text-primary">Tesla</span>
      <span className="text-foreground">Tech</span>
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
