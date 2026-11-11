import { ImageResponse } from "next/og";

export const alt = "Ahicad Blog";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
                    padding: 72,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 64,
                            height: 64,
                            borderRadius: 20,
                            background: "#ffffff",
                            fontSize: 34,
                            fontWeight: 700,
                            color: "#065f46",
                        }}
                    >
                        A
                    </div>
                    <span style={{ fontSize: 30, color: "#d1fae5", letterSpacing: 4 }}>
                        AHICADDE
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            fontSize: 72,
                            fontWeight: 700,
                            color: "#ffffff",
                        }}
                    >
                        Blog
                    </div>
                    <div
                        style={{
                            display: "flex",
                            fontSize: 30,
                            color: "#a7f3d0",
                        }}
                    >
                        E-ticaret, yapay zekâ ve pazarlama üzerine veriye dayalı yazılar
                    </div>
                </div>

                <div style={{ display: "flex", fontSize: 24, color: "#d1fae5" }}>
                    ahicadde.com/blog
                </div>
            </div>
        ),
        size,
    );
}
