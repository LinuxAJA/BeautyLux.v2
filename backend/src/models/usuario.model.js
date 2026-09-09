/**
 * Modelo de Usuario: traduce entre la fila de MySQL (snake_case) y el DTO
 * de la API (camelCase). `toJSON()` nunca expone `password_hash`.
 */
export class User {
    constructor({
        id,
        firstName,
        lastName,
        documentType,
        documentNumber,
        address,
        phone,
        email,
        passwordHash,
        role,
        status,
        lastLoginAt,
        createdAt,
        updatedAt,
    }) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.address = address;
        this.phone = phone;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.lastLoginAt = lastLoginAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromRow(row) {
        if (!row) return null;
        return new User({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            documentType: row.document_type_code,
            documentNumber: row.document_number,
            address: row.address,
            phone: row.phone,
            email: row.email,
            passwordHash: row.password_hash,
            role: {
                id: row.role_id,
                name: row.role_name ?? undefined,
                label: row.role_label ?? undefined,
            },
            status: row.status,
            lastLoginAt: row.last_login_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    /** Representación pública: nunca incluye el hash de la contraseña. */
    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            documentType: this.documentType,
            documentNumber: this.documentNumber,
            address: this.address,
            phone: this.phone,
            email: this.email,
            role: this.role,
            status: this.status,
            lastLoginAt: this.lastLoginAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default User;
