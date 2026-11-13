/**
 * Servicio de Streaming Token-a-Token para IA (Gemini / LLMs)
 * Permite recibir y renderizar la respuesta de la IA en tiempo real sin esperar al buffer completo
 */

export interface AIStreamChunk {
  token: string;
  accumulated: string;
  isComplete: boolean;
}

/**
 * Generador asíncrono que emite tokens en tiempo real a partir de un ReadableStream
 */
export async function* streamAiTokens(
  apiEndpoint: string,
  payload: Record<string, any>,
  signal?: AbortSignal
): AsyncGenerator<AIStreamChunk, void, unknown> {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, text/plain',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Error en el stream de IA (${response.status}): ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('El navegador o la respuesta no soportan ReadableStream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulated = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      // Soporte para chunks planos o Server-Sent Events (data: ...)
      const lines = chunkText.split('\n');

      for (const line of lines) {
        let token = line;
        if (line.startsWith('data: ')) {
          token = line.slice(6);
        }

        if (token === '[DONE]') {
          yield { token: '', accumulated, isComplete: true };
          return;
        }

        if (token) {
          accumulated += token;
          yield {
            token,
            accumulated,
            isComplete: false,
          };
        }
      }
    }

    yield { token: '', accumulated, isComplete: true };
  } finally {
    reader.releaseLock();
  }
}
