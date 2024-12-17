describe('Add or Remove Tournament', () => {

    beforeEach(() => {
      cy.login('test4@test.com', 'qweqweqwe');
    });

    it('should show validation errors when required fields are empty', () => {
      cy.visit('http://localhost:3001/admin#tournaments');
 
      cy.get('[data-cy="submit_tournament"]').click();

      cy.get('[data-cy="error_naam"]').should('contain', 'Toernooi naam is vereist.');

      cy.get('[data-cy="error_rondes"]').should('contain', 'Aantal rondes is vereist');
    });

    it('should add a tournament', () => {
      
      cy.visit('http://localhost:3001/admin#tournaments');

      cy.get('[data-cy=name_input]').type('Test toernooi');

      cy.get('[data-cy=round_input]').click();
      cy.get('[role=option]').eq(3).click();
      cy.get('[data-cy="round_input"] span').should('contain', '4');
      
      cy.get('[data-cy="participant_input"]')  
      .contains('Jesse Vaerendonck')  
      .click();
      cy.get('[data-cy="participant_input"]')  
      .contains('Giovanni Berniers')  
      .click();
      cy.get('[data-cy="participant_input"]')  
      .contains('Niels Ongena')  
      .click();
      
      cy.get('[data-cy="submit_tournament"]').click();
      cy.get('[data-cy="tournament_name"]').should('contain', 'Test toernooi');
    });

    it('generate pairings and update score', () => {     
      cy.visit('http://localhost:3001/admin#tournaments');
      cy.get('[data-cy="tournament_manage_button"]').last().click();
      cy.get('[data-cy="generate_pairings_button"]').last().click();

      cy.get('[data-cy="score_input"]').first().click();
      cy.get('[role="option"]').contains('1-0').click();
    });

    it('delete Tournament', () => {
      cy.visit('http://localhost:3001/admin#tournaments');

      cy.get('[data-cy="tournament_delete_button"]').last().click();
    });
  });
  