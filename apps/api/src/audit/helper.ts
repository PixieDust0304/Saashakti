import { sql } from '../db/client.js';
import { toJsonb } from '../db/jsonb.js';

export interface AuditEntry {
  actorType: string;
  actorId?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}

export const writeAuditLog = async (entry: AuditEntry): Promise<void> => {
  await sql`
    INSERT INTO audit_logs (actor_type, actor_id, event_type, entity_type, entity_id, payload)
    VALUES (
      ${entry.actorType},
      ${entry.actorId ?? null},
      ${entry.eventType},
      ${entry.entityType ?? null},
      ${entry.entityId ?? null},
      ${toJsonb(entry.payload ?? {})}
    )
  `;
};

export const writeDashboardEvent = async (entry: {
  eventType: string;
  district?: string;
  beneficiaryId?: number;
}): Promise<void> => {
  await sql`
    INSERT INTO dashboard_events (event_type, district, beneficiary_id)
    VALUES (${entry.eventType}, ${entry.district ?? null}, ${entry.beneficiaryId ?? null})
  `;
};
