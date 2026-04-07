sap.ui.define(
  ["sap/ui/core/UIComponent", "sap/ui/model/json/JSONModel"],
  function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("hypera.conferencia.ui.Component", {
      metadata: {
        manifest: "json",
      },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);

        const oAppModel = new JSONModel({
          currentUser: {
            ID: "11111111-1111-1111-1111-111111111111",
            name: "Colaborador Hypera",
            role: "COLABORADOR",
          },
        });

        this.setModel(oAppModel, "app");
        this.getRouter().initialize();
      },
    });
  },
);
