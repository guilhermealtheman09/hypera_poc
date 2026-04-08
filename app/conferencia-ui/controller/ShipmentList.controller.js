sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Item",
    "hypera/conferencia/ui/model/formatter",
  ],
  function (Controller, Filter, FilterOperator, Item, formatter) {
    "use strict";

    return Controller.extend("hypera.conferencia.ui.controller.ShipmentList", {
      formatter: formatter,

      onInit: function () {
        this._sQuery = "";
        this._sStatusFilter = "ALL";
        this._sDockFilter = "ALL";
        this._sCarrierFilter = "ALL";

        var oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("shipments")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched: function () {
        var oUser = this.getOwnerComponent()
          .getModel("app")
          .getProperty("/currentUser");
        if (!oUser || !oUser.authenticated) {
          this.getOwnerComponent().getRouter().navTo("login");
          return;
        }
        this._populateSelects();
        this._applyFilters();
      },

      _populateSelects: function () {
        var oModel = this.getView().getModel();
        var aShipments = (oModel && oModel.getProperty("/Shipments")) || [];
        var oUser = this.getOwnerComponent()
          .getModel("app")
          .getProperty("/currentUser");
        var aAuthorized = (oUser && oUser.authorizedDocks) || [];

        var oDockSet = {};
        var oCarrierSet = {};
        for (var i = 0; i < aShipments.length; i++) {
          var s = aShipments[i];
          // Só lista docas autorizadas pro user atual (se for colaborador)
          if (
            oUser.role === "COLABORADOR" &&
            aAuthorized.length &&
            aAuthorized.indexOf(s.dock) === -1
          ) {
            continue;
          }
          if (s.dock) oDockSet[s.dock] = true;
          if (s.carrier) oCarrierSet[s.carrier] = true;
        }

        var oDockSelect = this.byId("dockSelect");
        var oCarrierSelect = this.byId("carrierSelect");

        if (oDockSelect) {
          oDockSelect.removeAllItems();
          oDockSelect.addItem(new Item({ key: "ALL", text: "Todas as docas" }));
          Object.keys(oDockSet).sort().forEach(function (k) {
            oDockSelect.addItem(new Item({ key: k, text: k }));
          });
          oDockSelect.setSelectedKey("ALL");
        }
        if (oCarrierSelect) {
          oCarrierSelect.removeAllItems();
          oCarrierSelect.addItem(new Item({ key: "ALL", text: "Todas as transportadoras" }));
          Object.keys(oCarrierSet).sort().forEach(function (k) {
            oCarrierSelect.addItem(new Item({ key: k, text: k }));
          });
          oCarrierSelect.setSelectedKey("ALL");
        }
      },

      onSearch: function (oEvent) {
        this._sQuery = (oEvent.getParameter("newValue") || oEvent.getParameter("query") || "").trim();
        this._applyFilters();
      },

      onChipPress: function (oEvent) {
        var oBtn = oEvent.getSource();
        var sId = oBtn.getId();
        var oMap = {
          chipAll: "ALL",
          chipPending: "PENDING",
          chipInProgress: "IN_PROGRESS",
          chipApproved: "APPROVED",
          chipDivergent: "DIVERGENT",
          chipBoxByBox: "BOX_BY_BOX",
        };
        var sKey = null;
        Object.keys(oMap).forEach(function (k) {
          if (sId.indexOf(k) !== -1) sKey = oMap[k];
        });
        if (!sKey) return;

        this._sStatusFilter = sKey;

        var that = this;
        Object.keys(oMap).forEach(function (k) {
          var oC = that.byId(k);
          if (oC) {
            oC.removeStyleClass("hyperaChipActive");
            oC.setType("Default");
          }
        });
        oBtn.addStyleClass("hyperaChipActive");
        oBtn.setType("Emphasized");

        this._applyFilters();
      },

      onDockChange: function (oEvent) {
        this._sDockFilter = oEvent.getParameter("selectedItem").getKey();
        this._applyFilters();
      },

      onCarrierChange: function (oEvent) {
        this._sCarrierFilter = oEvent.getParameter("selectedItem").getKey();
        this._applyFilters();
      },

      _applyFilters: function () {
        var aFilters = [];
        var oUser = this.getOwnerComponent()
          .getModel("app")
          .getProperty("/currentUser");

        // Filtro obrigatório: docas autorizadas (apenas para COLABORADOR)
        if (
          oUser &&
          oUser.role === "COLABORADOR" &&
          oUser.authorizedDocks &&
          oUser.authorizedDocks.length
        ) {
          var aDockFilters = oUser.authorizedDocks.map(function (d) {
            return new Filter("dock", FilterOperator.EQ, d);
          });
          aFilters.push(new Filter({ filters: aDockFilters, and: false }));
        }

        if (this._sStatusFilter && this._sStatusFilter !== "ALL") {
          aFilters.push(new Filter("status", FilterOperator.EQ, this._sStatusFilter));
        }
        if (this._sDockFilter && this._sDockFilter !== "ALL") {
          aFilters.push(new Filter("dock", FilterOperator.EQ, this._sDockFilter));
        }
        if (this._sCarrierFilter && this._sCarrierFilter !== "ALL") {
          aFilters.push(new Filter("carrier", FilterOperator.EQ, this._sCarrierFilter));
        }

        if (this._sQuery) {
          var q = this._sQuery;
          aFilters.push(
            new Filter({
              filters: [
                new Filter("shipmentNumber", FilterOperator.Contains, q),
                new Filter("orderNumber", FilterOperator.Contains, q),
                new Filter("transportDocument", FilterOperator.Contains, q),
                new Filter("product", FilterOperator.Contains, q),
                new Filter("carrier", FilterOperator.Contains, q),
                new Filter("dock", FilterOperator.Contains, q),
                new Filter("destination", FilterOperator.Contains, q),
                new Filter("palletTag", FilterOperator.Contains, q),
              ],
              and: false,
            }),
          );
        }

        var oList = this.byId("shipmentList");
        var oBinding = oList && oList.getBinding("items");
        if (oBinding) {
          oBinding.filter(aFilters.length ? new Filter({ filters: aFilters, and: true }) : []);
        }
      },

      onItemPress: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext();
        var sId = oCtx.getProperty("ID");
        this.getOwnerComponent().getRouter().navTo("conference", { shipmentId: sId });
      },

      onLogout: function () {
        var oAppModel = this.getOwnerComponent().getModel("app");
        oAppModel.setProperty("/currentUser", {
          ID: null,
          name: "",
          role: "COLABORADOR",
          authenticated: false,
        });
        this.getOwnerComponent().getRouter().navTo("login");
      },

      onNavBack: function () {
        this.onLogout();
      },
    });
  },
);
