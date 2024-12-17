declare namespace Cypress {
    interface Chainable<Subject = string> {
        login(email: string, password: string): Chainable<void>
        logout(): Chainable<void>
    }
  }
