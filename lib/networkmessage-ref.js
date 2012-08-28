/*
 * Different implementation of the Network Message library due to performance test purposes
 * 
 */

function TibiaSecurity() {
    this.XTEA_KEY = [];
    this.GenerateXTEAKey = function() {
        this.XTEA_KEY[0] = (((Math.random() * 10000000 << 16) | Math.random() * 10000000) & 0xFFFFFFFF) >>> 0;
        this.XTEA_KEY[1] = (((Math.random() * 10000000 << 16) | Math.random() * 10000000) & 0xFFFFFFFF) >>> 0;
        this.XTEA_KEY[2] = (((Math.random() * 10000000 << 16) | Math.random() * 10000000) & 0xFFFFFFFF) >>> 0;
        this.XTEA_KEY[3] = (((Math.random() * 10000000 << 16) | Math.random() * 10000000) & 0xFFFFFFFF) >>> 0;
    };
}
var Security = new TibiaSecurity();
Security.GenerateXTEAKey();
function NetworkMessage() {
    this.m_MsgBuf = [];
    this.m_ReadPos = 2;
    this.m_MsgSize = 0;

    this.m_key = [];

    this.DecodeHeader = function() {
        this.m_MsgSize = (this.m_MsgBuf[0] | (this.m_MsgBuf[1] << 8));
        return this.m_MsgSize; 
    }

    this.EncodeHeader = function() {
        this.m_MsgBuf[0] = this.m_MsgSize & 0xFF;
        this.m_MsgBuf[1] = (this.m_MsgSize >> 8) & 0xFF;
    }

    this.Reset = function() {
        this.m_MsgBuf = [];
        this.m_ReadPos = 2;
        this.m_MsgSize = 0;
    }

    this.getMessageLength = function() {
        return this.m_MsgSize;
    }

    this.getBufferSize = function() {
        return this.m_MsgBuf.length;
    }

    this.SkipBytes = function(count) {
        this.m_ReadPos += count;
    }

    this.GetByte = function() {
        return this.m_MsgBuf[this.m_ReadPos++];
    }

    this.AddByte = function(b) {
        this.m_MsgBuf[this.m_ReadPos] = b & 0xFF;
        ++this.m_ReadPos;
        ++this.m_MsgSize;
    }

    this.GetU16 = function() {
        var ret = (this.m_MsgBuf[this.m_ReadPos] | (this.m_MsgBuf[this.m_ReadPos+1] << 8));
        this.m_ReadPos += 2;
        return ret;
    }

    this.AddU16 = function(u16) {
        u16 &= 0xFFFF;
        this.m_MsgBuf[this.m_ReadPos++] = u16 & 0xFF;
        this.m_MsgBuf[this.m_ReadPos++] = (u16 >> 8) & 0xFF;
        this.m_MsgSize += 2;
    }

    this.GetU32 = function() {
        var ret = ((this.m_MsgBuf[this.m_ReadPos]) | (this.m_MsgBuf[this.m_ReadPos+1] << 8) | (this.m_MsgBuf[this.m_ReadPos+2] << 16) | (this.m_MsgBuf[this.m_ReadPos+3] << 24)) >>> 0;
        this.m_ReadPos += 4;
        return ret;
    }

    this.AddU32 = function(u32) {
        u32 &= 0xFFFFFFFF;
        this.m_MsgBuf[this.m_ReadPos++] = u32 & 0xFF;
        this.m_MsgBuf[this.m_ReadPos++] = (u32 >> 8) & 0xFF;
        this.m_MsgBuf[this.m_ReadPos++] = (u32 >> 16) & 0xFF;
        this.m_MsgBuf[this.m_ReadPos++] = (u32 >> 24) & 0xFF;
        this.m_MsgSize += 4;
    }

    this.GetString = function() {
        var stringlen = this.GetU16();
        if(stringlen >= (NETWORKMESSAGE_MAXSIZE - this.m_ReadPos))
            return null;

        var ret = '';
        for(i = 0; i < stringlen; ++i) {
            ret += String.fromCharCode(this.GetByte());
        }
        return ret;
    }

    this.AddString = function(str) {
        this.AddU16(str.length);
        for(i = 0; i < str.length; ++i) {
            this.AddByte(str.charCodeAt(i));
        }
    }

    this.AddPaddingBytes = function(total) {
        for(i = 0; i < total; ++i) {
            this.AddByte(0xAC);
        }
    }

    this.Encode = function() {
        this.EncodeHeader();
        return Base64.encode(this.m_MsgBuf);
    }

    this.Decode = function(data) {
        this.m_MsgBuf = Base64.decode(data, 0);
        if(!this.m_MsgBuf[this.m_MsgBuf.length-1]) {
            this.m_MsgBuf.pop();
        }
    }

    this.XTEA_Decrypt = function() {
        if(Security.XTEA_KEY == []) {
            console.log('XTEA Key not found.');
        }

        this.DecodeHeader();

        if((this.m_MsgSize-this.m_ReadPos+2) % 8 != 0) {
            console.log('XTEA: Wrong Packet Size: '+this.m_MsgSize-this.m_ReadPos+2);
            return;
        }

        var k = [];
        k[0] = Security.XTEA_KEY[0];
        k[1] = Security.XTEA_KEY[1];
        k[2] = Security.XTEA_KEY[2];
        k[3] = Security.XTEA_KEY[3];

        var pos = 0;
        var buffer = this.m_MsgBuf.slice(this.m_ReadPos);

        while(pos < buffer.length) {
            var delta = 0x61C88647;
            var sum = 0xC6EF3720;
            var n = 32;

            v0 = ((buffer[pos]) | (buffer[pos+1] << 8) | (buffer[pos+2] << 16) | (buffer[pos+3] << 24) & 0xffffffff) >>> 0;
            v1 = ((buffer[pos+4]) | (buffer[pos+5] << 8) | (buffer[pos+6] << 16) | (buffer[pos+7] << 24) & 0xffffffff) >>> 0;

            while ( n-- > 0 ) {
            v1 -= (((v0 << 4 ^ v0 >>> 5) + v0) ^ (sum + k[sum>>>11 & 3])) >>> 0;
            sum += delta;
            v0 -= (((v1 << 4 ^ v1 >>> 5) + v1) ^ (sum + k[sum & 3])) >>> 0;
            }

            buffer[pos] = v0 & 0xFF;
            buffer[pos+1] = (v0 >> 8) & 0xFF;
            buffer[pos+2] = (v0 >> 16) & 0xFF;
            buffer[pos+3] = (v0 >> 24) & 0xFF;

            if(v1 != 0) {
            buffer[pos+4] = v1 & 0xFF;
            buffer[pos+5] = (v1 >> 8) & 0xFF;
            buffer[pos+6] = (v1 >> 16) & 0xFF;
            buffer[pos+7] = (v1 >> 24) & 0xFF;
            }

            pos += 8;
        }

        if(buffer.length-2 < (buffer[0] | (buffer[1] << 8))) {
            console.log("XTEA: Wrong decrypted size: "+(buffer.length-2)+" "+(buffer[0] | (buffer[1] << 8)));
        }

        this.m_MsgBuf = buffer;
        this.m_ReadPos = 2;
        this.DecodeHeader();
    }

    this.XTEA_Encrypt = function() {
        if(Security.XTEA_KEY == []) {
            console.log('XTEA Key not found.');
        }

        var k = [];
        k[0] = this.m_key[0];
        k[1] = this.m_key[1];
        k[2] = this.m_key[2];
        k[3] = this.m_key[3];

        if (((this.m_MsgSize+2) % 8) != 0) {
            n = 8 - ((this.m_MsgSize+2) % 8);
            for(i = 0; i < n; ++i) {
                this.AddByte(0xAC);
            }
        }

        this.EncodeHeader();
        var buffer = this.m_MsgBuf;

        var pos = 0;
        while (pos < buffer.length) {
            var delta = 0x61C88647;
            var sum = 0 & 0xFFFFFFFF;
            var n = 32;

            v0 = ((buffer[pos]) | (buffer[pos+1] << 8) | (buffer[pos+2] << 16) | (buffer[pos+3] << 24) & 0xffffffff) >>> 0;
            v1 = ((buffer[pos+4]) | (buffer[pos+5] << 8) | (buffer[pos+6] << 16) | (buffer[pos+7] << 24) & 0xffffffff)  >>> 0;

            while ( n-- > 0 ) {
                v0 += (((v1 << 4 ^ v1 >>> 5) + v1) ^ (sum + k[sum & 3]) & 0xffffffff) >>> 0;
                sum -= delta;
                v1 += (((v0 << 4 ^ v0 >>> 5) + v0) ^ (sum + k[sum>>>11 & 3]) & 0xffffffff) >>> 0;
            }

            buffer[pos] = v0 & 0xFF;
            buffer[pos+1] = (v0 >> 8) & 0xFF;
            buffer[pos+2] = (v0 >> 16) & 0xFF;
            buffer[pos+3] = (v0 >> 24) & 0xFF;

            buffer[pos+4] = v1 & 0xFF;
            buffer[pos+5] = (v1 >> 8) & 0xFF;
            buffer[pos+6] = (v1 >> 16) & 0xFF;
            buffer[pos+7] = (v1 >> 24) & 0xFF;

            pos += 8;
        }

        this.m_MsgBuf = [0x00, 0x00].concat(buffer);
        this.m_MsgSize = buffer.length;
        this.EncodeHeader();
    }

    this.RSA_Encrypt = function(start) {
        start += 2;
        var encrypt = RSAEncryptBuffer(TibiaClient.RSA_KEY, this.m_MsgBuf.slice(start));
        for(i = 0; i < encrypt.length; ++i) {
            encrypt[i] = encrypt[i] & 0xFF;
        }
        this.m_MsgBuf = this.m_MsgBuf.slice(0, start).concat(encrypt);
        this.m_MsgSize = this.m_MsgBuf.length-2;
    }

    this.Join = function(msg) {
        this.m_MsgBuf = this.m_MsgBuf.concat(msg.m_MsgBuf.slice(1));
    };

    this.GetChecksum = function(offset) {
        var buffer = this.m_MsgBuf.slice(offset);
        var len = buffer.length;

        var a = 1 & 0xFFFFFFFF;
        var b = 0 & 0xFFFFFFFF;
        var i = 0;

        while (len > 0) {
            var tlen = len > 5552 ? 5552 : len;
            len -= tlen;

            do {
                a += buffer[i++] & 0xFFFFFFF;
                b += a;
            } while (--tlen);

            a %= MOD_ADLER;
            b %= MOD_ADLER;
        }

        return ((b << 16) | a) >>> 0;
    };

    this.Checksum = function() {
        var recivedSum = this.GetU32();
        var sum = this.GetChecksum(6);

        if(sum == recivedSum) {
            return true;
        } else {
            console.log("Wrong checksum: "+sum+" "+recivedSum);
        }
        return false;
    };

    this.AddChecksum = function() {
        var sum = this.GetChecksum(2);
        this.m_MsgBuf = [0x00, 0x00, sum & 0xFF, (sum >> 8) & 0xFF, (sum >> 16) & 0xFF, (sum >> 24) & 0xFF].concat(this.m_MsgBuf.slice(2));
        this.m_MsgSize += 4;
        this.m_MsgRead += 4;
        this.EncodeHeader();
    };
}
