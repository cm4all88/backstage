import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AgeGate from "./AgeGate";
import SubscribeButton from "./SubscribeButton";

type Props = { params: Promise<{ creator: string }> };

async function fetchProfile(handle: string) {
  const supabase = await createClient();

  const { data: profile } = await (supabase as any)
    .from("creator_profiles")
    .select("*")
    .eq("kind", "backstage")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) return null;

  const { data: posts } = await (supabase as any)
    .from("posts")
    .select("*")
    .eq("creator_profile_id", profile.id)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(30);

  // Check if viewer is subscribed
  const { data: { user } } = await supabase.auth.getUser();
  let isSubscribed = false;
  if (user) {
    const { data: sub } = await (supabase as any)
      .from("subscriptions")
      .select("id")
      .eq("fan_user_id", user.id)
      .eq("creator_profile_id", profile.id)
      .eq("status", "active")
      .maybeSingle();
    isSubscribed = !!sub;
  }

  // Spotlight handle for cross-link (if linked)
  let spotlightHandle: string | null = null;
  if (profile.linked) {
    const { data: spotlight } = await (supabase as any)
      .from("creator_profiles")
      .select("handle")
      .eq("user_id", profile.user_id)
      .eq("kind", "spotlight")
      .maybeSingle();
    if (spotlight) spotlightHandle = spotlight.handle;
  }

  return { profile, posts: posts ?? [], isSubscribed, spotlightHandle };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { creator } = await params;
  const data = await fetchProfile(creator);
  if (!data) return { title: "Not found · Backstagely" };
  const name = data.profile.display_name ?? data.profile.handle;
  return {
    title: `${name} · Backstagely`,
    description: `Exclusive content from ${name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function BackstageCreatorPage({ params }: Props) {
  const { creator } = await params;
  const data = await fetchProfile(creator);
  if (!data) notFound();

  const { profile, posts, isSubscribed, spotlightHandle } = data;
  const displayName = profile.display_name ?? profile.handle;

  return (
    <AgeGate>
      <main className="bcp">
        {/* Header */}
        <header className="bcp-header">
          {profile.cover_url && (
            <div className="bcp-cover">
              <img src={profile.cover_url} alt="" className="bcp-cover-img" />
              <div className="bcp-cover-fade" aria-hidden />
            </div>
          )}
          <div className="bcp-header-inner">
            <div className="bcp-avatar-wrap">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="bcp-avatar" />
              ) : (
                <div className="bcp-avatar bcp-avatar-fallback">
                  {String(displayName).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="bcp-identity">
              <h1 className="bcp-name">{displayName}</h1>
              <p className="bcp-handle">@{profile.handle}</p>
              {profile.bio && <p className="bcp-bio">{profile.bio}</p>}
              {spotlightHandle && (
                <a
                  href={`https://spotlightly.app/${spotlightHandle}`}
                  className="bcp-spotlight-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>✦ Spotlight</span>
                  <span>Also on Spotlightly →</span>
                </a>
              )}
            </div>
            <div className="bcp-actions">
              <SubscribeButton
                creatorProfileId={profile.id}
                handle={profile.handle}
                price={profile.subscription_price}
                isSubscribed={isSubscribed}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="bcp-content">
          {posts.length === 0 ? (
            <div className="bcp-empty">
              <p className="bcp-empty-title">Nothing posted yet.</p>
              <p className="bcp-empty-text">Check back soon.</p>
            </div>
          ) : (
            <ul className="bcp-posts">
              {posts.map((p: any) => {
                const locked = p.tier === "premium" && !isSubscribed;
                return (
                  <li key={p.id} className={`bcp-post${locked ? " bcp-post--locked" : ""}`}>
                    {locked ? (
                      <div className="bcp-gate">
                        <span className="bcp-gate-icon">🔒</span>
                        <p className="bcp-gate-label">Subscribers only</p>
                        <p className="bcp-gate-desc">
                          Subscribe to {displayName} to unlock this post.
                        </p>
                        <SubscribeButton
                          creatorProfileId={profile.id}
                          handle={profile.handle}
                          price={profile.subscription_price}
                          isSubscribed={false}
                        />
                      </div>
                    ) : (
                      <>
                        {p.media_url && p.media_type === "image" && (
                          <img src={p.media_url} alt="" className="bcp-post-media" />
                        )}
                        {p.media_url && p.media_type === "video" && (
                          <video
                            src={p.media_url}
                            controls
                            className="bcp-post-media"
                            playsInline
                          />
                        )}
                        {p.caption && <p className="bcp-post-caption">{p.caption}</p>}
                        <div className="bcp-post-meta">
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                          {p.tier === "premium" && (
                            <span style={{ color: "var(--accent)" }}>✓ Subscriber</span>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 2257 Footer */}
        <footer className="bcp-footer">
          <a href="https://spotlightly.app/2257" className="bcp-footer-link">
            18 U.S.C. § 2257 Record-Keeping Statement
          </a>
          <span>·</span>
          <a href="https://spotlightly.app/terms" className="bcp-footer-link">Terms</a>
          <span>·</span>
          <a href="https://spotlightly.app/privacy" className="bcp-footer-link">Privacy</a>
          <span>·</span>
          <span style={{ color: "var(--muted)" }}>© Tahoma Systems LLC</span>
        </footer>

        <style>{`
          .bcp { min-height: 100vh; display: flex; flex-direction: column; }
          .bcp-cover { position: relative; height: clamp(200px, 28vw, 320px); overflow: hidden; }
          .bcp-cover-img { width: 100%; height: 100%; object-fit: cover; }
          .bcp-cover-fade { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, var(--bg) 100%); }
          .bcp-header { position: relative; }
          .bcp-header-inner {
            max-width: var(--container);
            margin: -80px auto 0;
            padding: 0 var(--s-6) var(--s-10);
            display: grid;
            grid-template-columns: auto 1fr auto;
            gap: var(--s-8);
            align-items: end;
            position: relative;
            z-index: 2;
          }
          .bcp-avatar {
            width: 128px; height: 128px;
            border-radius: 50%;
            border: 4px solid var(--bg);
            object-fit: cover;
            background: var(--surface-2);
          }
          .bcp-avatar-fallback {
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-serif);
            font-size: 48px;
            color: var(--accent);
          }
          .bcp-identity { padding-bottom: var(--s-3); min-width: 0; }
          .bcp-name {
            font-family: var(--font-serif);
            font-size: clamp(28px, 4vw, 40px);
            font-weight: 400;
            color: #fff;
            margin: 0;
            line-height: 1.05;
          }
          .bcp-handle { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin: var(--s-2) 0 0; }
          .bcp-bio { font-size: 14px; color: var(--text-soft); line-height: 1.7; margin: var(--s-3) 0 0; max-width: 520px; }
          .bcp-spotlight-link {
            display: inline-flex; align-items: center; gap: var(--s-3);
            margin-top: var(--s-4); padding: 8px 14px;
            background: rgba(240,180,41,0.06); border: 1px solid rgba(240,180,41,0.18);
            border-radius: var(--r-2); font-size: 12px;
          }
          .bcp-spotlight-link span:first-child { color: var(--gold); font-family: var(--font-mono); font-size: 10px; letter-spacing: .15em; }
          .bcp-spotlight-link span:last-child { color: var(--text-soft); }
          .bcp-actions { display: flex; gap: var(--s-2); padding-bottom: var(--s-3); }
          .bcp-content { max-width: var(--container); margin: 0 auto; padding: 0 var(--s-6) var(--s-16); flex: 1; }
          .bcp-posts { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 2px; }
          .bcp-post { background: var(--surface); border: 1px solid var(--border); padding: var(--s-6); }
          .bcp-post--locked { border-color: rgba(168,85,247,0.15); }
          .bcp-post-media { width: 100%; max-height: 700px; object-fit: cover; border-radius: var(--r-2); margin-bottom: var(--s-4); }
          .bcp-post-caption { font-size: 15px; line-height: 1.7; color: var(--text); margin: 0 0 var(--s-3); white-space: pre-wrap; }
          .bcp-post-meta { display: flex; gap: var(--s-4); font-family: var(--font-mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
          .bcp-gate { text-align: center; padding: var(--s-12) var(--s-6); display: flex; flex-direction: column; align-items: center; gap: var(--s-3); }
          .bcp-gate-icon { font-size: 28px; }
          .bcp-gate-label { font-family: var(--font-mono); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--accent); }
          .bcp-gate-desc { font-size: 13px; color: var(--text-soft); max-width: 320px; line-height: 1.65; margin: 0; }
          .bcp-empty { text-align: center; padding: var(--s-16) var(--s-6); }
          .bcp-empty-title { font-family: var(--font-serif); font-size: 22px; font-style: italic; font-weight: 300; color: rgba(255,255,255,0.4); margin-bottom: var(--s-2); }
          .bcp-empty-text { font-size: 13px; color: var(--muted); }
          .bcp-footer { max-width: var(--container); margin: 0 auto; padding: var(--s-8) var(--s-6); display: flex; align-items: center; gap: var(--s-4); font-size: 11px; color: var(--muted); flex-wrap: wrap; border-top: 1px solid var(--border); }
          .bcp-footer-link { color: var(--muted); transition: color var(--t-fast); }
          .bcp-footer-link:hover { color: var(--text); }
          @media (max-width: 640px) {
            .bcp-header-inner { grid-template-columns: 1fr; margin-top: -48px; gap: var(--s-4); }
            .bcp-avatar { width: 96px; height: 96px; }
            .bcp-actions { padding-bottom: 0; }
          }
        `}</style>
      </main>
    </AgeGate>
  );
}
