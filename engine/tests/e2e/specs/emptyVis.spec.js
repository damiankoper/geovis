// https://docs.cypress.io/api/introduction/api.html

/// <reference types="cypress"/>

describe("EmptyVis", () => {
  it("should have controls visible", () => {
    cy.visit("iframe.html?id=emptyvis--basic");
    cy.get("[cy-data='open-control-panel']").click();
    cy.get("[cy-data='open-control-panel']").should("not.be.visible");
  });

  it("should display meta in info tab", () => {
    cy.get("[cy-data='tab-controls']").should("not.be.visible");
    cy.get("[cy-data='tab-info']").should("be.visible").click();
    cy.checkMeta("emptyVis.meta");
  });

  it("should close vis controls", () => {
    cy.get("[cy-data='close-control-panel']").should("be.visible").click();
    cy.get("[cy-data='close-control-panel']").should("not.be.visible");
  });

  it("should display latitude and longitude", () => {
    cy.get("[cy-data='position']")
      .text()
      .then((text) => expect(text).to.eq("0° 00\" 00' N | 0° 00\" 00' W"));
  });

  it("should move camera - change latitude and longitude", () => {
    cy.get("[cy-data='position']")
      .text()
      .then((text) => expect(text).to.eq("0° 00\" 00' N | 0° 00\" 00' W"));

    cy.get("canvas").trigger("pointerdown", {
      clientX: 0,
      clientY: 0,
      buttons: 1,
      pointerId: 1,
    });

    cy.get("canvas").trigger("pointermove", {
      clientX: 100,
      clientY: 0,
      buttons: 1,
      pointerId: 1,
    });

    cy.get("canvas").trigger("pointermove", {
      clientX: 102,
      clientY: 0,
      buttons: 1,
      pointerId: 1,
    });

    cy.get("canvas").trigger("pointerup", {
      clientX: 100,
      clientY: 0,
      buttons: 1,
      pointerId: 1,
    });

    cy.get("[cy-data='position']")
      .text()
      .then((text) => expect(text).to.eq("0° 03\" 49' N | 9° 08\" 16' E"));
  });

  it("should be empty vis", () => {
    cy.get("canvas").toMatchImageSnapshot();
  });
});
