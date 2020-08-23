// https://docs.cypress.io/api/introduction/api.html

/// <reference types="cypress" />

describe("VisPicker - layout & filter", () => {
  it("should be responsive", () => {
    cy.visit("/");
    cy.viewport(1980, 1080);
    cy.get("[cy-data='vis-card']").should("have.css", "max-width", "25%");
    cy.viewport(1280, 720);
    cy.get("[cy-data='vis-card']").should("have.css", "max-width", "33.3333%");
    cy.viewport(960, 720);
    cy.get("[cy-data='vis-card']").should("have.css", "max-width", "50%");
    cy.viewport(500, 720);
    cy.get("[cy-data='vis-card']").should("have.css", "max-width", "100%");
  });

  it("should filter visualizations", () => {
    cy.viewport(1280, 720);
    cy.get("[cy-data='search']").type("atmosphere");
    cy.get("[cy-data='vis-card']").should("have.length", 5);
    cy.get("[cy-data='vis-card']").should("contain.text", "atmosphere");
  });

  it("should filter visualizations - many", () => {
    cy.get("[cy-data='search']").clear().type("earth osm");
    cy.get("[cy-data='vis-card']").should("have.length", 4);
    cy.get("[cy-data='vis-card']")
      .should("contain.text", "earth")
      .should("contain.text", "OSM");
  });

  it("should filter visualizations - single", () => {
    cy.get("[cy-data='search']").clear().type("title");
    cy.get("[cy-data='vis-card']").should("have.length", 1);
    cy.get("[cy-data='vis-card']").should("contain.text", "Title");
  });

  it("should filter visualizations - single", () => {
    cy.get("[cy-data='search']").clear().type("title");
    cy.get("[cy-data='vis-card']").should("have.length", 1);
    cy.get("[cy-data='vis-card']").should("contain.text", "Title");
  });
});
