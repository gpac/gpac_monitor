export class MessageFormatter {
  static formatForSend(message: string): string {
    return message.startsWith('json:') ? message : `json:${message}`;
  }

  static parseReceived(data: string): any {
    if (data.startsWith('json:')) {
      return JSON.parse(data.substring(5));
    }
    if (data.startsWith('{')) {
      return JSON.parse(data);
    }
    return data;
  }

  static createDataView(data: any): DataView {
    const textEncoder = new TextEncoder();
    const encoded = textEncoder.encode(JSON.stringify(data));
    return new DataView(encoded.buffer);
  }

  static decodeDataView(dataView: DataView): string {
    return new TextDecoder().decode(dataView.buffer);
  }
}
