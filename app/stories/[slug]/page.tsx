import { notFound } from 'next/navigation';
import { getStory } from '../catalog';
import StoryPageClient from '../StoryPageClient';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) notFound();
  return <StoryPageClient story={story} />;
}
