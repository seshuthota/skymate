import './globals.css';
import UserMenu from '@/components/UserMenu';
import ChatWidget from '@/components/ChatWidget';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase()
  const model = provider === 'openai'
    ? (process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini')
    : (process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'llama3.2')
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
          <div className="container flex items-center justify-between gap-4 py-3">
            <a href="/" className="flex items-center gap-2 font-bold">
              <span className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-cyan-400 shadow" />
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-lg text-transparent">SkyMate</span>
            </a>
            <nav className="flex items-center gap-2">
              <UserMenu />
            </nav>
          </div>
        </header>
        <div className="container py-8 md:py-10">{children}</div>
        <ChatWidget provider={provider} model={model} />
      </body>
    </html>
  );
}
