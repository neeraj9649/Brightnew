import React, { useRef, useState } from 'react';
import { Check, ExternalLink, MessageSquare, Newspaper, Pencil, Plus, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { fileUrl, uploadProfileImage, validateFile } from '../../services/storage';
import { Badge, Card, Empty, ErrorState, Field, Input, Modal, ModalHead, Skeleton, Tabs, TextArea, fmtDate, fmtDateTime, useAsync } from '../ui';
import StaffShell from './StaffShell';

// Posts appear on the public website's Blog page; this links an admin straight to one.
const WEBSITE = 'https://brightwingstravel.com';
const postLink = (slug) => `${WEBSITE}/blog-details/?slug=${encodeURIComponent(slug)}`;

/** Admin: write website blog posts and approve visitors' comments. */
export default function Blog() {
  const [tab, setTab] = useState('posts');
  const posts = useAsync(() => api.get('/admin/blog/posts'), []);
  const pending = (posts.data || []).reduce((n, p) => n + Number(p.pending_comments || 0), 0);
  const [edit, setEdit] = useState(undefined); // undefined = closed, null = new, object = editing

  const toggle = async (p) => {
    try { await api.put(`/admin/blog/posts/${p.id}`, { ...p, is_published: !p.is_published }); posts.reload(); } catch (e) { toast.error(e.message || 'Could not update'); }
  };

  return (
    <StaffShell active="blog" title="Blog" sub="Posts you publish here appear on the website's Blog page. Visitors' comments show only after you approve them."
      actions={tab === 'posts' && <button type="button" className="pt-btn" onClick={() => setEdit(null)}><Plus size={17} /> New post</button>}>
      <div style={{ marginBottom: 18 }}>
        <Tabs value={tab} onChange={setTab} tabs={[['posts', 'Posts'], ['comments', pending ? `Comments (${pending} waiting)` : 'Comments']]} />
      </div>
      {tab === 'posts' ? (
        posts.loading && !posts.data ? <Skeleton h={220} /> : posts.error ? <ErrorState onRetry={posts.reload} /> : !posts.data.length ? (
          <Card><Empty icon={Newspaper} title="No posts yet" action={<button type="button" className="pt-btn" onClick={() => setEdit(null)}>Write the first post</button>}>Travel tips, destination guides and news for the website.</Empty></Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
            {posts.data.map((p) => (
              <Card key={p.id} pad={false}>
                <div style={{ height: 150, background: `center / cover url(${p.cover_image})`, borderRadius: '16px 16px 0 0', position: 'relative' }}>
                  <span style={{ position: 'absolute', right: 12, top: 12 }}><Badge tone={p.is_published ? 'green' : ''}>{p.is_published ? 'Published' : 'Hidden'}</Badge></span>
                </div>
                <div style={{ padding: 16 }}>
                  <strong style={{ fontSize: 16, color: 'var(--pt-navy)' }}>{p.title}</strong>
                  <div className="pt-tiny" style={{ marginTop: 6 }}>{fmtDate(p.published_on)}{Number(p.pending_comments) ? <> · <b>{p.pending_comments} comment{Number(p.pending_comments) > 1 ? 's' : ''} waiting</b></> : null}</div>
                  <div className="pt-row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="pt-btn ghost sm" onClick={() => setEdit(p)}><Pencil size={14} /> Edit</button>
                    <button type="button" className="pt-btn ghost sm" onClick={() => toggle(p)}>{p.is_published ? 'Hide' : 'Publish'}</button>
                    {p.is_published && <a className="pt-btn ghost sm" href={postLink(p.slug)} target="_blank" rel="noreferrer"><ExternalLink size={14} /> View</a>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : <Comments onChange={posts.reload} />}
      {edit !== undefined && <PostDrawer post={edit} onClose={() => setEdit(undefined)} onSaved={() => { setEdit(undefined); posts.reload(); }} />}
    </StaffShell>
  );
}

function Comments({ onChange }) {
  const [status, setStatus] = useState('pending');
  const { data, loading, error, reload } = useAsync(() => api.get(`/admin/blog/comments?status=${status}`), [status]);
  const review = async (c, next) => {
    try {
      await api.put(`/admin/blog/comments/${c.id}`, { status: next });
      toast.success(next === 'approved' ? 'Comment approved. It is now on the website.' : 'Comment rejected');
      reload(); onChange();
    } catch (e) { toast.error(e.message || 'Could not update'); }
  };
  return (
    <div className="pt-stack">
      <Tabs value={status} onChange={setStatus} tabs={[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']]} />
      {loading && !data ? <Skeleton h={160} /> : error ? <ErrorState onRetry={reload} /> : !data.length ? (
        <Card><Empty icon={MessageSquare} title={status === 'pending' ? 'No comments waiting' : `No ${status} comments`}>New comments from the website appear here for approval.</Empty></Card>
      ) : data.map((c) => (
        <Card key={c.id}>
          <div className="pt-row between top" style={{ gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ color: 'var(--pt-navy)' }}>{c.name}</strong> <span className="pt-tiny">{c.email}</span>
              <div className="pt-tiny" style={{ marginTop: 2 }}>On <a href={postLink(c.post_slug)} target="_blank" rel="noreferrer">{c.post_title}</a> · {fmtDateTime(c.created_at)}</div>
              <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{c.message}</p>
            </div>
            <div className="pt-row" style={{ gap: 8 }}>
              {c.status !== 'approved' && <button type="button" className="pt-btn sm" onClick={() => review(c, 'approved')}><Check size={15} /> Approve</button>}
              {c.status !== 'rejected' && <button type="button" className="pt-btn ghost sm" onClick={() => review(c, 'rejected')}><X size={15} /> Reject</button>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/** One image picker: uploads to the file store and keeps the public URL. */
export function ImagePick({ value, onChange, label }) {
  const ref = useRef(null);
  const [up, setUp] = useState(false);
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp(true);
    try { validateFile(file, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/jpg']); const { file_id: id } = await uploadProfileImage(file); onChange(fileUrl(id)); } catch (err) { toast.error(err.message || 'Upload failed'); } finally { setUp(false); e.target.value = ''; }
  };
  return (
    <div className="pt-row" style={{ gap: 12 }}>
      {value ? <img src={value} alt="" style={{ width: 110, height: 70, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ width: 110, height: 70, borderRadius: 10, background: 'linear-gradient(135deg, #10283f, #c9963e)' }} />}
      <div className="pt-row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <input ref={ref} type="file" hidden accept="image/png,image/jpeg" onChange={upload} />
        <button type="button" className="pt-btn soft sm" disabled={up} onClick={() => ref.current?.click()}><Upload size={15} /> {up ? 'Uploading…' : value ? `Change ${label}` : `Upload ${label}`}</button>
        {value && <button type="button" className="pt-btn ghost sm" onClick={() => onChange('')}>Remove</button>}
      </div>
    </div>
  );
}

function PostDrawer({ post, onClose, onSaved }) {
  const [f, setF] = useState({
    title: post?.title || '', published_on: post?.published_on || new Date().toISOString().slice(0, 10), cover_image: post?.cover_image || '',
    content: post?.content || '', inner_1: post?.inner_images?.[0] || '', inner_2: post?.inner_images?.[1] || '',
    inner_text: post?.inner_text || '', quote: post?.quote || '', closing_text: post?.closing_text || '',
    tags: (post?.tags || []).join(', '), is_published: post ? post.is_published : true,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF((old) => ({ ...old, [k]: v })); setErrors((old) => ({ ...old, [k]: undefined })); };

  const save = async () => {
    const next = {};
    if (!f.title.trim()) next.title = 'Give the post a title';
    if (!f.cover_image) next.cover_image = 'Upload a cover image';
    if (!f.content.trim()) next.content = 'Write the opening text';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const body = {
      title: f.title.trim(), published_on: f.published_on || null, cover_image: f.cover_image, content: f.content,
      inner_images: [f.inner_1, f.inner_2].filter(Boolean), inner_text: f.inner_text, quote: f.quote, closing_text: f.closing_text,
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean), is_published: f.is_published,
    };
    try {
      if (post) await api.put(`/admin/blog/posts/${post.id}`, body); else await api.post('/admin/blog/posts', body);
      toast.success(post ? 'Post updated' : f.is_published ? 'Post published' : 'Post saved as hidden');
      onSaved();
    } catch (err) { toast.error(err.message || 'Could not save'); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} side label="Blog post">
      <ModalHead title={post ? 'Edit post' : 'New post'} sub="Laid out like the website's blog page, top to bottom." onClose={onClose} />
      <div className="pt-stack">
        <Field label="Title *" error={errors.title}><Input value={f.title} onChange={(e) => set('title', e.target.value)} maxLength={200} placeholder="7 things to do in Dubai" error={errors.title} /></Field>
        <Field label="Date" hint="Shown on the post. The newest date is listed first."><Input type="date" value={f.published_on} onChange={(e) => set('published_on', e.target.value)} /></Field>
        <Field label="Cover image *" error={errors.cover_image}><ImagePick value={f.cover_image} onChange={(v) => set('cover_image', v)} label="cover" /></Field>
        <Field label="Opening text *" error={errors.content} hint="Leave an empty line between paragraphs."><TextArea value={f.content} onChange={(e) => set('content', e.target.value)} rows={7} max={20000} error={errors.content} /></Field>
        <Field label="Two inner images" optional hint="Shown side by side under the opening text.">
          <div className="pt-stack"><ImagePick value={f.inner_1} onChange={(v) => set('inner_1', v)} label="image 1" /><ImagePick value={f.inner_2} onChange={(v) => set('inner_2', v)} label="image 2" /></div>
        </Field>
        <Field label="Text before the quote" optional><TextArea value={f.inner_text} onChange={(e) => set('inner_text', e.target.value)} rows={4} max={20000} /></Field>
        <Field label="Quote" optional hint="Shown highlighted."><TextArea value={f.quote} onChange={(e) => set('quote', e.target.value)} rows={3} max={20000} /></Field>
        <Field label="Closing text" optional><TextArea value={f.closing_text} onChange={(e) => set('closing_text', e.target.value)} rows={4} max={20000} /></Field>
        <Field label="Tags" optional hint="Separate with commas, e.g. Dubai, Family, Visa"><Input value={f.tags} onChange={(e) => set('tags', e.target.value)} /></Field>
        <label className="pt-check"><input type="checkbox" checked={f.is_published} onChange={(e) => set('is_published', e.target.checked)} /><span className="box">{f.is_published ? '✓' : ''}</span><span>Published — visible on the website</span></label>
        <div className="pt-grid2"><button type="button" className="pt-btn ghost" onClick={onClose}>Cancel</button><button type="button" className="pt-btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : post ? 'Save changes' : 'Publish post'}</button></div>
      </div>
    </Modal>
  );
}
