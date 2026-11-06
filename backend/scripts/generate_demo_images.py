"""Demo urun gorselleri uretici: frontend/public/demo/*.svg

Ahicadde vitrin/demo verisi icin deterministik, harici bagimliligi olmayan
(offline calisan) urun gorselleri uretir. Her SVG: kategoriye gore gradyan
zemin + dekoratif halkalar + urun adinin ilk harfi.

Calistirma:
    python3 backend/scripts/generate_demo_images.py
"""

from __future__ import annotations

from pathlib import Path

# Kategoriye gore gradyan ciftleri (site paleti ile uyumlu toprak/mavi tonlar).
PALETTES: list[tuple[str, str]] = [
    ("#3f6386", "#2c4a66"),  # cinimavisi
    ("#b45309", "#8a3f06"),  # toprak kiremit
    ("#15803d", "#14532d"),  # zeytin yesili
    ("#a16207", "#713f12"),  # hiriz bal
    ("#6d28d9", "#4c1d95"),  # mor
    ("#0f766e", "#134e4a"),  # cam yestili
]

# (slug, ad, renk-indeksi) — seed_demo.py urun gorselleriyle eslesir.
PRODUCTS: list[tuple[str, str, int]] = [
    ("el-yapimi-cini-tabak", "Çini Tabak", 0),
    ("comlek-kil-testi", "Kil Testi", 0),
    ("seramik-vazo", "Seramik Vazo", 0),
    ("ahsap-oyma-sandik", "Ağaç Oyma", 1),
    ("bakir-cezve-ince-isleme", "Bakır Cezve", 1),
    ("organik-suzme-bal", "Bal", 3),
    ("karadeniz-tereyagi", "Tereyağı", 3),
    ("gun-kurumu-domates", "Domates", 3),
    ("ceyizlik-ucet-sirca", "Sirke", 3),
    ("el-dokuma-usak-halisi", "Halı", 2),
    ("anadolu-bufas-sali", "Büfaş", 2),
    ("kendine-ozgu-dokuma-sal", "Şal", 2),
    ("el-kecesi-duvar-panosu", "Keçe", 2),
    ("dokuma-kilim", "Kilim", 2),
    ("defne-yagli-el-sabunu", "Sabun", 5),
    ("igde-cicegi-sabunu", "Iğde", 5),
    ("lavanta-sabunu", "Lavanta", 5),
    ("gliserinli-sabun", "Gliserin", 5),
    ("el-isi-gumus-kupe", "Gümüş", 4),
    ("hasir-sepet", "Hasır", 3),
]

# Basit deterministik dekor: her urun icin farkli halka konumlari.
SIZE = 640
SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" aria-label="{label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" fill="url(#bg)"/>
  <circle cx="{r1x}" cy="{r1y}" r="{r1}" fill="#ffffff" opacity="0.08"/>
  <circle cx="{r2x}" cy="{r2y}" r="{r2}" fill="#ffffff" opacity="0.06"/>
  <circle cx="{r3x}" cy="{r3y}" r="{r3}" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="6"/>
  <circle cx="{r4x}" cy="{r4y}" r="{r4}" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="4"/>
  <text x="50%" y="50%" dy="0.36em" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="{letter_size}" font-weight="700" fill="#ffffff" opacity="0.92">{letter}</text>
</svg>
"""


def render(slug: str, label: str, letter: str, palette_index: int) -> str:
    c1, c2 = PALETTES[palette_index % len(PALETTES)]
    phase = len(slug)  # deterministik cesitlilik icin slug uzunlugu
    return SVG_TEMPLATE.format(
        size=SIZE,
        label=label,
        letter=letter,
        c1=c1,
        c2=c2,
        letter_size=230,
        r1=180 + (phase * 7) % 60,
        r1x=90 + (phase * 13) % 120,
        r1y=110 + (phase * 11) % 100,
        r2=240,
        r2x=SIZE - (70 + (phase * 9) % 90),
        r2y=SIZE - (80 + (phase * 5) % 70),
        r3=280,
        r3x=SIZE - 40,
        r3y=60,
        r4=330,
        r4x=40,
        r4y=SIZE - 50,
    )


def main() -> None:
    out_dir = (
        Path(__file__).resolve().parents[2]
        / "frontend"
        / "public"
        / "demo"
    )
    out_dir.mkdir(parents=True, exist_ok=True)

    for slug, label, palette_index in PRODUCTS:
        letter = (label[:1] or "A").upper()
        svg = render(slug, label, letter, palette_index)
        (out_dir / f"{slug}.svg").write_text(svg, encoding="utf-8")
        print(f"ok: {slug}.svg")

    print(f"\n{len(PRODUCTS)} gorsel yazildi: {out_dir}")


if __name__ == "__main__":
    main()
