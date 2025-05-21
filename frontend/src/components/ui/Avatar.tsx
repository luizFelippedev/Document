// frontend/src/components/ui/Avatar.tsx
'use client';

import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { User } from 'lucide-react';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
      variant: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'circle',
    },
  },
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  fallbackInitials?: string;
  online?: boolean;
  fallbackIcon?: React.ReactNode;
}

export const Avatar = ({
  className,
  size,
  variant,
  src,
  alt = 'Avatar',
  fallbackInitials,
  online,
  fallbackIcon,
  ...props
}: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const hasImage = src && !imageError;

  // Get initials from alt text if not provided
  const getInitials = () => {
    if (fallbackInitials) return fallbackInitials;

    return alt
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statusSizeClass = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
    '2xl': 'h-5 w-5',
  };

  return (
    <div className="relative inline-block">
      <div
        className={cn(avatarVariants({ size, variant }), className)}
        {...props}
      >
        {hasImage ? (
          <img
            src={src as string}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : fallbackIcon ? (
          <span className="text-gray-500 dark:text-gray-400">
            {fallbackIcon}
          </span>
        ) : (
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {getInitials()}
          </span>
        )}
      </div>

      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
            online ? 'bg-green-500' : 'bg-gray-400',
            statusSizeClass[size || 'md'],
          )}
        />
      )}
    </div>
  );
};

// Group of Avatars (stacked)
interface AvatarGroupProps {
  avatars: {
    src?: string;
    alt?: string;
    fallbackInitials?: string;
    online?: boolean;
  }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  total?: number;
  className?: string;
}

export const AvatarGroup = ({
  avatars,
  max = 3,
  size = 'md',
  total,
  className,
}: AvatarGroupProps) => {
  const displayedAvatars = avatars.slice(0, max);
  const overflowCount = total ? total - max : avatars.length - max;

  const getOverlapMargin = () => {
    switch (size) {
      case 'xs':
        return '-mr-2';
      case 'sm':
        return '-mr-2.5';
      case 'md':
        return '-mr-3';
      case 'lg':
        return '-mr-4';
      case 'xl':
        return '-mr-5';
      case '2xl':
        return '-mr-6';
      default:
        return '-mr-3';
    }
  };

  return (
    <div className={cn('flex', className)}>
      {displayedAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            index !== 0 && getOverlapMargin(),
            'relative inline-block',
          )}
        >
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            fallbackInitials={avatar.fallbackInitials}
            online={avatar.online}
            size={size}
            className="ring-2 ring-white dark:ring-gray-900"
          />
        </div>
      ))}

      {overflowCount > 0 && (
        <div className={cn(getOverlapMargin(), 'relative inline-block')}>
          <div
            className={cn(
              avatarVariants({ size, variant: 'circle' }),
              'bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-900',
            )}
          >
            <span className="font-medium text-gray-600 dark:text-gray-300">
              +{overflowCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
