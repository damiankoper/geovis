// https://docs.cypress.io/api/introduction/api.html

/// <reference types="cypress"/>

describe("EarthVis", () => {
  it("should load", () => {
    cy.visit("iframe.html?id=earthvis--basic");
    cy.wait(60000);
  });

  it("should be earth vis", () => {
    cy.clock(new Date(2020, 10, 10).getTime());
    cy.wait(1000);
    cy.get("canvas").toMatchImageSnapshot();
  });
});
