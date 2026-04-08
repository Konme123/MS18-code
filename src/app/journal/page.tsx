'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseAnonClient, JOURNAL_IMAGES_BUCKET } from '@/lib/supabase';

type JournalPost = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  body: string;
  gradient: 'purple' | 'blue' | 'green';
  createdAt: Date;
  media: Array<{ type: 'image'; src?: string }>;
};

type JournalPostRow = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  body: string;
  gradient: 'purple' | 'blue' | 'green';
  created_at: string;
  journal_post_images?: Array<{ path: string; sort_order: number }>;
};

type PostEngagement = {
  liked: boolean;
  likeCount: number;
  shareCount: number;
};

function getTheme(post: JournalPost) {
  return post.gradient || 'purple';
}

function formatManilaDate(d: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  }).format(d);
}

function formatTimeAgo(now: Date, createdAt: Date) {
  const diffMs = Math.max(0, now.getTime() - createdAt.getTime());
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 60) return `${diffMin}mins ago`;
  const diffHrs = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffHrs < 24) return `${diffHrs}hr ${remMin}mins ago`;
  const diffDays = Math.floor(diffHrs / 24);
  const remHrs = diffHrs % 24;
  return `${diffDays}d ${remHrs}hr ${remMin}mins ago`;
}

const SEEDED_POSTS: JournalPost[] = [
  {
    id: 'p1',
    category: 'For the People',
    title: 'Since 2003',
    subtitle: 'The perseverance of Technician',
    body:
      "We provide reliable computer repair services focused on fixing broken components, replacing faulty parts, and restoring your device's performance. Our goal is to deliver honest, efficient solutions that keep your technology running smoothly, whether for work, study, or everyday use.",
    gradient: 'purple',
    createdAt: new Date(Date.now() - 8 * 60 * 1000),
    media: [
      { type: 'image', src: '/image example/1.jfif' },
      { type: 'image', src: '/image example/2.png' },
      { type: 'image', src: '/image example/3.jfif' },
      { type: 'image', src: '/image example/4.png' },
      { type: 'image', src: '/image example/5.png' },
    ],
  },
  {
    id: 'p2',
    category: 'For Companies',
    title: 'Willing to prepare you for the Digital Space',
    subtitle: 'The perseverance of Technician',
    body:
      'The future is in your hands. We can help you set up your devices, network, and cloud services so your team can work reliably and securely.',
    gradient: 'blue',
    createdAt: new Date(Date.now() - (2 * 60 + 30) * 60 * 1000),
    media: [
      { type: 'image', src: '/image example/4.png' },
      { type: 'image', src: '/image example/5.png' },
    ],
  },
  {
    id: 'p3',
    category: 'For Companies',
    title: 'Willing to prepare you for the Digital Space',
    subtitle: 'The perseverance of Technician',
    body:
      'The future is in your hands. We can help you set up your devices, network, and cloud services so your team can work reliably and securely.',
    gradient: 'blue',
    createdAt: new Date(Date.now() - (2 * 60 + 30) * 60 * 1000),
    media: [{ type: 'image', src: '/image example/2.png' }],
  },
];

export default function JournalPage() { 
  const router = useRouter();
  const searchParams = useSearchParams();
  const [now, setNow] = useState<Date | null>(null);
  const [activePost, setActivePost] = useState<JournalPost | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeMediaIsLandscape, setActiveMediaIsLandscape] = useState(false);
  const [engagement, setEngagement] = useState<Record<string, PostEngagement>>({});
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});
  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [shareToast, setShareToast] = useState<string>('');

  const closingModalRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const closeModal = () => {
    closingModalRef.current = true;
    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    setActivePost(null);
    router.replace('/journal', { scroll: false });
  };

  useEffect(() => {
    const postId = searchParams.get('post');
    if (!postId) {
      closingModalRef.current = false;
      return;
    }
    if (closingModalRef.current) return;
    if (!posts.length) return;
    if (activePost?.id === postId) return;

    const found = posts.find((p) => p.id === postId);
    if (!found) return;
    setActivePost(found);
    setActiveMediaIndex(0);
  }, [searchParams, posts, activePost]);

  useEffect(() => {
    if (!activePost) {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      if (lastScrollYRef.current) {
        window.scrollTo({ top: lastScrollYRef.current, left: 0, behavior: 'auto' });
      }
      return;
    }

    lastScrollYRef.current = window.scrollY || window.pageYOffset || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [activePost]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoadingPosts(true);
        const supabase = createSupabaseAnonClient();
        const { data, error } = await supabase
          .from('journal_posts')
          .select('id, category, title, subtitle, body, gradient, created_at, journal_post_images(path, sort_order)')
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error || !data) {
          setPosts(SEEDED_POSTS);
          return;
        }

        const rows = data as unknown as JournalPostRow[];
        if (rows.length === 0) {
          setPosts([]);
          return;
        }

        const mapped: JournalPost[] = rows.map((r) => {
          const images = (r.journal_post_images ?? [])
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

          const media = images.map((img) => {
            const url = supabase.storage.from(JOURNAL_IMAGES_BUCKET).getPublicUrl(img.path).data
              .publicUrl;
            return { type: 'image' as const, src: url };
          });

          return {
            id: r.id,
            category: r.category,
            title: r.title,
            subtitle: r.subtitle || '',
            body: r.body,
            gradient: r.gradient || 'purple',
            createdAt: new Date(r.created_at),
            media,
          };
        });

        setPosts(mapped);
      } catch {
        if (cancelled) return;
        setPosts(SEEDED_POSTS);
      } finally {
        if (cancelled) return;
        setLoadingPosts(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activePost) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!activePost) return;
      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key === 'ArrowLeft') {
        setActiveMediaIndex((idx) => {
          const count = activePost.media.length;
          if (count <= 1) return 0;
          return (idx - 1 + count) % count;
        });
      }

      if (e.key === 'ArrowRight') {
        setActiveMediaIndex((idx) => {
          const count = activePost.media.length;
          if (count <= 1) return 0;
          return (idx + 1) % count;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePost]);

  useEffect(() => {
    setEngagement((prev) => {
      const next: Record<string, PostEngagement> = { ...prev };

      for (const post of posts) {
        if (next[post.id]) continue;
        next[post.id] = {
          liked: false,
          likeCount: 120,
          shareCount: 30,
        };
      }

      return next;
    });
  }, [posts]);

  const toggleLike = (postId: string) => {
    setEngagement((prev) => {
      const current = prev[postId] ?? { liked: false, likeCount: 0, shareCount: 0 };
      const nextLiked = !current.liked;
      const nextLikeCount = Math.max(0, current.likeCount + (nextLiked ? 1 : -1));
      return {
        ...prev,
        [postId]: {
          ...current,
          liked: nextLiked,
          likeCount: nextLikeCount,
        },
      };
    });
  };

  const incrementShare = (postId: string) => {
    setEngagement((prev) => {
      const current = prev[postId] ?? { liked: false, likeCount: 0, shareCount: 0 };
      return {
        ...prev,
        [postId]: {
          ...current,
          shareCount: current.shareCount + 1,
        },
      };
    });
  };

  const sharePost = async (postId: string, title?: string) => {
    const url = `${window.location.origin}/journal?post=${encodeURIComponent(postId)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'Journal post', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareToast('Link copied');
      }
      incrementShare(postId);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareToast('Link copied');
        incrementShare(postId);
      } catch {
        setShareToast('Unable to share');
      }
    }
  };

  useEffect(() => {
    if (!shareToast) return;
    const id = window.setTimeout(() => setShareToast(''), 1800);
    return () => window.clearTimeout(id);
  }, [shareToast]);

  return (
    <div className="min-h-screen bg-white">
      {shareToast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg">
          {shareToast}
        </div>
      ) : null}
      <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[clamp(3rem,6vw,4.5rem)] font-bold -tracking-[3px] leading-[0.95]">
            <span className="bg-gradient-to-b from-[#9A42E6] to-[#562580] from-[40%] bg-clip-text text-transparent">
              The
            </span>{' '}
            <span className="bg-gradient-to-br from-[#2767BC] via-[#142699] to-[#070D33] from-40% via-100% to-100% bg-clip-text text-transparent">
              Journal.
            </span>
          </h1>

          <div className="mt-3 text-sm font-semibold text-slate-500">
            {now ? formatManilaDate(now) : ''}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          {loadingPosts ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <article key={`skeleton-${idx}`} className="mx-auto w-full max-w-2xl">
                <div className="rounded-3xl bg-white shadow-[0_14px_40px_rgba(2,6,23,0.20)] ring-1 ring-slate-200/60">
                  <div className="px-7 pt-7">
                    <div className="flex items-start justify-between gap-6">
                      <div className="w-full">
                        <div className="h-3 w-28 rounded-full bg-slate-200 animate-pulse" />
                        <div className="mt-3 h-8 w-3/4 rounded-2xl bg-slate-200 animate-pulse" />
                        <div className="mt-3 h-4 w-2/5 rounded-full bg-slate-200 animate-pulse" />
                        <div className="mt-5 grid gap-2">
                          <div className="h-3 w-full rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-3 w-11/12 rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-3 w-10/12 rounded-full bg-slate-200 animate-pulse" />
                          <div className="h-3 w-9/12 rounded-full bg-slate-200 animate-pulse" />
                        </div>
                      </div>
                      <div className="shrink-0 pt-2">
                        <div className="h-3 w-12 rounded-full bg-slate-200 animate-pulse" />
                      </div>
                    </div>

                    <div className="mt-6 grid aspect-[16/9] grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-slate-100">
                      <div className="h-full w-full bg-slate-200 animate-pulse" />
                      <div className="h-full w-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-end justify-between px-7 py-5">
                    <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-3 w-28 rounded-full bg-slate-200 animate-pulse" />
                      <div className="h-10 w-28 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : posts.length === 0 ? (
            <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-10 text-center text-sm font-semibold text-slate-500 shadow-[0_14px_40px_rgba(2,6,23,0.12)] ring-1 ring-slate-200/60">
              No posts yet.
            </div>
          ) : (
            posts.map((post) => (
            <article key={post.id} className="mx-auto w-full max-w-2xl">
              {(() => {
                const theme = getTheme(post);
                const stats = engagement[post.id];
                const categoryClass =
                  theme === 'blue'
                    ? 'bg-gradient-to-b from-[#2767BC] to-[#142699] from-20% to-100%'
                    : theme === 'green'
                    ? 'bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D] from-40% via-100% to-100%'
                    : 'bg-gradient-to-br from-[#9A42E6] to-[#562580] from-20% to-90%';
                const titleClass =
                  theme === 'blue'
                    ? 'bg-gradient-to-b from-[#2767BC] to-[#142699] from-40% to-100%'
                    : theme === 'green'
                    ? 'bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D] from-40% via-100% to-100%'
                    : 'bg-gradient-to-b from-[#9A42E6] to-[#562580] from-20% to-100%';
                
                  const BODY_PREVIEW_CHARS = 180;
                  const shouldShowSeeMore = post.body.trim().length > BODY_PREVIEW_CHARS;
                  const isExpanded = !!expandedBodies[post.id];
                  const previewBody = shouldShowSeeMore ? post.body.slice(0, BODY_PREVIEW_CHARS).trim() : post.body;
                  const bodyLen = post.body.trim().length;
                  const bodyTextClass =
                    bodyLen <= 80 ? 'text-xl leading-7' : bodyLen <= 140 ? 'text-lg leading-7' : 'text-sm leading-6';

                return (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActivePost(post);
                  setActiveMediaIndex(0);
                  router.replace(`/journal?post=${encodeURIComponent(post.id)}`, { scroll: false });
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  setActivePost(post);
                  setActiveMediaIndex(0);
                  router.replace(`/journal?post=${encodeURIComponent(post.id)}`, { scroll: false });
                }}
                className="cursor-pointer rounded-3xl bg-white shadow-[0_14px_40px_rgba(2,6,23,0.20)] ring-1 ring-slate-200/60 transition-shadow hover:shadow-[0_18px_55px_rgba(2,6,23,0.22)]"
              >
                <div className="px-7 pt-7">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div
                        className={`text-[10px] font-bold uppercase -tracking-[1px] bg-clip-text text-transparent ${categoryClass}`}
                      >
                        {post.category}
                      </div>
                      <h2 className="mt-1 text-3xl font-bold -tracking-[1px]">
                        <span
                          className={`bg-clip-text text-transparent -tracking-[1px] ${titleClass} [overflow-wrap:anywhere] break-words`}
                        >
                          {post.title}
                        </span>
                      </h2>
                      {post.subtitle && (
                        <div className="mt-1 text-[1.2em] font-bold text-[#616161] -tracking-[1px]">
                          {post.subtitle}
                        </div>
                      )}
                      <div className={`mt-3 text-slate-600 [overflow-wrap:anywhere] break-words ${bodyTextClass}`}>
                        {isExpanded ? (
                          <p>
                            {post.body}
                            {shouldShowSeeMore ? (
                              <>
                                {' '}
                                <button
                                  type="button"
                                  className="inline font-semibold text-slate-500 hover:text-slate-700"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedBodies((prev) => ({
                                      ...prev,
                                      [post.id]: false,
                                    }));
                                  }}
                                >
                                  See less
                                </button>
                              </>
                            ) : null}
                          </p>
                        ) : (
                          <p>
                            {shouldShowSeeMore ? previewBody : post.body}
                            {shouldShowSeeMore ? (
                              <>
                                ...{' '}
                                <button
                                  type="button"
                                  className="inline font-semibold text-slate-500 hover:text-slate-700"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedBodies((prev) => ({
                                      ...prev,
                                      [post.id]: true,
                                    }));
                                  }}
                                >
                                  See more
                                </button>
                              </>
                            ) : null}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pt-2 text-right text-[10px] font-semibold text-slate-400">
                      {now ? formatTimeAgo(now, post.createdAt) : ''}
                    </div>
                  </div>

                  {post.media.length > 0 ? (
                    <div
                      className={(() => {
                        const count = post.media.length;
                        if (count <= 1)
                          return 'mt-6 grid aspect-[4/3] grid-cols-1 gap-1 overflow-hidden rounded-2xl bg-transparent';
                        if (count === 2)
                          return 'mt-6 grid aspect-[16/9] grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-transparent';
                        if (count === 3)
                          return 'mt-6 grid aspect-[16/9] grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-transparent';
                        return 'mt-6 grid aspect-[1/1] grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-transparent';
                      })()}
                    >
                      {(() => {
                        const count = post.media.length;
                        const visible = count > 4 ? post.media.slice(0, 4) : post.media;
                        const extra = Math.max(0, count - 4);

                        return visible.map((m, idx) => {
                          const tileClass =
                            count === 3 && idx === 0
                              ? 'relative h-full w-full row-span-2 bg-transparent'
                              : 'relative h-full w-full bg-transparent';

                          return (
                            <div key={`${post.id}-m-${idx}`} className={tileClass}>
                              {m.src ? (
                                <img
                                  src={m.src}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  draggable={false}
                                />
                              ) : null}
                              {extra > 0 && idx === 3 ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                  <span className="text-4xl font-bold tracking-[-1px] text-white">+{extra}</span>
                                </div>
                              ) : null}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-end justify-between px-7 py-5">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50"
                    aria-label="Like"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(post.id);
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-7 w-7 ${stats?.liked ? 'text-red-500' : 'text-slate-700'}`}
                      fill={stats?.liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                    </svg>
                  </button>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {stats ? `${stats.likeCount} likes ${stats.shareCount} shares` : ''}
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      aria-label="Share"
                      onClick={(e) => {
                        e.stopPropagation();
                        void sharePost(post.id, post.title);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-7 w-7 text-slate-700"
                        fill="#1D1B20"
                        stroke="#1D1B20"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.7 13.6l6.6 3.8" />
                        <path d="M15.3 6.6L8.7 10.4" />
                      </svg>
                      <span className='font-bold text-[#242424] tracking-[-1px] text-[1.7em]'>Share</span>
                    </button>
                  </div>
                </div>
              </div>
                );
              })()}
            </article>
          ))
          )}
        </div>

        {activePost ? (
          (() => {
            const theme = getTheme(activePost);
            const stats = engagement[activePost.id];
            const categoryClass =
              theme === 'blue'
                ? 'bg-gradient-to-b from-[#2767BC] to-[#142699] from-20% to-100%'
                : theme === 'green'
                ? 'bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D] from-40% via-100% to-100%'
                : 'bg-gradient-to-br from-[#9A42E6] to-[#562580] from-20% to-90%';
            const titleClass =
              theme === 'blue'
                ? 'bg-gradient-to-b from-[#2767BC] to-[#142699] from-40% to-100%'
                : theme === 'green'
                ? 'bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D] from-40% via-100% to-100%'
                : 'bg-gradient-to-b from-[#9A42E6] to-[#562580] from-20% to-100%';

            const modalBodyLen = activePost.body.trim().length;
            const modalBodyTextClass =
              modalBodyLen <= 80
                ? 'text-xl leading-7'
                : modalBodyLen <= 140
                ? 'text-lg leading-7'
                : 'text-sm leading-6';

            const mediaCount = activePost.media.length;
            const activeMedia = activePost.media[activeMediaIndex];

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
                role="dialog"
                aria-modal="true"
                onClick={closeModal}
              >
                <div
                  className="relative w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_90px_rgba(2,6,23,0.45)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={mediaCount > 0 ? 'grid grid-cols-1 md:grid-cols-2' : 'grid grid-cols-1'}>
                    {mediaCount > 0 ? (
                      <div className="relative bg-black">
                        <div
                          className={
                            activeMediaIsLandscape
                              ? 'flex h-[75vh] w-full items-center justify-center bg-black'
                              : 'flex w-full items-center justify-center bg-black'
                          }
                        >
                          {activeMedia?.src ? (
                            <img
                              src={activeMedia.src}
                              alt=""
                              className={
                                activeMediaIsLandscape
                                  ? 'max-h-full w-full object-contain'
                                  : 'h-auto max-h-[75vh] w-full object-contain'
                              }
                              draggable={false}
                              onLoad={(e) => {
                                const img = e.currentTarget;
                                setActiveMediaIsLandscape(img.naturalWidth > img.naturalHeight);
                              }}
                            />
                          ) : null}
                        </div>

                        {mediaCount > 1 ? (
                          <>
                            <button
                              type="button"
                              aria-label="Previous"
                              onClick={() =>
                                setActiveMediaIndex((idx) => (idx - 1 + mediaCount) % mediaCount)
                              }
                              className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/45"
                            >
                              <span className="text-2xl leading-none">‹</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Next"
                              onClick={() => setActiveMediaIndex((idx) => (idx + 1) % mediaCount)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/45"
                            >
                              <span className="text-2xl leading-none">›</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="relative flex min-h-[380px] flex-col p-7">
                      <button
                        type="button"
                        aria-label="Close"
                        onClick={closeModal}
                        className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>

                      <div className="pr-10">
                        <div
                          className={`text-[10px] font-bold uppercase -tracking-[1px] bg-clip-text text-transparent ${categoryClass}`}
                        >
                          {activePost.category}
                        </div>
                        <h2 className="mt-1 text-4xl font-bold -tracking-[1px]">
                          <span
                            className={`bg-clip-text text-transparent -tracking-[1px] ${titleClass} [overflow-wrap:anywhere] break-words`}
                          >
                            {activePost.title}
                          </span>
                        </h2>
                        {activePost.subtitle && (
                          <div className="mt-1 text-sm font-semibold text-[#616161] -tracking-[0.3px]">
                            {activePost.subtitle}
                          </div>
                        )}
                        <div className="mt-2 text-xs font-semibold text-slate-400">
                          {now ? formatTimeAgo(now, activePost.createdAt) : ''}
                        </div>
                      </div>

                      <div
                        className={`mt-5 flex-1 overflow-auto pr-2 text-slate-600 [overflow-wrap:anywhere] break-words ${modalBodyTextClass}`}
                      >
                        {(() => {
                          const MODAL_BODY_PREVIEW_CHARS = 300;
                          const shouldShowSeeMore = activePost.body.trim().length > MODAL_BODY_PREVIEW_CHARS;
                          const isExpanded = !!expandedBodies[activePost.id];
                          const previewBody = shouldShowSeeMore ? activePost.body.slice(0, MODAL_BODY_PREVIEW_CHARS).trim() : activePost.body;

                          return isExpanded ? (
                            <p>
                              {activePost.body}
                              {shouldShowSeeMore ? (
                                <>
                                  {' '}
                                  <button
                                    type="button"
                                    className="inline font-semibold text-slate-500 hover:text-slate-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBodies((prev) => ({
                                        ...prev,
                                        [activePost.id]: false,
                                      }));
                                    }}
                                  >
                                    See less
                                  </button>
                                </>
                              ) : null}
                            </p>
                          ) : (
                            <p>
                              {shouldShowSeeMore ? previewBody : activePost.body}
                              {shouldShowSeeMore && (
                                <>
                                  ...{' '}
                                  <button
                                    type="button"
                                    className="inline font-semibold text-slate-500 hover:text-slate-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBodies((prev) => ({
                                        ...prev,
                                        [activePost.id]: true,
                                      }));
                                    }}
                                  >
                                    See more
                                  </button>
                                </>
                              )}
                            </p>
                          );
                        })()}
                      </div>

                      <div className="mt-6 flex items-end justify-between gap-4">
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-50"
                          aria-label="Like"
                          onClick={() => toggleLike(activePost.id)}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className={`h-6 w-6 ${stats?.liked ? 'text-red-500' : 'text-slate-700'}`}
                            fill={stats?.liked ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                          </svg>
                        </button>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs font-semibold text-slate-400">
                            {stats ? `${stats.likeCount} likes ${stats.shareCount} shares` : ''}
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            aria-label="Share"
                            onClick={() => void sharePost(activePost.id, activePost.title)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-6 w-6 text-slate-700"
                              fill="#1D1B20"
                              stroke="#1D1B20"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="18" cy="5" r="3" />
                              <circle cx="6" cy="12" r="3" />
                              <circle cx="18" cy="19" r="3" />
                              <path d="M8.7 13.6l6.6 3.8" />
                              <path d="M15.3 6.6L8.7 10.4" />
                            </svg>
                            <span className="font-bold text-[#242424] tracking-[-1px]">Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : null}
      </section>
    </div>
  );
}
