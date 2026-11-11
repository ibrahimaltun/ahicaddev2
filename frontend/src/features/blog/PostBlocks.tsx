import Link from "next/link";

import type { ContentBlock } from "@/features/blog/types";
import { slugifyHeading } from "@/features/blog/posts";

interface PostBlocksProps {
    blocks: ContentBlock[];
}

/**
 * Blog icerik bloklarini SEO dostu anlamsal HTML'e donusturur.
 * Sunucu bileşenidir; hicbir client JS uretir.
 * H2/H3 basliklari, derin baglantilar (anchor) icin slug id alir.
 */
export function PostBlocks({ blocks }: PostBlocksProps) {
    const headingIdCounts = new Map<string, number>();

    const getHeadingId = (text: string): string => {
        const base = slugifyHeading(text);
        const count = headingIdCounts.get(base) ?? 0;
        headingIdCounts.set(base, count + 1);

        return count === 0 ? base : `${base}-${count + 1}`;
    };

    return (
        <>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "paragraph":
                        return (
                            <p key={index} className="text-lg leading-relaxed text-slate-700">
                                {block.text}
                            </p>
                        );
                    case "heading2":
                        return (
                            <h2
                                key={index}
                                id={getHeadingId(block.text)}
                                className="scroll-mt-24 pt-6 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
                            >
                                {block.text}
                            </h2>
                        );
                    case "heading3":
                        return (
                            <h3
                                key={index}
                                id={getHeadingId(block.text)}
                                className="scroll-mt-24 pt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
                            >
                                {block.text}
                            </h3>
                        );
                    case "bulletList":
                        return (
                            <ul key={index} className="space-y-2">
                                {block.items.map((item, itemIndex) => (
                                    <li
                                        key={itemIndex}
                                        className="flex gap-3 text-lg leading-relaxed text-slate-700"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600"
                                        />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        );
                    case "numberedList":
                        return (
                            <ol key={index} className="space-y-3">
                                {block.items.map((item, itemIndex) => (
                                    <li
                                        key={itemIndex}
                                        className="flex gap-4 text-lg leading-relaxed text-slate-700"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800"
                                        >
                                            {itemIndex + 1}
                                        </span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ol>
                        );
                    case "quote":
                        return (
                            <blockquote
                                key={index}
                                className="border-l-4 border-emerald-600 pl-5 text-lg font-medium leading-relaxed text-slate-800"
                            >
                                {block.text}
                                {block.author ? (
                                    <span className="mt-2 block text-sm font-normal text-slate-500">
                                        — {block.author}
                                    </span>
                                ) : null}
                            </blockquote>
                        );
                    case "callout":
                        return (
                            <div
                                key={index}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-lg leading-relaxed text-emerald-950"
                            >
                                {block.text}
                            </div>
                        );
                    default:
                        return null;
                }
            })}
        </>
    );
}

interface PostSourcesProps {
    sources: { label: string; publisher: string; url: string }[];
}

export function PostSources({ sources }: PostSourcesProps) {
    return (
        <ul className="space-y-2">
            {sources.map((source) => (
                <li key={source.url} className="text-sm leading-relaxed text-slate-600">
                    <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-700 hover:underline"
                    >
                        {source.label}
                    </a>{" "}
                    <span className="text-slate-400">— {source.publisher}</span>
                </li>
            ))}
        </ul>
    );
}

interface PostCardProps {
    post: {
        slug: string;
        title: string;
        excerpt: string;
        category: string;
        readingMinutes: number;
    };
    dateLabel: string;
    readLabel: string;
}

export function PostCard({ post, dateLabel, readLabel }: PostCardProps) {
    return (
        <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                {post.category}
            </p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
                <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700">
                    {post.title}
                </Link>
            </h2>
            <p className="mt-3 flex-1 text-base leading-relaxed text-slate-600">
                {post.excerpt}
            </p>
            <p className="mt-4 text-sm text-slate-500">
                {dateLabel} · {post.readingMinutes} {readLabel}
            </p>
        </article>
    );
}
