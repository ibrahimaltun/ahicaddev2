import type { Metadata } from "next";
import Link from "next/link";

import { PostCard } from "@/features/blog/PostBlocks";
import {
    formatBlogDate,
    getSortedBlogPosts,
} from "@/features/blog/posts";
import { BLOG_BASE_PATH, SITE_URL } from "@/lib/constants";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getServerLocale } from "@/lib/i18n/server";
import { createCollectionPageJsonLd, jsonLdHtml } from "@/lib/json-ld";

const BLOG_TITLE = "Blog";
const BLOG_DESCRIPTION =
    "E-ticarette yapay zekâ, LLM ve chatbotlar; site tasarımı ve teknoloji standartları; 2026 pazarlama trendleri — veriye dayalı Türkçe rehberler.";

export const metadata: Metadata = {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    keywords: [
        "e-ticaret blog",
        "yapay zeka e-ticaret",
        "e-ticaret tasarım",
        "dijital pazarlama 2026",
        "ahicadde blog",
    ],
    alternates: {
        canonical: `${SITE_URL}${BLOG_BASE_PATH}`,
    },
    openGraph: {
        title: BLOG_TITLE,
        description: BLOG_DESCRIPTION,
        url: `${SITE_URL}${BLOG_BASE_PATH}`,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: BLOG_TITLE,
        description: BLOG_DESCRIPTION,
    },
};

export default async function BlogPage() {
    const posts = getSortedBlogPosts();
    const locale = await getServerLocale();
    const dictionary = dictionaries[locale];
    const jsonLd = createCollectionPageJsonLd({
        name: dictionary.blog.title,
        description: BLOG_DESCRIPTION,
        path: BLOG_BASE_PATH,
    });

    return (
        <div className="bg-slate-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
            />
            <main className="mx-auto w-full max-w-6xl px-6 py-16">
                <header className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
                        {dictionary.footer.blog}
                    </p>
                    <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {dictionary.blog.title}
                    </h1>
                    <p className="mt-4 text-lg leading-relaxed text-slate-600">
                        {dictionary.blog.subtitle}
                    </p>
                </header>

                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post) => (
                        <PostCard
                            key={post.slug}
                            post={post}
                            dateLabel={formatBlogDate(post.date, locale)}
                            readLabel={dictionary.blog.minutesRead}
                        />
                    ))}
                </div>

                <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
                    <p>
                        {dictionary.blog.sourcesNote}{" "}
                        <Link href="/" className="font-medium text-emerald-700 hover:underline">
                            {dictionary.blog.backHome}
                        </Link>
                    </p>
                </footer>
            </main>
        </div>
    );
}
