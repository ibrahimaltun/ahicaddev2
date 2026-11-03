"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";
import { createOrder } from "@/features/orders/api";

const emptyForm = {
    shipping_full_name: "",
    shipping_phone: "",
    shipping_city: "",
    shipping_district: "",
    shipping_address: "",
    shipping_postal_code: "",
};

export default function CheckoutPage() {
    const router = useRouter();

    const {
        user,
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const { items, isLoading: cartLoading, refresh } = useCart();

    const [form, setForm] = useState(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const accountFullName = user
        ? `${user.first_name} ${user.last_name}`.trim()
        : "";

    function updateField(field: keyof typeof emptyForm) {
        return (
            event: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement
            >,
        ) => {
            setForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError(null);

        const shippingFullName =
            form.shipping_full_name.trim() || accountFullName;

        if (shippingFullName.length < 3) {
            setError("Lütfen ad soyad girin.");

            return;
        }

        setIsSubmitting(true);

        try {
            const order = await createOrder({
                shipping_full_name: shippingFullName,
                shipping_phone: form.shipping_phone,
                shipping_city: form.shipping_city,
                shipping_district: form.shipping_district,
                shipping_address: form.shipping_address,
                shipping_postal_code:
                    form.shipping_postal_code || null,
            });

            await refresh();

            router.push(`/orders/${order.id}?success=1`);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Sipariş oluşturulamadı.",
            );
            setIsSubmitting(false);
        }
    }

    if (authLoading || cartLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Ödeme adımı yükleniyor...
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Ödeme adımı için giriş yapın
                </h1>

                <p className="mt-3 text-neutral-600">
                    Siparişinizi tamamlayabilmek için giriş
                    yapmanız gerekiyor.
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                    Giriş Yap
                </Link>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <p className="text-sm font-medium text-neutral-500">
                    Ödeme
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    Ödeme Adımı
                </h1>

                <div className="mt-12 rounded-2xl border border-neutral-200 p-8 text-center">
                    <p className="text-neutral-600">
                        Sepetiniz boş. Ödeme adımına geçebilmek
                        için sepetinize ürün ekleyin.
                    </p>

                    <Link
                        href="/products"
                        className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Alışverişe Devam Et
                    </Link>
                </div>
            </main>
        );
    }

    const total = items.reduce(
        (sum, item) =>
            sum + Number(item.product.price) * item.quantity,
        0,
    );

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <p className="text-sm font-medium text-neutral-500">
                Ödeme
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Ödeme Adımı
            </h1>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-10"
                >
                    <section className="rounded-2xl border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold">
                            Teslimat Bilgileri
                        </h2>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="text-sm text-neutral-600">
                                    Ad Soyad
                                </span>

                                <input
                                    type="text"
                                    maxLength={200}
                                    placeholder={
                                        accountFullName ||
                                        "Ad Soyad"
                                    }
                                    value={form.shipping_full_name}
                                    onChange={updateField(
                                        "shipping_full_name",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>

                            <label>
                                <span className="text-sm text-neutral-600">
                                    Telefon
                                </span>

                                <input
                                    type="tel"
                                    required
                                    minLength={7}
                                    maxLength={30}
                                    value={form.shipping_phone}
                                    onChange={updateField(
                                        "shipping_phone",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>

                            <label>
                                <span className="text-sm text-neutral-600">
                                    İl
                                </span>

                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    value={form.shipping_city}
                                    onChange={updateField(
                                        "shipping_city",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>

                            <label>
                                <span className="text-sm text-neutral-600">
                                    İlçe
                                </span>

                                <input
                                    type="text"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                    value={form.shipping_district}
                                    onChange={updateField(
                                        "shipping_district",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>

                            <label>
                                <span className="text-sm text-neutral-600">
                                    Posta Kodu (isteğe bağlı)
                                </span>

                                <input
                                    type="text"
                                    maxLength={10}
                                    value={form.shipping_postal_code}
                                    onChange={updateField(
                                        "shipping_postal_code",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>

                            <label className="sm:col-span-2">
                                <span className="text-sm text-neutral-600">
                                    Açık Adres
                                </span>

                                <textarea
                                    required
                                    minLength={10}
                                    maxLength={1000}
                                    rows={4}
                                    value={form.shipping_address}
                                    onChange={updateField(
                                        "shipping_address",
                                    )}
                                    className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm focus:border-neutral-950 focus:outline-none"
                                />
                            </label>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold">
                            Ödeme Yöntemi
                        </h2>

                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-neutral-200 p-4">
                            <input
                                type="radio"
                                id="iban_transfer"
                                name="payment_method"
                                value="iban_transfer"
                                checked
                                readOnly
                                className="mt-1"
                            />

                            <label htmlFor="iban_transfer">
                                <span className="block font-medium">
                                    Havale / EFT (IBAN)
                                </span>

                                <span className="mt-1 block text-sm text-neutral-500">
                                    Ödeme talimatları ve IBAN
                                    bilgisi siparişinizi
                                    oluşturduktan sonra
                                    gösterilecektir.
                                </span>
                            </label>
                        </div>
                    </section>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
                    >
                        {isSubmitting
                            ? "Sipariş oluşturuluyor..."
                            : "Siparişi Onayla"}
                    </button>
                </form>

                <aside className="h-fit rounded-2xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold">
                        Sipariş Özeti
                    </h2>

                    <ul className="mt-6 space-y-4">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-4 text-sm"
                            >
                                <span className="text-neutral-600">
                                    {item.product.name}
                                    {" × "}
                                    {item.quantity}
                                </span>

                                <span>
                                    {(
                                        Number(item.product.price) *
                                        item.quantity
                                    ).toFixed(2)}{" "}
                                    ₺
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex justify-between border-t border-neutral-200 pt-4 text-lg font-semibold">
                        <span>Toplam</span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <Link
                        href="/cart"
                        className="mt-6 block text-center text-sm text-neutral-600 hover:text-neutral-950"
                    >
                        Sepete dön
                    </Link>
                </aside>
            </div>
        </main>
    );
}
