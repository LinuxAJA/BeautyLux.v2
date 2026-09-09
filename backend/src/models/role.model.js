export class Role {
    constructor({ id, name, label, description, createdAt, updatedAt }) {
        this.id = id;
        this.name = name;
        this.label = label;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromRow(row) {
        if (!row) return null;
        return new Role({
            id: row.id,
            name: row.name,
            label: row.label,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    toJSON() {
        return { id: this.id, name: this.name, label: this.label, description: this.description };
    }
}

export default Role;
