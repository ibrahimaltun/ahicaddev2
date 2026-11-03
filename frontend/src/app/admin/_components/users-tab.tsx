"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    getAdminUsers,
    updateAdminUser,
} from "@/features/admin/api";
import type { AdminUser } from "@/features/admin/types";

export function UsersTab() {
    const { t } = useI18n();

    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        try {
            setUsers(await getAdminUsers(search || undefined));
        } catch (loadError_) {
            setLoadError(
                loadError_ instanceof Error
                    ? loadError_.message
                    : t("admin.users.loadError"),
            );
        } finally {
            setLoading(false);
        }
    }, [search, t]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadUsers();
        }, 300);

        return () => clearTimeout(timeout);
    }, [loadUsers]);

    async function handleUpdate(
        userId: number,
        payload: { role?: "customer" | "admin"; is_active?: boolean },
    ) {
        setProcessingId(userId);
        setActionError("");

        try {
            await updateAdminUser(userId, payload);
            await loadUsers();
        } catch (updateError) {
            setActionError(
                updateError instanceof Error
                    ? updateError.message
                    : t("common.error"),
            );
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("admin.users.searchPlaceholder")}
                className="w-full max-w-md"
            />

            {actionError && (
                <Notice tone="error" role="alert">
                    {actionError}
                </Notice>
            )}

            {loadError && (
                <Notice tone="error" role="alert">
                    {loadError}
                </Notice>
            )}

            {loading ? (
                <p className="text-foreground-muted">{t("common.loading")}</p>
            ) : users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-foreground-muted">
                    {t("admin.users.noUsers")}
                </div>
            ) : (
                <ul className="space-y-4">
                    {users.map((user) => (
                        <li
                            key={user.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6"
                        >
                            <div>
                                <p className="font-medium">
                                    {user.first_name} {user.last_name}
                                </p>

                                <p className="mt-1 text-sm text-foreground-muted">
                                    {user.email} · {t("admin.users.ordersCount")}: {" "}
                                    {user.orders_count}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Badge tone={user.role === "admin" ? "primary" : "neutral"}>
                                    {user.role === "admin"
                                        ? t("admin.users.roleAdmin")
                                        : t("admin.users.roleCustomer")}
                                </Badge>

                                <Badge tone={user.is_active ? "success" : "danger"}>
                                    {user.is_active
                                        ? t("admin.users.active")
                                        : t("admin.users.inactive")}
                                </Badge>

                                <Button
                                    variant="soft"
                                    size="sm"
                                    disabled={
                                        processingId === user.id ||
                                        user.role === "admin"
                                    }
                                    onClick={() =>
                                        handleUpdate(user.id, { role: "admin" })
                                    }
                                >
                                    {t("admin.users.makeAdmin")}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={
                                        processingId === user.id ||
                                        user.role === "customer"
                                    }
                                    onClick={() =>
                                        handleUpdate(user.id, { role: "customer" })
                                    }
                                >
                                    {t("admin.users.makeCustomer")}
                                </Button>

                                <Button
                                    variant="danger-outline"
                                    size="sm"
                                    disabled={
                                        processingId === user.id ||
                                        !user.is_active
                                    }
                                    onClick={() =>
                                        handleUpdate(user.id, { is_active: false })
                                    }
                                >
                                    {t("admin.users.deactivate")}
                                </Button>

                                {!user.is_active && (
                                    <Button
                                        variant="soft"
                                        size="sm"
                                        disabled={processingId === user.id}
                                        onClick={() =>
                                            handleUpdate(user.id, { is_active: true })
                                        }
                                    >
                                        {t("admin.users.activate")}
                                    </Button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
