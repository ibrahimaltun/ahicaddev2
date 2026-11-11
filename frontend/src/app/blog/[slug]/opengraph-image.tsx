import { ImageResponse } from "next/og";

import { getBlogPostBySlug } from "@/features/blog/posts";

export const alt = "Ahicad Blog";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

interface OpengraphImageProps {
    params: Promise<{ slug: string }>;
}

export default async function OpengraphImage({ params }: OpengraphImageProps) {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);
    const title = post?.title ?? "Ahicad Blog";

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #064e3b 0%, #047857 100%)",
                    padding: 64,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: "#ffffff",
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#065f46",
                        }}
                    >
                        A
                    </div>
                    <span style={{ fontSize: 26, color: "#d1fae5", letterSpacing: 2 }}>
                        AHICADDE BLOG
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        fontSize: 52,
                        fontWeight: 700,
                        color: "#ffffff",
                        lineHeight: 1.2,
                        maxWidth: 1040,
                    }}
                >
                    {title}
                </div>

                <div style={{ display: "flex", fontSize: 24, color: "#a7f3d0" }}>
                    ahicadde.com/blog
                </div>
            </div>
        ),
        size,
    );
}
