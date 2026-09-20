export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="max-w-4xl">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Ahilik anlayışından ilham alan e-ticaret
          </p>

          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Emeğin değerini koruyan,
            <br />
            dayanışmayla büyüyen pazar yeri.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-neutral-600 sm:text-xl">
            Ahicadde; ahilik kültürünün dayanışma, paylaşma, dürüstlük ve
            karşılıklı güven anlayışından ilham alan yeni nesil bir e-ticaret
            pazaryeridir.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/urunler"
              className="rounded-full border border-neutral-200 px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-100"
            >
              Ürünleri Keşfet
            </a>

            <a
              href="/satici-ol"
              className="rounded-full border border-neutral-200 px-7 py-3.5 text-sm font-medium transition hover:bg-neutral-100"
            >
              Satıcı Ol
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-neutral-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3 lg:px-8">
          <article>
            <h2 className="text-xl font-semibold">Dayanışma</h2>
            <p className="mt-3 leading-7 text-neutral-600">
              Ahicadde, ticareti yalnızca alışverişten ibaret görmeyen;
              üretici, satıcı ve alıcıların birlikte değer oluşturduğu bir
              ekosistem kurmayı hedefler.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold">Şeffaf ticaret</h2>
            <p className="mt-3 leading-7 text-neutral-600">
              Hizmet maliyetlerinin açık ve anlaşılır olması, satıcının
              ürününden elde ettiği kazancı daha iyi görebilmesi ve alıcının
              ödediği bedelin nereye gittiğini anlayabilmesi temel
              ilkelerimizdendir.
            </p>
          </article>

          <article>
            <h2 className="text-xl font-semibold">Uygun alışveriş</h2>
            <p className="mt-3 leading-7 text-neutral-600">
              Gereksiz maliyetlerin azaltılmasının, satıcıların kazancını
              korurken alıcılara daha uygun fiyatlar sunulmasına katkı
              sağlayabileceğine inanıyoruz.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ahilik kültürünü dijital ticarete taşıyoruz.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-8 text-neutral-600">
          <p>
            Ahilik; ticarette güveni, dürüstlüğü, emeğe saygıyı, paylaşmayı ve
            dayanışmayı önemseyen köklü bir Anadolu geleneğidir. Ahicadde,
            bu değerlerden ilham alarak dijital ortamda daha şeffaf ve
            dayanışmacı bir ticaret modeli oluşturmayı amaçlar.
          </p>

          <p>
            Hedefimiz, satıcıların ürünlerini sunarken karşılaştıkları
            gereksiz maliyetleri mümkün olduğunca azaltmak ve oluşan
            avantajın hem satıcının kazancına hem de alıcının alışveriş
            koşullarına yansıyabileceği bir pazar yeri oluşturmaktır.
          </p>

          <p>
            Bu nedenle Ahicadde'de yalnızca ürünleri değil; emeği, üretimi,
            esnafı, tüketiciyi ve aralarındaki dayanışmayı merkeze alan bir
            e-ticaret ekosistemi kuruyoruz.
          </p>
        </div>
      </section>
    </main>
  );
}