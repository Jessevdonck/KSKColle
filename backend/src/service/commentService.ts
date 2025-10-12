import { PrismaClient } from '@prisma/client'
import handleDBError from './handleDBError'
import type { 
  CommentWithAuthor, 
  CreateCommentRequest, 
  UpdateCommentRequest, 
  GetCommentsRequest, 
  GetCommentsResponse
} from '../types/comment'
import { 
  createArticleCommentNotification, 
  createCommentReplyNotification 
} from './notificationService'

const prisma = new PrismaClient()

export const createComment = async (authorId: number, commentData: CreateCommentRequest): Promise<CommentWithAuthor> => {
  try {
    const comment = await prisma.comment.create({
      data: {
        article_id: commentData.article_id,
        author_id: authorId,
        content: commentData.content,
        parent_comment_id: commentData.parent_comment_id || null,
      },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          }
        }
      }
    })

    // Send notifications
    if (commentData.parent_comment_id) {
      // This is a reply to a comment
      const parentComment = await prisma.comment.findUnique({
        where: { comment_id: commentData.parent_comment_id },
        include: { article: true }
      })
      
      if (parentComment) {
        await createCommentReplyNotification(
          parentComment.author_id,
          authorId,
          `${comment.author.voornaam} ${comment.author.achternaam}`,
          commentData.article_id,
          commentData.parent_comment_id,
          parentComment.article.title
        )
      }
    } else {
      // This is a comment on an article
      const article = await prisma.article.findUnique({
        where: { article_id: commentData.article_id }
      })
      
      if (article) {
        await createArticleCommentNotification(
          article.author_id,
          authorId,
          `${comment.author.voornaam} ${comment.author.achternaam}`,
          commentData.article_id,
          article.title
        )
      }
    }

    return comment
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getCommentsByArticleId = async (request: GetCommentsRequest): Promise<GetCommentsResponse> => {
  try {
    const { article_id, limit = 20, offset = 0 } = request

    // Get top-level comments (no parent)
    const [topLevelComments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          article_id,
          parent_comment_id: null
        },
        include: {
          author: {
            select: {
              user_id: true,
              voornaam: true,
              achternaam: true,
              avatar_url: true,
            }
          }
        },
        orderBy: { created_at: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.comment.count({
        where: { 
          article_id,
          parent_comment_id: null
        },
      })
    ])

    // Get ALL replies for this article (not just first level)
    const allReplies = await prisma.comment.findMany({
      where: {
        article_id,
        parent_comment_id: { not: null }
      },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          }
        }
      },
      orderBy: { created_at: 'asc' },
    })

    // Build hierarchical structure recursively
    const buildCommentTree = (parentId: number | null): any[] => {
      return allReplies
        .filter(reply => reply.parent_comment_id === parentId)
        .map(reply => ({
          ...reply,
          replies: buildCommentTree(reply.comment_id)
        }))
    }

    const commentsWithReplies = topLevelComments.map(comment => ({
      ...comment,
      replies: buildCommentTree(comment.comment_id)
    }))

    return {
      comments: commentsWithReplies,
      total,
      hasMore: offset + topLevelComments.length < total,
    }
  } catch (error) {
    throw handleDBError(error)
  }
}

export const updateComment = async (commentId: number, authorId: number, commentData: UpdateCommentRequest): Promise<CommentWithAuthor> => {
  try {
    // First check if the comment exists and belongs to the author
    const existingComment = await prisma.comment.findFirst({
      where: {
        comment_id: commentId,
        author_id: authorId,
      }
    })

    if (!existingComment) {
      throw new Error('Comment not found or you do not have permission to edit it')
    }

    const comment = await prisma.comment.update({
      where: { comment_id: commentId },
      data: {
        content: commentData.content,
        updated_at: new Date(),
      },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          }
        }
      }
    })

    return comment
  } catch (error) {
    throw handleDBError(error)
  }
}

export const deleteComment = async (commentId: number, authorId: number, userRoles: string[]): Promise<void> => {
  try {
    // Check if user has permission to delete this comment
    const comment = await prisma.comment.findUnique({
      where: { comment_id: commentId },
      include: {
        author: true
      }
    })

    if (!comment) {
      throw new Error('Comment not found')
    }

    // User can delete their own comment, or admins can delete any comment
    const isOwnComment = comment.author_id === authorId
    const isAdmin = userRoles.includes('admin')

    if (!isOwnComment && !isAdmin) {
      throw new Error('You do not have permission to delete this comment')
    }

    await prisma.comment.delete({
      where: { comment_id: commentId },
    })
  } catch (error) {
    throw handleDBError(error)
  }
}

export const getCommentById = async (commentId: number): Promise<CommentWithAuthor | null> => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { comment_id: commentId },
      include: {
        author: {
          select: {
            user_id: true,
            voornaam: true,
            achternaam: true,
            avatar_url: true,
          }
        }
      }
    })

    return comment
  } catch (error) {
    throw handleDBError(error)
  }
}
