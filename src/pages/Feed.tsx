import AppLayout from "@/components/AppLayout";
import PostFeed from "@/components/PostFeed";
import RightRail from "@/components/RightRail";

export default function FeedPage() {
  return (
    <AppLayout right={<RightRail />}>
      <PostFeed />
    </AppLayout>
  );
}
