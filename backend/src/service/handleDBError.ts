import ServiceError from '../core/serviceError';

const handleDBError = (error: any) => {
  const { code = '', message } = error;

  if (code === 'P2002') {
    switch (true) {
      case message.includes('idx_user_email_unique'):
        throw ServiceError.validationFailed(
          'There is already a user with this email address',
        );
      case message.includes('fide_id'):
        throw ServiceError.validationFailed(
          'There is already a user with this FIDE ID',
        );
      default:
        throw ServiceError.validationFailed('This item already exists');
    }
  }

  if (code === 'P2025') {
    switch (true) {
      case message.includes('fk_game_speler1'):
        throw ServiceError.notFound('The first player does not exist');
      case message.includes('fk_game_speler2'):
        throw ServiceError.notFound('The second player does not exist');
      case message.includes('fk_game_winnaar'):
        throw ServiceError.notFound('The winner does not exist');
      case message.includes('fk_round_tournament'):
        throw ServiceError.notFound('The tournament does not exist');
      case message.includes('fk_participation_user'):
        throw ServiceError.notFound('The user does not exist');
      case message.includes('fk_participation_tournament'):
        throw ServiceError.notFound('The tournament does not exist');
      case message.includes('game'):
        throw ServiceError.notFound('No game with this id exists');
      case message.includes('round'):
        throw ServiceError.notFound('No round with this id exists');
      case message.includes('tournament'):
        throw ServiceError.notFound('No tournament with this id exists');
      case message.includes('user'):
        throw ServiceError.notFound('No user with this id exists');
    }
  }

  if (code === 'P2003') {
    switch (true) {
      case message.includes('round_id'):
        throw ServiceError.conflict(
          'This round is still linked to games',
        );
      case message.includes('speler1_id'):
        throw ServiceError.conflict(
          'This player is still linked to games as speler1',
        );
      case message.includes('speler2_id'):
        throw ServiceError.conflict(
          'This player is still linked to games as speler2',
        );
      case message.includes('winnaar_id'):
        throw ServiceError.conflict(
          'This player is still linked to games as winnaar',
        );
      case message.includes('tournament_id'):
        throw ServiceError.conflict(
          'This tournament is still linked to rounds or participations',
        );
      case message.includes('user_id'):
        throw ServiceError.conflict(
          'This user is still linked to participations',
        );
    }
  }

  throw error;
};

export default handleDBError;