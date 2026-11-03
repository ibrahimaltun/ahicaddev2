import { ImageResponse } from "next/og";

export const alt = "Ahicadde | Ahilik Anlayışından İlham Alan E-Ticaret Pazaryeri";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0f2a1f 0%, #17402d 55%, #1e5138 100%)",
                    padding: 80,
                    color: "#f4f7f4",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 24,
                    }}
                >
                    <div
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: 18,
                            background: "#d9a521",
                        }}
                    />
                    <div
                        style={{
                            fontSize: 56,
                            fontWeight: 700,
                            letterSpacing: -1,
                        }}
                    >
                        Ahicadde
                    </div>
                </div>

                <div
                    style={{
                        marginTop: 48,
                        fontSize: 44,
                        fontWeight: 600,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                    }}
                >
                    <span>Ahilik anlayışından ilham alan e-ticaret</span>
                    <span style={{ color: "#bcd8c4", fontSize: 36, fontWeight: 500 }}>
                        Emeğin değerini koruyan, dayanışmayla büyüyen pazar yeri.
                    </span>
                </div>

                <div
                    style={{
                        marginTop: 56,
                        fontSize: 26,
                        color: "#9fbfa9",
                    }}
                >
                    ahicadde.com
                </div>
            </div>
        ),
        { ...size },
    );
}
