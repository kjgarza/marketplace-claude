import { Button } from '@monorepo/ui';
import { Message } from '@monorepo/ai-elements';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Your Monorepo
        </h1>
        <p className="text-center text-muted-foreground">
          Built with Next.js 15, React 19, shadcn/ui, and Tailwind CSS 4
        </p>

        <div className="flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>

        <div className="space-y-4 pt-8">
          <h2 className="text-xl font-semibold">AI Elements Demo</h2>
          <Message role="assistant" content="Hello! I'm an AI assistant ready to help you build amazing applications." />
          <Message role="user" content="Show me how to use the shared components!" />
        </div>
      </div>
    </main>
  );
}
