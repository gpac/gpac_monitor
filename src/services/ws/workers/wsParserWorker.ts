/**
 * WebSocket Parser Worker
 * Offloads heavy JSON parsing from Main Thread
 */

interface ParseRequest {
  id: number;
  data: ArrayBuffer | string;
}

interface ParseResponse {
  id: number;
  handlerKey: string;
  parsedData: unknown;
  error?: string;
}

self.onmessage = (event: MessageEvent<ParseRequest>) => {
  const { id, data } = event.data;

  try {
    let textData: string;

    // Decode ArrayBuffer to string
    if (data instanceof ArrayBuffer) {
      textData = new TextDecoder().decode(data);
    } else {
      textData = data;
    }

    // Handle JSON messages
    if (textData.startsWith('json:') || textData.startsWith('{')) {
      const jsonString = textData.startsWith('json:')
        ? textData.substring(5)
        : textData;
      const parsedData = JSON.parse(jsonString);
      const handlerKey = textData.startsWith('json:') ? 'json:' : 'json';

      const response: ParseResponse = { id, handlerKey, parsedData };
      self.postMessage(response);
      return;
    }

    // Legacy format - extract 4-char ID
    let handlerKey = '__default__';
    if (textData.length >= 4) {
      handlerKey = textData.substring(0, 4);
    }

    const response: ParseResponse = { id, handlerKey, parsedData: textData };
    self.postMessage(response);
  } catch (error) {
    const response: ParseResponse = {
      id,
      handlerKey: '__default__',
      parsedData: null,
      error: error instanceof Error ? error.message : 'Parse error',
    };
    self.postMessage(response);
  }
};
