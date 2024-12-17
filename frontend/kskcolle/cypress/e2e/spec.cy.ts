describe('Homepage', () => {
  it('draait de applicatie', () => {
    cy.visit('http://localhost:3001'); 
    cy.get('[data-cy=contact]').click();
    cy.get('[data-cy=about]').click();
  });
});

describe('General', () => {
  it('draait de applicatie', () => {
    cy.visit('http://localhost:3001');
  });

  it('should login and logout', () => {
    cy.login('test4@test.com', 'qweqweqwe'); 
    cy.logout();
  });
});