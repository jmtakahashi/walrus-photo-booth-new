import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';

export default async function TermsOfUse() {
  const filePath = path.join(process.cwd(), 'content', 'terms-of-use.md');
  const content = await fs.promises.readFile(filePath, 'utf8');

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Terms Of Use</h1>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
