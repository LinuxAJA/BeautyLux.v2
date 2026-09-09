export class AuditLog {
    constructor({ id, userId, userName, action, entity, entityId, changes, ipAddress, createdAt }) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.action = action;
        this.entity = entity;
        this.entityId = entityId;
        this.changes = changes;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt;
    }

    static fromRow(row) {
        if (!row) return null;
        let changes = row.changes;
        if (typeof changes === 'string') {
            try {
                changes = JSON.parse(changes);
            } catch {
                changes = null;
            }
        }
        return new AuditLog({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name ?? undefined,
            action: row.action,
            entity: row.entity,
            entityId: row.entity_id,
            changes,
            ipAddress: row.ip_address,
            createdAt: row.created_at,
        });
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            userName: this.userName,
            action: this.action,
            entity: this.entity,
            entityId: this.entityId,
            changes: this.changes,
            ipAddress: this.ipAddress,
            createdAt: this.createdAt,
        };
    }
}

export default AuditLog;
