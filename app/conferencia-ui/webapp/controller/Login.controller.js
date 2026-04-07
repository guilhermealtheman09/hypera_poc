sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageToast"],
  function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("hypera.conferencia.ui.controller.Login", {
      onLogin: function () {
        const oComponent = this.getOwnerComponent();
        const oAppModel = oComponent.getModel("app");
        const sName =
          this.byId("userNameInput").getValue() || "Usuário Operacional";
        const sRole = this.byId("roleSelect").getSelectedKey();

        oAppModel.setProperty("/currentUser", {
          ID:
            sRole === "SUPERVISOR"
              ? "22222222-2222-2222-2222-222222222222"
              : "11111111-1111-1111-1111-111111111111",
          name: sName,
          role: sRole,
        });

        MessageToast.show("Login realizado com sucesso.");
        oComponent.getRouter().navTo("shipments");
      },
    });
  },
);
