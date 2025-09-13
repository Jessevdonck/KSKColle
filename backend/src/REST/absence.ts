import Router from '@koa/router'
import { Context } from 'koa'
import * as absenceService from '../service/absenceService'
import { requireAuthentication } from '../core/auth'
import type { ChessAppContext, ChessAppState } from '../types/koa'

/**
 * Meld afwezigheid voor een speler
 * POST /absence
 */
export async function reportAbsence(ctx: Context): Promise<void> {
  try {

    // Haal user uit context (door requireAuthentication middleware)
    const user = (ctx as any).state.session
    if (!user) {
      ctx.status = 401
      ctx.body = { message: 'Authenticatie vereist' }
      return
    }

    // Haal parameters uit body
    const { tournament_id } = ctx.request.body as any

    // Validatie
    if (!tournament_id) {
      ctx.status = 400
      ctx.body = { message: 'tournament_id is vereist' }
      return
    }

    if (typeof tournament_id !== 'number') {
      ctx.status = 400
      ctx.body = { message: 'tournament_id moet een nummer zijn' }
      return
    }

    // Meld afwezigheid
    const result = await absenceService.reportAbsence(user.userId, tournament_id)

    ctx.status = 200
    ctx.body = { 
      message: `Afwezigheid gemeld voor ronde ${result.round_number}`,
      round_number: result.round_number,
      success: true
    }

  } catch (error: any) {
    console.error('Error in reportAbsence:', error)
    
    ctx.status = 500
    ctx.body = { 
      message: error.message || 'Er is een fout opgetreden bij het melden van afwezigheid',
      success: false
    }
  }
}

/**
 * Install absence router
 */
export default function installAbsenceRouter(router: Router<ChessAppState, ChessAppContext>): void {
  router.post('/absence', requireAuthentication, reportAbsence)
}
