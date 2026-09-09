export class Category {
    constructor({ id, slug, name, description, imageUrl, type, status, createdAt, updatedAt }) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromRow(row) {
        if (!row) return null;
        return new Category({
            id: row.id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            imageUrl: row.image_url,
            type: row.type,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    toJSON() {
        return {
            id: this.id,
            slug: this.slug,
            name: this.name,
            description: this.description,
            imageUrl: this.imageUrl,
            type: this.type,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default Category;
