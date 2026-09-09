export class Product {
    constructor({
        id,
        sku,
        slug,
        name,
        description,
        categoryId,
        categorySlug,
        categoryName,
        price,
        oldPrice,
        stock,
        rating,
        reviewsCount,
        imageUrl,
        badge,
        status,
        createdAt,
        updatedAt,
    }) {
        this.id = id;
        this.sku = sku;
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.categoryId = categoryId;
        this.categorySlug = categorySlug;
        this.categoryName = categoryName;
        this.price = price;
        this.oldPrice = oldPrice;
        this.stock = stock;
        this.rating = rating;
        this.reviewsCount = reviewsCount;
        this.imageUrl = imageUrl;
        this.badge = badge;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromRow(row) {
        if (!row) return null;
        return new Product({
            id: row.id,
            sku: row.sku,
            slug: row.slug,
            name: row.name,
            description: row.description,
            categoryId: row.category_id,
            categorySlug: row.category_slug ?? undefined,
            categoryName: row.category_name ?? undefined,
            price: row.price === null ? null : Number(row.price),
            oldPrice: row.old_price === null ? null : Number(row.old_price),
            stock: row.stock,
            rating: row.rating === null ? null : Number(row.rating),
            reviewsCount: row.reviews_count,
            imageUrl: row.image_url,
            badge: row.badge,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    toJSON() {
        return {
            id: this.id,
            sku: this.sku,
            slug: this.slug,
            name: this.name,
            description: this.description,
            category: this.categoryId
                ? { id: this.categoryId, slug: this.categorySlug, name: this.categoryName }
                : null,
            price: this.price,
            oldPrice: this.oldPrice,
            stock: this.stock,
            rating: this.rating,
            reviewsCount: this.reviewsCount,
            imageUrl: this.imageUrl,
            badge: this.badge,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default Product;
