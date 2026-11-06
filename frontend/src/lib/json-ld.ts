/**
 * JSON-LD verisini `<script>` etiketine guvenli serilestirir.
 *
 * Kullanici girisi (urun adi, aciklamasi vb.) JSON-LD'ye girebildigi icin
 * "<", ">" ve satir ayirici karakterler kacirilir; aksi halde urun adina
 * yazilan "</script><script>alert(1)</script>" gibi bir deger sayfada
 * sakli XSS ile sonuclanir.
 */
export function jsonLdHtml(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}