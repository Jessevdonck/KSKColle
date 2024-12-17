describe('User List', () => {

    beforeEach(() => {
      cy.login('test4@test.com', 'qweqweqwe');
    });
  
  it('should show all users', () => {
      cy.intercept(
        'GET',
        'http://localhost:9000/api/users',
        { fixture: 'users.json' }
      );
  
      cy.visit('http://localhost:3001/spelers');

      cy.get('[data-cy="name"]').eq(0).should('contain', 'Dyckmans, Björn');
      cy.get('[data-cy="rating"]').eq(0).should('contain', '2174');
      cy.get('[data-cy="rating_difference"]').eq(0).should('contain', '-');
      cy.get('[data-cy="rating_max"]').eq(0).should('contain', '2181');
    });

    it('should show a loading indicator for a very slow response', () => {
        cy.intercept(
          'http://localhost:9000/api/users',
          (req) => {
            req.on('response', (res) => {
              res.setDelay(1000);
            });
          },
        ).as('slowResponse');
    
        cy.visit('http://localhost:3001/spelers');
        cy.get('[data-cy=loader]').should('be.visible');
        cy.wait('@slowResponse');
        cy.get('[data-cy=loader]').should('not.exist');
      });

      it('should show a message when no transactions are found', () => {
        cy.intercept(
            'GET',
            'http://localhost:9000/api/users',
            { fixture: 'empty.json' }
            );
        cy.visit('http://localhost:3001/spelers');
      
        cy.get('[data-cy=no_users_message]').should('exist');
      });

      it('should show an error if the API call fails', () => {
        cy.intercept(
          'GET',
          'http://localhost:9000/api/spelers',
          {
            statusCode: 500,
            body: {
              error: 'Internal server error',
            },
          },
        );
        cy.visit('http://localhost:3001/spelers');
    
        cy.get('[data-cy=axios_error_message').should('exist');
      });
  });
  