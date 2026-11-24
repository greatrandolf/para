/**
 * Driver data access. Reads static mock data synchronously today; a real API
 * can replace these getters later without touching screens (plan D11).
 */
import {
  assignment,
  broadcastStatus,
  complianceDocs,
  directions,
  disbursements,
  driverIdentity,
  driverMetrics,
  driverProfileDetails,
  dutyBaseSupport,
  earningsSummary,
  poolShare,
  poolTelemetry,
  radarSnapshot,
  stopDemand,
} from '@/services/mock/driverData';
import type {
  Assignment,
  BroadcastStatus,
  ComplianceDoc,
  DirectionInfo,
  DisbursementSummary,
  DriverIdentity,
  DriverMetrics,
  DriverProfileDetails,
  DutyBaseSupport,
  DutyDirection,
  EarningsSummary,
  PoolShare,
  PoolTelemetry,
  RadarSnapshot,
  StopDemand,
} from '@/types/driver';

export const getDriverIdentity = (): DriverIdentity => driverIdentity;
export const getAssignment = (): Assignment => assignment;
export const getDirections = (): DirectionInfo[] => directions;
export const getBroadcastStatus = (): BroadcastStatus => broadcastStatus;
export const getDutyBaseSupport = (): DutyBaseSupport => dutyBaseSupport;
export const getPoolShare = (): PoolShare => poolShare;
export const getEarningsSummary = (): EarningsSummary => earningsSummary;
export const getPoolTelemetry = (): PoolTelemetry[] => poolTelemetry;
export const getDisbursements = (): DisbursementSummary => disbursements;
export const getRadarSnapshot = (): RadarSnapshot => radarSnapshot;
export const getStopDemand = (): StopDemand[] => stopDemand;
export const getDriverMetrics = (): DriverMetrics => driverMetrics;
export const getDriverProfileDetails = (): DriverProfileDetails => driverProfileDetails;
export const getComplianceDocs = (): ComplianceDoc[] => complianceDocs;

export function getDirection(id: DutyDirection): DirectionInfo {
  const found = directions.find((direction) => direction.id === id);
  if (!found) throw new Error(`Unknown direction: ${id}`);
  return found;
}

export const toggleDirection = (id: DutyDirection): DutyDirection => (id === 'apas' ? 'colon' : 'apas');

/** Today's instant earnings = daily duty base + route pool share. */
export const getTodayEarnings = (): number => dutyBaseSupport.dailyCredit + poolShare.share;
