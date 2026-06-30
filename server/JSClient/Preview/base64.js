const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Encodes an ArrayBuffer to a Base64 string 
export function base64ArrayBuffer(arrayBuffer) {
    let base64 = '';

    const bytes         = new Uint8Array(arrayBuffer);
    const byteLength    = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength    = byteLength - byteRemainder;

    let a, b, c, d, chunk;

    for (let i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        a = (chunk & 16515072) >> 18;
        b = (chunk & 258048)   >> 12;
        c = (chunk & 4032)     >>  6;
        d = chunk & 63;

        base64 += BASE64_ALPHABET[a] + BASE64_ALPHABET[b] + BASE64_ALPHABET[c] + BASE64_ALPHABET[d];
    }

    if (byteRemainder === 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2;
        b = (chunk & 3)   << 4;
        base64 += BASE64_ALPHABET[a] + BASE64_ALPHABET[b] + '==';
    } else if (byteRemainder === 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10;
        b = (chunk & 1008)  >>  4;
        c = (chunk & 15)    <<  2;
        base64 += BASE64_ALPHABET[a] + BASE64_ALPHABET[b] + BASE64_ALPHABET[c] + '=';
    }

    return base64;
}

// Merges an array of Uint8Array chunks into a single contiguous buffer.
export function concatUint8Arrays(chunks) {
    let totalLength = 0;
    for (const chunk of chunks) totalLength += chunk.byteLength;
    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
    return merged;
}
