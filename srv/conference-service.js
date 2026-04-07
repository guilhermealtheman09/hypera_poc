const cds = require("@sap/cds");

module.exports = cds.service.impl(async function () {
  const { Users, Shipments, ConferenceAttempts } =
    cds.entities("hypera.conferencia");

  this.on("startConference", async (req) => {
    const { shipmentId, userId } = req.data;

    const shipment = await SELECT.one.from(Shipments).where({ ID: shipmentId });
    if (!shipment) {
      return req.error(404, "Remessa não encontrada.");
    }

    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) {
      return req.error(404, "Usuário não encontrado.");
    }

    await UPDATE(Shipments)
      .set({ status: "IN_PROGRESS" })
      .where({ ID: shipmentId });

    return "Conferência iniciada com sucesso.";
  });

  this.on("submitCount", async (req) => {
    const { shipmentId, userId, countedQuantity, divergenceReason } = req.data;

    const shipment = await SELECT.one.from(Shipments).where({ ID: shipmentId });
    if (!shipment) {
      return req.error(404, "Remessa não encontrada.");
    }

    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) {
      return req.error(404, "Usuário não encontrado.");
    }

    const lastAttempt = await SELECT.one
      .from(ConferenceAttempts)
      .where({ shipment_ID: shipmentId })
      .orderBy("attemptNumber desc");

    const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    let attemptStatus = "OPEN";
    let shipmentStatus = "IN_PROGRESS";
    let message = "";

    if (countedQuantity === shipment.expectedQuantity) {
      attemptStatus = "APPROVED";
      shipmentStatus = "APPROVED";
      message = "Contagem validada com sucesso.";
    } else if (attemptNumber >= 2) {
      attemptStatus = "BOX_BY_BOX";
      shipmentStatus = "BOX_BY_BOX";
      message =
        "Divergência persistente. Seguir para conferência caixa por caixa.";
    } else {
      attemptStatus = "DIVERGENT";
      shipmentStatus = "DIVERGENT";
      message = "Divergência identificada. Nova tentativa necessária.";
    }

    await INSERT.into(ConferenceAttempts).entries({
      shipment_ID: shipmentId,
      attemptNumber,
      countedQuantity,
      status: attemptStatus,
      divergenceReason,
      countedBy_ID: userId,
    });

    await UPDATE(Shipments)
      .set({
        countedQuantity,
        status: shipmentStatus,
      })
      .where({ ID: shipmentId });

    return message;
  });

  this.on("approveAttempt", async (req) => {
    const { attemptId, supervisorId } = req.data;

    const attempt = await SELECT.one
      .from(ConferenceAttempts)
      .where({ ID: attemptId });
    if (!attempt) {
      return req.error(404, "Tentativa não encontrada.");
    }

    const supervisor = await SELECT.one.from(Users).where({ ID: supervisorId });
    if (!supervisor) {
      return req.error(404, "Supervisor não encontrado.");
    }

    if (supervisor.role !== "SUPERVISOR") {
      return req.error(403, "Somente supervisor pode aprovar apontamentos.");
    }

    await UPDATE(ConferenceAttempts)
      .set({
        status: "APPROVED",
        approvedBy_ID: supervisorId,
      })
      .where({ ID: attemptId });

    await UPDATE(Shipments)
      .set({ status: "APPROVED" })
      .where({ ID: attempt.shipment_ID });

    return "Apontamento aprovado pelo supervisor.";
  });

  this.on("startBoxByBox", async (req) => {
    const { shipmentId, supervisorId } = req.data;

    const shipment = await SELECT.one.from(Shipments).where({ ID: shipmentId });
    if (!shipment) {
      return req.error(404, "Remessa não encontrada.");
    }

    const supervisor = await SELECT.one.from(Users).where({ ID: supervisorId });
    if (!supervisor) {
      return req.error(404, "Supervisor não encontrado.");
    }

    if (supervisor.role !== "SUPERVISOR") {
      return req.error(
        403,
        "Somente supervisor pode iniciar conferência caixa por caixa.",
      );
    }

    await UPDATE(Shipments)
      .set({ status: "BOX_BY_BOX" })
      .where({ ID: shipmentId });

    return "Fluxo caixa por caixa iniciado.";
  });
});
