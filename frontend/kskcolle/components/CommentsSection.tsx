'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../app/contexts/auth"
import * as api from "../app/api/index.js"
import { CommentWithAuthor, CreateCommentRequest, GetCommentsResponse } from "../data/comment"
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { MessageSquare, Edit, Trash2, Send, User as UserIcon, Reply } from 'lucide-react'
import Image from 'next/image'

interface CommentsSectionProps {
  articleId: number
}

export default function CommentsSection({ articleId }: CommentsSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Check if user can comment (user, bestuurslid, or admin roles)
  const canComment = user && (
    user.roles.includes('user') || 
    user.roles.includes('bestuurslid') || 
    user.roles.includes('admin')
  )

  useEffect(() => {
    fetchComments()
  }, [articleId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response: GetCommentsResponse = await api.getComments(articleId)
      setComments(response.comments)
      setTotal(response.total)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (parentCommentId?: number) => {
    const content = parentCommentId ? replyContent : newComment
    if (!content.trim() || !canComment) return

    try {
      setSubmitting(true)
      const commentData: CreateCommentRequest = {
        article_id: articleId,
        content: content.trim(),
        parent_comment_id: parentCommentId,
      }

      const newCommentData = await api.createComment(commentData)
      
      if (parentCommentId) {
        // Add reply to the correct parent comment (recursive search)
        const addReplyToComment = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
          return comments.map(comment => {
            if (comment.comment_id === parentCommentId) {
              return { ...comment, replies: [...(comment.replies || []), newCommentData] }
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: addReplyToComment(comment.replies) }
            }
            return comment
          })
        }
        
        setComments(prev => addReplyToComment(prev))
        setReplyContent('')
        setReplyingTo(null)
      } else {
        // Add as top-level comment
        setComments(prev => [...prev, newCommentData])
        setNewComment('')
        setTotal(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Er is een fout opgetreden bij het plaatsen van de reactie.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return

    try {
      setSubmitting(true)
      const updatedComment = await api.updateComment(commentId, { content: editContent.trim() })
      
      // Update the comment in the state
      const updateCommentInState = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.map(comment => {
          if (comment.comment_id === commentId) {
            return { ...comment, ...updatedComment }
          }
          if (comment.replies) {
            return { ...comment, replies: updateCommentInState(comment.replies) }
          }
          return comment
        })
      }
      
      setComments(updateCommentInState)
      setEditingComment(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Er is een fout opgetreden bij het bewerken van de reactie.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return

    try {
      setSubmitting(true)
      await api.deleteComment(commentId)
      
      // Remove the comment from the state
      const removeCommentFromState = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.filter(comment => {
          if (comment.comment_id === commentId) {
            return false
          }
          if (comment.replies) {
            comment.replies = removeCommentFromState(comment.replies)
          }
          return true
        })
      }
      
      setComments(removeCommentFromState)
      setTotal(prev => prev - 1)
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Er is een fout opgetreden bij het verwijderen van de reactie.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (comment: CommentWithAuthor) => {
    setEditingComment(comment.comment_id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const canEditComment = (comment: CommentWithAuthor) => {
    return user && (
      comment.author_id === user.user_id || 
      user.roles.includes('admin')
    )
  }

  const startReply = (commentId: number) => {
    setReplyingTo(commentId)
    setReplyContent('')
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reacties
        </h3>
        <div className="text-center py-8 text-gray-500">
          Reacties laden...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-mainAccent">
        <MessageSquare className="h-5 w-5" />
        Reacties ({total})
      </h3>

      {canComment ? (
        <Card>
          <CardContent className="pt-6">
            <Textarea
              placeholder="Schrijf je reactie hier..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="mb-4"
            />
            <div className="flex justify-end items-center">
              <Button 
                onClick={() => handleSubmitComment()}
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-2 bg-mainAccent hover:bg-mainAccentDark"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Bezig...' : 'Plaats reactie'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <UserIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">
            Je moet ingelogd zijn als actief lid om reacties te kunnen plaatsen.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nog geen reacties!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              depth={0}
              canComment={canComment}
              canEditComment={canEditComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              submitting={submitting}
              onStartReply={startReply}
              onCancelReply={cancelReply}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSubmitReply={handleSubmitComment}
              onSubmitEdit={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Comment Item Component for threaded display
function CommentItem({
  comment,
  depth = 0,
  canComment,
  canEditComment,
  replyingTo,
  replyContent,
  setReplyContent,
  editingComment,
  editContent,
  setEditContent,
  submitting,
  onStartReply,
  onCancelReply,
  onStartEdit,
  onCancelEdit,
  onSubmitReply,
  onSubmitEdit,
  onDeleteComment,
}: {
  comment: CommentWithAuthor
  depth?: number
  canComment: boolean
  canEditComment: (comment: CommentWithAuthor) => boolean
  replyingTo: number | null
  replyContent: string
  setReplyContent: (content: string) => void
  editingComment: number | null
  editContent: string
  setEditContent: (content: string) => void
  submitting: boolean
  onStartReply: (commentId: number) => void
  onCancelReply: () => void
  onStartEdit: (comment: CommentWithAuthor) => void
  onCancelEdit: () => void
  onSubmitReply: (parentCommentId: number) => void
  onSubmitEdit: (commentId: number) => void
  onDeleteComment: (commentId: number) => void
}) {
  // Avatar size decreases with depth (min 24px)
  const avatarSize = Math.max(40 - depth * 4, 24)
  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.author.avatar_url ? (
              <div className="relative" style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}>
                <img
                  src={comment.author.avatar_url}
                  alt={`${comment.author.voornaam} ${comment.author.achternaam}`}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="bg-mainAccent/10 rounded-full items-center justify-center absolute top-0 left-0"
                  style={{ width: `${avatarSize}px`, height: `${avatarSize}px`, display: 'none' }}
                >
                  <span className="text-mainAccent font-semibold" style={{ fontSize: `${avatarSize * 0.4}px` }}>
                    {comment.author.voornaam[0]}{comment.author.achternaam[0]}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                className="bg-mainAccent/10 rounded-full flex items-center justify-center"
                style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
              >
                <span className="text-mainAccent font-semibold" style={{ fontSize: `${avatarSize * 0.4}px` }}>
                  {comment.author.voornaam[0]}{comment.author.achternaam[0]}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {comment.author.voornaam} {comment.author.achternaam}
                </span>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                {canComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartReply(comment.comment_id)}
                    className="h-8 w-8 p-0 text-mainAccent hover:text-mainAccentDark hover:bg-mainAccent/10"
                    title="Reageren"
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}
                
                {canEditComment(comment) && (
                  <>
                    {editingComment !== comment.comment_id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStartEdit(comment)}
                          className="h-8 w-8 p-0 text-mainAccent hover:text-mainAccentDark hover:bg-mainAccent/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteComment(comment.comment_id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={onCancelEdit}
                          className="h-8 px-3 hover:bg-mainAccent/10"
                        >
                          Annuleren
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSubmitEdit(comment.comment_id)}
                          disabled={!editContent.trim() || submitting}
                          className="h-8 px-3 bg-mainAccent hover:bg-mainAccentDark"
                        >
                          Opslaan
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {editingComment === comment.comment_id ? (
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="mb-2"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
            
            {comment.updated_at !== comment.created_at && (
              <p className="text-xs text-gray-500 mt-2">
                Bewerkt op {format(new Date(comment.updated_at), 'dd MMM yyyy HH:mm', { locale: nl })}
              </p>
            )}

            {/* Reply Form */}
            {replyingTo === comment.comment_id && (
              <div className="mt-4 p-4 bg-mainAccent/5 border border-mainAccent/20 rounded-lg">
                <Textarea
                  placeholder="Schrijf je reactie hier..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                  className="mb-4"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelReply}
                    className="hover:bg-mainAccent/10"
                  >
                    Annuleren
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSubmitReply(comment.comment_id)}
                    disabled={!replyContent.trim() || submitting}
                    className="flex items-center gap-2 bg-mainAccent hover:bg-mainAccentDark"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Bezig...' : 'Plaats reactie'}
                  </Button>
                </div>
              </div>
            )}

            {/* Replies - Recursive rendering for unlimited nesting */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 pl-6 border-l-2 border-mainAccent/30 space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.comment_id}
                    comment={reply}
                    depth={depth + 1}
                    canComment={canComment}
                    canEditComment={canEditComment}
                    replyingTo={replyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    editingComment={editingComment}
                    editContent={editContent}
                    setEditContent={setEditContent}
                    submitting={submitting}
                    onStartReply={onStartReply}
                    onCancelReply={onCancelReply}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                    onSubmitReply={onSubmitReply}
                    onSubmitEdit={onSubmitEdit}
                    onDeleteComment={onDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}