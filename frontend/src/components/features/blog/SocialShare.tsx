// src/components/features/blog/SocialShare.tsx
'use client';

import { useState } from 'react';
import { Facebook, Twitter, Linkedin, Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { copyToClipboard } from '@/utils/helpers';
import { cn } from '@/utils/cn';

interface SocialShareProps {
  url: string;
  title: string;
  summary?: string;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'icon';
}

export const SocialShare = ({
  url,
  title,
  summary = '',
  className,
  variant = 'horizontal',
}: SocialShareProps) => {
  const [copied, setCopied] = useState(false);
  
  // Encode params for social media platforms
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary);
  
  // Share URLs
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`;
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (variant === 'icon') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip content="Share on Twitter">
          <a 
            href={twitterUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Share on Twitter"
          >
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Twitter className="h-4 w-4" />
            </Button>
          </a>
        </Tooltip>
        
        <Tooltip content="Share on Facebook">
          <a 
            href={facebookUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Share on Facebook"
          >
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Facebook className="h-4 w-4" />
            </Button>
          </a>
        </Tooltip>
        
        <Tooltip content="Share on LinkedIn">
          <a 
            href={linkedinUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Share on LinkedIn"
          >
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
              <Linkedin className="h-4 w-4" />
            </Button>
          </a>
        </Tooltip>
        
        <Tooltip content={copied ? "Copied!" : "Copy link"}>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full" 
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
          </Button>
        </Tooltip>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        "flex items-center gap-2",
        variant === 'vertical' ? "flex-col" : "flex-row",
        className
      )}
    >
      <a 
        href={twitterUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex"
      >
        <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Twitter className="h-4 w-4" />
          <span>Twitter</span>
        </Button>
      </a>
      
      <a 
        href={facebookUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex"
      >
        <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Facebook className="h-4 w-4" />
          <span>Facebook</span>
        </Button>
      </a>
      
      <a 
        href={linkedinUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="inline-flex"
      >
        <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          <span>LinkedIn</span>
        </Button>
      </a>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="inline-flex items-center gap-2"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
        <span>{copied ? "Copied!" : "Copy link"}</span>
      </Button>
    </div>
  );
};