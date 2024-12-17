describe('Tournament list', () => {

  beforeEach(() => {
    cy.login('test4@test.com', 'qweqweqwe');
  });

it('should show all tournaments', () => {
    cy.intercept(
      'GET',
      'http://localhost:9000/api/tournament',
      { fixture: 'tournaments.json' }
    );

    cy.visit('http://localhost:3001/admin#tournaments');

      cy.get('[data-cy="tournament_name"]').eq(0).should('contain', 'Herfstcompetitie');
      cy.get('[data-cy="tournament_round"]').eq(0).should('contain', '8');
      cy.get('[data-cy="tournament_participation"]').eq(0).should('contain', '5');
  });
});