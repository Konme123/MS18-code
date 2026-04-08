'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  createSupabaseAnonClient,
  createSupabaseUserClient,
  JOURNAL_IMAGES_BUCKET,
  SERVICE_IMAGES_BUCKET,
} from '@/lib/supabase';

type ServicePillStatus = 'available' | 'unavailable' | 'remote' | 'on_site';

type ServiceRow = {
  id: string;
  title: string;
  description: string;
  details?: string | null;
  icon_src?: string | null;
  modal_image_src?: string | null;
  pill_statuses?: ServicePillStatus[] | null;
  sort_order?: number | null;
};

function togglePillInSet(current: ServicePillStatus[] | null | undefined, pill: ServicePillStatus) {
  const next = new Set<ServicePillStatus>((current ?? []) as ServicePillStatus[]);
  if (next.has(pill)) next.delete(pill);
  else next.add(pill);
  return Array.from(next);
}

type StaticServiceRow = {
  id: string;
  title: string;
  description: string;
  details?: string | null;
  iconSrc?: string | null;
  modalImageSrc?: string | null;
  pillStatuses?: ServicePillStatus[] | null;
  sortOrder?: number | null;
};

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

type NewImage = { file: File; previewUrl: string };

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function AdminPage() {
  const { data: session, status, update } = useSession();

  const [posts, setPosts] = useState<JournalPost[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ category: string; title: string; subtitle: string; body: string; gradient: 'purple' | 'blue' | 'green' }>({
    category: '',
    title: '',
    subtitle: '',
    body: '',
    gradient: 'purple',
  });
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [error, setError] = useState<string>('');

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [servicesError, setServicesError] = useState<string>('');
  const [savingServices, setSavingServices] = useState(false);
  const [servicesSha, setServicesSha] = useState<string>('');
  const [newService, setNewService] = useState<Partial<ServiceRow>>({
    title: '',
    description: '',
    details: '',
    icon_src: '',
    modal_image_src: '',
    pill_statuses: [],
  });

  const fetchPosts = async () => {
    const supabase = createSupabaseAnonClient();
    const { data, error: fetchError } = await supabase
      .from('journal_posts')
      .select('id, category, title, subtitle, body, gradient, created_at, journal_post_images(path, sort_order)')
      .order('created_at', { ascending: false });

    if (fetchError || !data) {
      setPosts([]);
      return;
    }

    const rows = data as unknown as JournalPostRow[];
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
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    fetchPosts();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setServicesError('');
    try {
      const res = await fetch('/api/admin/services', { cache: 'no-store' });
      const json = (await res.json()) as { services?: StaticServiceRow[]; sha?: string; error?: string };

      if (!res.ok || json.error) {
        setServicesError(json.error || 'Failed to load services.');
        setServices([]);
        setServicesSha('');
        return;
      }

      const rows = (json.services ?? []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setServicesSha(json.sha ?? '');
      setServices(
        rows.map((r, idx) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          details: r.details ?? null,
          icon_src: r.iconSrc ?? null,
          modal_image_src: r.modalImageSrc ?? null,
          pill_statuses: (r.pillStatuses ?? []) as any,
          sort_order: r.sortOrder ?? idx,
        }))
      );
    } catch (e: any) {
      setServicesError(e?.message ?? 'Failed to load services.');
      setServices([]);
      setServicesSha('');
    }
  };

  const toggleServicePill = (id: string, pill: ServicePillStatus) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const current = new Set<ServicePillStatus>((s.pill_statuses ?? []) as ServicePillStatus[]);
        if (current.has(pill)) current.delete(pill);
        else current.add(pill);
        return { ...s, pill_statuses: Array.from(current) };
      })
    );
  };

  const updateServiceModalImage = (id: string, value: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, modal_image_src: value || null } : s))
    );
  };

  const updateServiceField = (id: string, field: keyof ServiceRow, value: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value || null } : s))
    );
  };

  const addNewService = () => {
    if (!newService.title?.trim() || !newService.description?.trim()) {
      setServicesError('Title and description are required for new service.');
      return;
    }

    const id = `svc-${Date.now()}`;
    const service: ServiceRow = {
      id,
      title: newService.title.trim(),
      description: newService.description.trim(),
      details: newService.details?.trim() || null,
      icon_src: newService.icon_src?.trim() || null,
      modal_image_src: newService.modal_image_src?.trim() || null,
      pill_statuses: newService.pill_statuses ?? [],
      sort_order: services.length,
    };

    setServices((prev) => [...prev, service]);
    setNewService({
      title: '',
      description: '',
      details: '',
      icon_src: '',
      modal_image_src: '',
      pill_statuses: [],
    });
    setServicesError('');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const uploadServiceImage = async (file: File, type: 'icon' | 'modal'): Promise<string | null> => {
    if (status === 'loading') return null;

    const nextSession = update ? await update() : session;
    const accessToken = (nextSession as any)?.supabaseAccessToken as string | undefined;
    if (!accessToken) {
      setServicesError('Not authenticated. Please log in again.');
      return null;
    }

    const supabaseUser = createSupabaseUserClient(accessToken);
    const ext = file.name.split('.').pop() ?? 'png';
    const fileName = `${type}-${Date.now()}-${safeFileName(file.name)}`;
    const path = `${fileName}`;

    const { error: uploadError } = await supabaseUser.storage
      .from(SERVICE_IMAGES_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setServicesError(`Failed to upload image: ${uploadError.message}`);
      return null;
    }

    const { data } = supabaseUser.storage.from(SERVICE_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleServiceImageUpload = async (
    serviceId: string,
    files: FileList | null,
    type: 'icon' | 'modal'
  ) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = await uploadServiceImage(file, type);
    if (!url) return;

    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, [type === 'icon' ? 'icon_src' : 'modal_image_src']: url }
          : s
      )
    );
  };

  const handleNewServiceImageUpload = async (
    files: FileList | null,
    type: 'icon' | 'modal'
  ) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = await uploadServiceImage(file, type);
    if (!url) return;

    setNewService((p) => ({
      ...p,
      [type === 'icon' ? 'icon_src' : 'modal_image_src']: url,
    }));
  };

  const saveServices = async () => {
    setServicesError('');

    setSavingServices(true);
    try {
      if (!servicesSha) {
        setServicesError('Missing SHA for services.json. Refresh the page and try again.');
        return;
      }

      const payload: StaticServiceRow[] = services
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((s, idx) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          details: s.details ?? null,
          iconSrc: s.icon_src ?? null,
          modalImageSrc: s.modal_image_src ?? null,
          pillStatuses: (s.pill_statuses ?? []) as any,
          sortOrder: idx,
        }));

      const res = await fetch('/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: payload,
          sha: servicesSha,
          message: 'Update services.json via admin',
        }),
      });

      const json = (await res.json()) as { ok?: boolean; sha?: string; error?: string };
      if (!res.ok || !json.ok) {
        setServicesError(json.error || 'Failed to save services.');
        return;
      }

      setServicesSha(json.sha ?? servicesSha);
      await fetchServices();
    } finally {
      setSavingServices(false);
    }
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [posts]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ category: '', title: '', subtitle: '', body: '', gradient: 'purple' });
    setExistingImagePaths([]);
    setNewImages([]);
    setError('');
  };

  const startEdit = async (post: JournalPost) => {
    setEditingId(post.id);
    setForm({ category: post.category, title: post.title, subtitle: post.subtitle, body: post.body, gradient: post.gradient });

    try {
      const supabase = createSupabaseAnonClient();
      const { data, error: imgError } = await supabase
        .from('journal_post_images')
        .select('path, sort_order')
        .eq('post_id', post.id)
        .order('sort_order', { ascending: true });

      if (imgError || !data) {
        setExistingImagePaths([]);
      } else {
        setExistingImagePaths((data as Array<{ path: string }>).map((r) => r.path));
      }
    } catch {
      setExistingImagePaths([]);
    }

    setNewImages([]);
    setError('');
  };

  const upsertPost = async () => {
    setError('');

    if (status === 'loading') return;

    const nextSession = update ? await update() : session;
    const accessToken = (nextSession as any)?.supabaseAccessToken as string | undefined;
    if (!accessToken) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    const category = form.category.trim();
    const title = form.title.trim();
    const subtitle = form.subtitle.trim();
    const body = form.body.trim();
    const gradient = form.gradient;

    if (!category || !title || !body) {
      setError('Please fill in category, title, and body.');
      return;
    }

    const supabaseUser = createSupabaseUserClient(accessToken);

    // Use existing ID when editing, or generate a new one
    const id = editingId || `post-${Date.now()}`;
    const isNew = !editingId;
    const createdAt = isNew ? new Date().toISOString() : undefined;

    const { error: upsertError } = await supabaseUser
      .from('journal_posts')
      .upsert(
        {
          id,
          category,
          title,
          subtitle,
          body,
          gradient,
          ...(createdAt ? { created_at: createdAt } : {}),
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: 'id' }
      );

    if (upsertError) {
      setError(`Failed to save post: ${upsertError.message}`);
      return;
    }

    const postIdToUse = id;

    // Delete removed images from storage (editing flow can orphan files otherwise)
    const { data: currentImageRows, error: currentImagesError } = await supabaseUser
      .from('journal_post_images')
      .select('path')
      .eq('post_id', postIdToUse);

    if (!currentImagesError && currentImageRows) {
      const currentPaths = new Set((currentImageRows as Array<{ path: string }>).map((r) => r.path));
      const keepPaths = new Set(existingImagePaths);
      const removedPaths = Array.from(currentPaths).filter((p) => !keepPaths.has(p));

      if (removedPaths.length > 0) {
        const { error: removeError } = await supabaseUser.storage
          .from(JOURNAL_IMAGES_BUCKET)
          .remove(removedPaths);

        if (removeError) {
          console.error('Failed to delete removed images from storage:', removeError.message);
          // Continue anyway so post edits are not blocked
        }
      }
    }

    const { error: deleteImagesError } = await supabaseUser
      .from('journal_post_images')
      .delete()
      .eq('post_id', postIdToUse);

    if (deleteImagesError) {
      setError(`Failed to update post images: ${deleteImagesError.message}`);
      return;
    }

    const uploadedPaths: string[] = [];
    for (const img of newImages) {
      const path = `${postIdToUse}/${Date.now()}-${safeFileName(img.file.name)}`;
      const { error: uploadError } = await supabaseUser
        .storage
        .from(JOURNAL_IMAGES_BUCKET)
        .upload(path, img.file, { upsert: true });

      if (uploadError) {
        setError(`Failed to upload image: ${uploadError.message}`);
        return;
      }

      uploadedPaths.push(path);
    }

    const allPaths = [...existingImagePaths, ...uploadedPaths];
    if (allPaths.length > 0) {
      const { error: insertError } = await supabaseUser.from('journal_post_images').insert(
        allPaths.map((p, idx) => ({
          post_id: postIdToUse,
          path: p,
          sort_order: idx,
        })) as any
      );

      if (insertError) {
        setError(`Failed to save image references: ${insertError.message}`);
        return;
      }
    }

    await fetchPosts();
    resetForm();
  };

  const removePost = async (id: string) => {
    setError('');

    const nextSession = update ? await update() : session;
    const accessToken = (nextSession as any)?.supabaseAccessToken as string | undefined;
    if (!accessToken) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    const supabaseUser = createSupabaseUserClient(accessToken);

    // First, fetch all image paths for this post
    const { data: imageData, error: fetchError } = await supabaseUser
      .from('journal_post_images')
      .select('path')
      .eq('post_id', id);

    if (!fetchError && imageData && imageData.length > 0) {
      // Delete images from storage bucket
      const paths = imageData.map((r: { path: string }) => r.path);
      const { error: storageError } = await supabaseUser
        .storage
        .from(JOURNAL_IMAGES_BUCKET)
        .remove(paths);

      if (storageError) {
        console.error('Failed to delete images from storage:', storageError.message);
        // Continue anyway to delete the post
      }
    }

    // Delete the post (cascade will delete journal_post_images rows)
    const { error: deleteError } = await supabaseUser.from('journal_posts').delete().eq('id', id);
    if (deleteError) {
      setError(`Failed to delete post: ${deleteError.message}`);
      return;
    }

    await fetchPosts();
    if (editingId === id) resetForm();
  };

  const onAttachImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');

    const next: NewImage[] = Array.from(files).map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));

    setNewImages((prev) => [...prev, ...next]);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white">
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
          <div className="text-sm font-semibold text-slate-500">Loading…</div>
        </section>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
          <div className="text-sm font-semibold text-slate-500">Not signed in.</div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16 overflow-x-hidden">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Admin</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Create, edit, and delete Journal posts.
            </p>
          </div>

          <button
            type="button"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
          >
            Sign out
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit post: ${editingId}` : 'Create post'}
              </h2>

              {editingId ? (
                <button
                  type="button"
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {error ? <div className="mt-3 text-sm font-semibold text-red-600">{error}</div> : null}

            <div className="mt-5 grid grid-cols-1 gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Gradient</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, gradient: 'purple' }))}
                    className={`flex-1 h-11 rounded-xl border-2 px-4 text-sm font-bold transition-all ${
                      form.gradient === 'purple'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="bg-gradient-to-r from-[#984CD3] via-[#522BC9] to-[#411563] bg-clip-text text-transparent">
                      Purple
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, gradient: 'blue' }))}
                    className={`flex-1 h-11 rounded-xl border-2 px-4 text-sm font-bold transition-all ${
                      form.gradient === 'blue'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="bg-gradient-to-br from-[#4873FF] via-[#1629A6] to-[#142699] bg-clip-text text-transparent">
                      Blue
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, gradient: 'green' }))}
                    className={`flex-1 h-11 rounded-xl border-2 px-4 text-sm font-bold transition-all ${
                      form.gradient === 'green'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D] bg-clip-text text-transparent">
                      Green
                    </span>
                  </button>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Category</span>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. For Companies"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Title</span>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Post title"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Subtitle</span>
                <input
                  className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="e.g. The perseverance of Technician"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Body</span>
                <textarea
                  className="min-h-[140px] resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                  value={form.body}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Write the post..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Attach images</span>
                <input
                  className="block w-full text-sm font-semibold text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onAttachImages(e.target.files)}
                />
              </label>

              {existingImagePaths.length > 0 || newImages.length > 0 ? (
                <div className="grid gap-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Attached ({existingImagePaths.length + newImages.length})
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {existingImagePaths.map((path, idx) => {
                      const supabase = createSupabaseAnonClient();
                      const src = supabase.storage.from(JOURNAL_IMAGES_BUCKET).getPublicUrl(path).data
                        .publicUrl;
                      return (
                        <div key={`existing-${idx}-${path}`} className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                          <img src={src} alt="" className="h-24 w-full object-cover" draggable={false} />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs font-bold text-white"
                            onClick={() => setExistingImagePaths((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {newImages.map((img, idx) => (
                      <div key={`new-${idx}-${img.previewUrl}`} className="relative overflow-hidden rounded-xl ring-1 ring-slate-200">
                        <img src={img.previewUrl} alt="" className="h-24 w-full object-cover" draggable={false} />
                        <button
                          type="button"
                          className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs font-bold text-white"
                          onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                className="mt-2 h-11 rounded-xl bg-gradient-to-r from-[#984CD3] via-[#522BC9] to-[#411563] to-[90%] text-sm font-bold tracking-tight text-white hover:opacity-95"
                onClick={upsertPost}
              >
                {editingId ? 'Save changes' : 'Create post'}
              </button>
            </div>
          </div>

          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900">Posts</h2>

            <div className="mt-5 flex flex-col gap-4 min-w-0">
              {sortedPosts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-[0_10px_30px_rgba(2,6,23,0.08)] overflow-hidden"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                    <div className="min-w-0 overflow-hidden" style={{ wordBreak: 'break-word' }}>
                      <div className={`text-xs font-bold uppercase tracking-wide bg-clip-text text-transparent ${
                        p.gradient === 'purple'
                          ? 'bg-gradient-to-r from-[#984CD3] via-[#522BC9] to-[#411563]'
                          : p.gradient === 'green'
                          ? 'bg-gradient-to-br from-[#3CB244] via-[#2A611C] to-[#142E0D]'
                          : 'bg-gradient-to-br from-[#4873FF] via-[#1629A6] to-[#142699]'
                      }`}>
                        {p.gradient}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-700">{p.category}</div>
                      <div className="mt-1 text-base font-bold text-slate-900" style={{ wordBreak: 'break-all' }}>
                        {p.title}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 line-clamp-3" style={{ wordBreak: 'break-all' }}>
                        {p.body}
                      </p>
                      <div className="mt-2 text-xs font-semibold text-slate-400">{p.media.length} images</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                        onClick={() => removePost(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {sortedPosts.length === 0 ? (
                <div className="text-sm font-semibold text-slate-500">No posts yet.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Services</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Assign pills per service (Available/Unavailable/Remote/On-site).</p>
            </div>
            <button
              type="button"
              className="h-10 rounded-xl bg-gradient-to-b from-[#2767BC] to-[#142699] px-4 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
              onClick={saveServices}
              disabled={savingServices}
            >
              {savingServices ? 'Saving…' : 'Save services'}
            </button>
          </div>

          {servicesError ? <div className="mt-3 text-sm font-semibold text-red-600">{servicesError}</div> : null}

          {/* Create new service form */}
          <details className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 p-4" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-slate-700">Create New Service</h3>
                <span className="text-xs font-semibold text-slate-500">Click to {''}</span>
              </div>
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Title *</span>
                  <input
                    type="text"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                    value={newService.title ?? ''}
                    onChange={(e) => setNewService((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Service title"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Description *</span>
                  <input
                    type="text"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                    value={newService.description ?? ''}
                    onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Short description"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(() => {
                  const pills = new Set<ServicePillStatus>((newService.pill_statuses ?? []) as ServicePillStatus[]);
                  return (
                    <>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={pills.has('available')}
                          onChange={() =>
                            setNewService((p) => ({
                              ...p,
                              pill_statuses: togglePillInSet((p.pill_statuses ?? []) as any, 'available'),
                            }))
                          }
                        />
                        Available
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={pills.has('unavailable')}
                          onChange={() =>
                            setNewService((p) => ({
                              ...p,
                              pill_statuses: togglePillInSet((p.pill_statuses ?? []) as any, 'unavailable'),
                            }))
                          }
                        />
                        Unavailable
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={pills.has('remote')}
                          onChange={() =>
                            setNewService((p) => ({
                              ...p,
                              pill_statuses: togglePillInSet((p.pill_statuses ?? []) as any, 'remote'),
                            }))
                          }
                        />
                        Remote
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={pills.has('on_site')}
                          onChange={() =>
                            setNewService((p) => ({
                              ...p,
                              pill_statuses: togglePillInSet((p.pill_statuses ?? []) as any, 'on_site'),
                            }))
                          }
                        />
                        On-site
                      </label>
                    </>
                  );
                })()}
              </div>
              <label className="grid gap-1">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Details</span>
                <textarea
                  className="min-h-[60px] resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                  value={newService.details ?? ''}
                  onChange={(e) => setNewService((p) => ({ ...p, details: e.target.value }))}
                  placeholder="Detailed description for modal"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Icon</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm font-semibold text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                    onChange={(e) => handleNewServiceImageUpload(e.target.files, 'icon')}
                  />
                  {newService.icon_src ? (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newService.icon_src}
                        alt="Icon preview"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-slate-50"
                      />
                      <span className="text-xs text-slate-500 truncate flex-1">{newService.icon_src.split('/').pop()}</span>
                    </div>
                  ) : null}
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Modal Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm font-semibold text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                    onChange={(e) => handleNewServiceImageUpload(e.target.files, 'modal')}
                  />
                  {newService.modal_image_src ? (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newService.modal_image_src}
                        alt="Modal image preview"
                        className="h-12 w-16 rounded-lg border border-slate-200 object-cover bg-slate-50"
                      />
                      <span className="text-xs text-slate-500 truncate flex-1">{newService.modal_image_src.split('/').pop()}</span>
                    </div>
                  ) : null}
                </label>
              </div>
              <button
                type="button"
                className="h-10 rounded-xl bg-gradient-to-b from-[#2767BC] to-[#142699] text-sm font-bold tracking-tight text-white hover:opacity-95"
                onClick={addNewService}
              >
                Add Service
              </button>
            </div>
          </details>

          <div className="mt-5 grid grid-cols-1 gap-4">
            {services.map((s) => {
              const pills = new Set<ServicePillStatus>((s.pill_statuses ?? []) as ServicePillStatus[]);
              return (
                <details key={s.id} className="rounded-2xl border border-slate-200 p-4 overflow-hidden">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{s.title}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-500 truncate">{s.id}</div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                        onClick={(e) => {
                          e.preventDefault();
                          deleteService(s.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </summary>

                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="grid grid-cols-1 gap-3">
                      <label className="grid gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Title</span>
                        <input
                          type="text"
                          className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                          value={s.title}
                          onChange={(e) => updateServiceField(s.id, 'title', e.target.value)}
                        />
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</span>
                        <input
                          type="text"
                          className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                          value={s.description}
                          onChange={(e) => updateServiceField(s.id, 'description', e.target.value)}
                        />
                      </label>

                      <label className="grid gap-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Details</span>
                        <textarea
                          className="min-h-[80px] resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-slate-400"
                          value={s.details ?? ''}
                          onChange={(e) => updateServiceField(s.id, 'details', e.target.value)}
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={pills.has('available')}
                            onChange={() => toggleServicePill(s.id, 'available')}
                          />
                          Available
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={pills.has('unavailable')}
                            onChange={() => toggleServicePill(s.id, 'unavailable')}
                          />
                          Unavailable
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={pills.has('remote')}
                            onChange={() => toggleServicePill(s.id, 'remote')}
                          />
                          Remote
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={pills.has('on_site')}
                            onChange={() => toggleServicePill(s.id, 'on_site')}
                          />
                          On-site
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Icon</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm font-semibold text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                            onChange={(e) => handleServiceImageUpload(s.id, e.target.files, 'icon')}
                          />
                          {s.icon_src ? (
                            <div className="mt-2 flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={s.icon_src}
                                alt="Icon preview"
                                className="h-12 w-12 rounded-lg border border-slate-200 object-contain bg-slate-50"
                              />
                              <span className="text-xs text-slate-500 truncate flex-1">{s.icon_src.split('/').pop()}</span>
                            </div>
                          ) : null}
                        </label>

                        <label className="grid gap-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Modal Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm font-semibold text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                            onChange={(e) => handleServiceImageUpload(s.id, e.target.files, 'modal')}
                          />
                          {s.modal_image_src ? (
                            <div className="mt-2 flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={s.modal_image_src}
                                alt="Modal image preview"
                                className="h-12 w-16 rounded-lg border border-slate-200 object-cover bg-slate-50"
                              />
                              <span className="text-xs text-slate-500 truncate flex-1">{s.modal_image_src.split('/').pop()}</span>
                            </div>
                          ) : null}
                        </label>
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}

            {services.length === 0 ? (
              <div className="text-sm font-semibold text-slate-500">No services found.</div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
