import * as std from 'std';

function ChunkStream(dir, prefix, maxSize) {
    this._dir = dir;
    this._prefix = prefix;
    this._maxSize = maxSize;
    this._file = null;
    this._index = 0;
    this._count = 0;
    this._startUs = null;
    this._lastUs = null;
    this._completed = [];

    this._path = function(index) {
        const padded = String(index).padStart(4, '0');
        return `${this._dir}/${this._prefix}_${padded}.jsonl`;
    };

    this._open = function() {
        if (this._file) {
            this._file.close();
            this._file = null;
        }
        const path = this._path(this._index);
        this._file = std.open(path, 'a');
        if (!this._file) {
            print(`[ChunkStream] Failed to open ${path}`);
        }
        this._count = 0;
        this._startUs = null;
    };

    this._rotate = function() {
        if (this._count < this._maxSize) return;
        const dirName = this._dir.split('/').pop();
        this._completed.push({
            file: `${dirName}/${this._prefix}_${String(this._index).padStart(4, '0')}.jsonl`,
            fromUs: this._startUs,
            toUs: this._lastUs,
            count: this._count,
        });
        this._index++;
        this._open();
    };

    this.write = function(jsonString, tsUs) {
        if (!this._file) return;
        this._rotate();
        if (this._startUs === null) this._startUs = tsUs;
        this._lastUs = tsUs;
        this._file.puts(jsonString + '\n');
        this._file.flush();
        this._count++;
    };

    this.getAllChunks = function() {
        const all = this._completed.slice();
        if (this._file && this._count > 0) {
            const dirName = this._dir.split('/').pop();
            all.push({
                file: `${dirName}/${this._prefix}_${String(this._index).padStart(4, '0')}.jsonl`,
                fromUs: this._startUs,
                toUs: this._lastUs,
                count: this._count,
            });
        }
        return all;
    };

    this.close = function() {
        if (this._file) {
            this._file.close();
            this._file = null;
        }
    };

    this._open();
}

export { ChunkStream };
