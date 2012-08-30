function NetworkMessage(mBuf) {
    this.Reset();
    this.MsgBuf = mBuf;
    this.MsgSize = this.MsgBuf.length;
    this.Overrun = false;
    this.maxBodyLength = this.NETWORKMESSAGE_MAXSIZE - this.headerLength - this.cryptoLength - this.xteaMultiple;
}

NetworkMessage.prototype = {
    NETWORKMESSAGE_MAXSIZE: 15340,
    headerLength: 2,
    cryptoLength: 4,
    xteaMultiple: 8,
    ReadPos: 8
};

NetworkMessage.prototype.Reset = function() {
    this.MsgSize = 0;
    this.ReadPos = 8;
    this.Overrun = false;
};

NetworkMessage.prototype.expectRead = function(size) {
    if (size >= (this.NETWORKMESSAGE_MAXSIZE - this.ReadPos)) {
        this.Overrun = true;
        return false;
    }
    return true;
};

NetworkMessage.prototype.canAdd = function(size) {
    return (size + this.ReadPos < this.maxBodyLength);
};

NetworkMessage.prototype.isOverrun = function() {
    return this.Overrun;
};

NetworkMessage.prototype.GetByte = function() {
    if (!this.expectRead(1)) {
        return 0;
    }
    return this.MsgBuf[this.ReadPos++];
};

//Wrappers:
NetworkMessage.prototype.GetU16 = function() {
    if (!this.expectRead(2)) {
        return 0;
    }
    var v = this.MsgBuf.readUInt16BE(this.ReadPos);
    this.ReadPos += 2;
    return v;
};
NetworkMessage.prototype.GetU32 = function() {
    if (!this.expectRead(4)) {
        return 0;
    }
    var v = this.MsgBuf.readUInt32BE(this.ReadPos);
    this.ReadPos += 4;
    return v;
};
NetworkMessage.prototype.PeekU32 = function() {
    if (!this.expectRead(4)) {
        return 0;
    }
    return this.MsgBuf.readUInt32BE(this.ReadPos);
};
NetworkMessage.prototype.GetString = function() {
    var stringLength = this.GetU16();
    if (stringLength >= (this.NETWORKMESSAGE_MAXSIZE - this.ReadPos)) {
        return "";
    }
    var buf1 = this.MsgBuf.slice(this.ReadPos, this.ReadPos + stringLength);
    var v = buf1.toString('utf8', 0, stringLength);
    this.ReadPos += stringLength;
    return v;
};
NetworkMessage.prototype.GetRaw = function() {
    var stringLength = this.MsgSize - this.ReadPos;
    if (stringLength >= (this.NETWORKMESSAGE_MAXSIZE - this.ReadPos)) {
        return "";
    }
    var buf1 = this.MsgBuf.slice(this.ReadPos, this.ReadPos + stringLength);
    var v = buf1.toString('utf8', 0, stringLength);
    this.ReadPos += stringLength;
    return v;
};
NetworkMessage.prototype.GetPosition = function() {
    // TODO: implement positioning system
};
NetworkMessage.prototype.SkipBytes = function(bytesCount) {
    this.ReadPos += bytesCount;
};
NetworkMessage.prototype.AddByte = function(value) {
    if (this.canAdd(1)) {
        this.MsgBuf[this.ReadPos++] = value;
        this.MsgSize++;
    }
};
NetworkMessage.prototype.AddU16 = function(value) {
    if (this.canAdd(2)) {
        for (var i = 0; i < 2; i++) {
            this.MsgBuf[this.ReadPos++] = value[i];
        }
        this.MsgSize += 2;
    }
};
NetworkMessage.prototype.AddU32 = function(value) {
    if (this.canAdd(4)) {
        for (var i = 0; i < 4; i++) {
            this.MsgBuf[this.ReadPos++] = value[i];
        }
        this.MsgSize += 4;
    }
};
NetworkMessage.prototype.AddBytes = function(value, size) {
    if (!this.canAdd(size) || size > 8192) {
        return false;
    }
    for (var i = 0; i < size; i++) {
        this.MsgBuf[this.ReadPos++] = value[i];
    }
    this.MsgSize += size;
};
NetworkMessage.prototype.AddPaddingBytes = function(size) {
    if (this.canAdd(size)) {
        for (var i = 0; i < size; i++) {
            this.MsgBuf[this.ReadPos++] = 0x33;
        }
        this.MsgSize += size;
    }
};
NetworkMessage.prototype.AddString = function(str) {
    var tmpBuf = new Buffer(str);
    var strBytesLength = tmpBuf.length;
    if (!this.canAdd(strBytesLength + 2) || strBytesLength > 8192) {
        return false;
    }
    this.AddU16(strBytesLength);
    this.MsgBuf.write(str, this.ReadPos, strBytesLength);
    this.ReadPos += strBytesLength;
    this.MsgSize += strBytesLength;
};
NetworkMessage.prototype.AddPosition = function(position) {
    // TODO: implement positioning system
};
NetworkMessage.prototype.DecodeHeader = function() {
    this.MsgSize = (this.MsgBuf[0] | this.MsgBuf[1] << 8);
    return this.MsgSize;
};
NetworkMessage.prototype.GetChecksum = function(offset) {
    var buffer = this.MsgBuf.slice(offset);
    var len = buffer.length;

    var a = 1 & 0xFFFFFFFF;
    var b = 0 & 0xFFFFFFFF;
    var i = 0;
    var MOD_ADLER = 65521;

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
module.exports = NetworkMessage;


/*
 * TODO: Implement this whole library:
 * 
 * Publics:
 * - int headerLength = 2;
 * - int cryptoLength = 4;
 * - int xteaMultiple = 8;
 * - int maxBodyLength = NETWORKMESSAGE_MAXSIZE - this.headerLength - this.cryptoLength - this.xteaMultiple;
 * 
 * - void NetworkMessage() //Constructor
 * - uint8_t GetByte()
 * - uint16_t GetU16()
 * - uint32_t GetU32()
 * - uint32_t PeekU32()
 * - string GetString()
 * - string GetRaw()
 * - Position GetPosition()
 * - void SkipBytes(int count)
 * - void AddByte(uint8_t value)
 * - void AddBytes(const char* bytes, uint32_t size) // OVERLOADING THE FUNCTION ABOVE
 * - void AddU16(uint16_t value)
 * - void AddU32(uint32_t value)
 * - void AddPaddingBytes(uint32_t n)
 * - void AddString(const string& value) // { this.AddString(value.c_str()); }
 * - void AddString(const char* value) //OVERLOAD
 * - void AddPosition(const Position &pos)
 * - void AddItem(uint16_t id, uint8_t count)
 * - void AddItem(const Item *item) //OVERLOAD
 * - void AddItemId(const Item *item)
 * - void AddItemId(uint16_t itemId) //OVERLOAD
 * - void AddCreature(const Creature *creature, bool known, unsigned int remove)
 * - int32_t GetMessageLength() // return this.MsgSize;
 * - void SetMessageLength(int32_t newSize)  // this.MsgSize = newSize;
 * - int32_t GetReadPos() // return this.ReadPos;
 * - void SetReadPos(int32_t pos) // this.ReadPos = pos;
 * - int32_t decodeHeader()
 * - bool isOverrun() // return this.Overrun;
 * - char* getBuffer() // return this.MsgBuf[0];
 * - char* getBodyBuffer() // this.ReadPos = 2; return this.MsgBuf[this.headerLength];
 * 
 * Protected:
 * - int32_t MsgSize;
 * - int32_t ReadPos;
 * - bool Overrun;
 * - uint8_t MsgBuf = []; //Max size: NETWORKMESSAGE_MAXSIZE
 * 
 * - void Reset() // this.Overrun = false; this.MsgSize = 0; this.ReadPos = 0; //reset params
 * - bool canAdd(uint32_t size) // return (size + this.ReadPos MENOR_QUE this.maxBodyLength);
 * - bool expectRead(uint32_t size)
 * 
 * - void Track(string file, long line, string func)
 * - void clearTrack()
 * 
 * - uint16_t GetSpriteId() // return GetU16()
 * 
 */