// src/components/features/blog/CommentSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { MessageCircle, Send, User, ThumbsUp, Reply, Flag, Trash, Edit } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

interface Author {
  id: string;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  liked?: boolean;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
}

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment is too long'),
});

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting }
  } = useForm<{ content: string }>({
    resolver: zodResolver(commentSchema),
  });
  
  // Load comments
  useEffect(() => {
    const fetchComments = async () => {
      // This would be an API call in a real application
      // Mocking data for demo purposes
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockComments: Comment[] = [
          {
            id: '1',
            content: 'Great article! I really enjoyed the insights on how to properly structure React components.',
            author: {
              id: '101',
              name: 'Jane Cooper',
              avatar: 'https://i.pravatar.cc/150?img=1',
            },
            createdAt: '2023-01-15T12:00:00Z',
            likes: 5,
            liked: true,
            replies: [
              {
                id: '11',
                content: 'Thanks Jane! I appreciate your feedback.',
                author: {
                  id: '102',
                  name: 'Author Name',
                  avatar: 'https://i.pravatar.cc/150?img=2',
                },
                createdAt: '2023-01-15T12:30:00Z',
                likes: 2,
              },
              {
                id: '12',
                content: 'I agree with you Jane, the component patterns were very well explained.',
                author: {
                  id: '103',
                  name: 'Robert Johnson',
                  avatar: 'https://i.pravatar.cc/150?img=3',
                },
                createdAt: '2023-01-15T12:45:00Z',
                likes: 1,
              }
            ]
          },
          {
            id: '2',
            content: 'I would have liked to see more examples with TypeScript. Otherwise, great post!',
            author: {
              id: '104',
              name: 'Michael Wilson',
              avatar: 'https://i.pravatar.cc/150?img=4',
            },
            createdAt: '2023-01-16T09:15:00Z',
            likes: 3,
          }
        ];
        
        setComments(mockComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load comments',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [postId, toast]);
  
  // Submit comment
  const onSubmitComment = async (data: { content: string }) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to post a comment',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // This would be an API call in a real application
      // Mocking for demo purposes
      
      // Create new comment object
      const newComment: Comment = {
        id: Date.now().toString(),
        content: data.content,
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        },
        createdAt: new Date().toISOString(),
        likes: 0,
      };
      
      if (replyingTo) {
        // Add reply to existing comment
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === replyingTo) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
              };
            }
            return comment;
          })
        );
        
        setReplyingTo(null);
      } else if (editingComment) {
        // Update existing comment
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === editingComment) {
              return {
                ...comment,
                content: data.content,
                updatedAt: new Date().toISOString(),
              };
            }
            
            // Check if the edited comment is a reply
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => {
                  if (reply.id === editingComment) {
                    return {
                      ...reply,
                      content: data.content,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return reply;
                }),
              };
            }
            
            return comment;
          })
        );
        
        setEditingComment(null);
      } else {
        // Add new top-level comment
        setComments(prevComments => [newComment, ...prevComments]);
      }
      
      // Reset form
      reset();
      
      toast({
        title: 'Success',
        description: editingComment 
          ? 'Comment updated successfully' 
          : replyingTo 
            ? 'Reply posted successfully' 
            : 'Comment posted successfully',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    }
  };
  
  // Handle like action
  const handleLike = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => {
        // Check if this is the comment to be liked/unliked
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.liked ? comment.likes - 1 : comment.likes + 1,
            liked: !comment.liked,
          };
        }
        
        // Check if the comment to be liked/unliked is a reply
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                return {
                  ...reply,
                  likes: reply.liked ? reply.likes - 1 : reply.likes + 1,
                  liked: !reply.liked,
                };
              }
              return reply;
            }),
          };
        }
        
        return comment;
      })
    );
  };
  
  // Handle reply action
  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setEditingComment(null);
    reset({ content: '' });
    
    // Scroll to comment form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle edit action
  const handleEdit = (commentId: string, content: string) => {
    setEditingComment(commentId);
    setReplyingTo(null);
    reset({ content });
    
    // Scroll to comment form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Handle delete action
  const handleDelete = (commentId: string) => {
    setComments(prevComments => 
      prevComments.filter(comment => {
        // Remove the comment if it's a top-level comment
        if (comment.id === commentId) {
          return false;
        }
        
        // Remove the comment if it's a reply
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== commentId),
          };
        }
        
        return true;
      })
    );
    
    toast({
      title: 'Comment deleted',
      description: 'Your comment has been deleted',
    });
  };
  
  // Cancel reply or edit
  const handleCancel = () => {
    setReplyingTo(null);
    setEditingComment(null);
    reset({ content: '' });
  };
  
  // Render a single comment
  const renderComment = (comment: Comment, isReply = false) => (
    <div 
      key={comment.id} 
      className={cn(
        "relative p-4 border rounded-lg mb-4",
        isReply ? "ml-12" : ""
      )}
    >
      <div className="flex items-start gap-3">
        {comment.author.avatar ? (
          <Avatar
            src={comment.author.avatar}
            alt={comment.author.name}
            className="h-10 w-10"
          />
        ) : (
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <h4 className="font-semibold text-foreground">
              {comment.author.name}
            </h4>
            <span className="text-xs text-muted-foreground">
              {format(new Date(comment.createdAt), 'MMM d, yyyy • h:mm a')}
              {comment.updatedAt && ' (edited)'}
            </span>
          </div>
          
          <p className="text-foreground mb-3">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 p-1 h-auto"
              onClick={() => handleLike(comment.id)}
            >
              <ThumbsUp className={cn(
                "h-4 w-4",
                comment.liked ? "fill-primary text-primary" : "text-muted-foreground"
              )} />
              <span>{comment.likes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 p-1 h-auto"
              onClick={() => handleReply(comment.id)}
            >
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span>Reply</span>
            </Button>
            
            {user && user.id === comment.author.id && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 p-1 h-auto"
                  onClick={() => handleEdit(comment.id, comment.content)}
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                  <span>Edit</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 p-1 h-auto text-destructive hover:text-destructive"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </>
            )}
            
            {user && user.id !== comment.author.id && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 p-1 h-auto"
              >
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>Report</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-card rounded-lg p-6 border">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
      </div>
      
      {/* Comment form */}
      <form 
        id="comment-form"
        onSubmit={handleSubmit(onSubmitComment)} 
        className="mb-8"
      >
        <div className="flex gap-3">
          {user?.avatar ? (
            <Avatar
              src={user.avatar}
              alt={user.name}
              className="h-10 w-10"
            />
          ) : (
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary">
              <User className="h-5 w-5 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            <Textarea
              {...register('content')}
              placeholder={
                editingComment 
                  ? "Edit your comment..." 
                  : replyingTo 
                    ? "Write a reply..." 
                    : "Join the conversation..."
              }
              className={cn(
                "resize-none min-h-[100px]",
                errors.content && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.content && (
              <p className="text-sm text-destructive mt-1">
                {errors.content.message}
              </p>
            )}
            
            <div className="flex justify-between mt-2">
              {(replyingTo || editingComment) && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="submit"
                className="ml-auto"
                disabled={isSubmitting || !user}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {editingComment 
                      ? "Update Comment" 
                      : replyingTo 
                        ? "Post Reply" 
                        : "Post Comment"
                    }
                  </>
                )}
              </Button>
            </div>
            
            {!user && (
              <p className="text-sm text-muted-foreground mt-2">
                Please <a href="/login" className="text-primary hover:underline">sign in</a> to post a comment.
              </p>
            )}
          </div>
        </div>
      </form>
      
      {/* Comments list */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div>
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </div>
  );
};