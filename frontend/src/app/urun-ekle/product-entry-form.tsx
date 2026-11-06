"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api/client";
import { createCustomerProduct } from "@/features/products/client-api";

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface SubmittedProduct {
    name: string;
    price: string;
    stock: number;
    categoryName: string | null;
}

const MAX_PRICE = 10000000;
const MAX_STOCK = 1000000;

interface FieldErrors {
    name?: string;
    description?: string;
    price?: string;
    stock?: string;
    category?: string;
    imageUrl?: string;
}

function fieldErrorClasses(hasError: boolean) {
    return hasError
        ? "border-danger-solid focus:border-danger-solid"
        : "";
}

export function ProductEntryForm() {
    const { t } = useI18n();
    const { user, loading, isAuthenticated } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("1");
    const [imageUrl, setImageUrl] = useState("");

    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<SubmittedProduct | null>(null);

    // Kategoriler: form acildiginda bir kez cekilir.
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await apiFetch<Category[]>("/categories");
                if (!cancelled) {
                    setCategories(data);
                }
            } catch {
                // Kategori listesi bos kalabilir; gonderimde sunucu da dogrular.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    function validate(): FieldErrors {
        const nextErrors: FieldErrors = {};

        const trimmedName = name.trim();
        const trimmedDescription = description.trim();

        if (trimmedName.length < 3) {
            nextErrors.name = t("addProduct.errName");
        }

        if (trimmedDescription.length < 10) {
            nextErrors.description = t("addProduct.errDescription");
        }

        const priceValue = Number(price.replace(",", "."));

        if (
            price.trim() === "" ||
            Number.isNaN(priceValue) ||
            priceValue <= 0 ||
            priceValue > MAX_PRICE
        ) {
            nextErrors.price = t("addProduct.errPrice");
        }

        const stockValue = Number(stock);

        if (
            stock.trim() === "" ||
            !Number.isInteger(stockValue) ||
            stockValue < 0 ||
            stockValue > MAX_STOCK
        ) {
            nextErrors.stock = t("addProduct.errStock");
        }

        if (categoryId === "") {
            nextErrors.category = t("addProduct.errCategory");
        }

        const trimmedImage = imageUrl.trim();

        if (
            trimmedImage !== "" &&
            !trimmedImage.toLowerCase().startsWith("http://") &&
            !trimmedImage.toLowerCase().startsWith("https://")
        ) {
            nextErrors.imageUrl = t("addProduct.errImage");
        }

        return nextErrors;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        const validationErrors = validate();

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(t("addProduct.errForm"));
            return;
        }

        setSubmitting(true);

        try {
            const product = await createCustomerProduct({
                name: name.trim(),
                description: description.trim(),
                price: Number(price.replace(",", ".")),
                stock: Number(stock),
                category_id: Number(categoryId),
                image_url: imageUrl.trim() === "" ? null : imageUrl.trim(),
            });

            const selectedCategory = categories.find(
                (category) => category.id === product.category_id,
            );

            setSubmitted({
                name: product.name,
                price: product.price,
                stock: product.stock,
                categoryName: selectedCategory?.name ?? null,
            });
        } catch (submitError) {
            setFormError(
                submitError instanceof Error
                    ? submitError.message
                    : t("addProduct.errServer"),
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <p className="text-foreground-muted">{t("myProducts.loading")}</p>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-xl font-semibold">
                    {t("addProduct.loginTitle")}
                </h2>

                <p className="mt-3 text-foreground-muted">
                    {t("addProduct.loginDescription")}
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                >
                    {t("common.login")}
                </Link>
            </div>
        );
    }

    // Onaya gonderildi ekranı: musteri akisin sonunu net gorur.
    if (submitted) {
        return (
            <div className="space-y-6">
                <Notice tone="success">
                    <p className="font-semibold text-base">
                        {t("addProduct.successTitle")}
                    </p>
                </Notice>

                <div className="rounded-2xl border border-border bg-surface p-6">
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("addProduct.summaryName")}
                            </dt>
                            <dd className="mt-1 font-medium">{submitted.name}</dd>
                        </div>

                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("addProduct.summaryCategory")}
                            </dt>
                            <dd className="mt-1 font-medium">
                                {submitted.categoryName ??
                                    t("addProduct.unknownCategory")}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("addProduct.summaryPrice")}
                            </dt>
                            <dd className="mt-1 font-medium">
                                {submitted.price} ₺
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("addProduct.summaryStock")}
                            </dt>
                            <dd className="mt-1 font-medium">{submitted.stock}</dd>
                        </div>
                    </dl>
                </div>

                <p className="text-sm text-foreground-muted">
                    {t("addProduct.successDescription")}
                </p>

                <p className="text-sm text-foreground-muted">
                    {t("addProduct.successNote")}
                </p>

                <div className="flex flex-wrap gap-3">
                    <Link href="/urunlerim">
                        <Button variant="primary">
                            {t("addProduct.myProductsCta")}
                        </Button>
                    </Link>

                    <Link href="/">
                        <Button variant="secondary">
                            {t("addProduct.homeCta")}
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {formError && (
                <Notice tone="error" role="alert">
                    {formError}
                </Notice>
            )}

            {/* Urun adi */}
            <div>
                <label
                    htmlFor="product-name"
                    className="mb-2 block text-sm font-semibold"
                >
                    {t("addProduct.fieldName")}{" "}
                    <span className="text-danger-solid">*</span>
                </label>

                <input
                    id="product-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t("addProduct.namePlaceholder")}
                    maxLength={255}
                    aria-invalid={Boolean(errors.name)}
                    className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.name))}`}
                />

                {errors.name ? (
                    <p className="mt-1.5 text-sm text-danger-fg">{errors.name}</p>
                ) : (
                    <p className="mt-1.5 text-sm text-foreground-subtle">
                        {t("addProduct.nameHelp")}
                    </p>
                )}
            </div>

            {/* Aciklama */}
            <div>
                <label
                    htmlFor="product-description"
                    className="mb-2 block text-sm font-semibold"
                >
                    {t("addProduct.fieldDescription")}{" "}
                    <span className="text-danger-solid">*</span>
                </label>

                <textarea
                    id="product-description"
                    name="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t("addProduct.descriptionPlaceholder")}
                    rows={5}
                    maxLength={5000}
                    aria-invalid={Boolean(errors.description)}
                    className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.description))}`}
                />

                {errors.description ? (
                    <p className="mt-1.5 text-sm text-danger-fg">
                        {errors.description}
                    </p>
                ) : (
                    <p className="mt-1.5 text-sm text-foreground-subtle">
                        {t("addProduct.descriptionHelp")}
                    </p>
                )}
            </div>

            {/* Kategori */}
            <div>
                <label
                    htmlFor="product-category"
                    className="mb-2 block text-sm font-semibold"
                >
                    {t("addProduct.fieldCategory")}{" "}
                    <span className="text-danger-solid">*</span>
                </label>

                <select
                    id="product-category"
                    name="category"
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    aria-invalid={Boolean(errors.category)}
                    className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.category))}`}
                >
                    <option value="">
                        {t("addProduct.categoryPlaceholder")}
                    </option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                {errors.category ? (
                    <p className="mt-1.5 text-sm text-danger-fg">
                        {errors.category}
                    </p>
                ) : (
                    <p className="mt-1.5 text-sm text-foreground-subtle">
                        {t("addProduct.categoryHelp")}
                    </p>
                )}
            </div>

            {/* Fiyat + stok: mobilde alt alta, geniste yan yana */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="product-price"
                        className="mb-2 block text-sm font-semibold"
                    >
                        {t("addProduct.fieldPrice")}{" "}
                        <span className="text-danger-solid">*</span>
                    </label>

                    <input
                        id="product-price"
                        name="price"
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        placeholder="349.90"
                        aria-invalid={Boolean(errors.price)}
                        className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.price))}`}
                    />

                    {errors.price ? (
                        <p className="mt-1.5 text-sm text-danger-fg">
                            {errors.price}
                        </p>
                    ) : (
                        <p className="mt-1.5 text-sm text-foreground-subtle">
                            {t("addProduct.priceHelp")}
                        </p>
                    )}
                </div>

                <div>
                    <label
                        htmlFor="product-stock"
                        className="mb-2 block text-sm font-semibold"
                    >
                        {t("addProduct.fieldStock")}{" "}
                        <span className="text-danger-solid">*</span>
                    </label>

                    <input
                        id="product-stock"
                        name="stock"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        value={stock}
                        onChange={(event) => setStock(event.target.value)}
                        aria-invalid={Boolean(errors.stock)}
                        className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.stock))}`}
                    />

                    {errors.stock ? (
                        <p className="mt-1.5 text-sm text-danger-fg">
                            {errors.stock}
                        </p>
                    ) : (
                        <p className="mt-1.5 text-sm text-foreground-subtle">
                            {t("addProduct.stockHelp")}
                        </p>
                    )}
                </div>
            </div>

            {/* Gorsel baglantisi (opsiyonel) + onizleme */}
            <div>
                <label
                    htmlFor="product-image"
                    className="mb-2 block text-sm font-semibold"
                >
                    {t("addProduct.fieldImage")}
                </label>

                <input
                    id="product-image"
                    name="image_url"
                    type="url"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder={t("addProduct.imagePlaceholder")}
                    maxLength={500}
                    aria-invalid={Boolean(errors.imageUrl)}
                    className={`w-full px-4 py-2.5 ${fieldErrorClasses(Boolean(errors.imageUrl))}`}
                />

                {errors.imageUrl ? (
                    <p className="mt-1.5 text-sm text-danger-fg">
                        {errors.imageUrl}
                    </p>
                ) : (
                    <p className="mt-1.5 text-sm text-foreground-subtle">
                        {t("addProduct.imageHelp")}
                    </p>
                )}

                {imageUrl.trim() !== "" && !errors.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl.trim()}
                        alt={t("addProduct.imagePreviewAlt")}
                        className="mt-3 h-36 w-36 rounded-xl border border-border object-cover"
                    />
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                >
                    {submitting
                        ? t("addProduct.submitting")
                        : t("addProduct.submit")}
                </Button>
            </div>
        </form>
    );
}

export default ProductEntryForm;
