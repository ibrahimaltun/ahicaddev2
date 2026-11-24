"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { apiFetch } from "@/lib/api/client";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import {
    createCustomerProduct,
    uploadProductImages,
} from "@/features/products/client-api";

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface CategoryOption {
    /** /categories listesindeki kategori slug'i; gonderimde id'ye eslenir. */
    slug: string;
    nameKey: TranslationKey;
    descriptionKey: TranslationKey;
}

interface CategoryGroup {
    slug: string;
    labelKey: TranslationKey;
    helpKey: TranslationKey;
    options: CategoryOption[];
}

interface SubmittedProduct {
    name: string;
    price: string;
    stock: number;
    categoryName: string | null;
}

interface ImagePreview {
    file: File;
    url: string;
}

const MAX_PRICE = 10000000;
const MAX_STOCK = 1000000;

// Urun gorselleri: sunucuya (/uploads) yuklenir, DB'ye URL kaydedilir.
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 5;

/**
 * 2 asamali kategori secimi:
 * 1. asama -> ana kategori (grup), 2. asama -> aciklamali alt kategori.
 * Yeni ana kategoriler bu listeye eklenerek genisletilir.
 */
const CATEGORY_GROUPS: CategoryGroup[] = [
    {
        slug: "cicek-bitki",
        labelKey: "addProduct.categoryGroupCicekBitki",
        helpKey: "addProduct.categoryStage1Help",
        options: [
            {
                slug: "el-yapimi-yapay-cicekler",
                nameKey: "addProduct.catElYapimiYapayCicekler",
                descriptionKey: "addProduct.catElYapimiYapayCiceklerDesc",
            },
            {
                slug: "buket-cicekler",
                nameKey: "addProduct.catBuketCicekler",
                descriptionKey: "addProduct.catBuketCiceklerDesc",
            },
            {
                slug: "saksi-bitkileri",
                nameKey: "addProduct.catSaksiBitkileri",
                descriptionKey: "addProduct.catSaksiBitkileriDesc",
            },
            {
                slug: "celenk-ozel-gun",
                nameKey: "addProduct.catCelenkOzelGun",
                descriptionKey: "addProduct.catCelenkOzelGunDesc",
            },
        ],
    },
];

interface FieldErrors {
    name?: string;
    description?: string;
    price?: string;
    stock?: string;
    categoryGroup?: string;
    categoryItem?: string;
    images?: string;
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
    const [categoryGroupSlug, setCategoryGroupSlug] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("1");
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const [errors, setErrors] = useState<FieldErrors>({});
    const [imageErrors, setImageErrors] = useState<string[]>([]);
    const [formError, setFormError] = useState("");
    const [uploadingImages, setUploadingImages] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<SubmittedProduct | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Onizlemeler: dosya listesi degistiginde yeniden uretilir; eski
    // object URL'ler cleanup'ta geri verilir (bellek sizintisi olmasin).
    const imagePreviews = useMemo<ImagePreview[]>(
        () => imageFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [imageFiles],
    );

    useEffect(() => {
        return () => {
            for (const preview of imagePreviews) {
                URL.revokeObjectURL(preview.url);
            }
        };
    }, [imagePreviews]);

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

        if (categoryGroupSlug === "") {
            nextErrors.categoryGroup = t("addProduct.errCategoryGroup");
        }

        if (categoryGroupSlug !== "" && categorySlug === "") {
            nextErrors.categoryItem = t("addProduct.errCategoryItem");
        }

        return nextErrors;
    }

    function handleGroupChange(nextGroupSlug: string) {
        setCategoryGroupSlug(nextGroupSlug);

        // Ana kategori degisince 2. asama secimi sifirlanir.
        setCategorySlug("");
    }

    function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
        const selected = Array.from(event.target.files ?? []);

        // Ayni dosyayi tekrar secilebilsin diye input degeri temizlenir.
        event.target.value = "";

        if (selected.length === 0) {
            return;
        }

        const nextImageErrors: string[] = [];
        const accepted: File[] = [];

        for (const file of selected) {
            if (imageFiles.length + accepted.length >= MAX_IMAGES) {
                nextImageErrors.push(t("addProduct.imageMaxReached"));
                break;
            }

            if (!file.type.toLowerCase().startsWith("image/")) {
                nextImageErrors.push(
                    t("addProduct.imageTypeError", { name: file.name }),
                );
                continue;
            }

            if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
                nextImageErrors.push(
                    t("addProduct.imageSizeError", { name: file.name }),
                );
                continue;
            }

            accepted.push(file);
        }

        setImageErrors(nextImageErrors);

        if (accepted.length > 0) {
            setImageFiles((previous) => [...previous, ...accepted]);
        }
    }

    function removeImage(index: number) {
        setImageFiles((previous) =>
            previous.filter((_, itemIndex) => itemIndex !== index),
        );
        setImageErrors([]);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");
        setImageErrors([]);

        const validationErrors = validate();

        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setFormError(t("addProduct.errForm"));
            return;
        }

        // Alt kategori slug'ini /categories listesindeki kategoriye esle;
        // seed calistirilmamissa kullaniciyi net sekilde yonlendir.
        const selectedCategory = categories.find(
            (category) => category.slug === categorySlug,
        );

        if (selectedCategory === undefined) {
            const missingErrors: FieldErrors = {
                ...validationErrors,
                categoryItem: t("addProduct.errCategoryMissing"),
            };

            setErrors(missingErrors);
            setFormError(t("addProduct.errForm"));
            return;
        }

        setSubmitting(true);

        try {
            // 1) Gorseller sunucuya yuklenir, URL'leri alinir.
            let imageUrls: string[] = [];

            if (imageFiles.length > 0) {
                setUploadingImages(true);

                try {
                    imageUrls = await uploadProductImages(imageFiles);
                } finally {
                    setUploadingImages(false);
                }
            }

            // 2) Urun girisi gonderilir (ilk gorsel kapak olur).
            const product = await createCustomerProduct({
                name: name.trim(),
                description: description.trim(),
                price: Number(price.replace(",", ".")),
                stock: Number(stock),
                category_id: selectedCategory.id,
                image_urls: imageUrls,
            });

            setSubmitted({
                name: product.name,
                price: product.price,
                stock: product.stock,
                categoryName: selectedCategory.name,
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

    const selectedGroup = CATEGORY_GROUPS.find(
        (group) => group.slug === categoryGroupSlug,
    );

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

            {/* Kategori: 2 asama (ana kategori -> aciklamali alt kategori) */}
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                {/* 1. Asama: ana kategori */}
                <p className="text-sm font-semibold">
                    {t("addProduct.categoryStage1Label")}{" "}
                    <span className="text-danger-solid">*</span>
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {CATEGORY_GROUPS.map((group) => {
                        const isSelected = group.slug === categoryGroupSlug;

                        return (
                            <button
                                key={group.slug}
                                type="button"
                                onClick={() => handleGroupChange(group.slug)}
                                aria-pressed={isSelected}
                                className={`rounded-xl border p-4 text-left transition ${
                                    isSelected
                                        ? "border-primary bg-primary-soft"
                                        : "border-border bg-surface hover:bg-surface-2"
                                }`}
                            >
                                <span className="flex items-center gap-2 font-semibold">
                                    <span
                                        aria-hidden
                                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                                            isSelected
                                                ? "bg-primary"
                                                : "border border-border-strong bg-surface"
                                        }`}
                                    />
                                    {t(group.labelKey)}
                                </span>

                                <span className="mt-1.5 block text-sm text-foreground-muted">
                                    {t(group.helpKey)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {errors.categoryGroup ? (
                    <p className="mt-2 text-sm text-danger-fg">
                        {errors.categoryGroup}
                    </p>
                ) : null}

                {/* 2. Asama: alt kategori kartlari + aciklamalari */}
                {selectedGroup ? (
                    <div
                        role="radiogroup"
                        aria-label={t("addProduct.categoryStage2Label")}
                        className="mt-5"
                    >
                        <p className="text-sm font-semibold">
                            {t("addProduct.categoryStage2Label")}{" "}
                            <span className="text-danger-solid">*</span>
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {selectedGroup.options.map((option) => {
                                const isSelected = option.slug === categorySlug;

                                return (
                                    <label
                                        key={option.slug}
                                        className={`cursor-pointer rounded-xl border p-4 transition ${
                                            isSelected
                                                ? "border-primary bg-primary-soft"
                                                : "border-border bg-surface hover:bg-surface-2"
                                        }`}
                                    >
                                        <span className="flex items-start gap-2">
                                            <input
                                                type="radio"
                                                name="product-category"
                                                value={option.slug}
                                                checked={isSelected}
                                                onChange={() =>
                                                    setCategorySlug(option.slug)
                                                }
                                                className="mt-1 size-4 accent-primary"
                                            />

                                            <span className="text-sm font-semibold">
                                                {t(option.nameKey)}
                                            </span>
                                        </span>

                                        <span className="mt-2 block text-sm text-foreground-muted">
                                            {t(option.descriptionKey)}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {errors.categoryItem ? (
                            <p className="mt-2 text-sm text-danger-fg">
                                {errors.categoryItem}
                            </p>
                        ) : (
                            <p className="mt-2 text-sm text-foreground-subtle">
                                {t("addProduct.categoryHelp")}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-foreground-muted">
                        {t("addProduct.categoryStage2Placeholder")}
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

            {/* Urun gorselleri: en fazla 5, telefonda galeriden/dosyadan secim */}
            <div>
                <p className="mb-2 block text-sm font-semibold">
                    {t("addProduct.fieldImage")}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageFiles.length >= MAX_IMAGES || uploadingImages}
                    >
                        {t("addProduct.imageUploadButton")}
                    </Button>

                    <span className="text-sm text-foreground-muted">
                        {t("addProduct.imageCount", { count: imageFiles.length })}
                    </span>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesSelected}
                        className="hidden"
                        aria-label={t("addProduct.fieldImage")}
                    />
                </div>

                {imageErrors.length > 0 ? (
                    <div className="mt-1.5 space-y-1">
                        {imageErrors.map((imageError) => (
                            <p
                                key={imageError}
                                className="text-sm text-danger-fg"
                            >
                                {imageError}
                            </p>
                        ))}
                    </div>
                ) : (
                    <p className="mt-1.5 text-sm text-foreground-subtle">
                        {t("addProduct.imageHelp")}
                    </p>
                )}

                {imagePreviews.length > 0 && (
                    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {imagePreviews.map((preview, index) => (
                            <li
                                key={preview.url}
                                className="relative overflow-hidden rounded-xl border border-border bg-surface"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview.url}
                                    alt={`${t("addProduct.imagePreviewAlt")} ${index + 1}`}
                                    className="h-36 w-full object-cover"
                                />

                                {index === 0 && (
                                    <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                        {t("addProduct.imageCoverBadge")}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    aria-label={t("addProduct.imageRemove")}
                                    className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm transition hover:bg-surface-2"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting || uploadingImages}
                >
                    {submitting
                        ? uploadingImages
                            ? t("addProduct.imageUploading")
                            : t("addProduct.submitting")
                        : t("addProduct.submit")}
                </Button>
            </div>
        </form>
    );
}

export default ProductEntryForm;
