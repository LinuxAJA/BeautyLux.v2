export class Permission {
    constructor({ id, code, module, action, description }) {
        this.id = id;
        this.code = code;
        this.module = module;
        this.action = action;
        this.description = description;
    }

    static fromRow(row) {
        if (!row) return null;
        return new Permission({
            id: row.id,
            code: row.code,
            module: row.module,
            action: row.action,
            description: row.description,
        });
    }

    toJSON() {
        return { id: this.id, code: this.code, module: this.module, action: this.action, description: this.description };
    }
}

export default Permission;
