export class Service {
    constructor({
        id,
        slug,
        name,
        description,
        categoryId,
        categorySlug,
        categoryName,
        price,
        durationMinutes,
        imageUrl,
        status,
        createdAt,
        updatedAt,
    }) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.categoryId = categoryId;
        this.categorySlug = categorySlug;
        this.categoryName = categoryName;
        this.price = price;
        this.durationMinutes = durationMinutes;
        this.imageUrl = imageUrl;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromRow(row) {
        if (!row) return null;
        return new Service({
            id: row.id,
            slug: row.slug,
            name: row.name,
            description: row.description,
            categoryId: row.category_id,
            categorySlug: row.category_slug ?? undefined,
            categoryName: row.category_name ?? undefined,
            price: row.price === null ? null : Number(row.price),
            durationMinutes: row.duration_minutes,
            imageUrl: row.image_url,
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
            category: this.categoryId
                ? { id: this.categoryId, slug: this.categorySlug, name: this.categoryName }
                : null,
            price: this.price,
            durationMinutes: this.durationMinutes,
            imageUrl: this.imageUrl,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default Service;
