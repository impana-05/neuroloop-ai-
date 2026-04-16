export const contentProcessor = {
  async extractFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64 })
          });
          const data = await response.json();
          if (data.error) throw new Error(data.error);
          resolve(data.text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  chunkText(text: string, maxChunkSize: number = 2000): string[] {
    const chunks: string[] = [];
    let currentChunk = "";
    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + ". ";
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }
};
