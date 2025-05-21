// src/components/features/blog/RelatedPosts.tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  publishedAt: string;
  author: {
    name: string;
  };
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  className?: string;
}

export const RelatedPosts = ({ posts, className }: RelatedPostsProps) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", className)}>
      {posts.map((post) => (
        <Link 
          key={post.id} 
          href={`/blog/${post.slug}`}
          className="group overflow-hidden rounded-lg border hover:shadow-md transition-shadow"
        >
          <div className="relative h-48 overflow-hidden">
            {post.featuredImage ? (
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {post.excerpt}
              </p>
            )}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{post.author.name}</span>
              <span>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};