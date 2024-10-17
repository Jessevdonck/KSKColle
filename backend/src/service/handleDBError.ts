import ServiceError from '../core/serviceError';

const handleDBError = (error: any) => {
  const { code = '', message } = error;

  if (code === 'P2002') {
    switch (true) {
      case message.includes('idx_place_name_unique'):
        throw ServiceError.validationFailed(
          'A place with this name already exists',
        );
      case message.includes('idx_user_email_unique'):
        throw ServiceError.validationFailed(
          'There is already a user with this email address',
        );
      default:
        throw ServiceError.validationFailed('This item already exists');
    }
  }

  if (code === 'P2025') {
    switch (true) {
      case message.includes('fk_transaction_user'):
        throw ServiceError.notFound('This user does not exist');
      case message.includes('fk_transaction_place'):
        throw ServiceError.notFound('This place does not exist');
      case message.includes('transaction'):
        throw ServiceError.notFound('No transaction with this id exists');
      case message.includes('place'):
        throw ServiceError.notFound('No place with this id exists');
      case message.includes('user'):
        throw ServiceError.notFound('No user with this id exists');
    }
  }

  if (code === 'P2003') {
    switch (true) {
      case message.includes('place_id'):
        throw ServiceError.conflict(
          'This place is still linked to transactions',
        );
      case message.includes('user_id'):
        throw ServiceError.conflict(
          'This user is still linked to transactions',
        );
    }
  }

  throw error;
};

export default handleDBError;