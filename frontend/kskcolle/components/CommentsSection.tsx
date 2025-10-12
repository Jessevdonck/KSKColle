"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../app/contexts/auth"
import * as api from "../app/api/index.js"
import { CommentWithAuthor, CreateCommentRequest, GetCommentsResponse } from "../data/comment"
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { MessageSquare, Edit, Trash2, Send, User as UserIcon } from 'lucide-react'
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

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !canComment) return

    try {
      setSubmitting(true)
      const commentData: CreateCommentRequest = {
        article_id: articleId,
        content: newComment.trim(),
      }

      const newCommentData = await api.createComment(commentData)
      setComments(prev => [...prev, newCommentData])
      setNewComment('')
      setTotal(prev => prev + 1)
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
      
      setComments(prev => 
        prev.map(comment => 
          comment.comment_id === commentId ? updatedComment : comment
        )
      )
      setEditingComment(null)
      setEditContent('')
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('Er is een fout opgetreden bij het bijwerken van de reactie.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return

    try {
      await api.deleteComment(commentId)
      setComments(prev => prev.filter(comment => comment.comment_id !== commentId))
      setTotal(prev => prev - 1)
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Er is een fout opgetreden bij het verwijderen van de reactie.')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reacties ({total})
        </h3>
      </div>

      {/* Comment form */}
      {canComment ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plaats een reactie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Schrijf je reactie hier..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end items-center">
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Bezig...' : 'Plaats reactie'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">
            Alleen actieve leden kunnen reacties plaatsen.
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nog geen reacties. Wees de eerste om te reageren!
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.comment_id} className="relative">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.author.avatar_url ? (
                      <div className="relative w-10 h-10">
                        <img
                          src={comment.author.avatar_url}
                          alt={`${comment.author.voornaam} ${comment.author.achternaam}`}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            // Hide image on error and show fallback
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div 
                          className="w-10 h-10 bg-mainAccent/10 rounded-full items-center justify-center absolute top-0 left-0"
                          style={{ display: 'none' }}
                        >
                          <span className="text-mainAccent font-semibold text-sm">
                            {comment.author.voornaam[0]}{comment.author.achternaam[0]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-mainAccent/10 rounded-full flex items-center justify-center">
                        <span className="text-mainAccent font-semibold text-sm">
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
                  
                  {canEditComment(comment) && (
                    <div className="flex items-center gap-1">
                      {editingComment !== comment.comment_id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(comment)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.comment_id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            className="h-8 px-2"
                          >
                            Annuleren
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.comment_id)}
                            disabled={!editContent.trim() || submitting}
                            className="h-8 px-2"
                          >
                            Opslaan
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
