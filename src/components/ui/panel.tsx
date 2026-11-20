import * as React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col w-full border border-synapse-border bg-synapse-panel shadow-sm',
          className,
        )}
        {...props}
      />
    );
  },
);
Panel.displayName = 'Panel';

interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelHeader = React.forwardRef<HTMLDivElement, PanelHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1 border-b border-synapse-border bg-synapse-panel/50 px-4 py-3',
        className,
      )}
      {...props}
    />
  ),
);
PanelHeader.displayName = 'PanelHeader';

interface PanelTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const PanelTitle = React.forwardRef<HTMLHeadingElement, PanelTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-sm font-semibold text-synapse-ink tracking-tight',
        className,
      )}
      {...props}
    />
  ),
);
PanelTitle.displayName = 'PanelTitle';

interface PanelDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const PanelDescription = React.forwardRef<
  HTMLParagraphElement,
  PanelDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-xs text-synapse-muted',
      className,
    )}
    {...props}
  />
));
PanelDescription.displayName = 'PanelDescription';

interface PanelContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelContent = React.forwardRef<HTMLDivElement, PanelContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4', className)}
      {...props}
    />
  ),
);
PanelContent.displayName = 'PanelContent';

interface PanelFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const PanelFooter = React.forwardRef<HTMLDivElement, PanelFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center border-t border-synapse-border bg-synapse-panel/50 px-4 py-3',
        className,
      )}
      {...props}
    />
  ),
);
PanelFooter.displayName = 'PanelFooter';

export {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
  PanelFooter,
};
