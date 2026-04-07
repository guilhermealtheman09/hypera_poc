using { hypera.conferencia as db } from '../db/schema';

service ConferenceService {
  entity Users              as projection on db.Users;
  entity Shipments          as projection on db.Shipments;
  entity ConferenceAttempts as projection on db.ConferenceAttempts;
  entity VolumeChecks       as projection on db.VolumeChecks;

  action startConference(shipmentId : UUID, userId : UUID) returns String;
  action submitCount(
    shipmentId : UUID,
    userId : UUID,
    countedQuantity : Integer,
    divergenceReason : String
  ) returns String;
  action approveAttempt(attemptId : UUID, supervisorId : UUID) returns String;
  action startBoxByBox(shipmentId : UUID, supervisorId : UUID) returns String;
}