import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'card' | 'avatar';
    width?: string;
    height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-slate-700/50 rounded';

    const variantClasses = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        card: 'rounded-2xl',
        avatar: 'rounded-full size-12'
    };

    const style = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '16px' : undefined)
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-built skeleton layouts
export const ClientCardSkeleton: React.FC = () => (
    <div className="glass-card p-3 flex items-center gap-3 animate-pulse">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
            <Skeleton width="60%" height="14px" />
            <Skeleton width="80%" height="10px" />
            <Skeleton height="6px" className="mt-2" />
        </div>
    </div>
);

export const PaymentCardSkeleton: React.FC = () => (
    <div className="glass-card rounded-[24px] p-4 flex items-center gap-4 animate-pulse">
        <Skeleton variant="avatar" className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
            <Skeleton width="50%" height="14px" />
            <Skeleton width="70%" height="10px" />
        </div>
        <div className="space-y-1 text-right">
            <Skeleton width="60px" height="14px" />
            <Skeleton width="40px" height="8px" />
        </div>
    </div>
);

export const MetricCardSkeleton: React.FC = () => (
    <div className="glass-card rounded-[32px] p-6 animate-pulse">
        <Skeleton variant="circle" className="size-10 mb-4" />
        <Skeleton width="40%" height="24px" className="mb-2" />
        <Skeleton width="60%" height="10px" />
    </div>
);

export const AppointmentSkeleton: React.FC = () => (
    <div className="flex items-center gap-3 p-3 animate-pulse">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-1">
            <Skeleton width="40%" height="12px" />
            <Skeleton width="60%" height="10px" />
        </div>
    </div>
);

export default Skeleton;
