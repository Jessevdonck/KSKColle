import { PrismaClient } from '@prisma/client'
import handleDBError from './handleDBError'
import type { 
  CommentWithAuthor, 
  CreateCommentRequest, 
  UpdateCommentRequest, 
  GetCommentsRequest, 
  GetCommentsResponse
} from '../types/comment'

const prisma = new PrismaClient()

export const createComment = async (authorId: number, commentData: CreateCommentRequest): Promise<CommentWithAuthor> => {
  try {
    const comment = await prisma.comment.create({
      data: {
        article_id: commentData.article_id,
        author_id: authorId,
        content: commentData.content,
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

export const getCommentsByArticleId = async (request: GetCommentsRequest): Promise<GetCommentsResponse> => {
  try {
    const { article_id, limit = 20, offset = 0 } = request

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { article_id },
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
        where: { article_id },
      })
    ])

    return {
      comments,
      total,
      hasMore: offset + comments.length < total,
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
