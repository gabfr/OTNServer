

function Adler() {
    this.adler32Mod = 65521;
    this.adlerNmax = 5552;
    
    this.checksum = function(buffer, adler) {
        if (typeof buffer != "string") {
            throw new Error("adler32 received a buffer that is not a string");
        }

        var s1 = adler === undefined ? 1 : (adler &  0xFFFF);      // Sum of all bytes
        var s2 = adler === undefined ? 0 : (adler >> 16) & 0xFFFF; // Sum of all s1 values
        var length = buffer.length;
        var n, i = 0;

        while (length > 0) {
            n = Math.min(length, this.adlerNmax);
            length -= n;
            for (; n >= 16; n -= 16) {
                // s2 += (s1 += buffer.charCodeAt(i++)); // Maybe this one is slightly better? Need to test.
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
                s1 += buffer.charCodeAt(i++); s2 += s1;
            }
            while (n > 0) {
                s1 += buffer.charCodeAt(i++); s2 += s1;
                n--;
            }
            s1 %= this.adler32Mod;
            s2 %= this.adler32Mod;
        }

        return (s2 << 16) | s1; // or: (s2 * 65536) + s1
    };
}

module.exports = Adler;