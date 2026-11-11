import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostBlocks, PostSources } from "@/features/blog/PostBlocks";
import { RatingPanel } from "@/features/blog/RatingPanel";
import {
    BLOG_POSTS,
    formatBlogDate,
    getBlogPostBySlug,
    getOtherBlogPosts,
    getPostHeadings,
} from "@/features/blog/posts";
import { SITE_URL, BLOG_BASE_PATH } from "@/lib/constants";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getServerLocale } from "@/lib/i18n/server";
import {
    createArticleJsonLd,
    createBreadcrumbJsonLd,
    createFaqJsonLd,
    jsonLdHtml,
} from "@/lib/json-ld";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

/** SSG: her blog yazisi derleme zamaninda statik HTML olarak uretilir. */
export function generateStaticParams(): { slug: string }[] {
    return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        return {};
    }

    const url = `${SITE_URL}${BLOG_BASE_PATH}/${post.slug}`;

    return {
        title: post.title,
        description: post.excerpt,
        keywords: post.keywords,
        authors: [{ name: "Ahicadde" }],
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            url,
            type: "article",
            publishedTime: post.date,
            modifiedTime: post.dateModified ?? post.date,
            authors: ["Ahicadde"],
            tags: post.keywords,
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.excerpt,
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getBlogPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const locale = await getServerLocale();
    const dictionary = dictionaries[locale];
    const headings = getPostHeadings(post.blocks);
    const postUrl = `${SITE_URL}${BLOG_BASE_PATH}/${post.slug}`;
    const otherPosts = getOtherBlogPosts(post.slug);

    const jsonLd = [
        createArticleJsonLd({
            title: post.title,
            description: post.excerpt,
            slug: post.slug,
            datePublished: post.date,
            dateModified: post.dateModified ?? post.date,
            keywords: post.keywords,
        }),
        createBreadcrumbJsonLd([
            { name: dictionary.header.home, url: SITE_URL },
            { name: dictionary.footer.blog, url: `${SITE_URL}${BLOG_BASE_PATH}` },
            { name: post.title, url: postUrl },
        ]),
        createFaqJsonLd(post.faqs),
    ];

    return (
        <div className="bg-slate-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
            />
            <main className="mx-auto w-full max-w-3xl px-6 py-16">
                <article>
                    <nav aria-label={dictionary.blog.toc} className="mb-8">
                        <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <li>
                                <Link href="/" className="hover:text-emerald-700">
                                    {dictionary.header.home}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li>
                                <Link href={BLOG_BASE_PATH} className="hover:text-emerald-700">
                                    {dictionary.footer.blog}
                                </Link>
                            </li>
                            <li aria-hidden="true">/</li>
                            <li aria-current="page" className="text-slate-700">
                                {post.category}
                            </li>
                        </ol>
                    </nav>

                    <header>
                        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                            {post.category}
                        </p>
                        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            {post.title}
                        </h1>
                        <p className="mt-4 text-lg leading-relaxed text-slate-600">{post.excerpt}</p>
                        <p className="mt-4 text-sm text-slate-500">
                            {formatBlogDate(post.date, locale)} · {post.readingMinutes}{" "}
                            {dictionary.blog.minutesRead}
                        </p>
                    </header>

                    <section
                        aria-label={dictionary.blog.takeawaysTitle}
                        className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
                    >
                        <h2 className="text-lg font-bold text-emerald-900">
                            {dictionary.blog.takeawaysTitle}
                        </h2>
                        <ul className="mt-3 space-y-2">
                            {post.takeaways.map((takeaway) => (
                                <li
                                    key={takeaway}
                                    className="flex gap-3 text-base leading-relaxed text-emerald-950"
                                >
                                    <span aria-hidden="true" className="mt-1 text-emerald-600">
                                        ✓
                                    </span>
                                    <span>{takeaway}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {headings.length > 0 ? (
                        <section aria-label={dictionary.blog.toc} className="mt-8">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                                {dictionary.blog.toc}
                            </h2>
                            <ol className="mt-3 space-y-1">
                                {headings
                                    .filter((heading) => heading.level === 2)
                                    .map((heading) => (
                                        <li key={heading.id}>
                                            <a
                                                href={`#${heading.id}`}
                                                className="text-base text-slate-600 hover:text-emerald-700"
                                            >
                                                {heading.text}
                                            </a>
                                        </li>
                                    ))}
                            </ol>
                        </section>
                    ) : null}

                    <div className="mt-10 space-y-5">
                        <PostBlocks blocks={post.blocks} />
                    </div>

                    {post.faqs.length > 0 ? (
                        <section className="mt-10">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {dictionary.blog.faqTitle}
                            </h2>
                            <div className="mt-4 space-y-4">
                                {post.faqs.map((faq) => (
                                    <div
                                        key={faq.question}
                                        className="rounded-xl border border-slate-200 bg-white p-5"
                                    >
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {faq.question}
                                        </h3>
                                        <p className="mt-2 leading-relaxed text-slate-600">
                                            {faq.answer}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <section className="mt-10">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {dictionary.blog.sourcesTitle}
                        </h2>
                        <div className="mt-4">
                            <PostSources sources={post.sources} />
                        </div>
                    </section>
                </article>

                <RatingPanel
                    postSlug={post.slug}
                    title={dictionary.blog.rateTitle}
                    question={dictionary.blog.rateQuestion}
                    feedbackThanks={dictionary.blog.rateThanks}
                    resetLabel={dictionary.blog.rateReset}
                    emojis={dictionary.blog.rateEmojis.split("|")}
                    labels={dictionary.blog.rateLabels.split("|")}
                />

                {otherPosts.length > 0 ? (
                    <section className="mt-12 border-t border-slate-200 pt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                            {dictionary.blog.relatedTitle}
                        </h2>
                        <div className="mt-5 space-y-4">
                            {otherPosts.map((related) => (
                                <article
                                    key={related.slug}
                                    className="rounded-xl border border-slate-200 bg-white p-5"
                                >
                                    <p className="text-sm font-semibold text-emerald-700">
                                        {related.category}
                                    </p>
                                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                                        <Link
                                            href={`/blog/${related.slug}`}
                                            className="hover:text-emerald-700"
                                        >
                                            {related.title}
                                        </Link>
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {formatBlogDate(related.date, locale)}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}
            </main>
        </div>
    );
}
