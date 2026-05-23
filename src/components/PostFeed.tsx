import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Trash2, ImagePlus, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { initials, uploadFile } from "@/lib/uploads";
import { useToast } from "@/hooks/use-toast";

type Author = { id: string; username: string; full_name: string; avatar_url: string | null; role: string; sport: string | null };
export type FeedPost = {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  author: Author;
  likes: number;
  liked_by_me: boolean;
  comments_count: number;
};

export default function PostFeed({ userId }: { userId?: string }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState("");
  const [composerImg, setComposerImg] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase
      .from("posts")
      .select("id, content, image_url, created_at, user_id, profiles!posts_user_id_fkey(id, username, full_name, avatar_url, role, sport)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (userId) q = q.eq("user_id", userId);
    const { data, error } = await q;
    if (error) { toast({ title: "Couldn't load feed", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const ids = (data ?? []).map((p: any) => p.id);

    const [likesRes, commentsRes, myLikesRes] = await Promise.all([
      ids.length ? supabase.from("post_likes").select("post_id").in("post_id", ids) : { data: [] as any[] },
      ids.length ? supabase.from("post_comments").select("post_id").in("post_id", ids) : { data: [] as any[] },
      ids.length && user ? supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", user.id) : { data: [] as any[] },
    ]);

    const likeCount = new Map<string, number>();
    (likesRes.data ?? []).forEach((l: any) => likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1));
    const commentCount = new Map<string, number>();
    (commentsRes.data ?? []).forEach((c: any) => commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1));
    const myLikes = new Set((myLikesRes.data ?? []).map((l: any) => l.post_id));

    setPosts((data ?? []).map((p: any) => ({
      id: p.id, content: p.content, image_url: p.image_url, created_at: p.created_at, user_id: p.user_id,
      author: p.profiles, likes: likeCount.get(p.id) ?? 0, comments_count: commentCount.get(p.id) ?? 0,
      liked_by_me: myLikes.has(p.id),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); /* eslint-disable-next-line */ }, [userId, user?.id]);

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !composer.trim()) return;
    setPosting(true);
    try {
      let image_url: string | null = null;
      if (composerImg) image_url = await uploadFile("posts", user.id, composerImg);
      const { error } = await supabase.from("posts").insert({ user_id: user.id, content: composer.trim(), image_url });
      if (error) throw error;
      setComposer(""); setComposerImg(null);
      await fetchPosts();
      toast({ title: "Posted!" });
    } catch (err: any) {
      toast({ title: "Failed to post", description: err.message, variant: "destructive" });
    } finally { setPosting(false); }
  };

  const toggleLike = async (p: FeedPost) => {
    if (!user) return;
    if (p.liked_by_me) {
      setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, liked_by_me: false, likes: x.likes - 1 } : x));
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", user.id);
    } else {
      setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, liked_by_me: true, likes: x.likes + 1 } : x));
      await supabase.from("post_likes").insert({ post_id: p.id, user_id: user.id });
    }
  };

  const deletePost = async (p: FeedPost) => {
    if (!confirm("Delete this post?")) return;
    setPosts((ps) => ps.filter((x) => x.id !== p.id));
    await supabase.from("posts").delete().eq("id", p.id);
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      {profile && !userId && (
        <Card className="p-4 shadow-sm">
          <form onSubmit={submitPost} className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <Textarea
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder={`Share an achievement, ${profile.full_name.split(" ")[0]}…`}
                className="border-0 bg-muted/50 resize-none min-h-[44px] focus-visible:ring-2 focus-visible:ring-accent"
              />
              {composerImg && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(composerImg)} alt="" className="h-32 rounded-lg object-cover" />
                  <button type="button" onClick={() => setComposerImg(null)} className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Add photo
                </Button>
                <Input
                  ref={fileInput} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setComposerImg(e.target.files?.[0] ?? null)}
                />
                <Button type="submit" variant="accent" size="sm" disabled={!composer.trim() || posting}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading feed…</Card>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <p className="font-display text-lg">Nothing here yet</p>
          <p className="text-sm mt-1">Be the first to post — share a win, training session, or upcoming event.</p>
        </Card>
      ) : (
        <AnimatePresence initial={false}>
          {posts.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PostCard post={p} onLike={() => toggleLike(p)} onDelete={() => deletePost(p)} canDelete={user?.id === p.user_id} />
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}

function PostCard({ post, onLike, onDelete, canDelete }: { post: FeedPost; onLike: () => void; onDelete: () => void; canDelete: boolean; }) {
  const [showComments, setShowComments] = useState(false);
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-3">
        <Link to={`/u/${post.author.username}`}>
          <Avatar className="h-11 w-11">
            <AvatarImage src={post.author.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(post.author.full_name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/u/${post.author.username}`} className="font-semibold hover:text-accent">{post.author.full_name}</Link>
          <p className="text-xs text-muted-foreground">
            @{post.author.username} {post.author.sport ? `· ${post.author.sport}` : ""} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete post">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="px-4 pb-3 whitespace-pre-wrap text-[15px] leading-relaxed">{post.content}</div>
      {post.image_url && <img src={post.image_url} alt="" className="w-full max-h-[560px] object-cover" loading="lazy" />}
      <div className="px-4 py-2 border-t border-border flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onLike} className={post.liked_by_me ? "text-accent" : ""}>
          <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} /> {post.likes}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((s) => !s)}>
          <MessageCircle className="h-4 w-4" /> {post.comments_count}
        </Button>
      </div>
      {showComments && <Comments postId={post.id} />}
    </Card>
  );
}

function Comments({ postId }: { postId: string }) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const load = async () => {
    const { data } = await supabase.from("post_comments")
      .select("id, content, created_at, user_id, profiles!post_comments_user_id_fkey(username, full_name, avatar_url)")
      .eq("post_id", postId).order("created_at", { ascending: true });
    setItems(data ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [postId]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, content: text.trim() });
    setText(""); load();
  };
  return (
    <div className="border-t border-border bg-muted/30 p-4 space-y-3">
      {items.map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar className="h-8 w-8"><AvatarImage src={c.profiles?.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(c.profiles?.full_name)}</AvatarFallback></Avatar>
          <div className="bg-card rounded-xl px-3 py-2 text-sm flex-1">
            <Link to={`/u/${c.profiles?.username}`} className="font-semibold hover:text-accent">{c.profiles?.full_name}</Link>
            <p>{c.content}</p>
          </div>
        </div>
      ))}
      {profile && (
        <form onSubmit={submit} className="flex gap-2">
          <Avatar className="h-8 w-8"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback className="text-[10px]">{initials(profile.full_name)}</AvatarFallback></Avatar>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment…" className="bg-card" />
          <Button type="submit" size="sm" variant="accent" disabled={!text.trim()}>Send</Button>
        </form>
      )}
    </div>
  );
}
