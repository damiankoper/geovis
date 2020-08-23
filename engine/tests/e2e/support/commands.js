// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add("checkMeta", (fixture) => {
  cy.fixture(fixture).then((meta) => {
    cy.get("[cy-data='title']").should("contain.text", meta.title);
    cy.get("[cy-data='author']").should("contain.text", meta.author);
    cy.get("[cy-data='description']").should("contain.text", meta.description);
    meta.keywords.forEach((k) => {
      cy.get("[cy-data='keyword']").should("contain.text", k);
    });
  });
});
