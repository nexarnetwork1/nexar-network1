import { readFileSync } from 'fs';
import { join } from 'path';
import ReactMarkdown from 'react-markdown';
import { Container } from "@/components/ui/Container";

export default function ApiDocumentationPage() {
  const content = readFileSync(join(process.cwd(), 'docs/API_DOCUMENTATION.md'), 'utf-8');

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-12">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            API Documentation
          </h1>
          <p className="mt-3 text-lg text-muted">
            Complete API reference for integrating with Nexar Network
          </p>
        </div>

        <div className="luxury-border rounded-3xl bg-card/40 p-8 backdrop-blur-xl prose prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </Container>
  );
}