// https://docs.cypress.io/api/introduction/api.html

/// <reference types="cypress" />
describe("VisPicker - card", () => {
  function checkMeta(data) {
    cy.get("[cy-data='title']").should("contain.text", data.title);
    cy.get("[cy-data='description']").should("contain.text", data.description);
    cy.get("[cy-data='author']").should("contain.text", data.author);
    data.keywords.forEach((k) => {
      cy.get("[cy-data='keyword']").should("contain.text", k);
    });

    if (data.thumbnail) {
      cy.get("[cy-data='thumbnail']").should("be.visible");
      cy.get("[cy-data='no-thumbnail']").should("not.be.visible");
    } else {
      cy.get("[cy-data='thumbnail']").should("not.be.visible");
      cy.get("[cy-data='no-thumbnail']").should("be.visible");
    }
  }

  it("should display right meta - filter", () => {
    cy.viewport(1280, 720);
    cy.visit("/");
    cy.get("[cy-data='search']").clear().type("current time");
    cy.get("[cy-data='vis-card']").should("have.length", 1);
  });

  it("should display right meta - EarthVis", () => {
    cy.fixture("earthVis.meta").then((meta) => {
      checkMeta(meta);
    });
  });

  it("should display right meta - filter", () => {
    cy.get("[cy-data='search']").clear().type("Title");
    cy.get("[cy-data='vis-card']").should("have.length", 1);
  });

  it("should display right meta - EmptyVis", () => {
    cy.fixture("emptyVis.meta").then((meta) => {
      checkMeta(meta);
    });
  });

  it("should redirect to VisViewer", () => {
    cy.get("[cy-data=show]").click();
    cy.url().should("contain", "emptyVis");
  });

  it("should redirect back to VisPicker", () => {
    cy.get("[cy-data=back]").click();
    cy.url().should("not.contain", "emptyVis");
  });
});
