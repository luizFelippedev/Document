// src/components/features/blog/Post.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { format } from 'date-fns';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Copy,
  Twitter,
  Facebook,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';
import { copyToClipboard } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Tooltip } from '@/components/ui/Tooltip';
import { TableOfContents } from '@/components/features/blog/TableOfContents';
import { RelatedPosts } from '@/components/features/blog/RelatedPosts';
import { CommentSection } from '@/components/features/blog/CommentSection';
import { SocialShare } from '@/components/features/blog/SocialShare';

interface PostAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
}

interface PostCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author: PostAuthor;
  categories: PostCategory[];
  tags: string[];
  readingTime: number;
  publishedAt: string;
  updatedAt?: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  relatedPosts?: unknown[];
}

interface PostProps {
  post: Post;
  previousPost?: { title: string; slug: string };
  nextPost?: { title: string; slug: string };
  className?: string;
}

export const Post = ({
  post,
  previousPost,
  nextPost,
  className,
}: PostProps) => {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // References for elements
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Animation for the header
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.9]);

  // Media query for responsive layout
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Format dates
  const formattedPublishDate = format(
    new Date(post.publishedAt),
    'MMMM d, yyyy',
  );
  const formattedUpdateDate = post.updatedAt
    ? format(new Date(post.updatedAt), 'MMMM d, yyyy')
    : null;

  // Handle like action
  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
    // Here you would call your API to update like status
  };

  // Handle bookmark action
  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    toast({
      title: bookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
      description: bookmarked
        ? 'The post has been removed from your bookmarks'
        : 'The post has been added to your bookmarks',
      variant: bookmarked ? 'destructive' : 'default',
    });
    // Here you would call your API to update bookmark status
  };

  // Handle share action
  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = window.location.href;
    copyToClipboard(url).then(() => {
      toast({
        title: 'Link copied',
        description: 'The link has been copied to your clipboard',
        variant: 'default',
      });
      setShowShareMenu(false);
    });
  };

  // Handle comments toggle
  const handleCommentToggle = () => {
    setShowComments(!showComments);
  };

  // Update view count on mount
  useEffect(() => {
    // Here you would call your API to increment view count
    // This is just a placeholder
    console.log('Updating view count for post:', post.id);
  }, [post.id]);

  return (
    <article
      className={cn('relative max-w-full mx-auto bg-background', className)}
    >
      {/* Post Header with Hero Image */}
      <motion.div
        ref={headerRef}
        style={{ opacity: headerOpacity, scale: headerScale }}
        className="relative w-full h-[50vh] lg:h-[70vh] overflow-hidden"
      >
        {post.featuredImage ? (
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8 lg:p-16">
          <div className="max-w-4xl">
            {post.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((category) => (
                  <Link href={`/category/${category.slug}`} key={category.id}>
                    <Badge
                      variant="outline"
                      className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                    >
                      {category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            <h1 className="font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-white/90 mb-6 max-w-3xl">
              {post.excerpt}
            </p>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center">
                {post.author.avatar ? (
                  <Avatar
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-10 w-10 mr-2"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary mr-2">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{post.author.name}</p>
                  <p className="text-xs">{post.author.role}</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-6 bg-white/30" />
              <div className="flex items-center text-sm">
                <span>{formattedPublishDate}</span>
                {formattedUpdateDate && (
                  <span className="ml-2 text-white/60">
                    (Updated: {formattedUpdateDate})
                  </span>
                )}
              </div>
              <Separator orientation="vertical" className="h-6 bg-white/30" />
              <div className="text-sm">{post.readingTime} min read</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar for desktop */}
          {isDesktop && (
            <div className="lg:col-span-3 relative">
              <div className="sticky top-24">
                <TableOfContents contentRef={contentRef} />

                <div className="mt-10 p-6 bg-muted rounded-lg">
                  <div className="flex flex-col gap-3">
                    <Button
                      variant={liked ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleLike}
                      className="w-full justify-start gap-2"
                    >
                      <Heart
                        className={cn('h-4 w-4', liked && 'fill-current')}
                      />
                      <span>{liked ? 'Liked' : 'Like'}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {likeCount}
                      </Badge>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCommentToggle}
                      className="w-full justify-start gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Comments</span>
                      <Badge variant="secondary" className="ml-auto">
                        {post.commentCount}
                      </Badge>
                    </Button>

                    <Button
                      variant={bookmarked ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleBookmark}
                      className="w-full justify-start gap-2"
                    >
                      <Bookmark
                        className={cn('h-4 w-4', bookmarked && 'fill-current')}
                      />
                      <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </Button>

                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="w-full justify-start gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                        <Badge variant="secondary" className="ml-auto">
                          {post.shareCount}
                        </Badge>
                      </Button>

                      {showShareMenu && (
                        <div className="absolute top-full left-0 w-full mt-2 p-2 bg-background border rounded-lg shadow-lg z-10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyLink}
                            className="w-full justify-start gap-2 mb-1"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Copy link</span>
                          </Button>
                          <Separator className="my-2" />
                          <div className="flex justify-around py-2">
                            <Tooltip content="Share on Twitter">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <Twitter className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Share on Facebook">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <Facebook className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Share on LinkedIn">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                              >
                                <Linkedin className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-9">
            <div
              ref={contentRef}
              className="prose prose-lg dark:prose-invert max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link href={`/tag/${tag}`} key={tag}>
                      <Badge variant="secondary" className="text-sm">
                        #{tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Info */}
            <div className="mb-12 p-6 bg-card rounded-lg border">
              <div className="flex items-start gap-4">
                {post.author.avatar ? (
                  <Avatar
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-16 w-16"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {post.author.name}
                  </h3>
                  {post.author.role && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {post.author.role}
                    </p>
                  )}
                  {post.author.bio && (
                    <p className="text-sm text-foreground">{post.author.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile interaction bar */}
            {!isDesktop && (
              <div className="flex justify-between items-center mb-8 p-4 border rounded-lg">
                <div className="flex gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className="flex items-center gap-1"
                  >
                    <Heart
                      className={cn(
                        'h-5 w-5',
                        liked && 'fill-current text-primary',
                      )}
                    />
                    <span>{likeCount}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCommentToggle}
                    className="flex items-center gap-1"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.commentCount}</span>
                  </Button>
                </div>

                <div className="flex gap-4">
                  <Button variant="ghost" size="sm" onClick={handleBookmark}>
                    <Bookmark
                      className={cn(
                        'h-5 w-5',
                        bookmarked && 'fill-current text-primary',
                      )}
                    />
                  </Button>

                  <Button variant="ghost" size="sm" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Post Navigation */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-12">
              {previousPost && (
                <Link
                  href={`/blog/${previousPost.slug}`}
                  className="p-4 border rounded-lg flex-1 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-sm">Previous Post</span>
                  </div>
                  <h4 className="font-medium">{previousPost.title}</h4>
                </Link>
              )}

              {nextPost && (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="p-4 border rounded-lg flex-1 hover:bg-muted transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-2 text-muted-foreground mb-2">
                    <span className="text-sm">Next Post</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium">{nextPost.title}</h4>
                </Link>
              )}
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="mb-12">
                <CommentSection postId={post.id} />
              </div>
            )}

            {/* Related Posts */}
            {post.relatedPosts && post.relatedPosts.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
                <RelatedPosts posts={post.relatedPosts} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
