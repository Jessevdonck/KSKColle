describe('Add or Remove User', () => {

    beforeEach(() => {
      cy.login('test4@test.com', 'qweqweqwe');
    });

    it('should show validation errors when required fields are empty', () => {
      cy.visit('http://localhost:3001/admin#users');
 
      cy.get('[data-cy="submit_user"]').click();

      cy.get('[data-cy="error_voornaam"]').should('be.visible');
      cy.get('[data-cy="error_achternaam"]').should('be.visible');
      cy.get('[data-cy="error_password"]').should('be.visible');
      cy.get('[data-cy="error_email"]').should('be.visible');
      cy.get('[data-cy="error_telnr"]').should('be.visible');
      cy.get('[data-cy="error_rating"]').should('be.visible');
    });

    it('should add a user', () => {  
        cy.visit('http://localhost:3001/admin#users');
  
        cy.get('[data-cy=voornaam]').type('John');
        cy.get('[data-cy=achternaam]').type('Doe');
        cy.get('[data-cy=password]').type('ditiseentest');
        cy.get('[data-cy=email]').type('johndoe@test.com');
        cy.get('[data-cy=telnr]').type('123456789');
        cy.get('[data-cy=rating]').type('1234');
  
        cy.get('[data-cy="submit_user"]').first().click();
      });
  
});