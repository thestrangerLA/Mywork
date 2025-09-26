
import type { Metadata } from 'next';
import { getTourProgram, getAllTourProgramIds } from '@/services/tourProgramService';
import TourProgramClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';


// This tells Next.js to use static generation but allow for new pages
// to be generated on-demand if they are not pre-built.
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllTourProgramIds();
    return ids;
  } catch (error) {
    console.error("Failed to generate static params:", error);
    // Return a default or empty array to prevent build failure
    return [{ id: 'default' }];
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  // In a server environment, this will fetch real data.
  // In a static build, this might fail gracefully if Firebase isn't available.
  try {
    const program = await getTourProgram(params.id);
    if (!program) {
      return { title: 'Tour Program Not Found' };
    }
    return {
      title: `Tour: ${program.programName}`,
      description: `Details for tour program: ${program.programName}`,
    };
  } catch (error) {
    console.error("Failed to generate metadata:", error);
    return {
      title: 'Tour Program',
      description: 'Details for a tour program.',
    };
  }
}


export default async function TourProgramPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const { id } = params;
  
  // Fetch initial data on the server. The client component will re-fetch if needed.
  // This helps with initial page load performance and SEO.
  const program = await getTourProgram(id);

  if (!program) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Tour Program not found</h1>
        </div>
    );
  }

  return <TourProgramClientPage initialProgram={program} programId={id} />;
}

    
    