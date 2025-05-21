// src/components/features/blog/TableOfContents.tsx
'use client';

import { useState, useEffect, useRef, RefObject } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef: RefObject<HTMLDivElement>;
}

export const TableOfContents = ({ contentRef }: TableOfContentsProps) => {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const observer = useRef<IntersectionObserver | null>(null);

  // Extract headings from content
  useEffect(() => {
    if (!contentRef.current) return;

    const elements = Array.from(contentRef.current.querySelectorAll('h2, h3, h4'));
    const headingItems = elements.map((el) => {
      // Add IDs to headings if they don't have one
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/[^\w]+/g, '-') || '';
      }
      
      return {
        id: el.id,
        text: el.textContent || '',
        level: parseInt(el.tagName.substring(1), 10),
      };
    });
    
    setHeadings(headingItems);
  }, [contentRef]);

  // Set up intersection observer to track active heading
  useEffect(() => {
    if (!contentRef.current) return;
    
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };
    
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px -80% 0px',
      threshold: 0,
    });
    
    const elements = Array.from(contentRef.current.querySelectorAll('h2, h3, h4'));
    elements.forEach((element) => observer.current?.observe(element));
    
    return () => observer.current?.disconnect();
  }, [contentRef, headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Table of Contents</h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li 
            key={heading.id}
            className={cn(
              "transition-colors relative",
              heading.level === 2 && "pl-0",
              heading.level === 3 && "pl-4",
              heading.level === 4 && "pl-8",
            )}
          >
            
              href={`#${heading.id}`}
              className={cn(
                "block py-1 hover:text-primary transition-colors",
                activeId === heading.id ? "text-primary font-medium" : "text-foreground/80"
              )}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: 'smooth',
                });
              }}
            >
              {heading.text}
            </a>
            {activeId === heading.id && (
              <motion.div
                layoutId="activeHeading"
                className="absolute left-0 top-0 w-0.5 h-full bg-primary"
                transition={{ duration: 0.2 }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};