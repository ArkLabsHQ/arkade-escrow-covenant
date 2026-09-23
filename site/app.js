var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod2) => function __require() {
  try {
    return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
  } catch (e) {
    throw mod2 = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));

// node_modules/bip68/index.js
var require_bip68 = __commonJS({
  "node_modules/bip68/index.js"(exports, module) {
    var SEQUENCE_FINAL = 4294967295;
    var SEQUENCE_LOCKTIME_DISABLE_FLAG = 1 << 31;
    var SEQUENCE_LOCKTIME_GRANULARITY = 9;
    var SEQUENCE_LOCKTIME_MASK = 65535;
    var SEQUENCE_LOCKTIME_TYPE_FLAG = 1 << 22;
    var BLOCKS_MAX = SEQUENCE_LOCKTIME_MASK;
    var SECONDS_MOD = 1 << SEQUENCE_LOCKTIME_GRANULARITY;
    var SECONDS_MAX = SEQUENCE_LOCKTIME_MASK << SEQUENCE_LOCKTIME_GRANULARITY;
    function decode2(sequence) {
      if (sequence & SEQUENCE_LOCKTIME_DISABLE_FLAG) return {};
      if (sequence & SEQUENCE_LOCKTIME_TYPE_FLAG) {
        return {
          seconds: (sequence & SEQUENCE_LOCKTIME_MASK) << SEQUENCE_LOCKTIME_GRANULARITY
        };
      }
      return {
        blocks: sequence & SEQUENCE_LOCKTIME_MASK
      };
    }
    function encode3({ blocks, seconds }) {
      if (blocks !== void 0 && seconds !== void 0) throw new TypeError("Cannot encode blocks AND seconds");
      if (blocks === void 0 && seconds === void 0) return SEQUENCE_FINAL;
      if (seconds !== void 0) {
        if (!Number.isFinite(seconds)) throw new TypeError("Expected Number seconds");
        if (seconds > SECONDS_MAX) throw new TypeError("Expected Number seconds <= " + SECONDS_MAX);
        if (seconds % SECONDS_MOD !== 0) throw new TypeError("Expected Number seconds as a multiple of " + SECONDS_MOD);
        return SEQUENCE_LOCKTIME_TYPE_FLAG | seconds >> SEQUENCE_LOCKTIME_GRANULARITY;
      }
      if (!Number.isFinite(blocks)) throw new TypeError("Expected Number blocks");
      if (blocks > SEQUENCE_LOCKTIME_MASK) throw new TypeError("Expected Number blocks <= " + BLOCKS_MAX);
      return blocks;
    }
    module.exports = { decode: decode2, encode: encode3 };
  }
});

// node_modules/@scure/base/index.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
}
function isArrayOf(isString, arr) {
  if (!Array.isArray(arr))
    return false;
  if (arr.length === 0)
    return true;
  if (isString) {
    return arr.every((item) => typeof item === "string");
  } else {
    return arr.every((item) => Number.isSafeInteger(item));
  }
}
function afn(input) {
  if (typeof input !== "function")
    throw new Error("function expected");
  return true;
}
function astr(label, input) {
  if (typeof input !== "string")
    throw new Error(`${label}: string expected`);
  return true;
}
function anumber(n) {
  if (!Number.isSafeInteger(n))
    throw new Error(`invalid integer: ${n}`);
}
function aArr(input) {
  if (!Array.isArray(input))
    throw new Error("array expected");
}
function astrArr(label, input) {
  if (!isArrayOf(true, input))
    throw new Error(`${label}: array of strings expected`);
}
function anumArr(label, input) {
  if (!isArrayOf(false, input))
    throw new Error(`${label}: array of numbers expected`);
}
// @__NO_SIDE_EFFECTS__
function chain(...args) {
  const id = (a) => a;
  const wrap2 = (a, b) => (c) => a(b(c));
  const encode3 = args.map((x) => x.encode).reduceRight(wrap2, id);
  const decode2 = args.map((x) => x.decode).reduce(wrap2, id);
  return { encode: encode3, decode: decode2 };
}
// @__NO_SIDE_EFFECTS__
function alphabet(letters) {
  const lettersA = typeof letters === "string" ? letters.split("") : letters;
  const len = lettersA.length;
  astrArr("alphabet", lettersA);
  const indexes = new Map(lettersA.map((l, i) => [l, i]));
  return {
    encode: (digits) => {
      aArr(digits);
      return digits.map((i) => {
        if (!Number.isSafeInteger(i) || i < 0 || i >= len)
          throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
        return lettersA[i];
      });
    },
    decode: (input) => {
      aArr(input);
      return input.map((letter) => {
        astr("alphabet.decode", letter);
        const i = indexes.get(letter);
        if (i === void 0)
          throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
        return i;
      });
    }
  };
}
// @__NO_SIDE_EFFECTS__
function join(separator = "") {
  astr("join", separator);
  return {
    encode: (from) => {
      astrArr("join.decode", from);
      return from.join(separator);
    },
    decode: (to) => {
      astr("join.decode", to);
      return to.split(separator);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function padding(bits, chr = "=") {
  anumber(bits);
  astr("padding", chr);
  return {
    encode(data) {
      astrArr("padding.encode", data);
      while (data.length * bits % 8)
        data.push(chr);
      return data;
    },
    decode(input) {
      astrArr("padding.decode", input);
      let end = input.length;
      if (end * bits % 8)
        throw new Error("padding: invalid, string should have whole number of bytes");
      for (; end > 0 && input[end - 1] === chr; end--) {
        const last = end - 1;
        const byte = last * bits;
        if (byte % 8 === 0)
          throw new Error("padding: invalid, string has too much padding");
      }
      return input.slice(0, end);
    }
  };
}
// @__NO_SIDE_EFFECTS__
function normalize(fn) {
  afn(fn);
  return { encode: (from) => from, decode: (to) => fn(to) };
}
function convertRadix(data, from, to) {
  if (from < 2)
    throw new Error(`convertRadix: invalid from=${from}, base cannot be less than 2`);
  if (to < 2)
    throw new Error(`convertRadix: invalid to=${to}, base cannot be less than 2`);
  aArr(data);
  if (!data.length)
    return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data, (d) => {
    anumber(d);
    if (d < 0 || d >= from)
      throw new Error(`invalid integer: ${d}`);
    return d;
  });
  const dlen = digits.length;
  while (true) {
    let carry = 0;
    let done = true;
    for (let i = pos; i < dlen; i++) {
      const digit = digits[i];
      const fromCarry = from * carry;
      const digitBase = fromCarry + digit;
      if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
        throw new Error("convertRadix: carry overflow");
      }
      const div = digitBase / to;
      carry = digitBase % to;
      const rounded = Math.floor(div);
      digits[i] = rounded;
      if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
        throw new Error("convertRadix: carry overflow");
      if (!done)
        continue;
      else if (!rounded)
        pos = i;
      else
        done = false;
    }
    res.push(carry);
    if (done)
      break;
  }
  for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
    res.push(0);
  return res.reverse();
}
var gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
var radix2carry = /* @__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
var powers = /* @__PURE__ */ (() => {
  let res = [];
  for (let i = 0; i < 40; i++)
    res.push(2 ** i);
  return res;
})();
function convertRadix2(data, from, to, padding2) {
  aArr(data);
  if (from <= 0 || from > 32)
    throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32)
    throw new Error(`convertRadix2: wrong to=${to}`);
  if (/* @__PURE__ */ radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${/* @__PURE__ */ radix2carry(from, to)}`);
  }
  let carry = 0;
  let pos = 0;
  const max = powers[from];
  const mask = powers[to] - 1;
  const res = [];
  for (const n of data) {
    anumber(n);
    if (n >= max)
      throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32)
      throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to)
      res.push((carry >> pos - to & mask) >>> 0);
    const pow = powers[pos];
    if (pow === void 0)
      throw new Error("invalid carry");
    carry &= pow - 1;
  }
  carry = carry << to - pos & mask;
  if (!padding2 && pos >= from)
    throw new Error("Excess padding");
  if (!padding2 && carry > 0)
    throw new Error(`Non-zero padding: ${carry}`);
  if (padding2 && pos > 0)
    res.push(carry >>> 0);
  return res;
}
// @__NO_SIDE_EFFECTS__
function radix(num2) {
  anumber(num2);
  const _256 = 2 ** 8;
  return {
    encode: (bytes) => {
      if (!isBytes(bytes))
        throw new Error("radix.encode input should be Uint8Array");
      return convertRadix(Array.from(bytes), _256, num2);
    },
    decode: (digits) => {
      anumArr("radix.decode", digits);
      return Uint8Array.from(convertRadix(digits, num2, _256));
    }
  };
}
// @__NO_SIDE_EFFECTS__
function radix2(bits, revPadding = false) {
  anumber(bits);
  if (bits <= 0 || bits > 32)
    throw new Error("radix2: bits should be in (0..32]");
  if (/* @__PURE__ */ radix2carry(8, bits) > 32 || /* @__PURE__ */ radix2carry(bits, 8) > 32)
    throw new Error("radix2: carry overflow");
  return {
    encode: (bytes) => {
      if (!isBytes(bytes))
        throw new Error("radix2.encode input should be Uint8Array");
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: (digits) => {
      anumArr("radix2.decode", digits);
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}
function unsafeWrapper(fn) {
  afn(fn);
  return function(...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {
    }
  };
}
function checksum(len, fn) {
  anumber(len);
  afn(fn);
  return {
    encode(data) {
      if (!isBytes(data))
        throw new Error("checksum.encode: input should be Uint8Array");
      const sum = fn(data).slice(0, len);
      const res = new Uint8Array(data.length + len);
      res.set(data);
      res.set(sum, data.length);
      return res;
    },
    decode(data) {
      if (!isBytes(data))
        throw new Error("checksum.decode: input should be Uint8Array");
      const payload = data.slice(0, -len);
      const oldChecksum = data.slice(-len);
      const newChecksum = fn(payload).slice(0, len);
      for (let i = 0; i < len; i++)
        if (newChecksum[i] !== oldChecksum[i])
          throw new Error("Invalid checksum");
      return payload;
    }
  };
}
var hasBase64Builtin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toBase64 === "function" && typeof Uint8Array.fromBase64 === "function")();
var decodeBase64Builtin = (s, isUrl) => {
  astr("base64", s);
  const re = isUrl ? /^[A-Za-z0-9=_-]+$/ : /^[A-Za-z0-9=+/]+$/;
  const alphabet2 = isUrl ? "base64url" : "base64";
  if (s.length > 0 && !re.test(s))
    throw new Error("invalid base64");
  return Uint8Array.fromBase64(s, { alphabet: alphabet2, lastChunkHandling: "strict" });
};
var base64 = hasBase64Builtin ? {
  encode(b) {
    abytes(b);
    return b.toBase64();
  },
  decode(s) {
    return decodeBase64Builtin(s, false);
  }
} : /* @__PURE__ */ chain(/* @__PURE__ */ radix2(6), /* @__PURE__ */ alphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"), /* @__PURE__ */ padding(6), /* @__PURE__ */ join(""));
var genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet(abc), /* @__PURE__ */ join(""));
var base58 = /* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
var createBase58check = (sha2563) => /* @__PURE__ */ chain(checksum(4, (data) => sha2563(sha2563(data))), base58);
var BECH_ALPHABET = /* @__PURE__ */ chain(/* @__PURE__ */ alphabet("qpzry9x8gf2tvdw0s3jn54khce6mua7l"), /* @__PURE__ */ join(""));
var POLYMOD_GENERATORS = [996825010, 642813549, 513874426, 1027748829, 705979059];
function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 33554431) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1)
      chk ^= POLYMOD_GENERATORS[i];
  }
  return chk;
}
function bechChecksum(prefix2, words, encodingConst = 1) {
  const len = prefix2.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix2.charCodeAt(i);
    if (c < 33 || c > 126)
      throw new Error(`Invalid prefix (${prefix2})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++)
    chk = bech32Polymod(chk) ^ prefix2.charCodeAt(i) & 31;
  for (let v of words)
    chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++)
    chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % powers[30]], 30, 5, false));
}
// @__NO_SIDE_EFFECTS__
function genBech32(encoding) {
  const ENCODING_CONST = encoding === "bech32" ? 1 : 734539939;
  const _words = /* @__PURE__ */ radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);
  function encode3(prefix2, words, limit = 90) {
    astr("bech32.encode prefix", prefix2);
    if (isBytes(words))
      words = Array.from(words);
    anumArr("bech32.encode", words);
    const plen = prefix2.length;
    if (plen === 0)
      throw new TypeError(`Invalid prefix length ${plen}`);
    const actualLength = plen + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix2.toLowerCase();
    const sum = bechChecksum(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
  }
  function decode2(str, limit = 90) {
    astr("bech32.decode input", str);
    const slen = str.length;
    if (slen < 8 || limit !== false && slen > limit)
      throw new TypeError(`invalid string length: ${slen} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    const sepIndex = lowered.lastIndexOf("1");
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix2 = lowered.slice(0, sepIndex);
    const data = lowered.slice(sepIndex + 1);
    if (data.length < 6)
      throw new Error("Data must be at least 6 characters long");
    const words = BECH_ALPHABET.decode(data).slice(0, -6);
    const sum = bechChecksum(prefix2, words, ENCODING_CONST);
    if (!data.endsWith(sum))
      throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return { prefix: prefix2, words };
  }
  const decodeUnsafe = unsafeWrapper(decode2);
  function decodeToBytes(str) {
    const { prefix: prefix2, words } = decode2(str, false);
    return { prefix: prefix2, words, bytes: fromWords(words) };
  }
  function encodeFromBytes(prefix2, bytes) {
    return encode3(prefix2, toWords(bytes));
  }
  return {
    encode: encode3,
    decode: decode2,
    encodeFromBytes,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}
var bech32 = /* @__PURE__ */ genBech32("bech32");
var bech32m = /* @__PURE__ */ genBech32("bech32m");
var utf8 = {
  encode: (data) => new TextDecoder().decode(data),
  decode: (str) => new TextEncoder().encode(str)
};
var hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
var hexBuiltin = {
  encode(data) {
    abytes(data);
    return data.toHex();
  },
  decode(s) {
    astr("hex", s);
    return Uint8Array.fromHex(s);
  }
};
var hex = hasHexBuiltin ? hexBuiltin : /* @__PURE__ */ chain(/* @__PURE__ */ radix2(4), /* @__PURE__ */ alphabet("0123456789abcdef"), /* @__PURE__ */ join(""), /* @__PURE__ */ normalize((s) => {
  if (typeof s !== "string" || s.length % 2 !== 0)
    throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));

// node_modules/@noble/hashes/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber2(n, title = "") {
  if (!Number.isSafeInteger(n) || n < 0) {
    const prefix2 = title && `"${title}" `;
    throw new Error(`${prefix2}expected integer >= 0, got ${n}`);
  }
}
function abytes2(value, length, title = "") {
  const bytes = isBytes2(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix2 = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix2 + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash must wrapped by utils.createHasher");
  anumber2(h.outputLen);
  anumber2(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes2(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
var hasHexBuiltin2 = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin2)
    return bytes.toHex();
  let hex2 = "";
  for (let i = 0; i < bytes.length; i++) {
    hex2 += hexes[bytes[i]];
  }
  return hex2;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex2) {
  if (typeof hex2 !== "string")
    throw new Error("hex string expected, got " + typeof hex2);
  if (hasHexBuiltin2)
    return Uint8Array.fromHex(hex2);
  const hl = hex2.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array2 = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex2.charCodeAt(hi));
    const n2 = asciiToBase16(hex2.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex2[hi] + hex2[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array2[ai] = n1 * 16 + n2;
  }
  return array2;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  const cr2 = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr2?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  return cr2.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// node_modules/@noble/hashes/_md.js
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes2(data);
    const { view: view2, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view2, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view: view2, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view2, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    view2.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view2, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C: C2, D, E, F, G: G2, H } = this;
    return [A, B, C2, D, E, F, G2, H];
  }
  // prettier-ignore
  set(A, B, C2, D, E, F, G2, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C2 | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G2 | 0;
    this.H = H | 0;
  }
  process(view2, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view2.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C: C2, D, E, F, G: G2, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C2) | 0;
      H = G2;
      G2 = F;
      F = E;
      E = D + T1 | 0;
      D = C2;
      C2 = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C2 = C2 + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G2 = G2 + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C2, D, E, F, G2, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var sha256 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);

// node_modules/@noble/curves/utils.js
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix2 = title && `"${title}" `;
    throw new Error(prefix2 + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n) {
  if (typeof n === "bigint") {
    if (!isPosBig(n))
      throw new Error("positive bigint expected, got " + n);
  } else
    anumber2(n);
  return n;
}
function numberToHexUnpadded(num2) {
  const hex2 = abignumber(num2).toString(16);
  return hex2.length & 1 ? "0" + hex2 : hex2;
}
function hexToNumber(hex2) {
  if (typeof hex2 !== "string")
    throw new Error("hex string expected, got " + typeof hex2);
  return hex2 === "" ? _0n : BigInt("0x" + hex2);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes2(bytes)).reverse()));
}
function numberToBytesBE(n, len) {
  anumber2(len);
  n = abignumber(n);
  const res = hexToBytes(n.toString(16).padStart(len * 2, "0"));
  if (res.length !== len)
    throw new Error("number too large");
  return res;
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}
function asciiToBytes(ascii) {
  return Uint8Array.from(ascii, (c, i) => {
    const charCode = c.charCodeAt(0);
    if (c.length !== 1 || charCode > 127) {
      throw new Error(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
    }
    return charCode;
  });
}
var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n; n >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n) => (_1n << BigInt(n)) - _1n;
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber2(hashLen, "hashLen");
  anumber2(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n2 = (len) => new Uint8Array(len);
  const NULL3 = Uint8Array.of();
  const byte02 = Uint8Array.of(0);
  const byte12 = Uint8Array.of(1);
  const _maxDrbgIters2 = 1e3;
  let v = u8n2(hashLen);
  let k = u8n2(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
  const reseed = (seed = NULL3) => {
    k = h(byte02, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte12, seed);
    v = h();
  };
  const gen = () => {
    if (i++ >= _maxDrbgIters2)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, fields = {}, optFields = {}) {
  if (!object || typeof object !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f, isOpt) => Object.entries(f).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}

// node_modules/@noble/curves/abstract/modular.js
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a, b) {
  const result = a % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a !== _0n2) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd2 = b;
  if (gcd2 !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n) {
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n, p1div4);
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  assertIsSquare(Fp, root, n);
  return root;
}
function sqrt9mod16(P2) {
  const Fp_ = Field(P2);
  const tn = tonelliShanks(P2);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P2 + _7n) / _16n;
  return (Fp, n) => {
    let tv1 = Fp.pow(n, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n);
    const e2 = Fp.eql(Fp.sqr(tv3), n);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e2);
    const e3 = Fp.eql(Fp.sqr(tv2), n);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n);
    return root;
  };
}
function tonelliShanks(P2) {
  if (P2 < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P2 - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P2);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M2 = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M2)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M2 - i - 1);
      const b = Fp.pow(c, exponent);
      M2 = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P2) {
  if (P2 % _4n === _3n)
    return sqrt3mod4;
  if (P2 % _8n === _5n)
    return sqrt5mod8;
  if (P2 % _16n === _9n)
    return sqrt9mod16(P2);
  return tonelliShanks(P2);
}
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  return field;
}
function FpPow(Fp, num2, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n2) {
    if (power & _1n2)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n2;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber2(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _sqrt;
  // cached sqrt
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _0n2)
      throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        this.sqrt = opts.sqrt;
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = opts.allowedLengths?.slice();
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    this._sqrt = void 0;
    Object.preventExtensions(this);
  }
  create(num2) {
    return mod(num2, this.ORDER);
  }
  isValid(num2) {
    if (typeof num2 !== "bigint")
      throw new Error("invalid field element: expected bigint, got " + typeof num2);
    return _0n2 <= num2 && num2 < this.ORDER;
  }
  is0(num2) {
    return num2 === _0n2;
  }
  // is valid and invertible
  isValidNot0(num2) {
    return !this.is0(num2) && this.isValid(num2);
  }
  isOdd(num2) {
    return (num2 & _1n2) === _1n2;
  }
  neg(num2) {
    return mod(-num2, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num2) {
    return mod(num2 * num2, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num2, power) {
    return FpPow(this, num2, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num2) {
    return num2 * num2;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num2) {
    return invert(num2, this.ORDER);
  }
  sqrt(num2) {
    if (!this._sqrt)
      this._sqrt = FpSqrt(this.ORDER);
    return this._sqrt(this, num2);
  }
  toBytes(num2) {
    return this.isLE ? numberToBytesLE(num2, this.BYTES) : numberToBytesBE(num2, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes2(bytes);
    const { _lengths: allowedLengths, BYTES, isLE, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar2 = isLE ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar2 = mod(scalar2, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar2))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar2;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a, b, condition) {
    return condition ? b : a;
  }
};
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE = false) {
  abytes2(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n2) + _1n2;
  return isLE ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// node_modules/@noble/curves/abstract/curve.js
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c, points) {
  const invertedZs = FpInvertBatch(c.Fp, points.map((p) => p.Z));
  return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
}
function validateW(W2, bits) {
  if (!Number.isSafeInteger(W2) || W2 <= 0 || W2 > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W2);
}
function calcWOpts(W2, scalarBits2) {
  validateW(W2, scalarBits2);
  const windows = Math.ceil(scalarBits2 / W2) + 1;
  const windowSize = 2 ** (W2 - 1);
  const maxNumber = 2 ** W2;
  const mask = bitMask(W2);
  const shiftBy = BigInt(W2);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window2, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window2 * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero2 = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window2 % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF };
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P2) {
  return pointWindowSizes.get(P2) || 1;
}
function assert0(n) {
  if (n !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  BASE;
  ZERO;
  Fn;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point4, bits) {
    this.BASE = Point4.BASE;
    this.ZERO = Point4.ZERO;
    this.Fn = Point4.Fn;
    this.bits = bits;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n, p = this.ZERO) {
    let d = elm;
    while (n > _0n3) {
      if (n & _1n3)
        p = p.add(d);
      d = d.double();
      n >>= _1n3;
    }
    return p;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point Point instance
   * @param W window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point, W2) {
    const { windows, windowSize } = calcWOpts(W2, this.bits);
    const points = [];
    let p = point;
    let base = p;
    for (let window2 = 0; window2 < windows; window2++) {
      base = p;
      points.push(base);
      for (let i = 1; i < windowSize; i++) {
        base = base.add(p);
        points.push(base);
      }
      p = base.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W2, precomputes, n) {
    if (!this.Fn.isValid(n))
      throw new Error("invalid scalar");
    let p = this.ZERO;
    let f = this.BASE;
    const wo = calcWOpts(W2, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      const { nextN, offset, isZero: isZero2, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
      n = nextN;
      if (isZero2) {
        f = f.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p = p.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n);
    return { p, f };
  }
  /**
   * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
   * @param acc accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W2, precomputes, n, acc = this.ZERO) {
    const wo = calcWOpts(W2, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      if (n === _0n3)
        break;
      const { nextN, offset, isZero: isZero2, isNeg } = calcOffsets(n, window2, wo);
      n = nextN;
      if (isZero2) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n);
    return acc;
  }
  getPrecomputes(W2, point, transform) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W2);
      if (W2 !== 1) {
        if (typeof transform === "function")
          comp = transform(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar2, transform) {
    const W2 = getW(point);
    return this.wNAF(W2, this.getPrecomputes(W2, point, transform), scalar2);
  }
  unsafe(point, scalar2, transform, prev) {
    const W2 = getW(point);
    if (W2 === 1)
      return this._unsafeLadder(point, scalar2, prev);
    return this.wNAFUnsafe(W2, this.getPrecomputes(W2, point, transform), scalar2, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P2, W2) {
    validateW(W2, this.bits);
    pointWindowSizes.set(P2, W2);
    pointPrecomputes.delete(P2);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function mulEndoUnsafe(Point4, point, k1, k2) {
  let acc = point;
  let p1 = Point4.ZERO;
  let p2 = Point4.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p of ["p", "n", "h"]) {
    const val = CURVE[p];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn3 = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b2 = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b2];
  for (const p of params) {
    if (!Fp.isValid(CURVE[p]))
      throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn: Fn3 };
}
function createKeygen(randomSecretKey2, getPublicKey2) {
  return function keygen2(seed) {
    const secretKey = randomSecretKey2(seed);
    return { secretKey, publicKey: getPublicKey2(secretKey) };
  };
}

// node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes2(key, void 0, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes2(out, this.outputLen, "output");
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = (hash, key, message) => new _HMAC(hash, key).update(message).digest();
hmac.create = (hash, key) => new _HMAC(hash, key);

// node_modules/@noble/curves/abstract/weierstrass.js
var divNearest = (num2, den) => (num2 + (num2 >= 0 ? den : -den) / _2n2) / den;
function _splitEndoScalar(k, basis, n) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n);
  const c2 = divNearest(-b1 * k, n);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n4;
  const k2neg = k2 < _0n4;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n) / 2)) + _1n4;
  if (k1 < _0n4 || k1 >= MAX_NUM || k2 < _0n4 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format) {
  if (!["compact", "recovered", "der"].includes(format))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format;
}
function validateSigOpts(opts, def2) {
  const optsn = {};
  for (let optName of Object.keys(def2)) {
    optsn[optName] = opts[optName] === void 0 ? def2[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
var DERErr = class extends Error {
  constructor(m = "") {
    super(m);
  }
};
var DER = {
  // asn.1 DER encoding utils
  Err: DERErr,
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t = numberToHexUnpadded(tag);
      return t + lenLen + len + data;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length = 0;
      if (!isLong)
        length = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length = length << 8 | b;
        pos += lenLen;
        if (length < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length);
      if (v.length !== length)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num2) {
      const { Err: E } = DER;
      if (num2 < _0n4)
        throw new E("integer: negative integers are not allowed");
      let hex2 = numberToHexUnpadded(num2);
      if (Number.parseInt(hex2[0], 16) & 8)
        hex2 = "00" + hex2;
      if (hex2.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex2;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(bytes) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = abytes2(bytes, void 0, "signature");
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n2 = BigInt(2);
var _3n2 = BigInt(3);
var _4n2 = BigInt(4);
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn: Fn3 } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER2 } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths2 = getWLengths(Fp, Fn3);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes3(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes2(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths2;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (length === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err2 = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err2);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length === uncomp && head === 4) {
      const L3 = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L3));
      const y = Fp.fromBytes(tail.subarray(L3, L3 * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes || pointToBytes3;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n, banZero = false) {
    if (!Fp.isValid(n) || banZero && Fp.is0(n))
      throw new Error(`bad point coordinate ${title}`);
    return n;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point4))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn3.ORDER);
  }
  const toAffineMemo = memoized((p, iz) => {
    const { X, Y, Z } = p;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point4(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point4 {
    // base / generator point
    static BASE = new Point4(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    static ZERO = new Point4(Fp.ZERO, Fp.ONE, Fp.ZERO);
    // 0, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn3;
    X;
    Y;
    Z;
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point4)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point4.ZERO;
      return new Point4(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P2 = Point4.fromAffine(decodePoint(abytes2(bytes, void 0, "point")));
      P2.assertValidity();
      return P2;
    }
    static fromHex(hex2) {
      return Point4.fromBytes(hexToBytes(hex2));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n2);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point4(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point4(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point4(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point4.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar2) {
      const { endo: endo2 } = extraOpts;
      if (!Fn3.isValidNot0(scalar2))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = (n) => wnaf.cached(this, n, (p) => normalizeZ(Point4, p));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar2);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p, f } = mul(scalar2);
        point = p;
        fake = f;
      }
      return normalizeZ(Point4, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p = this;
      if (!Fn3.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n4 || p.is0())
        return Point4.ZERO;
      if (sc === _1n4)
        return p;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2 } = mulEndoUnsafe(Point4, p, k1, k2);
        return finishEndo(endo2.beta, p1, p2, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p, sc);
      }
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n4)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point4, this);
      return wnaf.unsafe(this, CURVE_ORDER2).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n4)
        return this;
      if (clearCofactor)
        return clearCofactor(Point4, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point4, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits = Fn3.BITS;
  const wnaf = new wNAF(Point4, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point4.BASE.precompute(8);
  return Point4;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn3) {
  return {
    secretKey: Fn3.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn3.BYTES
  };
}
function ecdh(Point4, ecdhOpts = {}) {
  const { Fn: Fn3 } = Point4;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths2 = Object.assign(getWLengths(Point4.Fp, Fn3), { seed: getMinHashLength(Fn3.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      const num2 = Fn3.fromBytes(secretKey);
      return Fn3.isValidNot0(num2);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths2;
    try {
      const l = publicKey.length;
      if (isCompressed === true && l !== comp)
        return false;
      if (isCompressed === false && l !== publicKeyUncompressed)
        return false;
      return !!Point4.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey2(seed = randomBytes_(lengths2.seed)) {
    return mapHashToField(abytes2(seed, lengths2.seed, "seed"), Fn3.ORDER);
  }
  function getPublicKey2(secretKey, isCompressed = true) {
    return Point4.BASE.multiply(Fn3.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths2;
    if (!isBytes2(item))
      return void 0;
    if ("_lengths" in Fn3 && Fn3._lengths || secretKey === publicKey)
      return void 0;
    const l = abytes2(item, void 0, "key").length;
    return l === publicKey || l === publicKeyUncompressed;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s = Fn3.fromBytes(secretKeyA);
    const b = Point4.fromBytes(publicKeyB);
    return b.multiply(s).toBytes(isCompressed);
  }
  const utils2 = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey: randomSecretKey2
  };
  const keygen2 = createKeygen(randomSecretKey2, getPublicKey2);
  return Object.freeze({ getPublicKey: getPublicKey2, getSharedSecret, keygen: keygen2, Point: Point4, utils: utils2, lengths: lengths2 });
}
function ecdsa(Point4, hash, ecdsaOpts = {}) {
  ahash(hash);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes3 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, msg) => hmac(hash, key, msg));
  const { Fp, Fn: Fn3 } = Point4;
  const { ORDER: CURVE_ORDER2, BITS: fnBits } = Fn3;
  const { keygen: keygen2, getPublicKey: getPublicKey2, getSharedSecret, utils: utils2, lengths: lengths2 } = ecdh(Point4, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeCofactor = CURVE_ORDER2 * _2n2 < Fp.ORDER;
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER2 >> _1n4;
    return number > HALF;
  }
  function validateRS(title, num2) {
    if (!Fn3.isValidNot0(num2))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num2;
  }
  function assertSmallCofactor() {
    if (hasLargeCofactor)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format) {
    validateSigFormat(format);
    const size = lengths2.signature;
    const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
    return abytes2(bytes, sizer);
  }
  class Signature2 {
    r;
    s;
    recovery;
    constructor(r, s, recovery) {
      this.r = validateRS("r", r);
      this.s = validateRS("s", s);
      if (recovery != null) {
        assertSmallCofactor();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format = defaultSigOpts.format) {
      validateSigLength(bytes, format);
      let recid;
      if (format === "der") {
        const { r: r2, s: s2 } = DER.toSig(abytes2(bytes));
        return new Signature2(r2, s2);
      }
      if (format === "recovered") {
        recid = bytes[0];
        format = "compact";
        bytes = bytes.subarray(1);
      }
      const L3 = lengths2.signature / 2;
      const r = bytes.subarray(0, L3);
      const s = bytes.subarray(L3, L3 * 2);
      return new Signature2(Fn3.fromBytes(r), Fn3.fromBytes(s), recid);
    }
    static fromHex(hex2, format) {
      return this.fromBytes(hexToBytes(hex2), format);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature2(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const { r, s } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r + CURVE_ORDER2 : r;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point4.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
      const ir = Fn3.inv(radj);
      const h = bits2int_modN2(abytes2(messageHash, void 0, "msgHash"));
      const u1 = Fn3.create(-h * ir);
      const u2 = Fn3.create(s * ir);
      const Q = Point4.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format = defaultSigOpts.format) {
      validateSigFormat(format);
      if (format === "der")
        return hexToBytes(DER.hexFromSig(this));
      const { r, s } = this;
      const rb = Fn3.toBytes(r);
      const sb = Fn3.toBytes(s);
      if (format === "recovered") {
        assertSmallCofactor();
        return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes(rb, sb);
    }
    toHex(format) {
      return bytesToHex(this.toBytes(format));
    }
  }
  const bits2int2 = ecdsaOpts.bits2int || function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  };
  const bits2int_modN2 = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
    return Fn3.create(bits2int2(bytes));
  };
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num2) {
    aInRange("num < 2^" + fnBits, num2, _0n4, ORDER_MASK);
    return Fn3.toBytes(num2);
  }
  function validateMsgAndHash(message, prehash) {
    abytes2(message, void 0, "message");
    return prehash ? abytes2(hash(message), void 0, "prehashed message") : message;
  }
  function prepSig(message, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    const h1int = bits2int_modN2(message);
    const d = Fn3.fromBytes(secretKey);
    if (!Fn3.isValidNot0(d))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e = extraEntropy === true ? randomBytes3(lengths2.secretKey) : extraEntropy;
      seedArgs.push(abytes2(e, void 0, "extraEntropy"));
    }
    const seed = concatBytes(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int2(kBytes);
      if (!Fn3.isValidNot0(k))
        return;
      const ik = Fn3.inv(k);
      const q = Point4.BASE.multiply(k).toAffine();
      const r = Fn3.create(q.x);
      if (r === _0n4)
        return;
      const s = Fn3.create(ik * Fn3.create(m + r * d));
      if (s === _0n4)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = Fn3.neg(s);
        recovery ^= 1;
      }
      return new Signature2(r, normS, hasLargeCofactor ? void 0 : recovery);
    }
    return { seed, k2sig };
  }
  function sign2(message, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message, secretKey, opts);
    const drbg = createHmacDrbg(hash.outputLen, Fn3.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message, publicKey, opts = {}) {
    const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes2(publicKey, void 0, "publicKey");
    message = validateMsgAndHash(message, prehash);
    if (!isBytes2(signature)) {
      const end = signature instanceof Signature2 ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format);
    try {
      const sig = Signature2.fromBytes(signature, format);
      const P2 = Point4.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r, s } = sig;
      const h = bits2int_modN2(message);
      const is = Fn3.inv(s);
      const u1 = Fn3.create(h * is);
      const u2 = Fn3.create(r * is);
      const R = Point4.BASE.multiplyUnsafe(u1).add(P2.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn3.create(R.x);
      return v === r;
    } catch (e) {
      return false;
    }
  }
  function recoverPublicKey(signature, message, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message = validateMsgAndHash(message, prehash);
    return Signature2.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
  }
  return Object.freeze({
    keygen: keygen2,
    getPublicKey: getPublicKey2,
    getSharedSecret,
    utils: utils2,
    lengths: lengths2,
    Point: Point4,
    sign: sign2,
    verify,
    recoverPublicKey,
    Signature: Signature2,
    hash
  });
}

// node_modules/@noble/curves/secp256k1.js
var secp256k1_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
  n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
  Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
  beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
  basises: [
    [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
    [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
  ]
};
var _0n5 = /* @__PURE__ */ BigInt(0);
var _2n3 = /* @__PURE__ */ BigInt(2);
function sqrtMod(y) {
  const P2 = secp256k1_CURVE.p;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P2;
  const b3 = b2 * b2 * y % P2;
  const b6 = pow2(b3, _3n3, P2) * b3 % P2;
  const b9 = pow2(b6, _3n3, P2) * b3 % P2;
  const b11 = pow2(b9, _2n3, P2) * b2 % P2;
  const b22 = pow2(b11, _11n, P2) * b11 % P2;
  const b44 = pow2(b22, _22n, P2) * b22 % P2;
  const b88 = pow2(b44, _44n, P2) * b44 % P2;
  const b176 = pow2(b88, _88n, P2) * b88 % P2;
  const b220 = pow2(b176, _44n, P2) * b44 % P2;
  const b223 = pow2(b220, _3n3, P2) * b3 % P2;
  const t1 = pow2(b223, _23n, P2) * b22 % P2;
  const t2 = pow2(t1, _6n, P2) * b2 % P2;
  const root = pow2(t2, _2n3, P2);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
  Fp: Fpk1,
  endo: secp256k1_ENDO
});
var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha256);
var TAGGED_HASH_PREFIXES = {};
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = sha256(asciiToBytes(tag));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}
var pointToBytes = (point) => point.toBytes(true).slice(1);
var hasEven = (y) => y % _2n3 === _0n5;
function schnorrGetExtPubKey(priv) {
  const { Fn: Fn3, BASE } = Pointk1;
  const d_ = Fn3.fromBytes(priv);
  const p = BASE.multiply(d_);
  const scalar2 = hasEven(p.y) ? d_ : Fn3.neg(d_);
  return { scalar: scalar2, bytes: pointToBytes(p) };
}
function lift_x(x) {
  const Fp = Fpk1;
  if (!Fp.isValidNot0(x))
    throw new Error("invalid x: Fail if x \u2265 p");
  const xx = Fp.create(x * x);
  const c = Fp.create(xx * x + BigInt(7));
  let y = Fp.sqrt(c);
  if (!hasEven(y))
    y = Fp.neg(y);
  const p = Pointk1.fromAffine({ x, y });
  p.assertValidity();
  return p;
}
var num = bytesToNumberBE;
function challenge(...args) {
  return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(secretKey) {
  return schnorrGetExtPubKey(secretKey).bytes;
}
function schnorrSign(message, secretKey, auxRand = randomBytes(32)) {
  const { Fn: Fn3 } = Pointk1;
  const m = abytes2(message, void 0, "message");
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
  const a = abytes2(auxRand, 32, "auxRand");
  const t = Fn3.toBytes(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(rand);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(Fn3.toBytes(Fn3.create(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const { Fp, Fn: Fn3, BASE } = Pointk1;
  const sig = abytes2(signature, 64, "signature");
  const m = abytes2(message, void 0, "message");
  const pub = abytes2(publicKey, 32, "publicKey");
  try {
    const P2 = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!Fp.isValidNot0(r))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!Fn3.isValidNot0(s))
      return false;
    const e = challenge(Fn3.toBytes(r), pointToBytes(P2), m);
    const R = BASE.multiplyUnsafe(s).add(P2.multiplyUnsafe(Fn3.neg(e)));
    const { x, y } = R.toAffine();
    if (R.is0() || !hasEven(y) || x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var schnorr = /* @__PURE__ */ (() => {
  const size = 32;
  const seedLength = 48;
  const randomSecretKey2 = (seed = randomBytes(seedLength)) => {
    return mapHashToField(seed, secp256k1_CURVE.n);
  };
  return {
    keygen: createKeygen(randomSecretKey2, schnorrGetPublicKey),
    getPublicKey: schnorrGetPublicKey,
    sign: schnorrSign,
    verify: schnorrVerify,
    Point: Pointk1,
    utils: {
      randomSecretKey: randomSecretKey2,
      taggedHash,
      lift_x,
      pointToBytes
    },
    lengths: {
      secretKey: size,
      publicKey: size,
      publicKeyHasPrefix: false,
      signature: size * 2,
      seed: seedLength
    }
  };
})();

// node_modules/@noble/hashes/legacy.js
var Rho160 = /* @__PURE__ */ Uint8Array.from([
  7,
  4,
  13,
  1,
  10,
  6,
  15,
  3,
  12,
  0,
  9,
  5,
  2,
  14,
  11,
  8
]);
var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
var idxLR = /* @__PURE__ */ (() => {
  const L3 = [Id160];
  const R = [Pi160];
  const res = [L3, R];
  for (let i = 0; i < 4; i++)
    for (let j of res)
      j.push(j[i].map((k) => Rho160[k]));
  return res;
})();
var idxL = /* @__PURE__ */ (() => idxLR[0])();
var idxR = /* @__PURE__ */ (() => idxLR[1])();
var shifts160 = /* @__PURE__ */ [
  [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
  [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
  [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
  [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
  [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
].map((i) => Uint8Array.from(i));
var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
var Kl160 = /* @__PURE__ */ Uint32Array.from([
  0,
  1518500249,
  1859775393,
  2400959708,
  2840853838
]);
var Kr160 = /* @__PURE__ */ Uint32Array.from([
  1352829926,
  1548603684,
  1836072691,
  2053994217,
  0
]);
function ripemd_f(group, x, y, z) {
  if (group === 0)
    return x ^ y ^ z;
  if (group === 1)
    return x & y | ~x & z;
  if (group === 2)
    return (x | ~y) ^ z;
  if (group === 3)
    return x & z | y & ~z;
  return x ^ (y | ~z);
}
var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
var _RIPEMD160 = class extends HashMD {
  h0 = 1732584193 | 0;
  h1 = 4023233417 | 0;
  h2 = 2562383102 | 0;
  h3 = 271733878 | 0;
  h4 = 3285377520 | 0;
  constructor() {
    super(64, 20, 8, true);
  }
  get() {
    const { h0, h1, h2, h3, h4 } = this;
    return [h0, h1, h2, h3, h4];
  }
  set(h0, h1, h2, h3, h4) {
    this.h0 = h0 | 0;
    this.h1 = h1 | 0;
    this.h2 = h2 | 0;
    this.h3 = h3 | 0;
    this.h4 = h4 | 0;
  }
  process(view2, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      BUF_160[i] = view2.getUint32(offset, true);
    let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr2 = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
    for (let group = 0; group < 5; group++) {
      const rGroup = 4 - group;
      const hbl = Kl160[group], hbr = Kr160[group];
      const rl = idxL[group], rr = idxR[group];
      const sl = shiftsL160[group], sr = shiftsR160[group];
      for (let i = 0; i < 16; i++) {
        const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
        al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
      }
      for (let i = 0; i < 16; i++) {
        const tr = rotl(ar + ripemd_f(rGroup, br, cr2, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
        ar = er, er = dr, dr = rotl(cr2, 10) | 0, cr2 = br, br = tr;
      }
    }
    this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr2 | 0);
  }
  roundClean() {
    clean(BUF_160);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0);
  }
};
var ripemd160 = /* @__PURE__ */ createHasher(() => new _RIPEMD160());

// node_modules/micro-packed/index.js
var EMPTY = /* @__PURE__ */ Uint8Array.of();
var NULL = /* @__PURE__ */ Uint8Array.of(0);
function equalBytes2(a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] !== b[i])
      return false;
  return true;
}
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function concatBytes2(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    if (!isBytes3(a))
      throw new Error("Uint8Array expected");
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
var createView2 = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isNum(num2) {
  return Number.isSafeInteger(num2);
}
var utils = {
  equalBytes: equalBytes2,
  isBytes: isBytes3,
  isCoder,
  checkBounds,
  concatBytes: concatBytes2,
  createView: createView2,
  isPlainObject
};
var lengthCoder = (len) => {
  if (len !== null && typeof len !== "string" && !isCoder(len) && !isBytes3(len) && !isNum(len)) {
    throw new Error(`lengthCoder: expected null | number | Uint8Array | CoderType, got ${len} (${typeof len})`);
  }
  return {
    encodeStream(w, value) {
      if (len === null)
        return;
      if (isCoder(len))
        return len.encodeStream(w, value);
      let byteLen;
      if (typeof len === "number")
        byteLen = len;
      else if (typeof len === "string")
        byteLen = Path.resolve(w.stack, len);
      if (typeof byteLen === "bigint")
        byteLen = Number(byteLen);
      if (byteLen === void 0 || byteLen !== value)
        throw w.err(`Wrong length: ${byteLen} len=${len} exp=${value} (${typeof value})`);
    },
    decodeStream(r) {
      let byteLen;
      if (isCoder(len))
        byteLen = Number(len.decodeStream(r));
      else if (typeof len === "number")
        byteLen = len;
      else if (typeof len === "string")
        byteLen = Path.resolve(r.stack, len);
      if (typeof byteLen === "bigint")
        byteLen = Number(byteLen);
      if (typeof byteLen !== "number")
        throw r.err(`Wrong length: ${byteLen}`);
      return byteLen;
    }
  };
};
var Bitset = {
  BITS: 32,
  FULL_MASK: -1 >>> 0,
  // 1<<32 will overflow
  len: (len) => Math.ceil(len / 32),
  create: (len) => new Uint32Array(Bitset.len(len)),
  clean: (bs) => bs.fill(0),
  debug: (bs) => Array.from(bs).map((i) => (i >>> 0).toString(2).padStart(32, "0")),
  checkLen: (bs, len) => {
    if (Bitset.len(len) === bs.length)
      return;
    throw new Error(`wrong length=${bs.length}. Expected: ${Bitset.len(len)}`);
  },
  chunkLen: (bsLen, pos, len) => {
    if (pos < 0)
      throw new Error(`wrong pos=${pos}`);
    if (pos + len > bsLen)
      throw new Error(`wrong range=${pos}/${len} of ${bsLen}`);
  },
  set: (bs, chunk, value, allowRewrite = true) => {
    if (!allowRewrite && (bs[chunk] & value) !== 0)
      return false;
    bs[chunk] |= value;
    return true;
  },
  pos: (pos, i) => ({
    chunk: Math.floor((pos + i) / 32),
    mask: 1 << 32 - (pos + i) % 32 - 1
  }),
  indices: (bs, len, invert3 = false) => {
    Bitset.checkLen(bs, len);
    const { FULL_MASK, BITS } = Bitset;
    const left = BITS - len % BITS;
    const lastMask = left ? FULL_MASK >>> left << left : FULL_MASK;
    const res = [];
    for (let i = 0; i < bs.length; i++) {
      let c = bs[i];
      if (invert3)
        c = ~c;
      if (i === bs.length - 1)
        c &= lastMask;
      if (c === 0)
        continue;
      for (let j = 0; j < BITS; j++) {
        const m = 1 << BITS - j - 1;
        if (c & m)
          res.push(i * BITS + j);
      }
    }
    return res;
  },
  range: (arr) => {
    const res = [];
    let cur;
    for (const i of arr) {
      if (cur === void 0 || i !== cur.pos + cur.length)
        res.push(cur = { pos: i, length: 1 });
      else
        cur.length += 1;
    }
    return res;
  },
  rangeDebug: (bs, len, invert3 = false) => `[${Bitset.range(Bitset.indices(bs, len, invert3)).map((i) => `(${i.pos}/${i.length})`).join(", ")}]`,
  setRange: (bs, bsLen, pos, len, allowRewrite = true) => {
    Bitset.chunkLen(bsLen, pos, len);
    const { FULL_MASK, BITS } = Bitset;
    const first = pos % BITS ? Math.floor(pos / BITS) : void 0;
    const lastPos = pos + len;
    const last = lastPos % BITS ? Math.floor(lastPos / BITS) : void 0;
    if (first !== void 0 && first === last)
      return Bitset.set(bs, first, FULL_MASK >>> BITS - len << BITS - len - pos, allowRewrite);
    if (first !== void 0) {
      if (!Bitset.set(bs, first, FULL_MASK >>> pos % BITS, allowRewrite))
        return false;
    }
    const start = first !== void 0 ? first + 1 : pos / BITS;
    const end = last !== void 0 ? last : lastPos / BITS;
    for (let i = start; i < end; i++)
      if (!Bitset.set(bs, i, FULL_MASK, allowRewrite))
        return false;
    if (last !== void 0 && first !== last) {
      if (!Bitset.set(bs, last, FULL_MASK << BITS - lastPos % BITS, allowRewrite))
        return false;
    }
    return true;
  }
};
var Path = {
  /**
   * Internal method for handling stack of paths (debug, errors, dynamic fields via path)
   * This is looks ugly (callback), but allows us to force stack cleaning by construction (.pop always after function).
   * Also, this makes impossible:
   * - pushing field when stack is empty
   * - pushing field inside of field (real bug)
   * NOTE: we don't want to do '.pop' on error!
   */
  pushObj: (stack, obj, objFn) => {
    const last = { obj };
    stack.push(last);
    objFn((field, fieldFn) => {
      last.field = field;
      fieldFn();
      last.field = void 0;
    });
    stack.pop();
  },
  path: (stack) => {
    const res = [];
    for (const i of stack)
      if (i.field !== void 0)
        res.push(i.field);
    return res.join("/");
  },
  err: (name, stack, msg) => {
    const err2 = new Error(`${name}(${Path.path(stack)}): ${typeof msg === "string" ? msg : msg.message}`);
    if (msg instanceof Error && msg.stack)
      err2.stack = msg.stack;
    return err2;
  },
  resolve: (stack, path) => {
    const parts = path.split("/");
    const objPath = stack.map((i2) => i2.obj);
    let i = 0;
    for (; i < parts.length; i++) {
      if (parts[i] === "..")
        objPath.pop();
      else
        break;
    }
    let cur = objPath.pop();
    for (; i < parts.length; i++) {
      if (!cur || cur[parts[i]] === void 0)
        return void 0;
      cur = cur[parts[i]];
    }
    return cur;
  }
};
var _Reader = class __Reader {
  pos = 0;
  data;
  opts;
  stack;
  parent;
  parentOffset;
  bitBuf = 0;
  bitPos = 0;
  bs;
  // bitset
  view;
  constructor(data, opts = {}, stack = [], parent = void 0, parentOffset = 0) {
    this.data = data;
    this.opts = opts;
    this.stack = stack;
    this.parent = parent;
    this.parentOffset = parentOffset;
    this.view = createView2(data);
  }
  /** Internal method for pointers. */
  _enablePointers() {
    if (this.parent)
      return this.parent._enablePointers();
    if (this.bs)
      return;
    this.bs = Bitset.create(this.data.length);
    Bitset.setRange(this.bs, this.data.length, 0, this.pos, this.opts.allowMultipleReads);
  }
  markBytesBS(pos, len) {
    if (this.parent)
      return this.parent.markBytesBS(this.parentOffset + pos, len);
    if (!len)
      return true;
    if (!this.bs)
      return true;
    return Bitset.setRange(this.bs, this.data.length, pos, len, false);
  }
  markBytes(len) {
    const pos = this.pos;
    this.pos += len;
    const res = this.markBytesBS(pos, len);
    if (!this.opts.allowMultipleReads && !res)
      throw this.err(`multiple read pos=${this.pos} len=${len}`);
    return res;
  }
  pushObj(obj, objFn) {
    return Path.pushObj(this.stack, obj, objFn);
  }
  readView(n, fn) {
    if (!Number.isFinite(n))
      throw this.err(`readView: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readView: Unexpected end of buffer");
    const res = fn(this.view, this.pos);
    this.markBytes(n);
    return res;
  }
  // read bytes by absolute offset
  absBytes(n) {
    if (n > this.data.length)
      throw new Error("Unexpected end of buffer");
    return this.data.subarray(n);
  }
  finish() {
    if (this.opts.allowUnreadBytes)
      return;
    if (this.bitPos) {
      throw this.err(`${this.bitPos} bits left after unpack: ${hex.encode(this.data.slice(this.pos))}`);
    }
    if (this.bs && !this.parent) {
      const notRead = Bitset.indices(this.bs, this.data.length, true);
      if (notRead.length) {
        const formatted = Bitset.range(notRead).map(({ pos, length }) => `(${pos}/${length})[${hex.encode(this.data.subarray(pos, pos + length))}]`).join(", ");
        throw this.err(`unread byte ranges: ${formatted} (total=${this.data.length})`);
      } else
        return;
    }
    if (!this.isEnd()) {
      throw this.err(`${this.leftBytes} bytes ${this.bitPos} bits left after unpack: ${hex.encode(this.data.slice(this.pos))}`);
    }
  }
  // User methods
  err(msg) {
    return Path.err("Reader", this.stack, msg);
  }
  offsetReader(n) {
    if (n > this.data.length)
      throw this.err("offsetReader: Unexpected end of buffer");
    return new __Reader(this.absBytes(n), this.opts, this.stack, this, n);
  }
  bytes(n, peek = false) {
    if (this.bitPos)
      throw this.err("readBytes: bitPos not empty");
    if (!Number.isFinite(n))
      throw this.err(`readBytes: wrong length=${n}`);
    if (this.pos + n > this.data.length)
      throw this.err("readBytes: Unexpected end of buffer");
    const slice = this.data.subarray(this.pos, this.pos + n);
    if (!peek)
      this.markBytes(n);
    return slice;
  }
  byte(peek = false) {
    if (this.bitPos)
      throw this.err("readByte: bitPos not empty");
    if (this.pos + 1 > this.data.length)
      throw this.err("readBytes: Unexpected end of buffer");
    const data = this.data[this.pos];
    if (!peek)
      this.markBytes(1);
    return data;
  }
  get leftBytes() {
    return this.data.length - this.pos;
  }
  get totalBytes() {
    return this.data.length;
  }
  isEnd() {
    return this.pos >= this.data.length && !this.bitPos;
  }
  // bits are read in BE mode (left to right): (0b1000_0000).readBits(1) == 1
  bits(bits) {
    if (bits > 32)
      throw this.err("BitReader: cannot read more than 32 bits in single call");
    let out = 0;
    while (bits) {
      if (!this.bitPos) {
        this.bitBuf = this.byte();
        this.bitPos = 8;
      }
      const take = Math.min(bits, this.bitPos);
      this.bitPos -= take;
      out = out << take | this.bitBuf >> this.bitPos & 2 ** take - 1;
      this.bitBuf &= 2 ** this.bitPos - 1;
      bits -= take;
    }
    return out >>> 0;
  }
  find(needle, pos = this.pos) {
    if (!isBytes3(needle))
      throw this.err(`find: needle is not bytes! ${needle}`);
    if (this.bitPos)
      throw this.err("findByte: bitPos not empty");
    if (!needle.length)
      throw this.err(`find: needle is empty`);
    for (let idx = pos; (idx = this.data.indexOf(needle[0], idx)) !== -1; idx++) {
      if (idx === -1)
        return;
      const leftBytes = this.data.length - idx;
      if (leftBytes < needle.length)
        return;
      if (equalBytes2(needle, this.data.subarray(idx, idx + needle.length)))
        return idx;
    }
    return;
  }
};
var _Writer = class {
  pos = 0;
  stack;
  // We could have a single buffer here and re-alloc it with
  // x1.5-2 size each time it full, but it will be slower:
  // basic/encode bench: 395ns -> 560ns
  buffers = [];
  ptrs = [];
  bitBuf = 0;
  bitPos = 0;
  viewBuf = new Uint8Array(8);
  view;
  finished = false;
  constructor(stack = []) {
    this.stack = stack;
    this.view = createView2(this.viewBuf);
  }
  pushObj(obj, objFn) {
    return Path.pushObj(this.stack, obj, objFn);
  }
  writeView(len, fn) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (!isNum(len) || len > 8)
      throw new Error(`wrong writeView length=${len}`);
    fn(this.view);
    this.bytes(this.viewBuf.slice(0, len));
    this.viewBuf.fill(0);
  }
  // User methods
  err(msg) {
    if (this.finished)
      throw this.err("buffer: finished");
    return Path.err("Reader", this.stack, msg);
  }
  bytes(b) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeBytes: ends with non-empty bit buffer");
    this.buffers.push(b);
    this.pos += b.length;
  }
  byte(b) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("writeByte: ends with non-empty bit buffer");
    this.buffers.push(new Uint8Array([b]));
    this.pos++;
  }
  finish(clean2 = true) {
    if (this.finished)
      throw this.err("buffer: finished");
    if (this.bitPos)
      throw this.err("buffer: ends with non-empty bit buffer");
    const buffers = this.buffers.concat(this.ptrs.map((i) => i.buffer));
    const sum = buffers.map((b) => b.length).reduce((a, b) => a + b, 0);
    const buf = new Uint8Array(sum);
    for (let i = 0, pad = 0; i < buffers.length; i++) {
      const a = buffers[i];
      buf.set(a, pad);
      pad += a.length;
    }
    for (let pos = this.pos, i = 0; i < this.ptrs.length; i++) {
      const ptr = this.ptrs[i];
      buf.set(ptr.ptr.encode(pos), ptr.pos);
      pos += ptr.buffer.length;
    }
    if (clean2) {
      this.buffers = [];
      for (const p of this.ptrs)
        p.buffer.fill(0);
      this.ptrs = [];
      this.finished = true;
      this.bitBuf = 0;
    }
    return buf;
  }
  bits(value, bits) {
    if (bits > 32)
      throw this.err("writeBits: cannot write more than 32 bits in single call");
    if (value >= 2 ** bits)
      throw this.err(`writeBits: value (${value}) >= 2**bits (${bits})`);
    while (bits) {
      const take = Math.min(bits, 8 - this.bitPos);
      this.bitBuf = this.bitBuf << take | value >> bits - take;
      this.bitPos += take;
      bits -= take;
      value &= 2 ** bits - 1;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        this.buffers.push(new Uint8Array([this.bitBuf]));
        this.pos++;
      }
    }
  }
};
var swapEndianness = (b) => Uint8Array.from(b).reverse();
function checkBounds(value, bits, signed) {
  if (signed) {
    const signBit = 2n ** (bits - 1n);
    if (value < -signBit || value >= signBit)
      throw new Error(`value out of signed bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
  } else {
    if (0n > value || value >= 2n ** bits)
      throw new Error(`value out of unsigned bounds. Expected 0 <= ${value} < ${2n ** bits}`);
  }
}
function _wrap(inner) {
  return {
    // NOTE: we cannot export validate here, since it is likely mistake.
    encodeStream: inner.encodeStream,
    decodeStream: inner.decodeStream,
    size: inner.size,
    encode: (value) => {
      const w = new _Writer();
      inner.encodeStream(w, value);
      return w.finish();
    },
    decode: (data, opts = {}) => {
      const r = new _Reader(data, opts);
      const res = inner.decodeStream(r);
      r.finish();
      return res;
    }
  };
}
function validate(inner, fn) {
  if (!isCoder(inner))
    throw new Error(`validate: invalid inner value ${inner}`);
  if (typeof fn !== "function")
    throw new Error("validate: fn should be function");
  return _wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let res;
      try {
        res = fn(value);
      } catch (e) {
        throw w.err(e);
      }
      inner.encodeStream(w, res);
    },
    decodeStream: (r) => {
      const res = inner.decodeStream(r);
      try {
        return fn(res);
      } catch (e) {
        throw r.err(e);
      }
    }
  });
}
var wrap = (inner) => {
  const res = _wrap(inner);
  return inner.validate ? validate(res, inner.validate) : res;
};
var isBaseCoder = (elm) => isPlainObject(elm) && typeof elm.decode === "function" && typeof elm.encode === "function";
function isCoder(elm) {
  return isPlainObject(elm) && isBaseCoder(elm) && typeof elm.encodeStream === "function" && typeof elm.decodeStream === "function" && (elm.size === void 0 || isNum(elm.size));
}
function dict() {
  return {
    encode: (from) => {
      if (!Array.isArray(from))
        throw new Error("array expected");
      const to = {};
      for (const item of from) {
        if (!Array.isArray(item) || item.length !== 2)
          throw new Error(`array of two elements expected`);
        const name = item[0];
        const value = item[1];
        if (to[name] !== void 0)
          throw new Error(`key(${name}) appears twice in struct`);
        to[name] = value;
      }
      return to;
    },
    decode: (to) => {
      if (!isPlainObject(to))
        throw new Error(`expected plain object, got ${to}`);
      return Object.entries(to);
    }
  };
}
var numberBigint = {
  encode: (from) => {
    if (typeof from !== "bigint")
      throw new Error(`expected bigint, got ${typeof from}`);
    if (from > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error(`element bigger than MAX_SAFE_INTEGER=${from}`);
    return Number(from);
  },
  decode: (to) => {
    if (!isNum(to))
      throw new Error("element is not a safe integer");
    return BigInt(to);
  }
};
function tsEnum(e) {
  if (!isPlainObject(e))
    throw new Error("plain object expected");
  return {
    encode: (from) => {
      if (!isNum(from) || !(from in e))
        throw new Error(`wrong value ${from}`);
      return e[from];
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`wrong value ${typeof to}`);
      return e[to];
    }
  };
}
function decimal(precision, round = false) {
  if (!isNum(precision))
    throw new Error(`decimal/precision: wrong value ${precision}`);
  if (typeof round !== "boolean")
    throw new Error(`decimal/round: expected boolean, got ${typeof round}`);
  const decimalMask = 10n ** BigInt(precision);
  return {
    encode: (from) => {
      if (typeof from !== "bigint")
        throw new Error(`expected bigint, got ${typeof from}`);
      let s = (from < 0n ? -from : from).toString(10);
      let sep = s.length - precision;
      if (sep < 0) {
        s = s.padStart(s.length - sep, "0");
        sep = 0;
      }
      let i = s.length - 1;
      for (; i >= sep && s[i] === "0"; i--)
        ;
      let int = s.slice(0, sep);
      let frac = s.slice(sep, i + 1);
      if (!int)
        int = "0";
      if (from < 0n)
        int = "-" + int;
      if (!frac)
        return int;
      return `${int}.${frac}`;
    },
    decode: (to) => {
      if (typeof to !== "string")
        throw new Error(`expected string, got ${typeof to}`);
      if (to === "-0")
        throw new Error(`negative zero is not allowed`);
      let neg = false;
      if (to.startsWith("-")) {
        neg = true;
        to = to.slice(1);
      }
      if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(to))
        throw new Error(`wrong string value=${to}`);
      let sep = to.indexOf(".");
      sep = sep === -1 ? to.length : sep;
      const intS = to.slice(0, sep);
      const fracS = to.slice(sep + 1).replace(/0+$/, "");
      const int = BigInt(intS) * decimalMask;
      if (!round && fracS.length > precision) {
        throw new Error(`fractional part cannot be represented with this precision (num=${to}, prec=${precision})`);
      }
      const fracLen = Math.min(fracS.length, precision);
      const frac = BigInt(fracS.slice(0, fracLen)) * 10n ** BigInt(precision - fracLen);
      const value = int + frac;
      return neg ? -value : value;
    }
  };
}
function match(lst) {
  if (!Array.isArray(lst))
    throw new Error(`expected array, got ${typeof lst}`);
  for (const i of lst)
    if (!isBaseCoder(i))
      throw new Error(`wrong base coder ${i}`);
  return {
    encode: (from) => {
      for (const c of lst) {
        const elm = c.encode(from);
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/encode: cannot find match in ${from}`);
    },
    decode: (to) => {
      for (const c of lst) {
        const elm = c.decode(to);
        if (elm !== void 0)
          return elm;
      }
      throw new Error(`match/decode: cannot find match in ${to}`);
    }
  };
}
var reverse = (coder) => {
  if (!isBaseCoder(coder))
    throw new Error("BaseCoder expected");
  return { encode: coder.decode, decode: coder.encode };
};
var coders = { dict, numberBigint, tsEnum, decimal, match, reverse };
var bigint = (size, le = false, signed = false, sized = true) => {
  if (!isNum(size))
    throw new Error(`bigint/size: wrong value ${size}`);
  if (typeof le !== "boolean")
    throw new Error(`bigint/le: expected boolean, got ${typeof le}`);
  if (typeof signed !== "boolean")
    throw new Error(`bigint/signed: expected boolean, got ${typeof signed}`);
  if (typeof sized !== "boolean")
    throw new Error(`bigint/sized: expected boolean, got ${typeof sized}`);
  const bLen = BigInt(size);
  const signBit = 2n ** (8n * bLen - 1n);
  return wrap({
    size: sized ? size : void 0,
    encodeStream: (w, value) => {
      if (signed && value < 0)
        value = value | signBit;
      const b = [];
      for (let i = 0; i < size; i++) {
        b.push(Number(value & 255n));
        value >>= 8n;
      }
      let res = new Uint8Array(b).reverse();
      if (!sized) {
        let pos = 0;
        for (pos = 0; pos < res.length; pos++)
          if (res[pos] !== 0)
            break;
        res = res.subarray(pos);
      }
      w.bytes(le ? res.reverse() : res);
    },
    decodeStream: (r) => {
      const value = r.bytes(sized ? size : Math.min(size, r.leftBytes));
      const b = le ? value : swapEndianness(value);
      let res = 0n;
      for (let i = 0; i < b.length; i++)
        res |= BigInt(b[i]) << 8n * BigInt(i);
      if (signed && res & signBit)
        res = (res ^ signBit) - signBit;
      return res;
    },
    validate: (value) => {
      if (typeof value !== "bigint")
        throw new Error(`bigint: invalid value: ${value}`);
      checkBounds(value, 8n * bLen, !!signed);
      return value;
    }
  });
};
var U256BE = /* @__PURE__ */ bigint(32, false);
var U64LE = /* @__PURE__ */ bigint(8, true);
var I64LE = /* @__PURE__ */ bigint(8, true, true);
var view = (len, opts) => wrap({
  size: len,
  encodeStream: (w, value) => w.writeView(len, (view2) => opts.write(view2, value)),
  decodeStream: (r) => r.readView(len, opts.read),
  validate: (value) => {
    if (typeof value !== "number")
      throw new Error(`viewCoder: expected number, got ${typeof value}`);
    if (opts.validate)
      opts.validate(value);
    return value;
  }
});
var intView = (len, signed, opts) => {
  const bits = len * 8;
  const signBit = 2 ** (bits - 1);
  const validateSigned = (value) => {
    if (!isNum(value))
      throw new Error(`sintView: value is not safe integer: ${value}`);
    if (value < -signBit || value >= signBit) {
      throw new Error(`sintView: value out of bounds. Expected ${-signBit} <= ${value} < ${signBit}`);
    }
  };
  const maxVal = 2 ** bits;
  const validateUnsigned = (value) => {
    if (!isNum(value))
      throw new Error(`uintView: value is not safe integer: ${value}`);
    if (0 > value || value >= maxVal) {
      throw new Error(`uintView: value out of bounds. Expected 0 <= ${value} < ${maxVal}`);
    }
  };
  return view(len, {
    write: opts.write,
    read: opts.read,
    validate: signed ? validateSigned : validateUnsigned
  });
};
var U32LE = /* @__PURE__ */ intView(4, false, {
  read: (view2, pos) => view2.getUint32(pos, true),
  write: (view2, value) => view2.setUint32(0, value, true)
});
var U32BE = /* @__PURE__ */ intView(4, false, {
  read: (view2, pos) => view2.getUint32(pos, false),
  write: (view2, value) => view2.setUint32(0, value, false)
});
var I32LE = /* @__PURE__ */ intView(4, true, {
  read: (view2, pos) => view2.getInt32(pos, true),
  write: (view2, value) => view2.setInt32(0, value, true)
});
var U16LE = /* @__PURE__ */ intView(2, false, {
  read: (view2, pos) => view2.getUint16(pos, true),
  write: (view2, value) => view2.setUint16(0, value, true)
});
var U8 = /* @__PURE__ */ intView(1, false, {
  read: (view2, pos) => view2.getUint8(pos),
  write: (view2, value) => view2.setUint8(0, value)
});
var createBytes = (len, le = false) => {
  if (typeof le !== "boolean")
    throw new Error(`bytes/le: expected boolean, got ${typeof le}`);
  const _length = lengthCoder(len);
  const _isb = isBytes3(len);
  return wrap({
    size: typeof len === "number" ? len : void 0,
    encodeStream: (w, value) => {
      if (!_isb)
        _length.encodeStream(w, value.length);
      w.bytes(le ? swapEndianness(value) : value);
      if (_isb)
        w.bytes(len);
    },
    decodeStream: (r) => {
      let bytes;
      if (_isb) {
        const tPos = r.find(len);
        if (!tPos)
          throw r.err(`bytes: cannot find terminator`);
        bytes = r.bytes(tPos - r.pos);
        r.bytes(len.length);
      } else {
        bytes = r.bytes(len === null ? r.leftBytes : _length.decodeStream(r));
      }
      return le ? swapEndianness(bytes) : bytes;
    },
    validate: (value) => {
      if (!isBytes3(value))
        throw new Error(`bytes: invalid value ${value}`);
      return value;
    }
  });
};
function prefix(len, inner) {
  if (!isCoder(inner))
    throw new Error(`prefix: invalid inner value ${inner}`);
  return apply(createBytes(len), reverse(inner));
}
var string = (len, le = false) => validate(apply(createBytes(len, le), utf8), (value) => {
  if (typeof value !== "string")
    throw new Error(`expected string, got ${typeof value}`);
  return value;
});
var createHex = (len, options = { isLE: false, with0x: false }) => {
  let inner = apply(createBytes(len, options.isLE), hex);
  const prefix2 = options.with0x;
  if (typeof prefix2 !== "boolean")
    throw new Error(`hex/with0x: expected boolean, got ${typeof prefix2}`);
  if (prefix2) {
    inner = apply(inner, {
      encode: (value) => `0x${value}`,
      decode: (value) => {
        if (!value.startsWith("0x"))
          throw new Error("hex(with0x=true).encode input should start with 0x");
        return value.slice(2);
      }
    });
  }
  return inner;
};
function apply(inner, base) {
  if (!isCoder(inner))
    throw new Error(`apply: invalid inner value ${inner}`);
  if (!isBaseCoder(base))
    throw new Error(`apply: invalid base value ${inner}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, value) => {
      let innerValue;
      try {
        innerValue = base.decode(value);
      } catch (e) {
        throw w.err("" + e);
      }
      return inner.encodeStream(w, innerValue);
    },
    decodeStream: (r) => {
      const innerValue = inner.decodeStream(r);
      try {
        return base.encode(innerValue);
      } catch (e) {
        throw r.err("" + e);
      }
    }
  });
}
var flag = (flagValue, xor = false) => {
  if (!isBytes3(flagValue))
    throw new Error(`flag/flagValue: expected Uint8Array, got ${typeof flagValue}`);
  if (typeof xor !== "boolean")
    throw new Error(`flag/xor: expected boolean, got ${typeof xor}`);
  return wrap({
    size: flagValue.length,
    encodeStream: (w, value) => {
      if (!!value !== xor)
        w.bytes(flagValue);
    },
    decodeStream: (r) => {
      let hasFlag = r.leftBytes >= flagValue.length;
      if (hasFlag) {
        hasFlag = equalBytes2(r.bytes(flagValue.length, true), flagValue);
        if (hasFlag)
          r.bytes(flagValue.length);
      }
      return hasFlag !== xor;
    },
    validate: (value) => {
      if (value !== void 0 && typeof value !== "boolean")
        throw new Error(`flag: expected boolean value or undefined, got ${typeof value}`);
      return value;
    }
  });
};
function flagged(path, inner, def2) {
  if (!isCoder(inner))
    throw new Error(`flagged: invalid inner value ${inner}`);
  if (typeof path !== "string" && !isCoder(inner))
    throw new Error(`flagged: wrong path=${path}`);
  return wrap({
    encodeStream: (w, value) => {
      if (typeof path === "string") {
        if (Path.resolve(w.stack, path))
          inner.encodeStream(w, value);
        else if (def2)
          inner.encodeStream(w, def2);
      } else {
        path.encodeStream(w, !!value);
        if (!!value)
          inner.encodeStream(w, value);
        else if (def2)
          inner.encodeStream(w, def2);
      }
    },
    decodeStream: (r) => {
      let hasFlag = false;
      if (typeof path === "string")
        hasFlag = !!Path.resolve(r.stack, path);
      else
        hasFlag = path.decodeStream(r);
      if (hasFlag)
        return inner.decodeStream(r);
      else if (def2)
        inner.decodeStream(r);
      return;
    }
  });
}
function magic(inner, constant, check = true) {
  if (!isCoder(inner))
    throw new Error(`magic: invalid inner value ${inner}`);
  if (typeof check !== "boolean")
    throw new Error(`magic: expected boolean, got ${typeof check}`);
  return wrap({
    size: inner.size,
    encodeStream: (w, _value) => inner.encodeStream(w, constant),
    decodeStream: (r) => {
      const value = inner.decodeStream(r);
      if (check && typeof value !== "object" && value !== constant || isBytes3(constant) && !equalBytes2(constant, value)) {
        throw r.err(`magic: invalid value: ${value} !== ${constant}`);
      }
      return;
    },
    validate: (value) => {
      if (value !== void 0)
        throw new Error(`magic: wrong value=${typeof value}`);
      return value;
    }
  });
}
function sizeof(fields) {
  let size = 0;
  for (const f of fields) {
    if (f.size === void 0)
      return;
    if (!isNum(f.size))
      throw new Error(`sizeof: wrong element size=${size}`);
    size += f.size;
  }
  return size;
}
function struct(fields) {
  if (!isPlainObject(fields))
    throw new Error(`struct: expected plain object, got ${fields}`);
  for (const name in fields) {
    if (!isCoder(fields[name]))
      throw new Error(`struct: field ${name} is not CoderType`);
  }
  return wrap({
    size: sizeof(Object.values(fields)),
    encodeStream: (w, value) => {
      w.pushObj(value, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => fields[name].encodeStream(w, value[name]));
      });
    },
    decodeStream: (r) => {
      const res = {};
      r.pushObj(res, (fieldFn) => {
        for (const name in fields)
          fieldFn(name, () => res[name] = fields[name].decodeStream(r));
      });
      return res;
    },
    validate: (value) => {
      if (typeof value !== "object" || value === null)
        throw new Error(`struct: invalid value ${value}`);
      return value;
    }
  });
}
function tuple(fields) {
  if (!Array.isArray(fields))
    throw new Error(`Packed.Tuple: got ${typeof fields} instead of array`);
  for (let i = 0; i < fields.length; i++) {
    if (!isCoder(fields[i]))
      throw new Error(`tuple: field ${i} is not CoderType`);
  }
  return wrap({
    size: sizeof(fields),
    encodeStream: (w, value) => {
      if (!Array.isArray(value))
        throw w.err(`tuple: invalid value ${value}`);
      w.pushObj(value, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => fields[i].encodeStream(w, value[i]));
      });
    },
    decodeStream: (r) => {
      const res = [];
      r.pushObj(res, (fieldFn) => {
        for (let i = 0; i < fields.length; i++)
          fieldFn(`${i}`, () => res.push(fields[i].decodeStream(r)));
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`tuple: invalid value ${value}`);
      if (value.length !== fields.length)
        throw new Error(`tuple: wrong length=${value.length}, expected ${fields.length}`);
      return value;
    }
  });
}
function array(len, inner) {
  if (!isCoder(inner))
    throw new Error(`array: invalid inner value ${inner}`);
  const _length = lengthCoder(typeof len === "string" ? `../${len}` : len);
  return wrap({
    size: typeof len === "number" && inner.size ? len * inner.size : void 0,
    encodeStream: (w, value) => {
      const _w = w;
      _w.pushObj(value, (fieldFn) => {
        if (!isBytes3(len))
          _length.encodeStream(w, value.length);
        for (let i = 0; i < value.length; i++) {
          fieldFn(`${i}`, () => {
            const elm = value[i];
            const startPos = w.pos;
            inner.encodeStream(w, elm);
            if (isBytes3(len)) {
              if (len.length > _w.pos - startPos)
                return;
              const data = _w.finish(false).subarray(startPos, _w.pos);
              if (equalBytes2(data.subarray(0, len.length), len))
                throw _w.err(`array: inner element encoding same as separator. elm=${elm} data=${data}`);
            }
          });
        }
      });
      if (isBytes3(len))
        w.bytes(len);
    },
    decodeStream: (r) => {
      const res = [];
      r.pushObj(res, (fieldFn) => {
        if (len === null) {
          for (let i = 0; !r.isEnd(); i++) {
            fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
            if (inner.size && r.leftBytes < inner.size)
              break;
          }
        } else if (isBytes3(len)) {
          for (let i = 0; ; i++) {
            if (equalBytes2(r.bytes(len.length, true), len)) {
              r.bytes(len.length);
              break;
            }
            fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
          }
        } else {
          let length;
          fieldFn("arrayLen", () => length = _length.decodeStream(r));
          for (let i = 0; i < length; i++)
            fieldFn(`${i}`, () => res.push(inner.decodeStream(r)));
        }
      });
      return res;
    },
    validate: (value) => {
      if (!Array.isArray(value))
        throw new Error(`array: invalid value ${value}`);
      return value;
    }
  });
}

// node_modules/@scure/btc-signer/utils.js
var Point = secp256k1.Point;
var Fn = Point.Fn;
var CURVE_ORDER = Point.Fn.ORDER;
var hasEven2 = (y) => y % 2n === 0n;
var isBytes4 = utils.isBytes;
var concatBytes3 = utils.concatBytes;
var equalBytes3 = utils.equalBytes;
var hash160 = (msg) => ripemd160(sha256(msg));
var sha256x2 = (...msgs) => sha256(sha256(concatBytes3(...msgs)));
var randomPrivateKeyBytes = schnorr.utils.randomSecretKey;
var pubSchnorr = schnorr.getPublicKey;
var pubECDSA = secp256k1.getPublicKey;
var hasLowR = (sig) => sig.r < CURVE_ORDER / 2n;
function signECDSA(hash, privateKey, lowR = false) {
  let sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false }));
  if (lowR && !hasLowR(sig)) {
    const extraEntropy = new Uint8Array(32);
    let counter = 0;
    while (!hasLowR(sig)) {
      extraEntropy.set(U32LE.encode(counter++));
      sig = secp256k1.Signature.fromBytes(secp256k1.sign(hash, privateKey, { prehash: false, extraEntropy }));
      if (counter > 4294967295)
        throw new Error("lowR counter overflow: report the error");
    }
  }
  return sig.toBytes("der");
}
var signSchnorr = schnorr.sign;
var tagSchnorr = schnorr.utils.taggedHash;
var PubT = {
  ecdsa: 0,
  schnorr: 1
};
function validatePubkey(pub, type) {
  const len = pub.length;
  if (type === PubT.ecdsa) {
    if (len === 32)
      throw new Error("Expected non-Schnorr key");
    Point.fromBytes(pub);
    return pub;
  } else if (type === PubT.schnorr) {
    if (len !== 32)
      throw new Error("Expected 32-byte Schnorr key");
    schnorr.utils.lift_x(bytesToNumberBE(pub));
    return pub;
  } else {
    throw new Error("Unknown key type");
  }
}
function tapTweak(a, b) {
  const u = schnorr.utils;
  const t = u.taggedHash("TapTweak", a, b);
  const tn = bytesToNumberBE(t);
  if (tn >= CURVE_ORDER)
    throw new Error("tweak higher than curve order");
  return tn;
}
function taprootTweakPrivKey(privKey, merkleRoot = Uint8Array.of()) {
  const u = schnorr.utils;
  const seckey0 = bytesToNumberBE(privKey);
  const P2 = Point.BASE.multiply(seckey0);
  const seckey = hasEven2(P2.y) ? seckey0 : Fn.neg(seckey0);
  const xP = u.pointToBytes(P2);
  const t = tapTweak(xP, merkleRoot);
  return numberToBytesBE(Fn.add(seckey, t), 32);
}
function taprootTweakPubkey(pubKey, h) {
  const u = schnorr.utils;
  const t = tapTweak(pubKey, h);
  const P2 = u.lift_x(bytesToNumberBE(pubKey));
  const Q = P2.add(Point.BASE.multiply(t));
  const parity = hasEven2(Q.y) ? 0 : 1;
  return [u.pointToBytes(Q), parity];
}
var TAPROOT_UNSPENDABLE_KEY = sha256(Point.BASE.toBytes(false));
var NETWORK = {
  bech32: "bc",
  pubKeyHash: 0,
  scriptHash: 5,
  wif: 128
};
var TEST_NETWORK = {
  bech32: "tb",
  pubKeyHash: 111,
  scriptHash: 196,
  wif: 239
};
function compareBytes(a, b) {
  if (!isBytes4(a) || !isBytes4(b))
    throw new Error(`cmp: wrong type a=${typeof a} b=${typeof b}`);
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++)
    if (a[i] != b[i])
      return Math.sign(a[i] - b[i]);
  return Math.sign(a.length - b.length);
}
function reverseObject(obj) {
  const res = {};
  for (const k in obj) {
    if (res[obj[k]] !== void 0)
      throw new Error("duplicate key");
    res[obj[k]] = k;
  }
  return res;
}

// node_modules/@scure/btc-signer/script.js
var OP = {
  OP_0: 0,
  PUSHDATA1: 76,
  PUSHDATA2: 77,
  PUSHDATA4: 78,
  "1NEGATE": 79,
  RESERVED: 80,
  OP_1: 81,
  OP_2: 82,
  OP_3: 83,
  OP_4: 84,
  OP_5: 85,
  OP_6: 86,
  OP_7: 87,
  OP_8: 88,
  OP_9: 89,
  OP_10: 90,
  OP_11: 91,
  OP_12: 92,
  OP_13: 93,
  OP_14: 94,
  OP_15: 95,
  OP_16: 96,
  // Control
  NOP: 97,
  VER: 98,
  IF: 99,
  NOTIF: 100,
  VERIF: 101,
  VERNOTIF: 102,
  ELSE: 103,
  ENDIF: 104,
  VERIFY: 105,
  RETURN: 106,
  // Stack
  TOALTSTACK: 107,
  FROMALTSTACK: 108,
  "2DROP": 109,
  "2DUP": 110,
  "3DUP": 111,
  "2OVER": 112,
  "2ROT": 113,
  "2SWAP": 114,
  IFDUP: 115,
  DEPTH: 116,
  DROP: 117,
  DUP: 118,
  NIP: 119,
  OVER: 120,
  PICK: 121,
  ROLL: 122,
  ROT: 123,
  SWAP: 124,
  TUCK: 125,
  // Splice
  CAT: 126,
  SUBSTR: 127,
  LEFT: 128,
  RIGHT: 129,
  SIZE: 130,
  // Boolean logic
  INVERT: 131,
  AND: 132,
  OR: 133,
  XOR: 134,
  EQUAL: 135,
  EQUALVERIFY: 136,
  RESERVED1: 137,
  RESERVED2: 138,
  // Numbers
  "1ADD": 139,
  "1SUB": 140,
  "2MUL": 141,
  "2DIV": 142,
  NEGATE: 143,
  ABS: 144,
  NOT: 145,
  "0NOTEQUAL": 146,
  ADD: 147,
  SUB: 148,
  MUL: 149,
  DIV: 150,
  MOD: 151,
  LSHIFT: 152,
  RSHIFT: 153,
  BOOLAND: 154,
  BOOLOR: 155,
  NUMEQUAL: 156,
  NUMEQUALVERIFY: 157,
  NUMNOTEQUAL: 158,
  LESSTHAN: 159,
  GREATERTHAN: 160,
  LESSTHANOREQUAL: 161,
  GREATERTHANOREQUAL: 162,
  MIN: 163,
  MAX: 164,
  WITHIN: 165,
  // Crypto
  RIPEMD160: 166,
  SHA1: 167,
  SHA256: 168,
  HASH160: 169,
  HASH256: 170,
  CODESEPARATOR: 171,
  CHECKSIG: 172,
  CHECKSIGVERIFY: 173,
  CHECKMULTISIG: 174,
  CHECKMULTISIGVERIFY: 175,
  // Expansion
  NOP1: 176,
  CHECKLOCKTIMEVERIFY: 177,
  CHECKSEQUENCEVERIFY: 178,
  NOP4: 179,
  NOP5: 180,
  NOP6: 181,
  NOP7: 182,
  NOP8: 183,
  NOP9: 184,
  NOP10: 185,
  // BIP 342
  CHECKSIGADD: 186,
  // Invalid
  INVALID: 255
};
var OPNames = reverseObject(OP);
function ScriptNum(bytesLimit = 6, forceMinimal = false) {
  return wrap({
    encodeStream: (w, value) => {
      if (value === 0n)
        return;
      const neg = value < 0;
      const val = BigInt(value);
      const nums = [];
      for (let abs = neg ? -val : val; abs; abs >>= 8n)
        nums.push(Number(abs & 0xffn));
      if (nums[nums.length - 1] >= 128)
        nums.push(neg ? 128 : 0);
      else if (neg)
        nums[nums.length - 1] |= 128;
      w.bytes(new Uint8Array(nums));
    },
    decodeStream: (r) => {
      const len = r.leftBytes;
      if (len > bytesLimit)
        throw new Error(`ScriptNum: number (${len}) bigger than limit=${bytesLimit}`);
      if (len === 0)
        return 0n;
      if (forceMinimal) {
        const data = r.bytes(len, true);
        if ((data[data.length - 1] & 127) === 0) {
          if (len <= 1 || (data[data.length - 2] & 128) === 0)
            throw new Error("Non-minimally encoded ScriptNum");
        }
      }
      let last = 0;
      let res = 0n;
      for (let i = 0; i < len; ++i) {
        last = r.byte();
        res |= BigInt(last) << 8n * BigInt(i);
      }
      if (last >= 128) {
        res &= 2n ** BigInt(len * 8) - 1n >> 1n;
        res = -res;
      }
      return res;
    }
  });
}
function OpToNum(op, bytesLimit = 4, forceMinimal = true) {
  if (typeof op === "number")
    return op;
  if (isBytes4(op)) {
    try {
      const val = ScriptNum(bytesLimit, forceMinimal).decode(op);
      if (val > Number.MAX_SAFE_INTEGER)
        return;
      return Number(val);
    } catch (e) {
      return;
    }
  }
  return;
}
var Script = wrap({
  encodeStream: (w, value) => {
    for (let o of value) {
      if (typeof o === "string") {
        if (OP[o] === void 0)
          throw new Error(`Unknown opcode=${o}`);
        w.byte(OP[o]);
        continue;
      } else if (typeof o === "number") {
        if (o === 0) {
          w.byte(0);
          continue;
        } else if (1 <= o && o <= 16) {
          w.byte(OP.OP_1 - 1 + o);
          continue;
        }
      }
      if (typeof o === "number")
        o = ScriptNum().encode(BigInt(o));
      if (!isBytes4(o))
        throw new Error(`Wrong Script OP=${o} (${typeof o})`);
      const len = o.length;
      if (len < OP.PUSHDATA1)
        w.byte(len);
      else if (len <= 255) {
        w.byte(OP.PUSHDATA1);
        w.byte(len);
      } else if (len <= 65535) {
        w.byte(OP.PUSHDATA2);
        w.bytes(U16LE.encode(len));
      } else {
        w.byte(OP.PUSHDATA4);
        w.bytes(U32LE.encode(len));
      }
      w.bytes(o);
    }
  },
  decodeStream: (r) => {
    const out = [];
    while (!r.isEnd()) {
      const cur = r.byte();
      if (OP.OP_0 < cur && cur <= OP.PUSHDATA4) {
        let len;
        if (cur < OP.PUSHDATA1)
          len = cur;
        else if (cur === OP.PUSHDATA1)
          len = U8.decodeStream(r);
        else if (cur === OP.PUSHDATA2)
          len = U16LE.decodeStream(r);
        else if (cur === OP.PUSHDATA4)
          len = U32LE.decodeStream(r);
        else
          throw new Error("Should be not possible");
        out.push(r.bytes(len));
      } else if (cur === 0) {
        out.push(0);
      } else if (OP.OP_1 <= cur && cur <= OP.OP_16) {
        out.push(cur - (OP.OP_1 - 1));
      } else {
        const op = OPNames[cur];
        if (op === void 0)
          throw new Error(`Unknown opcode=${cur.toString(16)}`);
        out.push(op);
      }
    }
    return out;
  }
});
var CSLimits = {
  253: [253, 2, 253n, 65535n],
  254: [254, 4, 65536n, 4294967295n],
  255: [255, 8, 4294967296n, 18446744073709551615n]
};
var CompactSize = wrap({
  encodeStream: (w, value) => {
    if (typeof value === "number")
      value = BigInt(value);
    if (0n <= value && value <= 252n)
      return w.byte(Number(value));
    for (const [flag2, bytes, start, stop] of Object.values(CSLimits)) {
      if (start > value || value > stop)
        continue;
      w.byte(flag2);
      for (let i = 0; i < bytes; i++)
        w.byte(Number(value >> 8n * BigInt(i) & 0xffn));
      return;
    }
    throw w.err(`VarInt too big: ${value}`);
  },
  decodeStream: (r) => {
    const b0 = r.byte();
    if (b0 <= 252)
      return BigInt(b0);
    const [_, bytes, start] = CSLimits[b0];
    let num2 = 0n;
    for (let i = 0; i < bytes; i++)
      num2 |= BigInt(r.byte()) << 8n * BigInt(i);
    if (num2 < start)
      throw r.err(`Wrong CompactSize(${8 * bytes})`);
    return num2;
  }
});
var CompactSizeLen = apply(CompactSize, coders.numberBigint);
var VarBytes = createBytes(CompactSize);
var RawWitness = array(CompactSizeLen, VarBytes);
var BTCArray = (t) => array(CompactSize, t);
var RawInput = struct({
  txid: createBytes(32, true),
  // hash(prev_tx),
  index: U32LE,
  // output number of previous tx
  finalScriptSig: VarBytes,
  // btc merges input and output script, executes it. If ok = tx passes
  sequence: U32LE
  // ?
});
var RawOutput = struct({ amount: U64LE, script: VarBytes });
var _RawTx = struct({
  version: I32LE,
  segwitFlag: flag(new Uint8Array([0, 1])),
  inputs: BTCArray(RawInput),
  outputs: BTCArray(RawOutput),
  witnesses: flagged("segwitFlag", array("inputs/length", RawWitness)),
  // < 500000000	Block number at which this transaction is unlocked
  // >= 500000000	UNIX timestamp at which this transaction is unlocked
  // Handled as part of PSBTv2
  lockTime: U32LE
});
function validateRawTx(tx) {
  if (tx.segwitFlag && tx.witnesses && !tx.witnesses.length)
    throw new Error("Segwit flag with empty witnesses array");
  return tx;
}
var RawTx = validate(_RawTx, validateRawTx);
var RawOldTx = struct({
  version: I32LE,
  inputs: BTCArray(RawInput),
  outputs: BTCArray(RawOutput),
  lockTime: U32LE
});

// node_modules/@scure/btc-signer/psbt.js
var PubKeyECDSA = validate(createBytes(null), (pub) => validatePubkey(pub, PubT.ecdsa));
var PubKeySchnorr = validate(createBytes(32), (pub) => validatePubkey(pub, PubT.schnorr));
var SignatureSchnorr = validate(createBytes(null), (sig) => {
  if (sig.length !== 64 && sig.length !== 65)
    throw new Error("Schnorr signature should be 64 or 65 bytes long");
  return sig;
});
var BIP32Der = struct({
  fingerprint: U32BE,
  path: array(null, U32LE)
});
var TaprootBIP32Der = struct({
  hashes: array(CompactSizeLen, createBytes(32)),
  der: BIP32Der
});
var GlobalXPUB = createBytes(78);
var tapScriptSigKey = struct({ pubKey: PubKeySchnorr, leafHash: createBytes(32) });
var _TaprootControlBlock = struct({
  version: U8,
  // With parity :(
  internalKey: createBytes(32),
  merklePath: array(null, createBytes(32))
});
var TaprootControlBlock = validate(_TaprootControlBlock, (cb) => {
  if (cb.merklePath.length > 128)
    throw new Error("TaprootControlBlock: merklePath should be of length 0..128 (inclusive)");
  return cb;
});
var tapTree = array(null, struct({
  depth: U8,
  version: U8,
  script: VarBytes
}));
var BytesInf = createBytes(null);
var Bytes20 = createBytes(20);
var Bytes32 = createBytes(32);
var PSBTGlobal = {
  unsignedTx: [0, false, RawOldTx, [0], [0], false],
  xpub: [1, GlobalXPUB, BIP32Der, [], [0, 2], false],
  txVersion: [2, false, U32LE, [2], [2], false],
  fallbackLocktime: [3, false, U32LE, [], [2], false],
  inputCount: [4, false, CompactSizeLen, [2], [2], false],
  outputCount: [5, false, CompactSizeLen, [2], [2], false],
  txModifiable: [6, false, U8, [], [2], false],
  // TODO: bitfield
  version: [251, false, U32LE, [], [0, 2], false],
  proprietary: [252, BytesInf, BytesInf, [], [0, 2], false]
};
var PSBTInput = {
  nonWitnessUtxo: [0, false, RawTx, [], [0, 2], false],
  witnessUtxo: [1, false, RawOutput, [], [0, 2], false],
  partialSig: [2, PubKeyECDSA, BytesInf, [], [0, 2], false],
  sighashType: [3, false, U32LE, [], [0, 2], false],
  redeemScript: [4, false, BytesInf, [], [0, 2], false],
  witnessScript: [5, false, BytesInf, [], [0, 2], false],
  bip32Derivation: [6, PubKeyECDSA, BIP32Der, [], [0, 2], false],
  finalScriptSig: [7, false, BytesInf, [], [0, 2], false],
  finalScriptWitness: [8, false, RawWitness, [], [0, 2], false],
  porCommitment: [9, false, BytesInf, [], [0, 2], false],
  ripemd160: [10, Bytes20, BytesInf, [], [0, 2], false],
  sha256: [11, Bytes32, BytesInf, [], [0, 2], false],
  hash160: [12, Bytes20, BytesInf, [], [0, 2], false],
  hash256: [13, Bytes32, BytesInf, [], [0, 2], false],
  txid: [14, false, Bytes32, [2], [2], true],
  index: [15, false, U32LE, [2], [2], true],
  sequence: [16, false, U32LE, [], [2], true],
  requiredTimeLocktime: [17, false, U32LE, [], [2], false],
  requiredHeightLocktime: [18, false, U32LE, [], [2], false],
  tapKeySig: [19, false, SignatureSchnorr, [], [0, 2], false],
  tapScriptSig: [20, tapScriptSigKey, SignatureSchnorr, [], [0, 2], false],
  tapLeafScript: [21, TaprootControlBlock, BytesInf, [], [0, 2], false],
  tapBip32Derivation: [22, Bytes32, TaprootBIP32Der, [], [0, 2], false],
  tapInternalKey: [23, false, PubKeySchnorr, [], [0, 2], false],
  tapMerkleRoot: [24, false, Bytes32, [], [0, 2], false],
  proprietary: [252, BytesInf, BytesInf, [], [0, 2], false]
};
var PSBTInputFinalKeys = [
  "txid",
  "sequence",
  "index",
  "witnessUtxo",
  "nonWitnessUtxo",
  "finalScriptSig",
  "finalScriptWitness",
  "unknown"
];
var PSBTInputUnsignedKeys = [
  "partialSig",
  "finalScriptSig",
  "finalScriptWitness",
  "tapKeySig",
  "tapScriptSig"
];
var PSBTOutput = {
  redeemScript: [0, false, BytesInf, [], [0, 2], false],
  witnessScript: [1, false, BytesInf, [], [0, 2], false],
  bip32Derivation: [2, PubKeyECDSA, BIP32Der, [], [0, 2], false],
  amount: [3, false, I64LE, [2], [2], true],
  script: [4, false, BytesInf, [2], [2], true],
  tapInternalKey: [5, false, PubKeySchnorr, [], [0, 2], false],
  tapTree: [6, false, tapTree, [], [0, 2], false],
  tapBip32Derivation: [7, PubKeySchnorr, TaprootBIP32Der, [], [0, 2], false],
  proprietary: [252, BytesInf, BytesInf, [], [0, 2], false]
};
var PSBTOutputUnsignedKeys = [];
var PSBTKeyPair = array(NULL, struct({
  //  <key> := <keylen> <keytype> <keydata> WHERE keylen = len(keytype)+len(keydata)
  key: prefix(CompactSizeLen, struct({ type: CompactSizeLen, key: createBytes(null) })),
  //  <value> := <valuelen> <valuedata>
  value: createBytes(CompactSizeLen)
}));
function PSBTKeyInfo(info) {
  const [type, kc, vc, reqInc, allowInc, silentIgnore] = info;
  return { type, kc, vc, reqInc, allowInc, silentIgnore };
}
var PSBTUnknownKey = struct({ type: CompactSizeLen, key: createBytes(null) });
function PSBTKeyMap(psbtEnum) {
  const byType = {};
  for (const k in psbtEnum) {
    const [num2, kc, vc] = psbtEnum[k];
    byType[num2] = [k, kc, vc];
  }
  return wrap({
    encodeStream: (w, value) => {
      let out = [];
      for (const name in psbtEnum) {
        const val = value[name];
        if (val === void 0)
          continue;
        const [type, kc, vc] = psbtEnum[name];
        if (!kc) {
          out.push({ key: { type, key: EMPTY }, value: vc.encode(val) });
        } else {
          const kv = val.map(([k, v]) => [
            kc.encode(k),
            vc.encode(v)
          ]);
          kv.sort((a, b) => compareBytes(a[0], b[0]));
          for (const [key, value2] of kv)
            out.push({ key: { key, type }, value: value2 });
        }
      }
      if (value.unknown) {
        value.unknown.sort((a, b) => compareBytes(a[0].key, b[0].key));
        for (const [k, v] of value.unknown)
          out.push({ key: k, value: v });
      }
      PSBTKeyPair.encodeStream(w, out);
    },
    decodeStream: (r) => {
      const raw = PSBTKeyPair.decodeStream(r);
      const out = {};
      const noKey = {};
      for (const elm of raw) {
        let name = "unknown";
        let key = elm.key.key;
        let value = elm.value;
        if (byType[elm.key.type]) {
          const [_name, kc, vc] = byType[elm.key.type];
          name = _name;
          if (!kc && key.length) {
            throw new Error(`PSBT: Non-empty key for ${name} (key=${hex.encode(key)} value=${hex.encode(value)}`);
          }
          key = kc ? kc.decode(key) : void 0;
          value = vc.decode(value);
          if (!kc) {
            if (out[name])
              throw new Error(`PSBT: Same keys: ${name} (key=${key} value=${value})`);
            out[name] = value;
            noKey[name] = true;
            continue;
          }
        } else {
          key = { type: elm.key.type, key: elm.key.key };
        }
        if (noKey[name])
          throw new Error(`PSBT: Key type with empty key and no key=${name} val=${value}`);
        if (!out[name])
          out[name] = [];
        out[name].push([key, value]);
      }
      return out;
    }
  });
}
var PSBTInputCoder = validate(PSBTKeyMap(PSBTInput), (i) => {
  if (i.finalScriptWitness && !i.finalScriptWitness.length)
    throw new Error("validateInput: empty finalScriptWitness");
  if (i.partialSig && !i.partialSig.length)
    throw new Error("Empty partialSig");
  if (i.partialSig)
    for (const [k] of i.partialSig)
      validatePubkey(k, PubT.ecdsa);
  if (i.bip32Derivation)
    for (const [k] of i.bip32Derivation)
      validatePubkey(k, PubT.ecdsa);
  if (i.requiredTimeLocktime !== void 0 && i.requiredTimeLocktime < 5e8)
    throw new Error(`validateInput: wrong timeLocktime=${i.requiredTimeLocktime}`);
  if (i.requiredHeightLocktime !== void 0 && (i.requiredHeightLocktime <= 0 || i.requiredHeightLocktime >= 5e8))
    throw new Error(`validateInput: wrong heighLocktime=${i.requiredHeightLocktime}`);
  if (i.tapLeafScript) {
    for (const [k, v] of i.tapLeafScript) {
      if ((k.version & 254) !== v[v.length - 1])
        throw new Error("validateInput: tapLeafScript version mimatch");
      if (v[v.length - 1] & 1)
        throw new Error("validateInput: tapLeafScript version has parity bit!");
    }
  }
  return i;
});
var PSBTOutputCoder = validate(PSBTKeyMap(PSBTOutput), (o) => {
  if (o.bip32Derivation)
    for (const [k] of o.bip32Derivation)
      validatePubkey(k, PubT.ecdsa);
  return o;
});
var PSBTGlobalCoder = validate(PSBTKeyMap(PSBTGlobal), (g) => {
  const version2 = g.version || 0;
  if (version2 === 0) {
    if (!g.unsignedTx)
      throw new Error("PSBTv0: missing unsignedTx");
    for (const inp of g.unsignedTx.inputs)
      if (inp.finalScriptSig && inp.finalScriptSig.length)
        throw new Error("PSBTv0: input scriptSig found in unsignedTx");
  }
  return g;
});
var _RawPSBTV0 = struct({
  magic: magic(string(new Uint8Array([255])), "psbt"),
  global: PSBTGlobalCoder,
  inputs: array("global/unsignedTx/inputs/length", PSBTInputCoder),
  outputs: array(null, PSBTOutputCoder)
});
var _RawPSBTV2 = struct({
  magic: magic(string(new Uint8Array([255])), "psbt"),
  global: PSBTGlobalCoder,
  inputs: array("global/inputCount", PSBTInputCoder),
  outputs: array("global/outputCount", PSBTOutputCoder)
});
var _DebugPSBT = struct({
  magic: magic(string(new Uint8Array([255])), "psbt"),
  items: array(null, apply(array(NULL, tuple([createHex(CompactSizeLen), createBytes(CompactSize)])), coders.dict()))
});
function validatePSBTFields(version2, info, lst) {
  for (const k in lst) {
    if (k === "unknown")
      continue;
    if (!info[k])
      continue;
    const { allowInc } = PSBTKeyInfo(info[k]);
    if (!allowInc.includes(version2))
      throw new Error(`PSBTv${version2}: field ${k} is not allowed`);
  }
  for (const k in info) {
    const { reqInc } = PSBTKeyInfo(info[k]);
    if (reqInc.includes(version2) && lst[k] === void 0)
      throw new Error(`PSBTv${version2}: missing required field ${k}`);
  }
}
function cleanPSBTFields(version2, info, lst) {
  const out = {};
  for (const _k in lst) {
    const k = _k;
    if (k !== "unknown") {
      if (!info[k])
        continue;
      const { allowInc, silentIgnore } = PSBTKeyInfo(info[k]);
      if (!allowInc.includes(version2)) {
        if (silentIgnore)
          continue;
        throw new Error(`Failed to serialize in PSBTv${version2}: ${k} but versions allows inclusion=${allowInc}`);
      }
    }
    out[k] = lst[k];
  }
  return out;
}
function validatePSBT(tx) {
  const version2 = tx && tx.global && tx.global.version || 0;
  validatePSBTFields(version2, PSBTGlobal, tx.global);
  for (const i of tx.inputs)
    validatePSBTFields(version2, PSBTInput, i);
  for (const o of tx.outputs)
    validatePSBTFields(version2, PSBTOutput, o);
  const inputCount = !version2 ? tx.global.unsignedTx.inputs.length : tx.global.inputCount;
  if (tx.inputs.length < inputCount)
    throw new Error("Not enough inputs");
  const inputsLeft = tx.inputs.slice(inputCount);
  if (inputsLeft.length > 1 || inputsLeft.length && Object.keys(inputsLeft[0]).length)
    throw new Error(`Unexpected inputs left in tx=${inputsLeft}`);
  const outputCount = !version2 ? tx.global.unsignedTx.outputs.length : tx.global.outputCount;
  if (tx.outputs.length < outputCount)
    throw new Error("Not outputs inputs");
  const outputsLeft = tx.outputs.slice(outputCount);
  if (outputsLeft.length > 1 || outputsLeft.length && Object.keys(outputsLeft[0]).length)
    throw new Error(`Unexpected outputs left in tx=${outputsLeft}`);
  return tx;
}
function mergeKeyMap(psbtEnum, val, cur, allowedFields, allowUnknown) {
  const res = { ...cur, ...val };
  for (const k in psbtEnum) {
    const key = k;
    const [_, kC, vC] = psbtEnum[key];
    const cannotChange = allowedFields && !allowedFields.includes(k);
    if (val[k] === void 0 && k in val) {
      if (cannotChange)
        throw new Error(`Cannot remove signed field=${k}`);
      delete res[k];
    } else if (kC) {
      const oldKV = cur && cur[k] ? cur[k] : [];
      let newKV = val[key];
      if (newKV) {
        if (!Array.isArray(newKV))
          throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
        newKV = newKV.map((val2) => {
          if (val2.length !== 2)
            throw new Error(`keyMap(${k}): KV pairs should be [k, v][]`);
          return [
            typeof val2[0] === "string" ? kC.decode(hex.decode(val2[0])) : val2[0],
            typeof val2[1] === "string" ? vC.decode(hex.decode(val2[1])) : val2[1]
          ];
        });
        const map = {};
        const add = (kStr, k2, v) => {
          if (map[kStr] === void 0) {
            map[kStr] = [k2, v];
            return;
          }
          const oldVal = hex.encode(vC.encode(map[kStr][1]));
          const newVal = hex.encode(vC.encode(v));
          if (oldVal !== newVal)
            throw new Error(`keyMap(${key}): same key=${kStr} oldVal=${oldVal} newVal=${newVal}`);
        };
        for (const [k2, v] of oldKV) {
          const kStr = hex.encode(kC.encode(k2));
          add(kStr, k2, v);
        }
        for (const [k2, v] of newKV) {
          const kStr = hex.encode(kC.encode(k2));
          if (v === void 0) {
            if (cannotChange)
              throw new Error(`Cannot remove signed field=${key}/${k2}`);
            delete map[kStr];
          } else
            add(kStr, k2, v);
        }
        res[key] = Object.values(map);
      }
    } else if (typeof res[k] === "string") {
      res[k] = vC.decode(hex.decode(res[k]));
    } else if (cannotChange && k in val && cur && cur[k] !== void 0) {
      if (!equalBytes3(vC.encode(val[k]), vC.encode(cur[k])))
        throw new Error(`Cannot change signed field=${k}`);
    }
  }
  for (const k in res) {
    if (!psbtEnum[k]) {
      if (allowUnknown && k === "unknown")
        continue;
      delete res[k];
    }
  }
  return res;
}
var RawPSBTV0 = validate(_RawPSBTV0, validatePSBT);
var RawPSBTV2 = validate(_RawPSBTV2, validatePSBT);

// node_modules/@scure/btc-signer/payment.js
var OutP2A = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 1 || !isBytes4(from[1]) || hex.encode(from[1]) !== "4e73")
      return;
    return { type: "p2a", script: Script.encode(from) };
  },
  decode: (to) => {
    if (to.type !== "p2a")
      return;
    return [1, hex.decode("4e73")];
  }
};
function isValidPubkey(pub, type) {
  try {
    validatePubkey(pub, type);
    return true;
  } catch (e) {
    return false;
  }
}
var OutPK = {
  encode(from) {
    if (from.length !== 2 || !isBytes4(from[0]) || !isValidPubkey(from[0], PubT.ecdsa) || from[1] !== "CHECKSIG")
      return;
    return { type: "pk", pubkey: from[0] };
  },
  decode: (to) => to.type === "pk" ? [to.pubkey, "CHECKSIG"] : void 0
};
var OutPKH = {
  encode(from) {
    if (from.length !== 5 || from[0] !== "DUP" || from[1] !== "HASH160" || !isBytes4(from[2]))
      return;
    if (from[3] !== "EQUALVERIFY" || from[4] !== "CHECKSIG")
      return;
    return { type: "pkh", hash: from[2] };
  },
  decode: (to) => to.type === "pkh" ? ["DUP", "HASH160", to.hash, "EQUALVERIFY", "CHECKSIG"] : void 0
};
var OutSH = {
  encode(from) {
    if (from.length !== 3 || from[0] !== "HASH160" || !isBytes4(from[1]) || from[2] !== "EQUAL")
      return;
    return { type: "sh", hash: from[1] };
  },
  decode: (to) => to.type === "sh" ? ["HASH160", to.hash, "EQUAL"] : void 0
};
var OutWSH = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 0 || !isBytes4(from[1]))
      return;
    if (from[1].length !== 32)
      return;
    return { type: "wsh", hash: from[1] };
  },
  decode: (to) => to.type === "wsh" ? [0, to.hash] : void 0
};
var OutWPKH = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 0 || !isBytes4(from[1]))
      return;
    if (from[1].length !== 20)
      return;
    return { type: "wpkh", hash: from[1] };
  },
  decode: (to) => to.type === "wpkh" ? [0, to.hash] : void 0
};
var OutMS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "CHECKMULTISIG")
      return;
    const m = from[0];
    const n = from[last - 1];
    if (typeof m !== "number" || typeof n !== "number")
      return;
    const pubkeys = from.slice(1, -2);
    if (n !== pubkeys.length)
      return;
    for (const pub of pubkeys)
      if (!isBytes4(pub))
        return;
    return { type: "ms", m, pubkeys };
  },
  // checkmultisig(n, ..pubkeys, m)
  decode: (to) => to.type === "ms" ? [to.m, ...to.pubkeys, to.pubkeys.length, "CHECKMULTISIG"] : void 0
};
var OutTR = {
  encode(from) {
    if (from.length !== 2 || from[0] !== 1 || !isBytes4(from[1]))
      return;
    return { type: "tr", pubkey: from[1] };
  },
  decode: (to) => to.type === "tr" ? [1, to.pubkey] : void 0
};
var OutTRNS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "CHECKSIG")
      return;
    const pubkeys = [];
    for (let i = 0; i < last; i++) {
      const elm = from[i];
      if (i & 1) {
        if (elm !== "CHECKSIGVERIFY" || i === last - 1)
          return;
        continue;
      }
      if (!isBytes4(elm))
        return;
      pubkeys.push(elm);
    }
    return { type: "tr_ns", pubkeys };
  },
  decode: (to) => {
    if (to.type !== "tr_ns")
      return;
    const out = [];
    for (let i = 0; i < to.pubkeys.length - 1; i++)
      out.push(to.pubkeys[i], "CHECKSIGVERIFY");
    out.push(to.pubkeys[to.pubkeys.length - 1], "CHECKSIG");
    return out;
  }
};
var OutTRMS = {
  encode(from) {
    const last = from.length - 1;
    if (from[last] !== "NUMEQUAL" || from[1] !== "CHECKSIG")
      return;
    const pubkeys = [];
    const m = OpToNum(from[last - 1]);
    if (typeof m !== "number")
      return;
    for (let i = 0; i < last - 1; i++) {
      const elm = from[i];
      if (i & 1) {
        if (elm !== (i === 1 ? "CHECKSIG" : "CHECKSIGADD"))
          throw new Error("OutScript.encode/tr_ms: wrong element");
        continue;
      }
      if (!isBytes4(elm))
        throw new Error("OutScript.encode/tr_ms: wrong key element");
      pubkeys.push(elm);
    }
    return { type: "tr_ms", pubkeys, m };
  },
  decode: (to) => {
    if (to.type !== "tr_ms")
      return;
    const out = [to.pubkeys[0], "CHECKSIG"];
    for (let i = 1; i < to.pubkeys.length; i++)
      out.push(to.pubkeys[i], "CHECKSIGADD");
    out.push(to.m, "NUMEQUAL");
    return out;
  }
};
var OutUnknown = {
  encode(from) {
    return { type: "unknown", script: Script.encode(from) };
  },
  decode: (to) => to.type === "unknown" ? Script.decode(to.script) : void 0
};
var OutScripts = [
  OutP2A,
  OutPK,
  OutPKH,
  OutSH,
  OutWSH,
  OutWPKH,
  OutMS,
  OutTR,
  OutTRNS,
  OutTRMS,
  OutUnknown
];
var _OutScript = apply(Script, coders.match(OutScripts));
var OutScript = validate(_OutScript, (i) => {
  if (i.type === "pk" && !isValidPubkey(i.pubkey, PubT.ecdsa))
    throw new Error("OutScript/pk: wrong key");
  if ((i.type === "pkh" || i.type === "sh" || i.type === "wpkh") && (!isBytes4(i.hash) || i.hash.length !== 20))
    throw new Error(`OutScript/${i.type}: wrong hash`);
  if (i.type === "wsh" && (!isBytes4(i.hash) || i.hash.length !== 32))
    throw new Error(`OutScript/wsh: wrong hash`);
  if (i.type === "tr" && (!isBytes4(i.pubkey) || !isValidPubkey(i.pubkey, PubT.schnorr)))
    throw new Error("OutScript/tr: wrong taproot public key");
  if (i.type === "ms" || i.type === "tr_ns" || i.type === "tr_ms") {
    if (!Array.isArray(i.pubkeys))
      throw new Error("OutScript/multisig: wrong pubkeys array");
  }
  if (i.type === "ms") {
    const n = i.pubkeys.length;
    for (const p of i.pubkeys)
      if (!isValidPubkey(p, PubT.ecdsa))
        throw new Error("OutScript/multisig: wrong pubkey");
    if (i.m <= 0 || n > 16 || i.m > n)
      throw new Error("OutScript/multisig: invalid params");
  }
  if (i.type === "tr_ns" || i.type === "tr_ms") {
    for (const p of i.pubkeys)
      if (!isValidPubkey(p, PubT.schnorr))
        throw new Error(`OutScript/${i.type}: wrong pubkey`);
  }
  if (i.type === "tr_ms") {
    const n = i.pubkeys.length;
    if (i.m <= 0 || n > 999 || i.m > n)
      throw new Error("OutScript/tr_ms: invalid params");
  }
  return i;
});
function checkWSH(s, witnessScript) {
  if (!equalBytes3(s.hash, sha256(witnessScript)))
    throw new Error("checkScript: wsh wrong witnessScript hash");
  const w = OutScript.decode(witnessScript);
  if (w.type === "tr" || w.type === "tr_ns" || w.type === "tr_ms")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2SH`);
  if (w.type === "wpkh" || w.type === "sh")
    throw new Error(`checkScript: P2${w.type} cannot be wrapped in P2WSH`);
}
function checkScript(script, redeemScript, witnessScript) {
  if (script) {
    const s = OutScript.decode(script);
    if (s.type === "tr_ns" || s.type === "tr_ms" || s.type === "ms" || s.type == "pk")
      throw new Error(`checkScript: non-wrapped ${s.type}`);
    if (s.type === "sh" && redeemScript) {
      if (!equalBytes3(s.hash, hash160(redeemScript)))
        throw new Error("checkScript: sh wrong redeemScript hash");
      const r = OutScript.decode(redeemScript);
      if (r.type === "tr" || r.type === "tr_ns" || r.type === "tr_ms")
        throw new Error(`checkScript: P2${r.type} cannot be wrapped in P2SH`);
      if (r.type === "sh")
        throw new Error("checkScript: P2SH cannot be wrapped in P2SH");
    }
    if (s.type === "wsh" && witnessScript)
      checkWSH(s, witnessScript);
  }
  if (redeemScript) {
    const r = OutScript.decode(redeemScript);
    if (r.type === "wsh" && witnessScript)
      checkWSH(r, witnessScript);
  }
}
function uniqPubkey(pubkeys) {
  const map = {};
  for (const pub of pubkeys) {
    const key = hex.encode(pub);
    if (map[key])
      throw new Error(`Multisig: non-uniq pubkey: ${pubkeys.map(hex.encode)}`);
    map[key] = true;
  }
}
function checkTaprootScript(script, internalPubKey, allowUnknownOutputs = false, customScripts) {
  const out = OutScript.decode(script);
  if (out.type === "unknown") {
    if (customScripts) {
      const cs = apply(Script, coders.match(customScripts));
      const c = cs.decode(script);
      if (c !== void 0) {
        if (typeof c.type !== "string" || !c.type.startsWith("tr_"))
          throw new Error(`P2TR: invalid custom type=${c.type}`);
        return;
      }
    }
    if (allowUnknownOutputs)
      return;
  }
  if (!["tr_ns", "tr_ms"].includes(out.type))
    throw new Error(`P2TR: invalid leaf script=${out.type}`);
  const outms = out;
  if (!allowUnknownOutputs && outms.pubkeys) {
    for (const p of outms.pubkeys) {
      if (equalBytes3(p, TAPROOT_UNSPENDABLE_KEY))
        throw new Error("Unspendable taproot key in leaf script");
      if (equalBytes3(p, internalPubKey)) {
        throw new Error("Using P2TR with leaf script with same key as internal key is not supported");
      }
    }
  }
}
function taprootListToTree(taprootList) {
  const lst = Array.from(taprootList);
  while (lst.length >= 2) {
    lst.sort((a2, b2) => (b2.weight || 1) - (a2.weight || 1));
    const b = lst.pop();
    const a = lst.pop();
    const weight = (a?.weight || 1) + (b?.weight || 1);
    lst.push({
      weight,
      // Unwrap children array
      // TODO: Very hard to remove any here
      childs: [a?.childs || a, b?.childs || b]
    });
  }
  const last = lst[0];
  return last?.childs || last;
}
function taprootAddPath(tree, path = []) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return { ...tree, path };
  if (tree.type !== "branch")
    throw new Error(`taprootAddPath: wrong type=${tree}`);
  return {
    ...tree,
    path,
    // Left element has right hash in path and otherwise
    left: taprootAddPath(tree.left, [tree.right.hash, ...path]),
    right: taprootAddPath(tree.right, [tree.left.hash, ...path])
  };
}
function taprootWalkTree(tree) {
  if (!tree)
    throw new Error(`taprootAddPath: empty tree`);
  if (tree.type === "leaf")
    return [tree];
  if (tree.type !== "branch")
    throw new Error(`taprootWalkTree: wrong type=${tree}`);
  return [...taprootWalkTree(tree.left), ...taprootWalkTree(tree.right)];
}
function taprootHashTree(tree, internalPubKey, allowUnknownOutputs = false, customScripts) {
  if (!tree)
    throw new Error("taprootHashTree: empty tree");
  if (Array.isArray(tree) && tree.length === 1)
    tree = tree[0];
  if (!Array.isArray(tree)) {
    const { leafVersion: version2, script: leafScript } = tree;
    if (tree.tapLeafScript || tree.tapMerkleRoot && !equalBytes3(tree.tapMerkleRoot, EMPTY))
      throw new Error("P2TR: tapRoot leafScript cannot have tree");
    const script = typeof leafScript === "string" ? hex.decode(leafScript) : leafScript;
    if (!isBytes4(script))
      throw new Error(`checkScript: wrong script type=${script}`);
    checkTaprootScript(script, internalPubKey, allowUnknownOutputs, customScripts);
    return {
      type: "leaf",
      version: version2,
      script,
      hash: tapLeafHash(script, version2)
    };
  }
  if (tree.length !== 2)
    tree = taprootListToTree(tree);
  if (tree.length !== 2)
    throw new Error("hashTree: non binary tree!");
  const left = taprootHashTree(tree[0], internalPubKey, allowUnknownOutputs, customScripts);
  const right = taprootHashTree(tree[1], internalPubKey, allowUnknownOutputs, customScripts);
  let [lH, rH] = [left.hash, right.hash];
  if (compareBytes(rH, lH) === -1)
    [lH, rH] = [rH, lH];
  return { type: "branch", left, right, hash: tagSchnorr("TapBranch", lH, rH) };
}
var TAP_LEAF_VERSION = 192;
var tapLeafHash = (script, version2 = TAP_LEAF_VERSION) => tagSchnorr("TapLeaf", new Uint8Array([version2]), VarBytes.encode(script));
function p2tr(internalPubKey, tree, network = NETWORK, allowUnknownOutputs = false, customScripts) {
  if (!internalPubKey && !tree)
    throw new Error("p2tr: should have pubKey or scriptTree (or both)");
  const pubKey = typeof internalPubKey === "string" ? hex.decode(internalPubKey) : internalPubKey || TAPROOT_UNSPENDABLE_KEY;
  if (!isValidPubkey(pubKey, PubT.schnorr))
    throw new Error("p2tr: non-schnorr pubkey");
  if (tree) {
    let hashedTree = taprootAddPath(taprootHashTree(tree, pubKey, allowUnknownOutputs, customScripts));
    const tapMerkleRoot = hashedTree.hash;
    const [tweakedPubkey, parity] = taprootTweakPubkey(pubKey, tapMerkleRoot);
    const leaves = taprootWalkTree(hashedTree).map((l) => ({
      ...l,
      controlBlock: TaprootControlBlock.encode({
        version: (l.version || TAP_LEAF_VERSION) + parity,
        internalKey: pubKey,
        merklePath: l.path
      })
    }));
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey,
      leaves,
      tapLeafScript: leaves.map((l) => [
        TaprootControlBlock.decode(l.controlBlock),
        concatBytes3(l.script, new Uint8Array([l.version || TAP_LEAF_VERSION]))
      ]),
      tapMerkleRoot
    };
  } else {
    const tweakedPubkey = taprootTweakPubkey(pubKey, EMPTY)[0];
    return {
      type: "tr",
      script: OutScript.encode({ type: "tr", pubkey: tweakedPubkey }),
      address: Address(network).encode({ type: "tr", pubkey: tweakedPubkey }),
      // For tests
      tweakedPubkey,
      // PSBT stuff
      tapInternalKey: pubKey
    };
  }
}
function p2tr_ms(m, pubkeys, allowSamePubkeys = false) {
  if (!allowSamePubkeys)
    uniqPubkey(pubkeys);
  return {
    type: "tr_ms",
    script: OutScript.encode({ type: "tr_ms", pubkeys, m })
  };
}
var base58check = createBase58check(sha256);
function validateWitness(version2, data) {
  if (data.length < 2 || data.length > 40)
    throw new Error("Witness: invalid length");
  if (version2 > 16)
    throw new Error("Witness: invalid version");
  if (version2 === 0 && !(data.length === 20 || data.length === 32))
    throw new Error("Witness: invalid length for version");
}
function programToWitness(version2, data, network = NETWORK) {
  validateWitness(version2, data);
  const coder = version2 === 0 ? bech32 : bech32m;
  return coder.encode(network.bech32, [version2].concat(coder.toWords(data)));
}
function formatKey(hashed, prefix2) {
  return base58check.encode(concatBytes3(Uint8Array.from(prefix2), hashed));
}
function Address(network = NETWORK) {
  return {
    encode(from) {
      const { type } = from;
      if (type === "wpkh")
        return programToWitness(0, from.hash, network);
      else if (type === "wsh")
        return programToWitness(0, from.hash, network);
      else if (type === "tr")
        return programToWitness(1, from.pubkey, network);
      else if (type === "pkh")
        return formatKey(from.hash, [network.pubKeyHash]);
      else if (type === "sh")
        return formatKey(from.hash, [network.scriptHash]);
      throw new Error(`Unknown address type=${type}`);
    },
    decode(address) {
      if (address.length < 14 || address.length > 74)
        throw new Error("Invalid address length");
      if (network.bech32 && address.toLowerCase().startsWith(`${network.bech32}1`)) {
        let res;
        try {
          res = bech32.decode(address);
          if (res.words[0] !== 0)
            throw new Error(`bech32: wrong version=${res.words[0]}`);
        } catch (_) {
          res = bech32m.decode(address);
          if (res.words[0] === 0)
            throw new Error(`bech32m: wrong version=${res.words[0]}`);
        }
        if (res.prefix !== network.bech32)
          throw new Error(`wrong bech32 prefix=${res.prefix}`);
        const [version2, ...program2] = res.words;
        const data2 = bech32.fromWords(program2);
        validateWitness(version2, data2);
        if (version2 === 0 && data2.length === 32)
          return { type: "wsh", hash: data2 };
        else if (version2 === 0 && data2.length === 20)
          return { type: "wpkh", hash: data2 };
        else if (version2 === 1 && data2.length === 32)
          return { type: "tr", pubkey: data2 };
        else
          throw new Error("Unknown witness program");
      }
      const data = base58check.decode(address);
      if (data.length !== 21)
        throw new Error("Invalid base58 address");
      if (data[0] === network.pubKeyHash) {
        return { type: "pkh", hash: data.slice(1) };
      } else if (data[0] === network.scriptHash) {
        return {
          type: "sh",
          hash: data.slice(1)
        };
      }
      throw new Error(`Invalid address prefix=${data[0]}`);
    }
  };
}

// node_modules/@scure/btc-signer/transaction.js
var EMPTY32 = new Uint8Array(32);
var EMPTY_OUTPUT = {
  amount: 0xffffffffffffffffn,
  script: EMPTY
};
var toVsize = (weight) => Math.ceil(weight / 4);
var PRECISION = 8;
var DEFAULT_VERSION = 2;
var DEFAULT_LOCKTIME = 0;
var DEFAULT_SEQUENCE = 4294967295;
var Decimal = coders.decimal(PRECISION);
var def = (value, def2) => value === void 0 ? def2 : value;
function cloneDeep(obj) {
  if (Array.isArray(obj))
    return obj.map((i) => cloneDeep(i));
  else if (isBytes4(obj))
    return Uint8Array.from(obj);
  else if (["number", "bigint", "boolean", "string", "undefined"].includes(typeof obj))
    return obj;
  else if (obj === null)
    return obj;
  else if (typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cloneDeep(v)]));
  }
  throw new Error(`cloneDeep: unknown type=${obj} (${typeof obj})`);
}
var SignatureHash = {
  DEFAULT: 0,
  ALL: 1,
  NONE: 2,
  SINGLE: 3,
  ANYONECANPAY: 128
};
var SigHash = {
  DEFAULT: SignatureHash.DEFAULT,
  ALL: SignatureHash.ALL,
  NONE: SignatureHash.NONE,
  SINGLE: SignatureHash.SINGLE,
  DEFAULT_ANYONECANPAY: SignatureHash.DEFAULT | SignatureHash.ANYONECANPAY,
  ALL_ANYONECANPAY: SignatureHash.ALL | SignatureHash.ANYONECANPAY,
  NONE_ANYONECANPAY: SignatureHash.NONE | SignatureHash.ANYONECANPAY,
  SINGLE_ANYONECANPAY: SignatureHash.SINGLE | SignatureHash.ANYONECANPAY
};
var SigHashNames = reverseObject(SigHash);
function getTaprootKeys(privKey, pubKey, internalKey, merkleRoot = EMPTY) {
  if (equalBytes3(internalKey, pubKey)) {
    privKey = taprootTweakPrivKey(privKey, merkleRoot);
    pubKey = pubSchnorr(privKey);
  }
  return { privKey, pubKey };
}
function outputBeforeSign(i) {
  if (i.script === void 0 || i.amount === void 0)
    throw new Error("Transaction/output: script and amount required");
  return { script: i.script, amount: i.amount };
}
function inputBeforeSign(i) {
  if (i.txid === void 0 || i.index === void 0)
    throw new Error("Transaction/input: txid and index required");
  return {
    txid: i.txid,
    index: i.index,
    sequence: def(i.sequence, DEFAULT_SEQUENCE),
    finalScriptSig: def(i.finalScriptSig, EMPTY)
  };
}
function cleanFinalInput(i) {
  for (const _k in i) {
    const k = _k;
    if (!PSBTInputFinalKeys.includes(k))
      delete i[k];
  }
}
var TxHashIdx = struct({ txid: createBytes(32, true), index: U32LE });
function validateSigHash(s) {
  if (typeof s !== "number" || typeof SigHashNames[s] !== "string")
    throw new Error(`Invalid SigHash=${s}`);
  return s;
}
function unpackSighash(hashType) {
  const masked = hashType & 31;
  return {
    isAny: !!(hashType & SignatureHash.ANYONECANPAY),
    isNone: masked === SignatureHash.NONE,
    isSingle: masked === SignatureHash.SINGLE
  };
}
function validateOpts(opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error(`Wrong object type for transaction options: ${opts}`);
  const _opts = {
    ...opts,
    // Defaults
    version: def(opts.version, DEFAULT_VERSION),
    lockTime: def(opts.lockTime, 0),
    PSBTVersion: def(opts.PSBTVersion, 0)
  };
  if (typeof _opts.allowUnknowInput !== "undefined")
    opts.allowUnknownInputs = _opts.allowUnknowInput;
  if (typeof _opts.allowUnknowOutput !== "undefined")
    opts.allowUnknownOutputs = _opts.allowUnknowOutput;
  if (typeof _opts.lockTime !== "number")
    throw new Error("Transaction lock time should be number");
  U32LE.encode(_opts.lockTime);
  if (_opts.PSBTVersion !== 0 && _opts.PSBTVersion !== 2)
    throw new Error(`Unknown PSBT version ${_opts.PSBTVersion}`);
  for (const k of [
    "allowUnknownVersion",
    "allowUnknownOutputs",
    "allowUnknownInputs",
    "disableScriptCheck",
    "bip174jsCompat",
    "allowLegacyWitnessUtxo",
    "lowR"
  ]) {
    const v = _opts[k];
    if (v === void 0)
      continue;
    if (typeof v !== "boolean")
      throw new Error(`Transation options wrong type: ${k}=${v} (${typeof v})`);
  }
  if (_opts.allowUnknownVersion ? typeof _opts.version === "number" : ![-1, 0, 1, 2, 3].includes(_opts.version))
    throw new Error(`Unknown version: ${_opts.version}`);
  if (_opts.customScripts !== void 0) {
    const cs = _opts.customScripts;
    if (!Array.isArray(cs)) {
      throw new Error(`wrong custom scripts type (expected array): customScripts=${cs} (${typeof cs})`);
    }
    for (const s of cs) {
      if (typeof s.encode !== "function" || typeof s.decode !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
      if (s.finalizeTaproot !== void 0 && typeof s.finalizeTaproot !== "function")
        throw new Error(`wrong script=${s} (${typeof s})`);
    }
  }
  return Object.freeze(_opts);
}
function validateInput(i) {
  if (i.nonWitnessUtxo && i.index !== void 0) {
    const last = i.nonWitnessUtxo.outputs.length - 1;
    if (i.index > last)
      throw new Error(`validateInput: index(${i.index}) not in nonWitnessUtxo`);
    const prevOut = i.nonWitnessUtxo.outputs[i.index];
    if (i.witnessUtxo && (!equalBytes3(i.witnessUtxo.script, prevOut.script) || i.witnessUtxo.amount !== prevOut.amount))
      throw new Error("validateInput: witnessUtxo different from nonWitnessUtxo");
    if (i.txid) {
      const outputs = i.nonWitnessUtxo.outputs;
      if (outputs.length - 1 < i.index)
        throw new Error("nonWitnessUtxo: incorect output index");
      const tx = Transaction.fromRaw(RawTx.encode(i.nonWitnessUtxo), {
        allowUnknownOutputs: true,
        disableScriptCheck: true,
        allowUnknownInputs: true
      });
      const txid = hex.encode(i.txid);
      if (tx.isFinal && tx.id !== txid)
        throw new Error(`nonWitnessUtxo: wrong txid, exp=${txid} got=${tx.id}`);
    }
  }
  return i;
}
function getPrevOut(input) {
  if (input.nonWitnessUtxo) {
    if (input.index === void 0)
      throw new Error("Unknown input index");
    return input.nonWitnessUtxo.outputs[input.index];
  } else if (input.witnessUtxo)
    return input.witnessUtxo;
  else
    throw new Error("Cannot find previous output info");
}
function normalizeInput(i, cur, allowedFields, disableScriptCheck = false, allowUnknown = false) {
  let { nonWitnessUtxo, txid } = i;
  if (typeof nonWitnessUtxo === "string")
    nonWitnessUtxo = hex.decode(nonWitnessUtxo);
  if (isBytes4(nonWitnessUtxo))
    nonWitnessUtxo = RawTx.decode(nonWitnessUtxo);
  if (!("nonWitnessUtxo" in i) && nonWitnessUtxo === void 0)
    nonWitnessUtxo = cur?.nonWitnessUtxo;
  if (typeof txid === "string")
    txid = hex.decode(txid);
  if (txid === void 0)
    txid = cur?.txid;
  let res = { ...cur, ...i, nonWitnessUtxo, txid };
  if (!("nonWitnessUtxo" in i) && res.nonWitnessUtxo === void 0)
    delete res.nonWitnessUtxo;
  if (res.sequence === void 0)
    res.sequence = DEFAULT_SEQUENCE;
  if (res.tapMerkleRoot === null)
    delete res.tapMerkleRoot;
  res = mergeKeyMap(PSBTInput, res, cur, allowedFields, allowUnknown);
  PSBTInputCoder.encode(res);
  let prevOut;
  if (res.nonWitnessUtxo && res.index !== void 0)
    prevOut = res.nonWitnessUtxo.outputs[res.index];
  else if (res.witnessUtxo)
    prevOut = res.witnessUtxo;
  if (prevOut && !disableScriptCheck)
    checkScript(prevOut && prevOut.script, res.redeemScript, res.witnessScript);
  return res;
}
function getInputType(input, allowLegacyWitnessUtxo = false) {
  let txType = "legacy";
  let defaultSighash = SignatureHash.ALL;
  const prevOut = getPrevOut(input);
  const first = OutScript.decode(prevOut.script);
  let type = first.type;
  let cur = first;
  const stack = [first];
  if (first.type === "tr") {
    defaultSighash = SignatureHash.DEFAULT;
    return {
      txType: "taproot",
      type: "tr",
      last: first,
      lastScript: prevOut.script,
      defaultSighash,
      sighash: input.sighashType || defaultSighash
    };
  } else {
    if (first.type === "wpkh" || first.type === "wsh")
      txType = "segwit";
    if (first.type === "sh") {
      if (!input.redeemScript)
        throw new Error("inputType: sh without redeemScript");
      let child = OutScript.decode(input.redeemScript);
      if (child.type === "wpkh" || child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    if (cur.type === "wsh") {
      if (!input.witnessScript)
        throw new Error("inputType: wsh without witnessScript");
      let child = OutScript.decode(input.witnessScript);
      if (child.type === "wsh")
        txType = "segwit";
      stack.push(child);
      cur = child;
      type += `-${child.type}`;
    }
    const last = stack[stack.length - 1];
    if (last.type === "sh" || last.type === "wsh")
      throw new Error("inputType: sh/wsh cannot be terminal type");
    const lastScript = OutScript.encode(last);
    const res = {
      type,
      txType,
      last,
      lastScript,
      defaultSighash,
      sighash: input.sighashType || defaultSighash
    };
    if (txType === "legacy" && !allowLegacyWitnessUtxo && !input.nonWitnessUtxo) {
      throw new Error(`Transaction/sign: legacy input without nonWitnessUtxo, can result in attack that forces paying higher fees. Pass allowLegacyWitnessUtxo=true, if you sure`);
    }
    return res;
  }
}
var Transaction = class _Transaction {
  global = {};
  inputs = [];
  // use getInput()
  outputs = [];
  // use getOutput()
  opts;
  constructor(opts = {}) {
    const _opts = this.opts = validateOpts(opts);
    if (_opts.lockTime !== DEFAULT_LOCKTIME)
      this.global.fallbackLocktime = _opts.lockTime;
    this.global.txVersion = _opts.version;
  }
  // Import
  static fromRaw(raw, opts = {}) {
    const parsed = RawTx.decode(raw);
    const tx = new _Transaction({ ...opts, version: parsed.version, lockTime: parsed.lockTime });
    for (const o of parsed.outputs)
      tx.addOutput(o);
    tx.outputs = parsed.outputs;
    tx.inputs = parsed.inputs;
    if (parsed.witnesses) {
      for (let i = 0; i < parsed.witnesses.length; i++)
        tx.inputs[i].finalScriptWitness = parsed.witnesses[i];
    }
    return tx;
  }
  // PSBT
  static fromPSBT(psbt_, opts = {}) {
    let parsed;
    try {
      parsed = RawPSBTV0.decode(psbt_);
    } catch (e0) {
      try {
        parsed = RawPSBTV2.decode(psbt_);
      } catch (e2) {
        throw e0;
      }
    }
    const PSBTVersion = parsed.global.version || 0;
    if (PSBTVersion !== 0 && PSBTVersion !== 2)
      throw new Error(`Wrong PSBT version=${PSBTVersion}`);
    const unsigned = parsed.global.unsignedTx;
    const version2 = PSBTVersion === 0 ? unsigned?.version : parsed.global.txVersion;
    const lockTime = PSBTVersion === 0 ? unsigned?.lockTime : parsed.global.fallbackLocktime;
    const tx = new _Transaction({ ...opts, version: version2, lockTime, PSBTVersion });
    const inputCount = PSBTVersion === 0 ? unsigned?.inputs.length : parsed.global.inputCount;
    tx.inputs = parsed.inputs.slice(0, inputCount).map((i, j) => validateInput({
      finalScriptSig: EMPTY,
      ...parsed.global.unsignedTx?.inputs[j],
      ...i
    }));
    const outputCount = PSBTVersion === 0 ? unsigned?.outputs.length : parsed.global.outputCount;
    tx.outputs = parsed.outputs.slice(0, outputCount).map((i, j) => ({
      ...i,
      ...parsed.global.unsignedTx?.outputs[j]
    }));
    tx.global = { ...parsed.global, txVersion: version2 };
    if (lockTime !== DEFAULT_LOCKTIME)
      tx.global.fallbackLocktime = lockTime;
    return tx;
  }
  toPSBT(PSBTVersion = this.opts.PSBTVersion) {
    if (PSBTVersion !== 0 && PSBTVersion !== 2)
      throw new Error(`Wrong PSBT version=${PSBTVersion}`);
    const inputs = this.inputs.map((i) => validateInput(cleanPSBTFields(PSBTVersion, PSBTInput, i)));
    for (const inp of inputs) {
      if (inp.partialSig && !inp.partialSig.length)
        delete inp.partialSig;
      if (inp.finalScriptSig && !inp.finalScriptSig.length)
        delete inp.finalScriptSig;
      if (inp.finalScriptWitness && !inp.finalScriptWitness.length)
        delete inp.finalScriptWitness;
    }
    const outputs = this.outputs.map((i) => cleanPSBTFields(PSBTVersion, PSBTOutput, i));
    const global = { ...this.global };
    if (PSBTVersion === 0) {
      global.unsignedTx = RawOldTx.decode(RawOldTx.encode({
        version: this.version,
        lockTime: this.lockTime,
        inputs: this.inputs.map(inputBeforeSign).map((i) => ({
          ...i,
          finalScriptSig: EMPTY
        })),
        outputs: this.outputs.map(outputBeforeSign)
      }));
      delete global.fallbackLocktime;
      delete global.txVersion;
    } else {
      global.version = PSBTVersion;
      global.txVersion = this.version;
      global.inputCount = this.inputs.length;
      global.outputCount = this.outputs.length;
      if (global.fallbackLocktime && global.fallbackLocktime === DEFAULT_LOCKTIME)
        delete global.fallbackLocktime;
    }
    if (this.opts.bip174jsCompat) {
      if (!inputs.length)
        inputs.push({});
      if (!outputs.length)
        outputs.push({});
    }
    return (PSBTVersion === 0 ? RawPSBTV0 : RawPSBTV2).encode({
      global,
      inputs,
      outputs
    });
  }
  // BIP370 lockTime (https://github.com/bitcoin/bips/blob/master/bip-0370.mediawiki#determining-lock-time)
  get lockTime() {
    let height = DEFAULT_LOCKTIME;
    let heightCnt = 0;
    let time = DEFAULT_LOCKTIME;
    let timeCnt = 0;
    for (const i of this.inputs) {
      if (i.requiredHeightLocktime) {
        height = Math.max(height, i.requiredHeightLocktime);
        heightCnt++;
      }
      if (i.requiredTimeLocktime) {
        time = Math.max(time, i.requiredTimeLocktime);
        timeCnt++;
      }
    }
    if (heightCnt && heightCnt >= timeCnt)
      return height;
    if (time !== DEFAULT_LOCKTIME)
      return time;
    return this.global.fallbackLocktime || DEFAULT_LOCKTIME;
  }
  get version() {
    if (this.global.txVersion === void 0)
      throw new Error("No global.txVersion");
    return this.global.txVersion;
  }
  inputStatus(idx) {
    this.checkInputIdx(idx);
    const input = this.inputs[idx];
    if (input.finalScriptSig && input.finalScriptSig.length)
      return "finalized";
    if (input.finalScriptWitness && input.finalScriptWitness.length)
      return "finalized";
    if (input.tapKeySig)
      return "signed";
    if (input.tapScriptSig && input.tapScriptSig.length)
      return "signed";
    if (input.partialSig && input.partialSig.length)
      return "signed";
    return "unsigned";
  }
  // Cannot replace unpackSighash, tests rely on very generic implemenetation with signing inputs outside of range
  // We will lose some vectors -> smaller test coverage of preimages (very important!)
  inputSighash(idx) {
    this.checkInputIdx(idx);
    const inputSighash = this.inputs[idx].sighashType;
    const sighash = inputSighash === void 0 ? SignatureHash.DEFAULT : inputSighash;
    const sigOutputs = sighash === SignatureHash.DEFAULT ? SignatureHash.ALL : sighash & 3;
    const sigInputs = sighash & SignatureHash.ANYONECANPAY;
    return { sigInputs, sigOutputs };
  }
  // Very nice for debug purposes, but slow. If there is too much inputs/outputs to add, will be quadratic.
  // Some cache will be nice, but there chance to have bugs with cache invalidation
  signStatus() {
    let addInput = true, addOutput = true;
    let inputs = [], outputs = [];
    for (let idx = 0; idx < this.inputs.length; idx++) {
      const status = this.inputStatus(idx);
      if (status === "unsigned")
        continue;
      const { sigInputs, sigOutputs } = this.inputSighash(idx);
      if (sigInputs === SignatureHash.ANYONECANPAY)
        inputs.push(idx);
      else
        addInput = false;
      if (sigOutputs === SignatureHash.ALL)
        addOutput = false;
      else if (sigOutputs === SignatureHash.SINGLE)
        outputs.push(idx);
      else if (sigOutputs === SignatureHash.NONE) {
      } else
        throw new Error(`Wrong signature hash output type: ${sigOutputs}`);
    }
    return { addInput, addOutput, inputs, outputs };
  }
  get isFinal() {
    for (let idx = 0; idx < this.inputs.length; idx++)
      if (this.inputStatus(idx) !== "finalized")
        return false;
    return true;
  }
  // Info utils
  get hasWitnesses() {
    let out = false;
    for (const i of this.inputs)
      if (i.finalScriptWitness && i.finalScriptWitness.length)
        out = true;
    return out;
  }
  // https://en.bitcoin.it/wiki/Weight_units
  get weight() {
    if (!this.isFinal)
      throw new Error("Transaction is not finalized");
    let out = 32;
    const outputs = this.outputs.map(outputBeforeSign);
    out += 4 * CompactSizeLen.encode(this.outputs.length).length;
    for (const o of outputs)
      out += 32 + 4 * VarBytes.encode(o.script).length;
    if (this.hasWitnesses)
      out += 2;
    out += 4 * CompactSizeLen.encode(this.inputs.length).length;
    for (const i of this.inputs) {
      out += 160 + 4 * VarBytes.encode(i.finalScriptSig || EMPTY).length;
      if (this.hasWitnesses && i.finalScriptWitness)
        out += RawWitness.encode(i.finalScriptWitness).length;
    }
    return out;
  }
  get vsize() {
    return toVsize(this.weight);
  }
  toBytes(withScriptSig = false, withWitness = false) {
    return RawTx.encode({
      version: this.version,
      lockTime: this.lockTime,
      inputs: this.inputs.map(inputBeforeSign).map((i) => ({
        ...i,
        finalScriptSig: withScriptSig && i.finalScriptSig || EMPTY
      })),
      outputs: this.outputs.map(outputBeforeSign),
      witnesses: this.inputs.map((i) => i.finalScriptWitness || []),
      segwitFlag: withWitness && this.hasWitnesses
    });
  }
  get unsignedTx() {
    return this.toBytes(false, false);
  }
  get hex() {
    return hex.encode(this.toBytes(true, this.hasWitnesses));
  }
  get hash() {
    return hex.encode(sha256x2(this.toBytes(true)));
  }
  get id() {
    return hex.encode(sha256x2(this.toBytes(true)).reverse());
  }
  // Input stuff
  checkInputIdx(idx) {
    if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.inputs.length)
      throw new Error(`Wrong input index=${idx}`);
  }
  getInput(idx) {
    this.checkInputIdx(idx);
    return cloneDeep(this.inputs[idx]);
  }
  get inputsLength() {
    return this.inputs.length;
  }
  // Modification
  addInput(input, _ignoreSignStatus = false) {
    if (!_ignoreSignStatus && !this.signStatus().addInput)
      throw new Error("Tx has signed inputs, cannot add new one");
    this.inputs.push(normalizeInput(input, void 0, void 0, this.opts.disableScriptCheck));
    return this.inputs.length - 1;
  }
  updateInput(idx, input, _ignoreSignStatus = false) {
    this.checkInputIdx(idx);
    let allowedFields = void 0;
    if (!_ignoreSignStatus) {
      const status = this.signStatus();
      if (!status.addInput || status.inputs.includes(idx))
        allowedFields = PSBTInputUnsignedKeys;
    }
    this.inputs[idx] = normalizeInput(input, this.inputs[idx], allowedFields, this.opts.disableScriptCheck, this.opts.allowUnknown);
  }
  // Output stuff
  checkOutputIdx(idx) {
    if (!Number.isSafeInteger(idx) || 0 > idx || idx >= this.outputs.length)
      throw new Error(`Wrong output index=${idx}`);
  }
  getOutput(idx) {
    this.checkOutputIdx(idx);
    return cloneDeep(this.outputs[idx]);
  }
  getOutputAddress(idx, network = NETWORK) {
    const out = this.getOutput(idx);
    if (!out.script)
      return;
    return Address(network).encode(OutScript.decode(out.script));
  }
  get outputsLength() {
    return this.outputs.length;
  }
  normalizeOutput(o, cur, allowedFields) {
    let { amount, script } = o;
    if (amount === void 0)
      amount = cur?.amount;
    if (typeof amount !== "bigint")
      throw new Error(`Wrong amount type, should be of type bigint in sats, but got ${amount} of type ${typeof amount}`);
    if (typeof script === "string")
      script = hex.decode(script);
    if (script === void 0)
      script = cur?.script;
    let res = { ...cur, ...o, amount, script };
    if (res.amount === void 0)
      delete res.amount;
    res = mergeKeyMap(PSBTOutput, res, cur, allowedFields, this.opts.allowUnknown);
    PSBTOutputCoder.encode(res);
    if (res.script && !this.opts.allowUnknownOutputs && OutScript.decode(res.script).type === "unknown") {
      throw new Error("Transaction/output: unknown output script type, there is a chance that input is unspendable. Pass allowUnknownOutputs=true, if you sure");
    }
    if (!this.opts.disableScriptCheck)
      checkScript(res.script, res.redeemScript, res.witnessScript);
    return res;
  }
  addOutput(o, _ignoreSignStatus = false) {
    if (!_ignoreSignStatus && !this.signStatus().addOutput)
      throw new Error("Tx has signed outputs, cannot add new one");
    this.outputs.push(this.normalizeOutput(o));
    return this.outputs.length - 1;
  }
  updateOutput(idx, output, _ignoreSignStatus = false) {
    this.checkOutputIdx(idx);
    let allowedFields = void 0;
    if (!_ignoreSignStatus) {
      const status = this.signStatus();
      if (!status.addOutput || status.outputs.includes(idx))
        allowedFields = PSBTOutputUnsignedKeys;
    }
    this.outputs[idx] = this.normalizeOutput(output, this.outputs[idx], allowedFields);
  }
  addOutputAddress(address, amount, network = NETWORK) {
    return this.addOutput({ script: OutScript.encode(Address(network).decode(address)), amount });
  }
  // Utils
  get fee() {
    let res = 0n;
    for (const i of this.inputs) {
      const prevOut = getPrevOut(i);
      if (!prevOut)
        throw new Error("Empty input amount");
      res += prevOut.amount;
    }
    const outputs = this.outputs.map(outputBeforeSign);
    for (const o of outputs)
      res -= o.amount;
    return res;
  }
  // Signing
  // Based on https://github.com/bitcoin/bitcoin/blob/5871b5b5ab57a0caf9b7514eb162c491c83281d5/test/functional/test_framework/script.py#L624
  // There is optimization opportunity to re-use hashes for multiple inputs for witness v0/v1,
  // but we are trying to be less complicated for audit purpose for now.
  preimageLegacy(idx, prevOutScript, hashType) {
    const { isAny, isNone, isSingle } = unpackSighash(hashType);
    if (idx < 0 || !Number.isSafeInteger(idx))
      throw new Error(`Invalid input idx=${idx}`);
    if (isSingle && idx >= this.outputs.length || idx >= this.inputs.length)
      return U256BE.encode(1n);
    prevOutScript = Script.encode(Script.decode(prevOutScript).filter((i) => i !== "CODESEPARATOR"));
    let inputs = this.inputs.map(inputBeforeSign).map((input, inputIdx) => ({
      ...input,
      finalScriptSig: inputIdx === idx ? prevOutScript : EMPTY
    }));
    if (isAny)
      inputs = [inputs[idx]];
    else if (isNone || isSingle) {
      inputs = inputs.map((input, inputIdx) => ({
        ...input,
        sequence: inputIdx === idx ? input.sequence : 0
      }));
    }
    let outputs = this.outputs.map(outputBeforeSign);
    if (isNone)
      outputs = [];
    else if (isSingle) {
      outputs = outputs.slice(0, idx).fill(EMPTY_OUTPUT).concat([outputs[idx]]);
    }
    const tmpTx = RawTx.encode({
      lockTime: this.lockTime,
      version: this.version,
      segwitFlag: false,
      inputs,
      outputs
    });
    return sha256x2(tmpTx, I32LE.encode(hashType));
  }
  preimageWitnessV0(idx, prevOutScript, hashType, amount) {
    const { isAny, isNone, isSingle } = unpackSighash(hashType);
    let inputHash = EMPTY32;
    let sequenceHash = EMPTY32;
    let outputHash = EMPTY32;
    const inputs = this.inputs.map(inputBeforeSign);
    const outputs = this.outputs.map(outputBeforeSign);
    if (!isAny)
      inputHash = sha256x2(...inputs.map(TxHashIdx.encode));
    if (!isAny && !isSingle && !isNone)
      sequenceHash = sha256x2(...inputs.map((i) => U32LE.encode(i.sequence)));
    if (!isSingle && !isNone) {
      outputHash = sha256x2(...outputs.map(RawOutput.encode));
    } else if (isSingle && idx < outputs.length)
      outputHash = sha256x2(RawOutput.encode(outputs[idx]));
    const input = inputs[idx];
    return sha256x2(I32LE.encode(this.version), inputHash, sequenceHash, createBytes(32, true).encode(input.txid), U32LE.encode(input.index), VarBytes.encode(prevOutScript), U64LE.encode(amount), U32LE.encode(input.sequence), outputHash, U32LE.encode(this.lockTime), U32LE.encode(hashType));
  }
  preimageWitnessV1(idx, prevOutScript, hashType, amount, codeSeparator = -1, leafScript, leafVer = 192, annex) {
    if (!Array.isArray(amount) || this.inputs.length !== amount.length)
      throw new Error(`Invalid amounts array=${amount}`);
    if (!Array.isArray(prevOutScript) || this.inputs.length !== prevOutScript.length)
      throw new Error(`Invalid prevOutScript array=${prevOutScript}`);
    const out = [
      U8.encode(0),
      U8.encode(hashType),
      // U8 sigHash
      I32LE.encode(this.version),
      U32LE.encode(this.lockTime)
    ];
    const outType = hashType === SignatureHash.DEFAULT ? SignatureHash.ALL : hashType & 3;
    const inType = hashType & SignatureHash.ANYONECANPAY;
    const inputs = this.inputs.map(inputBeforeSign);
    const outputs = this.outputs.map(outputBeforeSign);
    if (inType !== SignatureHash.ANYONECANPAY) {
      out.push(...[
        inputs.map(TxHashIdx.encode),
        amount.map(U64LE.encode),
        prevOutScript.map(VarBytes.encode),
        inputs.map((i) => U32LE.encode(i.sequence))
      ].map((i) => sha256(concatBytes3(...i))));
    }
    if (outType === SignatureHash.ALL) {
      out.push(sha256(concatBytes3(...outputs.map(RawOutput.encode))));
    }
    const spendType = (annex ? 1 : 0) | (leafScript ? 2 : 0);
    out.push(new Uint8Array([spendType]));
    if (inType === SignatureHash.ANYONECANPAY) {
      const inp = inputs[idx];
      out.push(TxHashIdx.encode(inp), U64LE.encode(amount[idx]), VarBytes.encode(prevOutScript[idx]), U32LE.encode(inp.sequence));
    } else
      out.push(U32LE.encode(idx));
    if (spendType & 1)
      out.push(sha256(VarBytes.encode(annex || EMPTY)));
    if (outType === SignatureHash.SINGLE)
      out.push(idx < outputs.length ? sha256(RawOutput.encode(outputs[idx])) : EMPTY32);
    if (leafScript)
      out.push(tapLeafHash(leafScript, leafVer), U8.encode(0), I32LE.encode(codeSeparator));
    return tagSchnorr("TapSighash", ...out);
  }
  // Signer can be privateKey OR instance of bip32 HD stuff
  signIdx(privateKey, idx, allowedSighash, _auxRand) {
    this.checkInputIdx(idx);
    const input = this.inputs[idx];
    const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
    if (!isBytes4(privateKey)) {
      if (!input.bip32Derivation || !input.bip32Derivation.length)
        throw new Error("bip32Derivation: empty");
      const signers = input.bip32Derivation.filter((i) => i[1].fingerprint == privateKey.fingerprint).map(([pubKey, { path }]) => {
        let s = privateKey;
        for (const i of path)
          s = s.deriveChild(i);
        if (!equalBytes3(s.publicKey, pubKey))
          throw new Error("bip32Derivation: wrong pubKey");
        if (!s.privateKey)
          throw new Error("bip32Derivation: no privateKey");
        return s;
      });
      if (!signers.length)
        throw new Error(`bip32Derivation: no items with fingerprint=${privateKey.fingerprint}`);
      let signed = false;
      for (const s of signers)
        if (this.signIdx(s.privateKey, idx))
          signed = true;
      return signed;
    }
    if (!allowedSighash)
      allowedSighash = [inputType.defaultSighash];
    else
      allowedSighash.forEach(validateSigHash);
    const sighash = inputType.sighash;
    if (!allowedSighash.includes(sighash)) {
      throw new Error(`Input with not allowed sigHash=${sighash}. Allowed: ${allowedSighash.join(", ")}`);
    }
    const { sigOutputs } = this.inputSighash(idx);
    if (sigOutputs === SignatureHash.SINGLE && idx >= this.outputs.length) {
      throw new Error(`Input with sighash SINGLE, but there is no output with corresponding index=${idx}`);
    }
    const prevOut = getPrevOut(input);
    if (inputType.txType === "taproot") {
      const prevOuts = this.inputs.map(getPrevOut);
      const prevOutScript = prevOuts.map((i) => i.script);
      const amount = prevOuts.map((i) => i.amount);
      let signed = false;
      let schnorrPub = pubSchnorr(privateKey);
      let merkleRoot = input.tapMerkleRoot || EMPTY;
      if (input.tapInternalKey) {
        const { pubKey, privKey } = getTaprootKeys(privateKey, schnorrPub, input.tapInternalKey, merkleRoot);
        const [taprootPubKey, _] = taprootTweakPubkey(input.tapInternalKey, merkleRoot);
        if (equalBytes3(taprootPubKey, pubKey)) {
          const hash = this.preimageWitnessV1(idx, prevOutScript, sighash, amount);
          const sig = concatBytes3(signSchnorr(hash, privKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
          this.updateInput(idx, { tapKeySig: sig }, true);
          signed = true;
        }
      }
      if (input.tapLeafScript) {
        input.tapScriptSig = input.tapScriptSig || [];
        for (const [_, _script] of input.tapLeafScript) {
          const script = _script.subarray(0, -1);
          const scriptDecoded = Script.decode(script);
          const ver = _script[_script.length - 1];
          const hash = tapLeafHash(script, ver);
          const pos = scriptDecoded.findIndex((i) => isBytes4(i) && equalBytes3(i, schnorrPub));
          if (pos === -1)
            continue;
          const msg = this.preimageWitnessV1(idx, prevOutScript, sighash, amount, void 0, script, ver);
          const sig = concatBytes3(signSchnorr(msg, privateKey, _auxRand), sighash !== SignatureHash.DEFAULT ? new Uint8Array([sighash]) : EMPTY);
          this.updateInput(idx, { tapScriptSig: [[{ pubKey: schnorrPub, leafHash: hash }, sig]] }, true);
          signed = true;
        }
      }
      if (!signed)
        throw new Error("No taproot scripts signed");
      return true;
    } else {
      const pubKey = pubECDSA(privateKey);
      let hasPubkey = false;
      const pubKeyHash = hash160(pubKey);
      for (const i of Script.decode(inputType.lastScript)) {
        if (isBytes4(i) && (equalBytes3(i, pubKey) || equalBytes3(i, pubKeyHash)))
          hasPubkey = true;
      }
      if (!hasPubkey)
        throw new Error(`Input script doesn't have pubKey: ${inputType.lastScript}`);
      let hash;
      if (inputType.txType === "legacy") {
        hash = this.preimageLegacy(idx, inputType.lastScript, sighash);
      } else if (inputType.txType === "segwit") {
        let script = inputType.lastScript;
        if (inputType.last.type === "wpkh")
          script = OutScript.encode({ type: "pkh", hash: inputType.last.hash });
        hash = this.preimageWitnessV0(idx, script, sighash, prevOut.amount);
      } else
        throw new Error(`Transaction/sign: unknown tx type: ${inputType.txType}`);
      const sig = signECDSA(hash, privateKey, this.opts.lowR);
      this.updateInput(idx, {
        partialSig: [[pubKey, concatBytes3(sig, new Uint8Array([sighash]))]]
      }, true);
    }
    return true;
  }
  // This is bad API. Will work if user creates and signs tx, but if
  // there is some complex workflow with exchanging PSBT and signing them,
  // then it is better to validate which output user signs. How could a better API look like?
  // Example: user adds input, sends to another party, then signs received input (mixer etc),
  // another user can add different input for same key and user will sign it.
  // Even worse: another user can add bip32 derivation, and spend money from different address.
  // Better api: signIdx
  sign(privateKey, allowedSighash, _auxRand) {
    let num2 = 0;
    for (let i = 0; i < this.inputs.length; i++) {
      try {
        if (this.signIdx(privateKey, i, allowedSighash, _auxRand))
          num2++;
      } catch (e) {
      }
    }
    if (!num2)
      throw new Error("No inputs signed");
    return num2;
  }
  finalizeIdx(idx) {
    this.checkInputIdx(idx);
    if (this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    const input = this.inputs[idx];
    const inputType = getInputType(input, this.opts.allowLegacyWitnessUtxo);
    if (inputType.txType === "taproot") {
      if (input.tapKeySig)
        input.finalScriptWitness = [input.tapKeySig];
      else if (input.tapLeafScript && input.tapScriptSig) {
        const leafs = input.tapLeafScript.sort((a, b) => TaprootControlBlock.encode(a[0]).length - TaprootControlBlock.encode(b[0]).length);
        for (const [cb, _script] of leafs) {
          const script = _script.slice(0, -1);
          const ver = _script[_script.length - 1];
          const outScript = OutScript.decode(script);
          const hash = tapLeafHash(script, ver);
          const scriptSig = input.tapScriptSig.filter((i) => equalBytes3(i[0].leafHash, hash));
          let signatures = [];
          if (outScript.type === "tr_ms") {
            const m = outScript.m;
            const pubkeys = outScript.pubkeys;
            let added = 0;
            for (const pub of pubkeys) {
              const sigIdx = scriptSig.findIndex((i) => equalBytes3(i[0].pubKey, pub));
              if (added === m || sigIdx === -1) {
                signatures.push(EMPTY);
                continue;
              }
              signatures.push(scriptSig[sigIdx][1]);
              added++;
            }
            if (added !== m)
              continue;
          } else if (outScript.type === "tr_ns") {
            for (const pub of outScript.pubkeys) {
              const sigIdx = scriptSig.findIndex((i) => equalBytes3(i[0].pubKey, pub));
              if (sigIdx === -1)
                continue;
              signatures.push(scriptSig[sigIdx][1]);
            }
            if (signatures.length !== outScript.pubkeys.length)
              continue;
          } else if (outScript.type === "unknown" && this.opts.allowUnknownInputs) {
            const scriptDecoded = Script.decode(script);
            signatures = scriptSig.map(([{ pubKey }, signature]) => {
              const pos = scriptDecoded.findIndex((i) => isBytes4(i) && equalBytes3(i, pubKey));
              if (pos === -1)
                throw new Error("finalize/taproot: cannot find position of pubkey in script");
              return { signature, pos };
            }).sort((a, b) => a.pos - b.pos).map((i) => i.signature);
            if (!signatures.length)
              continue;
          } else {
            const custom = this.opts.customScripts;
            if (custom) {
              for (const c of custom) {
                if (!c.finalizeTaproot)
                  continue;
                const scriptDecoded = Script.decode(script);
                const csEncoded = c.encode(scriptDecoded);
                if (csEncoded === void 0)
                  continue;
                const finalized = c.finalizeTaproot(script, csEncoded, scriptSig);
                if (!finalized)
                  continue;
                input.finalScriptWitness = finalized.concat(TaprootControlBlock.encode(cb));
                input.finalScriptSig = EMPTY;
                cleanFinalInput(input);
                return;
              }
            }
            throw new Error("Finalize: Unknown tapLeafScript");
          }
          input.finalScriptWitness = signatures.reverse().concat([script, TaprootControlBlock.encode(cb)]);
          break;
        }
        if (!input.finalScriptWitness)
          throw new Error("finalize/taproot: empty witness");
      } else
        throw new Error("finalize/taproot: unknown input");
      input.finalScriptSig = EMPTY;
      cleanFinalInput(input);
      return;
    }
    if (!input.partialSig || !input.partialSig.length)
      throw new Error("Not enough partial sign");
    let inputScript = EMPTY;
    let witness = [];
    if (inputType.last.type === "ms") {
      const m = inputType.last.m;
      const pubkeys = inputType.last.pubkeys;
      let signatures = [];
      for (const pub of pubkeys) {
        const sign2 = input.partialSig.find((s) => equalBytes3(pub, s[0]));
        if (!sign2)
          continue;
        signatures.push(sign2[1]);
      }
      signatures = signatures.slice(0, m);
      if (signatures.length !== m) {
        throw new Error(`Multisig: wrong signatures count, m=${m} n=${pubkeys.length} signatures=${signatures.length}`);
      }
      inputScript = Script.encode([0, ...signatures]);
    } else if (inputType.last.type === "pk") {
      inputScript = Script.encode([input.partialSig[0][1]]);
    } else if (inputType.last.type === "pkh") {
      inputScript = Script.encode([input.partialSig[0][1], input.partialSig[0][0]]);
    } else if (inputType.last.type === "wpkh") {
      inputScript = EMPTY;
      witness = [input.partialSig[0][1], input.partialSig[0][0]];
    } else if (inputType.last.type === "unknown" && !this.opts.allowUnknownInputs)
      throw new Error("Unknown inputs not allowed");
    let finalScriptSig, finalScriptWitness;
    if (inputType.type.includes("wsh-")) {
      if (inputScript.length && inputType.lastScript.length) {
        witness = Script.decode(inputScript).map((i) => {
          if (i === 0)
            return EMPTY;
          if (isBytes4(i))
            return i;
          throw new Error(`Wrong witness op=${i}`);
        });
      }
      witness = witness.concat(inputType.lastScript);
    }
    if (inputType.txType === "segwit")
      finalScriptWitness = witness;
    if (inputType.type.startsWith("sh-wsh-")) {
      finalScriptSig = Script.encode([Script.encode([0, sha256(inputType.lastScript)])]);
    } else if (inputType.type.startsWith("sh-")) {
      finalScriptSig = Script.encode([...Script.decode(inputScript), inputType.lastScript]);
    } else if (inputType.type.startsWith("wsh-")) {
    } else if (inputType.txType !== "segwit")
      finalScriptSig = inputScript;
    if (!finalScriptSig && !finalScriptWitness)
      throw new Error("Unknown error finalizing input");
    if (finalScriptSig)
      input.finalScriptSig = finalScriptSig;
    if (finalScriptWitness)
      input.finalScriptWitness = finalScriptWitness;
    cleanFinalInput(input);
  }
  finalize() {
    for (let i = 0; i < this.inputs.length; i++)
      this.finalizeIdx(i);
  }
  extract() {
    if (!this.isFinal)
      throw new Error("Transaction has unfinalized inputs");
    if (!this.outputs.length)
      throw new Error("Transaction has no outputs");
    if (this.fee < 0n)
      throw new Error("Outputs spends more than inputs amount");
    return this.toBytes(true, true);
  }
  combine(other) {
    for (const k of ["PSBTVersion", "version", "lockTime"]) {
      if (this.opts[k] !== other.opts[k]) {
        throw new Error(`Transaction/combine: different ${k} this=${this.opts[k]} other=${other.opts[k]}`);
      }
    }
    for (const k of ["inputs", "outputs"]) {
      if (this[k].length !== other[k].length) {
        throw new Error(`Transaction/combine: different ${k} length this=${this[k].length} other=${other[k].length}`);
      }
    }
    const thisUnsigned = this.global.unsignedTx ? RawOldTx.encode(this.global.unsignedTx) : EMPTY;
    const otherUnsigned = other.global.unsignedTx ? RawOldTx.encode(other.global.unsignedTx) : EMPTY;
    if (!equalBytes3(thisUnsigned, otherUnsigned))
      throw new Error(`Transaction/combine: different unsigned tx`);
    this.global = mergeKeyMap(PSBTGlobal, this.global, other.global, void 0, this.opts.allowUnknown);
    for (let i = 0; i < this.inputs.length; i++)
      this.updateInput(i, other.inputs[i], true);
    for (let i = 0; i < this.outputs.length; i++)
      this.updateOutput(i, other.outputs[i], true);
    return this;
  }
  clone() {
    return _Transaction.fromPSBT(this.toPSBT(this.opts.PSBTVersion), this.opts);
  }
};

// packages/ts-sdk/src/networks.ts
var getNetwork = (network) => {
  const found = networks[network];
  if (!found) throw new Error(`Unsupported network: ${network}`);
  return found;
};
var networks = {
  bitcoin: withArkPrefix(NETWORK, "ark", "bitcoin"),
  testnet: withArkPrefix(TEST_NETWORK, "tark", "testnet"),
  signet: withArkPrefix(TEST_NETWORK, "tark", "signet"),
  mutinynet: withArkPrefix(TEST_NETWORK, "tark", "mutinynet"),
  regtest: withArkPrefix(
    {
      ...TEST_NETWORK,
      bech32: "bcrt",
      pubKeyHash: 111,
      scriptHash: 196
    },
    "tark",
    "regtest"
  )
};
function withArkPrefix(network, prefix2, name) {
  return {
    ...network,
    hrp: prefix2,
    name
  };
}
var DEFAULT_ARKADE_SERVER_URL = "https://arkade.computer";
var DEFAULT_NETWORK = networks.bitcoin;
var COMPRESSED_PUBKEY = /^0[23][0-9a-f]{64}$/;
var BITCOIN_EMULATOR_PUBKEY = "0239c196415da47b26456a101daaa12ba9e445bfe153197f1e2b750bf40e52092e";
var MUTINYNET_EMULATOR_PUBKEY = "03f823b9b2febc81f4af967e77aed2f541cbd3397c6d8f5a72e32eb7b471af889a";
var REGTEST_EMULATOR_PUBKEY = "02999413c46fa10ada5cbc4bcc79a1d09160c2ba3cfc812705d7a13e5e545fb2a9";
var EMULATOR_PUBKEYS = {
  bitcoin: BITCOIN_EMULATOR_PUBKEY,
  mutinynet: MUTINYNET_EMULATOR_PUBKEY,
  regtest: REGTEST_EMULATOR_PUBKEY
};
function defaultEmulatorPubkey(network) {
  const pinned = network.name ? EMULATOR_PUBKEYS[network.name] : void 0;
  if (!pinned) {
    const cause = network.name ? `no emulator is deployed for ${network.name}` : `this Network carries no name, so it cannot be matched (build it with getNetwork(...) rather than by hand)`;
    throw new Error(
      `No emulator co-signer key is pinned for this network: ${cause}; pass emulatorPubkey: "<33-byte compressed hex>" to Arkade.connect to co-sign with your own emulator instead. Pinned networks: ${Object.keys(EMULATOR_PUBKEYS).join(", ")}`
    );
  }
  return pinned;
}
function resolveEmulatorPubkey(network, override) {
  if (override === void 0) return defaultEmulatorPubkey(network);
  if (!COMPRESSED_PUBKEY.test(override)) {
    throw new Error(
      `Emulator pubkey override must be 33-byte compressed secp256k1 hex (66 lowercase chars, 02/03 prefix), got ${JSON.stringify(override)}.`
    );
  }
  return override;
}

// packages/ts-sdk/src/extension/asset/types.ts
var TX_HASH_SIZE = 32;
var ASSET_ID_SIZE = 34;
var MASK_ASSET_ID = 1;
var MASK_CONTROL_ASSET = 2;
var MASK_METADATA = 4;

// packages/ts-sdk/src/extension/utils.ts
var BufferWriter = class {
  buffer = [];
  write(data) {
    for (const byte of data) {
      this.buffer.push(byte);
    }
  }
  writeByte(byte) {
    this.buffer.push(byte & 255);
  }
  writeUint16LE(value) {
    const buf = new Uint8Array(2);
    new DataView(buf.buffer).setUint16(0, value, true);
    this.write(buf);
  }
  writeVarUint(value) {
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError("writeVarUint: value must be a non-negative integer");
      }
    } else if (value < 0n) {
      throw new RangeError("writeVarUint: value must be a non-negative integer");
    }
    const val = typeof value === "number" ? BigInt(value) : value;
    const bytes = [];
    let remaining = val;
    do {
      let byte = Number(remaining & 0x7fn);
      remaining >>= 7n;
      if (remaining > 0n) {
        byte |= 128;
      }
      bytes.push(byte);
    } while (remaining > 0n);
    this.write(new Uint8Array(bytes));
  }
  writeVarSlice(data) {
    this.writeVarUint(data.length);
    this.write(data);
  }
  writeCompactSize(value) {
    if (value < 253) {
      this.writeByte(value);
    } else if (value <= 65535) {
      this.writeByte(253);
      this.writeUint16LE(value);
    } else if (value <= 4294967295) {
      this.writeByte(254);
      const b = new Uint8Array(4);
      new DataView(b.buffer).setUint32(0, value, true);
      this.write(b);
    } else {
      throw new Error("CompactSize value too large");
    }
  }
  writeCompactSlice(data) {
    this.writeCompactSize(data.length);
    this.write(data);
  }
  toBytes() {
    return new Uint8Array(this.buffer);
  }
};
var BufferReader = class {
  view;
  offset = 0;
  constructor(data) {
    this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  }
  remaining() {
    return this.view.byteLength - this.offset;
  }
  readByte() {
    if (this.offset >= this.view.byteLength) {
      throw new Error("unexpected end of buffer");
    }
    return this.view.getUint8(this.offset++);
  }
  readSlice(size) {
    if (this.offset + size > this.view.byteLength) {
      throw new Error("unexpected end of buffer");
    }
    const result = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, size);
    this.offset += size;
    return result;
  }
  readUint16LE() {
    if (this.offset + 2 > this.view.byteLength) {
      throw new Error("unexpected end of buffer");
    }
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }
  readVarUint() {
    let result = 0n;
    let shift = 0n;
    let byte;
    do {
      if (this.offset >= this.view.byteLength) {
        throw new Error("unexpected end of buffer");
      }
      byte = this.view.getUint8(this.offset++);
      result |= BigInt(byte & 127) << shift;
      shift += 7n;
    } while (byte & 128);
    return result;
  }
  readVarSlice() {
    const length = Number(this.readVarUint());
    return this.readSlice(length);
  }
  readCompactSize() {
    const first = this.readByte();
    if (first < 253) return first;
    if (first === 253) return this.readUint16LE();
    if (first === 254) {
      const b = this.readSlice(4);
      return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(0, true);
    }
    throw new Error("CompactSize 8-byte values not supported");
  }
  readCompactSlice() {
    const length = this.readCompactSize();
    return this.readSlice(length);
  }
};

// packages/ts-sdk/src/extension/asset/utils.ts
function isZeroBytes(bytes) {
  return bytes.every((byte) => byte === 0);
}

// packages/ts-sdk/src/extension/asset/assetId.ts
var AssetId = class _AssetId {
  constructor(txid, groupIndex) {
    this.txid = txid;
    this.groupIndex = groupIndex;
  }
  txid;
  groupIndex;
  /**
   * Create an asset id from a genesis transaction id and group index.
   *
   * @param txid - Hex-encoded genesis transaction id
   * @param groupIndex - Asset group index within the genesis transaction
   * @returns A validated asset id
   * @throws Error if the txid is missing, malformed, or not 32 bytes long
   * @see fromString
   */
  static create(txid, groupIndex) {
    if (!txid) {
      throw new Error("missing txid");
    }
    let buf;
    try {
      buf = hex.decode(txid);
    } catch {
      throw new Error("invalid txid format, must be hex");
    }
    if (buf.length !== TX_HASH_SIZE) {
      throw new Error(
        `invalid txid length: got ${buf.length} bytes, want ${TX_HASH_SIZE} bytes`
      );
    }
    const assetId = new _AssetId(buf, groupIndex);
    assetId.validate();
    return assetId;
  }
  /**
   * Decode an asset id from its hex string representation.
   *
   * @param s - Hex-encoded asset id
   * @returns Decoded asset id
   * @throws Error if the string is not valid hex or does not encode a valid asset id
   * @see toString
   */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid asset id format, must be hex");
    }
    return _AssetId.fromBytes(buf);
  }
  /**
   * Decode an asset id from its serialized bytes.
   *
   * @param buf - Serialized asset id bytes
   * @returns Decoded asset id
   * @throws Error if the buffer length is invalid
   */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing asset id");
    }
    if (buf.length !== ASSET_ID_SIZE) {
      throw new Error(
        `invalid asset id length: got ${buf.length} bytes, want ${ASSET_ID_SIZE} bytes`
      );
    }
    const reader = new BufferReader(buf);
    return _AssetId.fromReader(reader);
  }
  /**
   * Serialize the asset id to raw bytes.
   *
   * @returns Serialized asset id bytes
   * @see fromBytes
   */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /**
   * Encode the asset id to a hex string.
   *
   * @returns Hex-encoded asset id
   * @see fromString
   */
  toString() {
    return hex.encode(this.serialize());
  }
  /**
   * Validate the asset id fields.
   *
   * @throws Error if the txid is empty or the group index is out of range
   */
  validate() {
    if (isZeroBytes(this.txid)) {
      throw new Error("empty txid");
    }
    if (!Number.isInteger(this.groupIndex) || this.groupIndex < 0 || this.groupIndex > 65535) {
      throw new Error(`invalid group index: ${this.groupIndex}, must be in range [0, 65535]`);
    }
  }
  /**
   * Decode an asset id from a binary reader.
   *
   * @param reader - Reader positioned at an asset id
   * @returns Decoded asset id
   * @throws Error if the reader does not contain enough bytes
   */
  static fromReader(reader) {
    if (reader.remaining() < ASSET_ID_SIZE) {
      throw new Error(
        `invalid asset id length: got ${reader.remaining()}, want ${ASSET_ID_SIZE}`
      );
    }
    const txid = reader.readSlice(TX_HASH_SIZE);
    const index = reader.readUint16LE();
    const assetId = new _AssetId(txid, index);
    assetId.validate();
    return assetId;
  }
  /**
   * Serialize the asset id into an existing binary writer.
   *
   * @param writer - Writer to append the asset id to
   * @see serialize
   */
  serializeTo(writer) {
    writer.write(this.txid);
    writer.writeUint16LE(this.groupIndex);
  }
};

// packages/ts-sdk/package.json
var version = "0.4.75";

// packages/ts-sdk/src/utils/fetch.ts
var buildVersion = "0.9.9";
var sdkVersion = `ts-sdk/${version}`;
var FetchError = class extends Error {
  /** The request URL that failed, when derivable from the `fetch` input. */
  url;
  /** The HTTP method of the failed request (defaults to `"GET"`). */
  method;
  constructor(message, options) {
    super(message, { cause: options.cause });
    this.name = "FetchError";
    this.url = options.url;
    this.method = options.method;
  }
};
var READ_TIMEOUT_MS = 3e4;
var warnedNoTimeoutSupport = false;
function readDeadline(input, init) {
  if (init?.signal || input instanceof Request) return void 0;
  const { method } = describeRequest(input, init);
  const verb = method.toUpperCase();
  if (verb !== "GET" && verb !== "HEAD") return void 0;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(READ_TIMEOUT_MS);
  }
  if (typeof AbortController === "function") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
    timer?.unref?.();
    return controller.signal;
  }
  if (!warnedNoTimeoutSupport) {
    warnedNoTimeoutSupport = true;
    console.warn(
      "Neither AbortSignal.timeout nor AbortController is available in this runtime: provider reads are UNBOUNDED and READ_TIMEOUT_MS is not being applied."
    );
  }
  return void 0;
}
function baseFetch(input, init) {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Fetch API is not available in this environment.");
  }
  const signal = readDeadline(input, init);
  return globalThis.fetch(input, signal ? { ...init, signal } : init).catch((cause) => {
    const { url, method } = describeRequest(input, init);
    throw new FetchError(`Network request failed: ${method} ${url}`, { url, method, cause });
  });
}
function fetch2(input, init) {
  const headers = new Headers(init?.headers);
  headers.set("X-Build-Version", buildVersion);
  headers.set("X-SDK-VERSION", sdkVersion);
  return baseFetch(input, { ...init, headers });
}
function describeRequest(input, init) {
  let url;
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }
  let method;
  if (init?.method !== void 0) {
    method = init.method;
  } else if (input instanceof Request) {
    method = input.method;
  } else {
    method = "GET";
  }
  return { url, method };
}

// packages/ts-sdk/src/providers/utils.ts
function createAbortError() {
  const error = new Error("EventSource closed");
  error.name = "AbortError";
  return error;
}
function eventSourceIterator(eventSource) {
  const messageQueue = [];
  const errorQueue = [];
  let messageResolve = null;
  let errorResolve = null;
  let closed = false;
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    eventSource.removeEventListener("message", messageHandler);
    eventSource.removeEventListener("error", errorHandler);
  };
  const close = () => {
    if (closed) return;
    closed = true;
    messageQueue.length = 0;
    errorQueue.length = 0;
    eventSource.close();
    cleanup();
    if (errorResolve) {
      const reject = errorResolve;
      messageResolve = null;
      errorResolve = null;
      reject(createAbortError());
    }
  };
  const messageHandler = (event) => {
    if (closed) return;
    if (messageResolve) {
      const resolve = messageResolve;
      messageResolve = null;
      errorResolve = null;
      resolve(event);
    } else {
      messageQueue.push(event);
    }
  };
  const errorHandler = () => {
    if (closed) return;
    const error = new Error("EventSource error");
    error.name = "EventSourceError";
    if (errorResolve) {
      const reject = errorResolve;
      messageResolve = null;
      errorResolve = null;
      reject(error);
    } else {
      errorQueue.push(error);
    }
  };
  eventSource.addEventListener("message", messageHandler);
  eventSource.addEventListener("error", errorHandler);
  const gen = (async function* () {
    try {
      while (!closed) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift();
          continue;
        }
        if (errorQueue.length > 0) {
          const error = errorQueue.shift();
          throw error;
        }
        const result = await new Promise((resolve, reject) => {
          messageResolve = resolve;
          errorResolve = reject;
        }).finally(() => {
          messageResolve = null;
          errorResolve = null;
        });
        if (!closed && result) {
          yield result;
        }
      }
    } finally {
      closed = true;
      cleanup();
      eventSource.close();
    }
  })();
  const origReturn = gen.return.bind(gen);
  const managed = gen;
  managed.close = close;
  managed.return = (value) => {
    close();
    return origReturn(value);
  };
  return managed;
}
function isEventSourceError(error) {
  return error instanceof Error && error.name === "EventSourceError";
}

// packages/ts-sdk/src/providers/eventSource.ts
var GUIDANCE = "Pass one with configureEventSource(url => new EventSource(url)) \u2014 in Node, from the `eventsource` package or by running with --experimental-eventsource. In React Native, use ExpoArkProvider / ExpoIndexerProvider instead.";
var EventSourceUnavailableError = class extends Error {
  constructor() {
    super(`no EventSource is available, so server-sent events cannot be opened. ${GUIDANCE}`);
    this.name = "EventSourceUnavailableError";
  }
};
function isEventSourceUnavailableError(error) {
  return error instanceof EventSourceUnavailableError || error instanceof Error && error.name === "EventSourceUnavailableError";
}
var configured;
function resolveEventSource(override) {
  const factory = override ?? configured ?? (typeof EventSource === "undefined" ? void 0 : (url) => new EventSource(url));
  if (!factory) throw new EventSourceUnavailableError();
  return factory;
}

// packages/ts-sdk/src/providers/errors.ts
var ArkError = class extends Error {
  constructor(code, message, name, metadata) {
    super(message);
    this.code = code;
    this.message = message;
    this.name = name;
    this.metadata = metadata;
  }
  code;
  message;
  name;
  metadata;
};
var ArkErrorName = {
  DIGEST_MISMATCH: "DIGEST_MISMATCH",
  VTXO_ALREADY_SPENT: "VTXO_ALREADY_SPENT",
  INVALID_TX_FILTER: "INVALID_TX_FILTER",
  TX_FILTERS_LIMIT_EXCEEDED: "TX_FILTERS_LIMIT_EXCEEDED",
  /**
   * A CLTV closure was spent before its absolute locktime matured. Raised only by
   * `submitTx` (never `finalizeTx`), with metadata
   * `{ locktime, current_locktime, type: "height" | "time" }`.
   *
   * Self-healing, so defer and retry rather than fail: the server matures a
   * seconds-locktime against the **chain tip block's timestamp**, not its wall clock,
   * so a spend attempted promptly at maturity is rejected until a later block lands.
   */
  FORFEIT_CLOSURE_LOCKED: "FORFEIT_CLOSURE_LOCKED"
};
function isArkError(error, name) {
  return error instanceof ArkError && (name === void 0 || error.name === name);
}
var ProviderUnavailableError = class extends Error {
  /** Always `true`: this error type only ever wraps retryable conditions. */
  retryable = true;
  constructor(message, options) {
    super(message, { cause: options?.cause });
    this.name = "ProviderUnavailableError";
  }
};
var ServerResponseMismatchError = class extends Error {
  retryable = false;
  constructor(message, options) {
    super(message, { cause: options?.cause });
    this.name = "ServerResponseMismatchError";
  }
};
function throwIfHttpUnavailable(response, kind, body) {
  if (body !== void 0 && maybeArkError(new Error(body))) return;
  if (response.status === 429 || response.status >= 500) {
    throw new ProviderUnavailableError(
      `${kind} unavailable: ${response.status} ${response.statusText}`
    );
  }
}
function toProviderUnavailable(err2, kind) {
  if (err2 instanceof FetchError) {
    return new ProviderUnavailableError(`${kind} request failed`, { cause: err2 });
  }
  return err2;
}
function maybeArkError(error) {
  try {
    if (!(error instanceof Error)) return void 0;
    const decoded = JSON.parse(error.message);
    if (Array.isArray(decoded.details)) {
      for (const details of decoded.details) {
        if (!("@type" in details)) continue;
        const type = details["@type"];
        if (type !== "type.googleapis.com/ark.v1.ErrorDetails") continue;
        if (!("code" in details)) continue;
        const code = details.code;
        if (!("message" in details)) continue;
        const message = details.message;
        if (!("name" in details)) continue;
        const name = details.name;
        let metadata;
        if ("metadata" in details && isMetadata(details.metadata)) {
          metadata = details.metadata;
        }
        return new ArkError(code, message, name, metadata);
      }
    }
    if (typeof decoded.message === "string") {
      const m = decoded.message.match(/^([A-Z][A-Z0-9_]*) \((\d+)\): ([\s\S]*)$/);
      if (m) return new ArkError(Number(m[2]), m[3], m[1]);
    }
    return void 0;
  } catch (e) {
    return void 0;
  }
}
function isMetadata(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// packages/ts-sdk/src/utils/transaction.ts
var Transaction2 = class extends Transaction {
  static ARK_TX_OPTS = {
    allowUnknown: true,
    allowUnknownOutputs: true,
    allowUnknownInputs: true
  };
  constructor(opts) {
    super(withArkOpts(opts));
  }
  static fromPSBT(psbt_, opts) {
    return Transaction.fromPSBT(psbt_, withArkOpts(opts));
  }
  static fromRaw(raw, opts) {
    return Transaction.fromRaw(raw, withArkOpts(opts));
  }
};
function withArkOpts(opts) {
  return { ...Transaction2.ARK_TX_OPTS, ...opts };
}
function formatSighash(type) {
  return `0x${type.toString(16).padStart(2, "0")}`;
}
function assertAllowedSighashTypes(tx, allowedSighashTypes = [SigHash.DEFAULT]) {
  for (let i = 0; i < tx.inputsLength; i++) {
    const declared = tx.getInput(i).sighashType;
    if (declared === void 0) continue;
    if (!allowedSighashTypes.includes(declared)) {
      throw new Error(`Unallowed sighash type ${formatSighash(declared)} for input ${i}.`);
    }
  }
}

// packages/ts-sdk/src/utils/timelock.ts
var bip68 = __toESM(require_bip68(), 1);
function timelockToSequence(timelock) {
  return bip68.encode(
    timelock.type === "blocks" ? { blocks: Number(timelock.value) } : { seconds: Number(timelock.value) }
  );
}
function sequenceToTimelock(sequence) {
  const decoded = bip68.decode(sequence);
  if ("blocks" in decoded && decoded.blocks !== void 0) {
    return { type: "blocks", value: BigInt(decoded.blocks) };
  }
  if ("seconds" in decoded && decoded.seconds !== void 0) {
    return { type: "seconds", value: BigInt(decoded.seconds) };
  }
  throw new Error(`Invalid BIP68 sequence: ${sequence}`);
}

// packages/ts-sdk/src/utils/unknownFields.ts
var ArkPsbtFieldKey = /* @__PURE__ */ ((ArkPsbtFieldKey2) => {
  ArkPsbtFieldKey2["VtxoTaprootTree"] = "taptree";
  ArkPsbtFieldKey2["VtxoTreeExpiry"] = "expiry";
  ArkPsbtFieldKey2["Cosigner"] = "cosigner";
  ArkPsbtFieldKey2["ConditionWitness"] = "condition";
  ArkPsbtFieldKey2["PrevArkTx"] = "prevarktx";
  ArkPsbtFieldKey2["PrevoutTx"] = "prevouttx";
  return ArkPsbtFieldKey2;
})(ArkPsbtFieldKey || {});
var ArkPsbtFieldKeyType = 222;
function setArkPsbtField(tx, inputIndex, coder, value) {
  tx.updateInput(inputIndex, {
    unknown: [...tx.getInput(inputIndex)?.unknown ?? [], coder.encode(value)]
  });
}
function getArkPsbtFields(tx, inputIndex, coder) {
  const unknown = tx.getInput(inputIndex)?.unknown ?? [];
  const fields = [];
  for (const u of unknown) {
    const v = coder.decode(u);
    if (v !== null) fields.push(v);
  }
  return fields;
}
var VtxoTaprootTree = {
  key: "taptree" /* VtxoTaprootTree */,
  encode: (value) => [
    {
      type: ArkPsbtFieldKeyType,
      key: encodedPsbtFieldKey["taptree" /* VtxoTaprootTree */]
    },
    value
  ],
  decode: (value) => nullIfCatch(() => {
    if (!checkKeyMatch(value[0], "taptree" /* VtxoTaprootTree */)) return null;
    return value[1];
  })
};
var ConditionWitness = {
  key: "condition" /* ConditionWitness */,
  encode: (value) => [
    {
      type: ArkPsbtFieldKeyType,
      key: encodedPsbtFieldKey["condition" /* ConditionWitness */]
    },
    RawWitness.encode(value)
  ],
  decode: (value) => nullIfCatch(() => {
    if (!checkKeyMatch(value[0], "condition" /* ConditionWitness */)) return null;
    return RawWitness.decode(value[1]);
  })
};
var PrevArkTxField = {
  key: "prevarktx" /* PrevArkTx */,
  encode: (value) => [
    {
      type: ArkPsbtFieldKeyType,
      key: encodedPsbtFieldKey["prevarktx" /* PrevArkTx */]
    },
    value
  ],
  decode: (value) => nullIfCatch(() => {
    if (!checkKeyMatch(value[0], "prevarktx" /* PrevArkTx */)) return null;
    return value[1];
  })
};
var CosignerPublicKey = {
  key: "cosigner" /* Cosigner */,
  encode: (value) => [
    {
      type: ArkPsbtFieldKeyType,
      key: new Uint8Array([...encodedPsbtFieldKey["cosigner" /* Cosigner */], value.index])
    },
    value.key
  ],
  decode: (unknown) => nullIfCatch(() => {
    if (!checkKeyMatch(unknown[0], "cosigner" /* Cosigner */, true)) return null;
    return {
      index: unknown[0].key[unknown[0].key.length - 1],
      key: unknown[1]
    };
  })
};
var encodedPsbtFieldKey = Object.fromEntries(
  Object.values(ArkPsbtFieldKey).map((key) => [key, new TextEncoder().encode(key)])
);
var nullIfCatch = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};
function checkKeyMatch(key, arkPsbtFieldKey, prefixOnly = false) {
  if (key.type !== ArkPsbtFieldKeyType) return false;
  const expected = encodedPsbtFieldKey[arkPsbtFieldKey];
  if (key.key.length < expected.length) return false;
  if (!prefixOnly && key.key.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (key.key[i] !== expected[i]) return false;
  }
  return true;
}

// packages/ts-sdk/src/script/address.ts
var ArkAddress = class _ArkAddress {
  /**
   * Create an Arkade address from its server public key, Taproot output key, and prefix.
   *
   * @param serverPubKey - 32-byte Arkade server public key
   * @param vtxoTaprootKey - 32-byte Taproot output key (a.k.a. tweaked public key)
   * @param hrp - Bech32 human-readable prefix
   * @param version - Address version byte
   * @defaultValue `version = 0`
   * @throws Error if either public key is not 32 bytes long
   */
  constructor(serverPubKey, vtxoTaprootKey, hrp = DEFAULT_NETWORK.hrp, version2 = 0) {
    this.serverPubKey = serverPubKey;
    this.vtxoTaprootKey = vtxoTaprootKey;
    this.hrp = hrp;
    this.version = version2;
    if (serverPubKey.length !== 32) {
      throw new Error(
        "Invalid server public key length, expected 32 bytes, got " + serverPubKey.length
      );
    }
    if (vtxoTaprootKey.length !== 32) {
      throw new Error(
        "Invalid vtxo taproot public key length, expected 32 bytes, got " + vtxoTaprootKey.length
      );
    }
  }
  serverPubKey;
  vtxoTaprootKey;
  hrp;
  version;
  /**
   * Decode an Arkade address from its bech32m string form.
   *
   * @param address - Bech32m-encoded Arkade address
   * @returns Decoded Arkade address
   * @throws Error if the address is malformed or has an invalid payload length
   * @see encode
   */
  static decode(address) {
    const decoded = bech32m.decodeUnsafe(address, 1023);
    if (!decoded) {
      throw new Error("Invalid address");
    }
    const data = new Uint8Array(bech32m.fromWords(decoded.words));
    if (data.length !== 1 + 32 + 32) {
      throw new Error("Invalid data length, expected 65 bytes, got " + data.length);
    }
    const version2 = data[0];
    const serverPubKey = data.slice(1, 33);
    const vtxoTaprootPubKey = data.slice(33, 65);
    return new _ArkAddress(serverPubKey, vtxoTaprootPubKey, decoded.prefix, version2);
  }
  /**
   * Encode the address to its bech32m string form.
   *
   * @returns Bech32m-encoded Arkade address
   * @see decode
   */
  encode() {
    const data = new Uint8Array(1 + 32 + 32);
    data[0] = this.version;
    data.set(this.serverPubKey, 1);
    data.set(this.vtxoTaprootKey, 33);
    const words = bech32m.toWords(data);
    return bech32m.encode(this.hrp, words, 1023);
  }
  /** ScriptPubKey used to send non-dust funds to the address. */
  get pkScript() {
    return Script.encode(["OP_1", this.vtxoTaprootKey]);
  }
  /** ScriptPubKey used to send sub-dust funds to the address. */
  get subdustPkScript() {
    return Script.encode(["RETURN", this.vtxoTaprootKey]);
  }
};

// packages/ts-sdk/src/script/tapscript.ts
var MinimalScriptNum = ScriptNum(void 0, true);
function decodeTapscript(script) {
  const types = [
    MultisigTapscript,
    CSVMultisigTapscript,
    ConditionCSVMultisigTapscript,
    ConditionMultisigTapscript,
    CLTVMultisigTapscript
  ];
  for (const type of types) {
    try {
      return type.decode(script);
    } catch (error) {
      continue;
    }
  }
  throw new Error(`Failed to decode: script ${hex.encode(script)} is not a valid tapscript`);
}
var MultisigTapscript;
((MultisigTapscript2) => {
  let MultisigType;
  ((MultisigType2) => {
    MultisigType2[MultisigType2["CHECKSIG"] = 0] = "CHECKSIG";
    MultisigType2[MultisigType2["CHECKSIGADD"] = 1] = "CHECKSIGADD";
  })(MultisigType = MultisigTapscript2.MultisigType || (MultisigTapscript2.MultisigType = {}));
  function encode3(params) {
    if (params.pubkeys.length === 0) {
      throw new Error("At least 1 pubkey is required");
    }
    for (const pubkey of params.pubkeys) {
      if (pubkey.length !== 32) {
        throw new Error(`Invalid pubkey length: expected 32, got ${pubkey.length}`);
      }
    }
    if (!params.type) {
      params.type = 0 /* CHECKSIG */;
    }
    if (params.type === 1 /* CHECKSIGADD */) {
      return {
        type: "multisig" /* Multisig */,
        params,
        script: p2tr_ms(params.pubkeys.length, params.pubkeys).script
      };
    }
    const asm = [];
    for (let i = 0; i < params.pubkeys.length; i++) {
      asm.push(params.pubkeys[i]);
      if (i < params.pubkeys.length - 1) {
        asm.push("CHECKSIGVERIFY");
      } else {
        asm.push("CHECKSIG");
      }
    }
    return {
      type: "multisig" /* Multisig */,
      params,
      script: Script.encode(asm)
    };
  }
  MultisigTapscript2.encode = encode3;
  function decode2(script) {
    if (script.length === 0) {
      throw new Error("Failed to decode: script is empty");
    }
    try {
      return decodeChecksigAdd(script);
    } catch (error) {
      try {
        return decodeChecksig(script);
      } catch (error2) {
        throw new Error(
          `Failed to decode script: ${error2 instanceof Error ? error2.message : String(error2)}`
        );
      }
    }
  }
  MultisigTapscript2.decode = decode2;
  function decodeChecksigAdd(script) {
    const asm = Script.decode(script);
    const pubkeys = [];
    let foundNumEqual = false;
    for (let i = 0; i < asm.length; i++) {
      const op = asm[i];
      if (typeof op !== "string" && typeof op !== "number") {
        if (op.length !== 32) {
          throw new Error(`Invalid pubkey length: expected 32, got ${op.length}`);
        }
        pubkeys.push(op);
        if (i + 1 >= asm.length || asm[i + 1] !== "CHECKSIGADD" && asm[i + 1] !== "CHECKSIG") {
          throw new Error("Expected CHECKSIGADD or CHECKSIG after pubkey");
        }
        i++;
        continue;
      }
      if (i === asm.length - 1) {
        if (op !== "NUMEQUAL") {
          throw new Error("Expected NUMEQUAL at end of script");
        }
        foundNumEqual = true;
      }
    }
    if (!foundNumEqual) {
      throw new Error("Missing NUMEQUAL operation");
    }
    if (pubkeys.length === 0) {
      throw new Error("Invalid script: must have at least 1 pubkey");
    }
    const reconstructed = encode3({
      pubkeys,
      type: 1 /* CHECKSIGADD */
    });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "multisig" /* Multisig */,
      params: { pubkeys, type: 1 /* CHECKSIGADD */ },
      script
    };
  }
  function decodeChecksig(script) {
    const asm = Script.decode(script);
    const pubkeys = [];
    for (let i = 0; i < asm.length; i++) {
      const op = asm[i];
      if (typeof op !== "string" && typeof op !== "number") {
        if (op.length !== 32) {
          throw new Error(`Invalid pubkey length: expected 32, got ${op.length}`);
        }
        pubkeys.push(op);
        if (i + 1 >= asm.length) {
          throw new Error("Unexpected end of script");
        }
        const nextOp = asm[i + 1];
        if (nextOp !== "CHECKSIGVERIFY" && nextOp !== "CHECKSIG") {
          throw new Error("Expected CHECKSIGVERIFY or CHECKSIG after pubkey");
        }
        if (i === asm.length - 2 && nextOp !== "CHECKSIG") {
          throw new Error("Last operation must be CHECKSIG");
        }
        i++;
        continue;
      }
    }
    if (pubkeys.length === 0) {
      throw new Error("Invalid script: must have at least 1 pubkey");
    }
    const reconstructed = encode3({ pubkeys, type: 0 /* CHECKSIG */ });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "multisig" /* Multisig */,
      params: { pubkeys, type: 0 /* CHECKSIG */ },
      script
    };
  }
  function is(tapscript) {
    return tapscript.type === "multisig" /* Multisig */;
  }
  MultisigTapscript2.is = is;
})(MultisigTapscript || (MultisigTapscript = {}));
var CSVMultisigTapscript;
((CSVMultisigTapscript2) => {
  function encode3(params) {
    for (const pubkey of params.pubkeys) {
      if (pubkey.length !== 32) {
        throw new Error(`Invalid pubkey length: expected 32, got ${pubkey.length}`);
      }
    }
    const sequence = MinimalScriptNum.encode(BigInt(timelockToSequence(params.timelock)));
    const asm = [
      sequence.length === 1 ? sequence[0] : sequence,
      "CHECKSEQUENCEVERIFY",
      "DROP"
    ];
    const multisigScript = MultisigTapscript.encode(params);
    const script = new Uint8Array([...Script.encode(asm), ...multisigScript.script]);
    return {
      type: "csv-multisig" /* CSVMultisig */,
      params,
      script
    };
  }
  CSVMultisigTapscript2.encode = encode3;
  function decode2(script) {
    if (script.length === 0) {
      throw new Error("Failed to decode: script is empty");
    }
    const isValid = isScriptValid(script);
    if (isValid instanceof Error) {
      throw isValid;
    }
    const asm = Script.decode(script);
    const sequence = asm[0];
    const multisigScript = new Uint8Array(Script.encode(asm.slice(3)));
    let multisig2;
    try {
      multisig2 = MultisigTapscript.decode(multisigScript);
    } catch (error) {
      throw new Error(
        `Invalid multisig script: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    let sequenceNum;
    if (typeof sequence === "number") {
      sequenceNum = sequence;
    } else {
      sequenceNum = Number(MinimalScriptNum.decode(sequence));
    }
    const timelock = sequenceToTimelock(sequenceNum);
    const reconstructed = encode3({
      timelock,
      ...multisig2.params
    });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "csv-multisig" /* CSVMultisig */,
      params: {
        timelock,
        ...multisig2.params
      },
      script
    };
  }
  CSVMultisigTapscript2.decode = decode2;
  function is(tapscript) {
    return tapscript.type === "csv-multisig" /* CSVMultisig */;
  }
  CSVMultisigTapscript2.is = is;
  function isScriptValid(script) {
    const asm = Script.decode(script);
    if (asm.length < 3) {
      return new Error(`Invalid script: too short (expected at least 3)`);
    }
    const sequence = asm[0];
    if (typeof sequence === "string") {
      return new Error("Invalid script: expected sequence number");
    }
    if (asm[1] !== "CHECKSEQUENCEVERIFY" || asm[2] !== "DROP") {
      return new Error("Invalid script: expected CHECKSEQUENCEVERIFY DROP");
    }
    return true;
  }
  CSVMultisigTapscript2.isScriptValid = isScriptValid;
})(CSVMultisigTapscript || (CSVMultisigTapscript = {}));
var ConditionCSVMultisigTapscript;
((ConditionCSVMultisigTapscript2) => {
  function encode3(params) {
    const script = new Uint8Array([
      ...params.conditionScript,
      ...Script.encode(["VERIFY"]),
      ...CSVMultisigTapscript.encode(params).script
    ]);
    return {
      type: "condition-csv-multisig" /* ConditionCSVMultisig */,
      params,
      script
    };
  }
  ConditionCSVMultisigTapscript2.encode = encode3;
  function decode2(script) {
    if (script.length === 0) {
      throw new Error("Failed to decode: script is empty");
    }
    const isValid = isScriptValid(script);
    if (isValid instanceof Error) {
      throw isValid;
    }
    const asm = Script.decode(script);
    let verifyIndex = getVerifyIndex(asm);
    if (verifyIndex === -1) {
      throw Error("Invalid script: missing VERIFY operation");
    }
    const conditionScript = new Uint8Array(Script.encode(asm.slice(0, verifyIndex)));
    const csvMultisigScript = new Uint8Array(Script.encode(asm.slice(verifyIndex + 1)));
    let csvMultisig;
    try {
      csvMultisig = CSVMultisigTapscript.decode(csvMultisigScript);
    } catch (error) {
      throw new Error(
        `Invalid CSV multisig script: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const reconstructed = encode3({
      conditionScript,
      ...csvMultisig.params
    });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "condition-csv-multisig" /* ConditionCSVMultisig */,
      params: {
        conditionScript,
        ...csvMultisig.params
      },
      script
    };
  }
  ConditionCSVMultisigTapscript2.decode = decode2;
  function is(tapscript) {
    return tapscript.type === "condition-csv-multisig" /* ConditionCSVMultisig */;
  }
  ConditionCSVMultisigTapscript2.is = is;
  function getVerifyIndex(asm) {
    let verifyIndex = -1;
    for (let i = asm.length - 1; i >= 0; i--) {
      if (asm[i] === "VERIFY") {
        verifyIndex = i;
        return verifyIndex;
      }
    }
    return verifyIndex;
  }
  function isScriptValid(script) {
    const asm = Script.decode(script);
    if (asm.length < 1) {
      return new Error(`Invalid script: too short (expected at least 1)`);
    }
    let verifyIndex = getVerifyIndex(asm);
    if (verifyIndex === -1) {
      return new Error("Invalid script: missing VERIFY operation");
    }
    return true;
  }
  ConditionCSVMultisigTapscript2.isScriptValid = isScriptValid;
})(ConditionCSVMultisigTapscript || (ConditionCSVMultisigTapscript = {}));
var ConditionMultisigTapscript;
((ConditionMultisigTapscript2) => {
  function encode3(params) {
    const script = new Uint8Array([
      ...params.conditionScript,
      ...Script.encode(["VERIFY"]),
      ...MultisigTapscript.encode(params).script
    ]);
    return {
      type: "condition-multisig" /* ConditionMultisig */,
      params,
      script
    };
  }
  ConditionMultisigTapscript2.encode = encode3;
  function decode2(script) {
    if (script.length === 0) {
      throw new Error("Failed to decode: script is empty");
    }
    const isValid = isScriptValid(script);
    if (isValid instanceof Error) {
      throw isValid;
    }
    const asm = Script.decode(script);
    let verifyIndex = getVerifyIndex(asm);
    if (verifyIndex === -1) {
      throw Error("Invalid script: missing VERIFY operation");
    }
    const conditionScript = new Uint8Array(Script.encode(asm.slice(0, verifyIndex)));
    const multisigScript = new Uint8Array(Script.encode(asm.slice(verifyIndex + 1)));
    let multisig2;
    try {
      multisig2 = MultisigTapscript.decode(multisigScript);
    } catch (error) {
      throw new Error(
        `Invalid multisig script: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const reconstructed = encode3({
      conditionScript,
      ...multisig2.params
    });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "condition-multisig" /* ConditionMultisig */,
      params: {
        conditionScript,
        ...multisig2.params
      },
      script
    };
  }
  ConditionMultisigTapscript2.decode = decode2;
  function is(tapscript) {
    return tapscript.type === "condition-multisig" /* ConditionMultisig */;
  }
  ConditionMultisigTapscript2.is = is;
  function getVerifyIndex(asm) {
    let verifyIndex = -1;
    for (let i = asm.length - 1; i >= 0; i--) {
      if (asm[i] === "VERIFY") {
        verifyIndex = i;
        return verifyIndex;
      }
    }
    return verifyIndex;
  }
  function isScriptValid(script) {
    const asm = Script.decode(script);
    if (asm.length < 1) {
      return new Error(`Invalid script: too short (expected at least 1)`);
    }
    let verifyIndex = getVerifyIndex(asm);
    if (verifyIndex === -1) {
      return new Error("Invalid script: missing VERIFY operation");
    }
    return true;
  }
  ConditionMultisigTapscript2.isScriptValid = isScriptValid;
})(ConditionMultisigTapscript || (ConditionMultisigTapscript = {}));
var CLTVMultisigTapscript;
((CLTVMultisigTapscript2) => {
  function encode3(params) {
    const locktime = MinimalScriptNum.encode(params.absoluteTimelock);
    const asm = [
      locktime.length === 1 ? locktime[0] : locktime,
      "CHECKLOCKTIMEVERIFY",
      "DROP"
    ];
    const timelockedScript = Script.encode(asm);
    const script = new Uint8Array([
      ...timelockedScript,
      ...MultisigTapscript.encode(params).script
    ]);
    return {
      type: "cltv-multisig" /* CLTVMultisig */,
      params,
      script
    };
  }
  CLTVMultisigTapscript2.encode = encode3;
  function decode2(script) {
    if (script.length === 0) {
      throw new Error("Failed to decode: script is empty");
    }
    const isValid = isScriptValid(script);
    if (isValid instanceof Error) {
      throw isValid;
    }
    const asm = Script.decode(script);
    const locktime = asm[0];
    if (typeof locktime === "string") {
      throw new Error("Invalid script: expected locktime number");
    }
    if (asm[1] !== "CHECKLOCKTIMEVERIFY" || asm[2] !== "DROP") {
      throw new Error("Invalid script: expected CHECKLOCKTIMEVERIFY DROP");
    }
    const multisigScript = new Uint8Array(Script.encode(asm.slice(3)));
    let multisig2;
    try {
      multisig2 = MultisigTapscript.decode(multisigScript);
    } catch (error) {
      throw new Error(
        `Invalid multisig script: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    let absoluteTimelock;
    if (typeof locktime === "number") {
      absoluteTimelock = BigInt(locktime);
    } else {
      absoluteTimelock = MinimalScriptNum.decode(locktime);
    }
    const reconstructed = encode3({
      absoluteTimelock,
      ...multisig2.params
    });
    if (hex.encode(reconstructed.script) !== hex.encode(script)) {
      throw new Error("Invalid script format: script reconstruction mismatch");
    }
    return {
      type: "cltv-multisig" /* CLTVMultisig */,
      params: {
        absoluteTimelock,
        ...multisig2.params
      },
      script
    };
  }
  CLTVMultisigTapscript2.decode = decode2;
  function is(tapscript) {
    return tapscript.type === "cltv-multisig" /* CLTVMultisig */;
  }
  CLTVMultisigTapscript2.is = is;
  function isScriptValid(script) {
    const asm = Script.decode(script);
    if (asm.length < 3) {
      return new Error(`Invalid script: too short (expected at least 3)`);
    }
    const locktime = asm[0];
    if (typeof locktime === "string") {
      return new Error("Invalid script: expected locktime as number or bytes");
    }
    if (asm[1] !== "CHECKLOCKTIMEVERIFY" || asm[2] !== "DROP") {
      return new Error("Invalid script: expected CHECKLOCKTIMEVERIFY DROP");
    }
    return true;
  }
  CLTVMultisigTapscript2.isScriptValid = isScriptValid;
})(CLTVMultisigTapscript || (CLTVMultisigTapscript = {}));

// packages/ts-sdk/src/script/taprootTree.ts
function assembleBtcdTaprootTree(scripts) {
  if (scripts.length === 0) {
    throw new Error("assembleBtcdTaprootTree: empty scripts list");
  }
  const leaves = scripts.map((script) => ({
    script,
    leafVersion: TAP_LEAF_VERSION
  }));
  if (leaves.length === 1) {
    return leaves[0];
  }
  const branches = [];
  for (let i = 0; i < leaves.length; i += 2) {
    if (i === leaves.length - 1) {
      const last = branches.pop();
      if (last === void 0) {
        throw new Error(
          `assembleBtcdTaprootTree: unexpected odd leaf at i=${i} with no prior branch`
        );
      }
      branches.push([last, leaves[i]]);
    } else {
      branches.push([leaves[i], leaves[i + 1]]);
    }
  }
  while (branches.length >= 2) {
    const left = branches.shift();
    const right = branches.shift();
    branches.push([left, right]);
  }
  return branches[0];
}

// packages/ts-sdk/src/script/base.ts
var TapTreeCoder = PSBTOutput.tapTree[2];
function scriptFromTapLeafScript(leaf) {
  return leaf[1].subarray(0, leaf[1].length - 1);
}
var VtxoScript = class _VtxoScript {
  /**
   * Create a virtual output script from its tapleaf scripts.
   *
   * The Taproot script tree is assembled using btcd's algorithm
   * (`txscript.AssembleTaprootScriptTree`) so the derived taproot output
   * key agrees with arkd for any leaf count. `@scure/btc-signer`'s
   * default `taprootListToTree` is a Huffman builder that only agrees
   * with arkd for power-of-2 leaf counts.
   *
   * @param scripts - Raw tapscript bytes for each leaf
   * @throws Error if the provided leaves cannot produce a valid Taproot tree
   */
  constructor(scripts) {
    this.scripts = scripts;
    const tapTree2 = assembleBtcdTaprootTree(scripts);
    const payment = p2tr(TAPROOT_UNSPENDABLE_KEY, tapTree2, void 0, true);
    if (!payment.tapLeafScript || payment.tapLeafScript.length !== scripts.length) {
      throw new Error("invalid scripts");
    }
    this.leaves = payment.tapLeafScript;
    this.tweakedPublicKey = payment.tweakedPubkey;
    this.pkScript = payment.script;
  }
  scripts;
  leaves;
  tweakedPublicKey;
  pkScript;
  /**
   * Decode a virtual output script from an encoded TapTree.
   *
   * @param tapTree - Encoded TapTree bytes
   * @returns Decoded virtual output script
   * @throws Error if the TapTree cannot be decoded into a valid script set
   * @see encode
   */
  static decode(tapTree2) {
    const leaves = TapTreeCoder.decode(tapTree2);
    const scripts = leaves.map((leaf) => leaf.script);
    return new _VtxoScript(scripts);
  }
  /**
   * Encode the virtual output script to a TapTree byte representation.
   *
   * @returns Encoded TapTree bytes
   * @see decode
   */
  encode() {
    const tapTree2 = TapTreeCoder.encode(
      this.scripts.map((script) => ({
        depth: 1,
        version: TAP_LEAF_VERSION,
        script
      }))
    );
    return tapTree2;
  }
  /**
   * Build the Arkade address corresponding to this virtual output script.
   *
   * @param prefix - Bech32 human-readable prefix
   * @param serverPubKey - 32-byte Arkade server public key
   * @returns Arkade address for this script
   * @see ArkAddress
   */
  address(prefix2 = DEFAULT_NETWORK.hrp, serverPubKey) {
    return new ArkAddress(serverPubKey, this.tweakedPublicKey, prefix2);
  }
  /**
   * Build the Taproot onchain address corresponding to this virtual output script.
   *
   * @param network - Bitcoin network descriptor
   * @returns Taproot onchain address
   * @see address
   */
  onchainAddress(network = DEFAULT_NETWORK) {
    return Address(network).encode({
      type: "tr",
      pubkey: this.tweakedPublicKey
    });
  }
  /**
   * Look up a tapleaf script by its hex-encoded tapscript body.
   *
   * @param scriptHex - Hex-encoded tapscript body without the leaf version byte
   * @returns Matching tapleaf script
   * @throws Error if no matching leaf exists
   */
  findLeaf(scriptHex) {
    const leaf = this.leaves.find(
      (leaf2) => hex.encode(scriptFromTapLeafScript(leaf2)) === scriptHex
    );
    if (!leaf) {
      throw new Error(`leaf '${scriptHex}' not found`);
    }
    return leaf;
  }
  /**
   * Return all unilateral exit paths embedded in the virtual output script.
   *
   * @returns CSV-based exit paths found in the leaves
   * @see getSequence
   */
  exitPaths() {
    const paths = [];
    for (const leaf of this.leaves) {
      try {
        const script = scriptFromTapLeafScript(leaf);
        if (CSVMultisigTapscript.isScriptValid(script) === true) {
          const tapScript = CSVMultisigTapscript.decode(script);
          paths.push(tapScript);
        } else if (ConditionCSVMultisigTapscript.isScriptValid(script) === true) {
          const tapScript = ConditionCSVMultisigTapscript.decode(script);
          paths.push(tapScript);
        }
      } catch (e) {
        console.debug("Failed to decode script", e);
      }
    }
    return paths;
  }
};
function getSequence(tapLeafScript) {
  let sequence = void 0;
  try {
    const scriptWithLeafVersion = tapLeafScript[1];
    const script = scriptWithLeafVersion.subarray(0, scriptWithLeafVersion.length - 1);
    try {
      const params = CSVMultisigTapscript.decode(script).params;
      sequence = timelockToSequence(params.timelock);
    } catch {
      const params = CLTVMultisigTapscript.decode(script).params;
      sequence = Number(params.absoluteTimelock);
    }
  } catch {
  }
  return sequence;
}

// packages/ts-sdk/src/intent/index.ts
var Intent;
((Intent2) => {
  function create(message, ins, outputs = []) {
    if (typeof message !== "string") {
      message = encodeMessage(message);
    }
    if (ins.length == 0) throw new Error("intent proof requires at least one input");
    const inputs = ins.map(prepareCoinAsIntentProofInput);
    if (!validateInputs(inputs)) throw new Error("invalid inputs");
    if (!validateOutputs(outputs)) throw new Error("invalid outputs");
    const toSpend = craftToSpendTx(message, inputs[0].witnessUtxo.script);
    return craftToSignTx(toSpend, inputs, outputs, message);
  }
  Intent2.create = create;
  function fee(proof) {
    let sumOfInputs = 0n;
    for (let i = 0; i < proof.inputsLength; i++) {
      const input = proof.getInput(i);
      if (input.witnessUtxo === void 0)
        throw new Error("intent proof input requires witness utxo");
      sumOfInputs += input.witnessUtxo.amount;
    }
    let sumOfOutputs = 0n;
    for (let i = 0; i < proof.outputsLength; i++) {
      const output = proof.getOutput(i);
      if (output.amount === void 0) throw new Error("intent proof output requires amount");
      sumOfOutputs += output.amount;
    }
    if (sumOfOutputs > sumOfInputs) {
      throw new Error(
        `intent proof output amount is greater than input amount: ${sumOfOutputs} > ${sumOfInputs}`
      );
    }
    return Number(sumOfInputs - sumOfOutputs);
  }
  Intent2.fee = fee;
  function encodeMessage(message) {
    switch (message.type) {
      case "register":
        return JSON.stringify({
          type: "register",
          onchain_output_indexes: message.onchain_output_indexes,
          valid_at: message.valid_at,
          expire_at: message.expire_at,
          cosigners_public_keys: message.cosigners_public_keys
        });
      case "delete":
        return JSON.stringify({
          type: "delete",
          expire_at: message.expire_at
        });
      case "get-pending-tx":
        return JSON.stringify({
          type: "get-pending-tx",
          expire_at: message.expire_at
        });
    }
  }
  Intent2.encodeMessage = encodeMessage;
})(Intent || (Intent = {}));
var OP_RETURN_EMPTY_PKSCRIPT = new Uint8Array([OP.RETURN]);
var ZERO_32 = new Uint8Array(32).fill(0);
var MAX_INDEX = 4294967295;
var TAG_INTENT_PROOF = "ark-intent-proof-message";
var PSBT_GLOBAL_GENERIC_SIGNED_MESSAGE = 9;
function validateInput2(input) {
  if (input.index === void 0) throw new Error("intent proof input requires index");
  if (input.txid === void 0) throw new Error("intent proof input requires txid");
  if (input.witnessUtxo === void 0)
    throw new Error("intent proof input requires witness utxo");
  return true;
}
function validateInputs(inputs) {
  inputs.forEach(validateInput2);
  return true;
}
function validateOutput(output) {
  if (output.amount === void 0) throw new Error("intent proof output requires amount");
  if (output.script === void 0) throw new Error("intent proof output requires script");
  return true;
}
function validateOutputs(outputs) {
  outputs.forEach(validateOutput);
  return true;
}
function craftToSpendTx(message, pkScript, tag = TAG_INTENT_PROOF) {
  const messageHash = hashMessage(message, tag);
  const tx = new Transaction2({
    version: 0
  });
  tx.addInput({
    txid: ZERO_32,
    // zero hash
    index: MAX_INDEX,
    sequence: 0
  });
  tx.addOutput({
    amount: 0n,
    script: pkScript
  });
  tx.updateInput(0, {
    finalScriptSig: Script.encode(["OP_0", messageHash])
  });
  return tx;
}
function craftToSignTx(toSpend, inputs, outputs, message) {
  const firstInput = inputs[0];
  const tx = new Transaction2({
    version: 2,
    lockTime: 0
  });
  tx.addInput({
    ...firstInput,
    txid: toSpend.id,
    index: 0,
    witnessUtxo: {
      script: firstInput.witnessUtxo.script,
      amount: 0n
    },
    sighashType: SigHash.ALL
  });
  for (const [i, input] of inputs.entries()) {
    tx.addInput({
      ...input,
      sighashType: SigHash.ALL
    });
    if (input.unknown?.length) {
      tx.updateInput(i + 1, {
        unknown: input.unknown
      });
    }
  }
  if (outputs.length === 0) {
    outputs = [
      {
        amount: 0n,
        script: OP_RETURN_EMPTY_PKSCRIPT
      }
    ];
  }
  for (const output of outputs) {
    tx.addOutput({
      amount: output.amount,
      script: output.script
    });
  }
  const global = tx.global;
  global.unknown = [
    ...global.unknown ?? [],
    [
      { type: PSBT_GLOBAL_GENERIC_SIGNED_MESSAGE, key: new Uint8Array() },
      new TextEncoder().encode(message)
    ]
  ];
  return tx;
}
function hashMessage(message, tag = TAG_INTENT_PROOF) {
  return schnorr.utils.taggedHash(tag, new TextEncoder().encode(message));
}
function prepareCoinAsIntentProofInput(coin) {
  if (!("tapTree" in coin)) {
    return coin;
  }
  const vtxoScript = VtxoScript.decode(coin.tapTree);
  const sequence = getSequence(coin.intentTapLeafScript);
  const unknown = [VtxoTaprootTree.encode(coin.tapTree)];
  if (coin.extraWitness) {
    unknown.push(ConditionWitness.encode(coin.extraWitness));
  }
  if (coin.prevTx) {
    unknown.push(PrevArkTxField.encode(coin.prevTx));
  }
  return {
    txid: hex.decode(coin.txid),
    index: coin.vout,
    witnessUtxo: {
      amount: BigInt(coin.value),
      script: vtxoScript.pkScript
    },
    sequence,
    tapLeafScript: [coin.intentTapLeafScript],
    unknown
  };
}

// packages/ts-sdk/src/providers/rateGate.ts
var DEFAULT_MAX_CONCURRENT = 6;
var DEFAULT_COOLDOWN_MS = 5e3;
var MAX_COOLDOWN_MS = 6e4;
var DEFAULT_JITTER_MS = 500;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function parseRetryAfterMs(header) {
  if (header === null || header === void 0) return void 0;
  const trimmed = header.trim();
  if (trimmed === "") return void 0;
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds)) return seconds < 0 ? void 0 : seconds * 1e3;
  const at = Date.parse(trimmed);
  if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  return void 0;
}
function requestOrigin(input) {
  let url;
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.href;
  } else {
    url = input.url;
  }
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}
var OriginRateGate = class {
  states = /* @__PURE__ */ new Map();
  maxConcurrent;
  defaultCooldownMs;
  maxCooldownMs;
  jitterMs;
  constructor(options) {
    this.maxConcurrent = options?.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
    this.defaultCooldownMs = options?.defaultCooldownMs ?? DEFAULT_COOLDOWN_MS;
    this.maxCooldownMs = options?.maxCooldownMs ?? MAX_COOLDOWN_MS;
    this.jitterMs = options?.jitterMs ?? DEFAULT_JITTER_MS;
  }
  /**
   * Run `fn` under the origin's concurrency cap and behind any active
   * cooldown. Put only the request in `fn`: the slot is released as soon as
   * it settles, so body parsing doesn't hold one.
   */
  async run(input, fn) {
    const state = this.stateFor(requestOrigin(input));
    await this.acquire(state);
    try {
      for (; ; ) {
        const remaining = state.blockedUntil - Date.now();
        if (remaining <= 0) break;
        await sleep(remaining + Math.random() * this.jitterMs);
      }
      return await fn();
    } finally {
      this.release(state);
    }
  }
  /**
   * {@link run} for a request whose response the gate should inspect: a `429`
   * is recorded *before* the slot is released. Reporting after `run()` resolves
   * is too late — `release()` hands the slot to the next queued waiter, which
   * resumes, sees no cooldown, and sends into the limiter that just refused us.
   *
   * Prefer this over `run` for anything returning a `Response`.
   */
  runHttp(input, fn) {
    return this.run(input, async () => {
      const response = await fn();
      if (response.status === 429) {
        this.reportRateLimited(input, response.headers?.get("retry-after"));
      }
      return response;
    });
  }
  /**
   * Record an observed `429`, pausing every gated request to that origin.
   * Monotonic: a shorter cooldown never shortens one already in effect.
   */
  reportRateLimited(input, retryAfterHeader) {
    const cooldown = Math.min(
      parseRetryAfterMs(retryAfterHeader) ?? this.defaultCooldownMs,
      this.maxCooldownMs
    );
    const state = this.stateFor(requestOrigin(input));
    state.blockedUntil = Math.max(state.blockedUntil, Date.now() + cooldown);
  }
  /** Milliseconds left on `input` origin's cooldown; `0` when not cooling down. */
  cooldownRemainingMs(input) {
    const state = this.states.get(requestOrigin(input));
    if (!state) return 0;
    return Math.max(0, state.blockedUntil - Date.now());
  }
  /**
   * Drop all per-origin state, so test suites don't inherit each other's
   * cooldowns. Waiters queued on the discarded state still drain normally.
   */
  reset() {
    this.states.clear();
  }
  stateFor(origin) {
    let state = this.states.get(origin);
    if (!state) {
      state = { blockedUntil: 0, active: 0, queue: [] };
      this.states.set(origin, state);
    }
    return state;
  }
  acquire(state) {
    if (state.active < this.maxConcurrent) {
      state.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      state.queue.push(() => {
        state.active += 1;
        resolve();
      });
    });
  }
  release(state) {
    state.active -= 1;
    const next = state.queue.shift();
    if (next) next();
  }
};
var rateGate = new OriginRateGate();

// packages/ts-sdk/src/providers/ark.ts
var DigestMismatchError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "DigestMismatchError";
  }
};
function advertisedLimit(fromServer) {
  if (fromServer == null) return void 0;
  const limit = BigInt(fromServer);
  return limit > 0n ? limit : void 0;
}
var RestArkProvider = class {
  constructor(serverUrl = DEFAULT_ARKADE_SERVER_URL, options = {}) {
    this.serverUrl = serverUrl;
    this.eventSource = options.eventSource;
  }
  serverUrl;
  /** Overrides {@link configureEventSource} for this provider's streams. */
  eventSource;
  /**
   * Last server-info digest seen from {@link getInfo}. Sent as `X-Digest`
   * so arkd can reject stale client configuration.
   */
  _digest = "";
  _hasServerInfo = false;
  _suppressNextGetInfoChangeEmit = false;
  _serverInfoListeners = /* @__PURE__ */ new Set();
  /**
   * Subscribe to server-info changes. Fired after a stale-info
   * `DIGEST_MISMATCH` refresh or when {@link getInfo} observes a changed digest.
   * Returns an unsubscribe function.
   */
  onServerInfoChanged(listener) {
    this._serverInfoListeners.add(listener);
    return () => {
      this._serverInfoListeners.delete(listener);
    };
  }
  emitServerInfoChanged(info) {
    for (const listener of this._serverInfoListeners) {
      try {
        listener(info);
      } catch (e) {
        console.warn("onServerInfoChanged listener threw", e);
      }
    }
  }
  /**
   * `fetch` wrapper for arkd requests that participates in server-info digest
   * negotiation. Sends the cached `X-Digest`; when arkd rejects a request with
   * `DIGEST_MISMATCH`, refreshes {@link getInfo} (updating the digest), fires
   * {@link onServerInfoChanged}, and THROWS {@link DigestMismatchError} — it
   * never silently retries, since the in-flight request was built against the
   * now-stale config. Dormant until arkd returns the error — then it is the
   * instant, event-driven signer-rotation trigger. {@link getInfo} itself never
   * routes through here: it is the refresh path and must not be digest-gated.
   */
  async authedFetch(url, init) {
    const digest = this._digest;
    const headers = {
      ...init.headers
    };
    if (digest) headers["X-Digest"] = digest;
    let response;
    try {
      response = await fetch2(url, { ...init, headers });
    } catch (err2) {
      throw toProviderUnavailable(err2, "arkade");
    }
    if (response.ok) return response;
    if (response.status === 429) {
      rateGate.reportRateLimited(url, response.headers?.get("retry-after"));
    }
    let body;
    try {
      body = await response.clone().text();
    } catch (e) {
      console.warn("authedFetch could not read response body for digest check", e);
      throwIfHttpUnavailable(response, "arkade");
      return response;
    }
    const arkError = maybeArkError(new Error(body));
    if (!arkError) throwIfHttpUnavailable(response, "arkade");
    if (!isArkError(arkError, ArkErrorName.DIGEST_MISMATCH)) return response;
    this._digest = "";
    this._suppressNextGetInfoChangeEmit = true;
    let info;
    try {
      info = await this.getInfo();
    } finally {
      this._suppressNextGetInfoChangeEmit = false;
    }
    this.emitServerInfoChanged(info);
    throw new DigestMismatchError(
      "Arkade server reported a configuration digest mismatch; server info was refreshed. Rebuild and retry the request under the new server info."
    );
  }
  async getInfo() {
    const url = `${this.serverUrl}/v1/info`;
    const response = await rateGate.runHttp(url, () => fetch2(url));
    if (!response.ok) {
      const errorText = await response.text();
      throwIfHttpUnavailable(response, "arkade", errorText);
      handleError(errorText, `Failed to get server info: ${response.statusText}`);
    }
    const fromServer = await response.json();
    const info = {
      boardingExitDelay: BigInt(fromServer.boardingExitDelay ?? 0),
      checkpointTapscript: fromServer.checkpointTapscript ?? "",
      deprecatedSigners: fromServer.deprecatedSigners?.map((signer) => ({
        // arkd advertises `cutoffDate` as a non-nullable field, so it
        // is always a bigint here — `0n` is the sentinel for "no
        // cutoff" (the classifier maps it to DUE_NOW). The grpc-gateway
        // marshals with EmitUnpopulated, so an unset `cutoff_date`
        // already arrives as `"0"`; a genuinely missing field defaults
        // to `0n` too. Never collapse to `undefined`.
        cutoffDate: BigInt(signer.cutoffDate ?? 0),
        pubkey: signer.pubkey ?? ""
      })) ?? [],
      digest: fromServer.digest ?? "",
      dust: BigInt(fromServer.dust ?? 0),
      fees: {
        intentFee: fromServer.fees?.intentFee ?? {},
        txFeeRate: fromServer?.fees?.txFeeRate ?? ""
      },
      forfeitAddress: fromServer.forfeitAddress ?? "",
      forfeitPubkey: fromServer.forfeitPubkey ?? "",
      network: fromServer.network ?? "",
      scheduledSession: "scheduledSession" in fromServer && fromServer.scheduledSession != null ? {
        duration: BigInt(fromServer.scheduledSession.duration ?? 0),
        nextStartTime: BigInt(fromServer.scheduledSession.nextStartTime ?? 0),
        nextEndTime: BigInt(fromServer.scheduledSession.nextEndTime ?? 0),
        period: BigInt(fromServer.scheduledSession.period ?? 0),
        fees: fromServer.scheduledSession.fees ?? {}
      } : void 0,
      serviceStatus: fromServer.serviceStatus ?? {},
      sessionDuration: BigInt(fromServer.sessionDuration ?? 0),
      signerPubkey: fromServer.signerPubkey ?? "",
      unilateralExitDelay: BigInt(fromServer.unilateralExitDelay ?? 0),
      vtxoTreeExpiry: fromServer.vtxoTreeExpiry != null ? BigInt(fromServer.vtxoTreeExpiry) : void 0,
      maxTxWeight: advertisedLimit(fromServer.maxTxWeight),
      maxOpReturnOutputs: advertisedLimit(fromServer.maxOpReturnOutputs),
      utxoMaxAmount: BigInt(fromServer.utxoMaxAmount ?? -1),
      utxoMinAmount: BigInt(fromServer.utxoMinAmount ?? 0),
      version: fromServer.version ?? "",
      vtxoMaxAmount: BigInt(fromServer.vtxoMaxAmount ?? -1),
      vtxoMinAmount: BigInt(fromServer.vtxoMinAmount ?? 0)
    };
    const previousDigest = this._digest;
    const hadServerInfo = this._hasServerInfo;
    this._digest = info.digest;
    this._hasServerInfo = true;
    if (hadServerInfo && previousDigest !== info.digest && !this._suppressNextGetInfoChangeEmit) {
      this.emitServerInfoChanged(info);
    }
    return info;
  }
  async submitTx(signedArkTx, checkpointTxs) {
    const url = `${this.serverUrl}/v1/tx/submit`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signedArkTx,
        checkpointTxs
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to submit virtual transaction: ${errorText}`);
    }
    const data = await response.json();
    return {
      arkTxid: data.arkTxid,
      finalArkTx: data.finalArkTx,
      signedCheckpointTxs: data.signedCheckpointTxs
    };
  }
  async finalizeTx(arkTxid, finalCheckpointTxs) {
    const url = `${this.serverUrl}/v1/tx/finalize`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        arkTxid,
        finalCheckpointTxs
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to finalize offchain transaction: ${errorText}`);
    }
  }
  async registerIntent(intent) {
    const url = `${this.serverUrl}/v1/batch/registerIntent`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: {
          proof: intent.proof,
          message: Intent.encodeMessage(intent.message)
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to register intent: ${errorText}`);
    }
    const data = await response.json();
    return data.intentId;
  }
  async deleteIntent(intent) {
    const url = `${this.serverUrl}/v1/batch/deleteIntent`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: {
          proof: intent.proof,
          message: Intent.encodeMessage(intent.message)
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to delete intent: ${errorText}`);
    }
  }
  async confirmRegistration(intentId) {
    const url = `${this.serverUrl}/v1/batch/ack`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intentId
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to confirm registration: ${errorText}`);
    }
  }
  async submitTreeNonces(batchId, pubkey, nonces) {
    const url = `${this.serverUrl}/v1/batch/tree/submitNonces`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        batchId,
        pubkey,
        treeNonces: encodeMusig2Nonces(nonces)
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to submit tree nonces: ${errorText}`);
    }
  }
  async submitTreeSignatures(batchId, pubkey, signatures) {
    const url = `${this.serverUrl}/v1/batch/tree/submitSignatures`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        batchId,
        pubkey,
        treeSignatures: encodeMusig2Signatures(signatures)
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to submit tree signatures: ${errorText}`);
    }
  }
  async submitSignedForfeitTxs(signedForfeitTxs, signedCommitmentTx) {
    const url = `${this.serverUrl}/v1/batch/submitForfeitTxs`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signedForfeitTxs,
        signedCommitmentTx
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to submit forfeit transactions: ${response.statusText}`);
    }
  }
  getEventStream(signal, topics) {
    const url = `${this.serverUrl}/v1/batch/events`;
    const queryParams = topics.length > 0 ? `?${topics.map((topic) => `topics=${encodeURIComponent(topic)}`).join("&")}` : "";
    let iterator = null;
    const closeIterator = () => iterator?.close();
    const self = this;
    const gen = (async function* () {
      const abortHandler = closeIterator;
      signal?.addEventListener("abort", abortHandler);
      try {
        while (!signal?.aborted) {
          const currentIterator = eventSourceIterator(
            resolveEventSource(self.eventSource)(url + queryParams)
          );
          iterator = currentIterator;
          try {
            for await (const event of currentIterator) {
              if (signal?.aborted) break;
              try {
                const data = JSON.parse(event.data);
                const settlementEvent = self.parseSettlementEvent(data);
                if (settlementEvent) {
                  yield settlementEvent;
                }
              } catch (err2) {
                console.error("Failed to parse event:", err2);
                throw err2;
              }
            }
          } catch (error) {
            if (signal?.aborted || error instanceof Error && error.name === "AbortError") {
              break;
            }
            if (isFetchTimeoutError(error)) {
              console.debug("Timeout error ignored");
              continue;
            }
            if (isEventSourceError(error)) {
              throw error;
            }
            if (isEventSourceUnavailableError(error)) throw error;
            console.error("Event stream error:", error);
            throw error;
          } finally {
            currentIterator.close();
            iterator = null;
          }
        }
      } finally {
        signal?.removeEventListener("abort", abortHandler);
        closeIterator();
      }
    })();
    const origReturn = gen.return.bind(gen);
    gen.return = (value) => {
      closeIterator();
      return origReturn(value);
    };
    return gen;
  }
  getTransactionsStream(signal) {
    const url = `${this.serverUrl}/v1/txs`;
    let iterator = null;
    const closeIterator = () => iterator?.close();
    const self = this;
    const gen = (async function* () {
      const abortHandler = closeIterator;
      signal?.addEventListener("abort", abortHandler);
      try {
        while (!signal?.aborted) {
          try {
            const currentIterator = eventSourceIterator(
              resolveEventSource(self.eventSource)(url)
            );
            iterator = currentIterator;
            for await (const event of currentIterator) {
              if (signal?.aborted) break;
              try {
                const data = JSON.parse(event.data);
                const txNotification = self.parseTransactionNotification(data);
                if (txNotification) {
                  yield txNotification;
                }
              } catch (err2) {
                console.error("Failed to parse transaction notification:", err2);
                throw err2;
              }
            }
          } catch (error) {
            if (signal?.aborted || error instanceof Error && error.name === "AbortError") {
              break;
            }
            if (isFetchTimeoutError(error)) {
              console.debug("Timeout error ignored");
              continue;
            }
            if (isEventSourceError(error)) {
              throw error;
            }
            if (isEventSourceUnavailableError(error)) throw error;
            console.error("Transaction stream error:", error);
            throw error;
          } finally {
            closeIterator();
            iterator = null;
          }
        }
      } finally {
        signal?.removeEventListener("abort", abortHandler);
        closeIterator();
      }
    })();
    const origReturn = gen.return.bind(gen);
    gen.return = (value) => {
      closeIterator();
      return origReturn(value);
    };
    return gen;
  }
  async getPendingTxs(intent) {
    const url = `${this.serverUrl}/v1/tx/pending`;
    const response = await this.authedFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: {
          proof: intent.proof,
          message: Intent.encodeMessage(intent.message)
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      handleError(errorText, `Failed to get pending transactions: ${errorText}`);
    }
    const data = await response.json();
    return data.pendingTxs;
  }
  parseSettlementEvent(data) {
    if (data.batchStarted) {
      return {
        type: "batch_started" /* BatchStarted */,
        id: data.batchStarted.id,
        intentIdHashes: data.batchStarted.intentIdHashes,
        batchExpiry: BigInt(data.batchStarted.batchExpiry)
      };
    }
    if (data.batchFinalization) {
      return {
        type: "batch_finalization" /* BatchFinalization */,
        id: data.batchFinalization.id,
        commitmentTx: data.batchFinalization.commitmentTx
      };
    }
    if (data.batchFinalized) {
      return {
        type: "batch_finalized" /* BatchFinalized */,
        id: data.batchFinalized.id,
        commitmentTxid: data.batchFinalized.commitmentTxid
      };
    }
    if (data.batchFailed) {
      return {
        type: "batch_failed" /* BatchFailed */,
        id: data.batchFailed.id,
        reason: data.batchFailed.reason
      };
    }
    if (data.treeSigningStarted) {
      return {
        type: "tree_signing_started" /* TreeSigningStarted */,
        id: data.treeSigningStarted.id,
        cosignersPublicKeys: data.treeSigningStarted.cosignersPubkeys,
        unsignedCommitmentTx: data.treeSigningStarted.unsignedCommitmentTx
      };
    }
    if (data.treeNoncesAggregated) {
      return null;
    }
    if (data.treeNonces) {
      return {
        type: "tree_nonces" /* TreeNonces */,
        id: data.treeNonces.id,
        topic: data.treeNonces.topic,
        txid: data.treeNonces.txid,
        nonces: decodeMusig2Nonces(data.treeNonces.nonces)
        // pubkey -> public nonce
      };
    }
    if (data.treeTx) {
      const children = Object.fromEntries(
        Object.entries(data.treeTx.children).map(([outputIndex, txid]) => {
          return [parseInt(outputIndex), txid];
        })
      );
      return {
        type: "tree_tx" /* TreeTx */,
        id: data.treeTx.id,
        topic: data.treeTx.topic,
        batchIndex: data.treeTx.batchIndex,
        chunk: {
          txid: data.treeTx.txid,
          tx: data.treeTx.tx,
          children
        }
      };
    }
    if (data.treeSignature) {
      return {
        type: "tree_signature" /* TreeSignature */,
        id: data.treeSignature.id,
        topic: data.treeSignature.topic,
        batchIndex: data.treeSignature.batchIndex,
        txid: data.treeSignature.txid,
        signature: data.treeSignature.signature
      };
    }
    if (data.streamStarted) {
      return {
        type: "stream_started" /* StreamStarted */,
        id: data.streamStarted.id
      };
    }
    if (data.heartbeat) {
      return null;
    }
    console.warn("Unknown event type:", data);
    return null;
  }
  parseTransactionNotification(data) {
    if (data.commitmentTx) {
      return { commitmentTx: mapTxNotification(data.commitmentTx) };
    }
    if (data.arkTx) {
      return { arkTx: mapTxNotification(data.arkTx) };
    }
    if (data.sweepTx) {
      return {
        sweepTx: {
          ...mapTxNotification(data.sweepTx),
          sweptVtxos: data.sweepTx.sweptVtxos ?? []
        }
      };
    }
    if (data.heartbeat) {
      return null;
    }
    console.warn("Unknown transaction notification type:", data);
    return null;
  }
};
function encodeMusig2Nonces(nonces) {
  const noncesObject = {};
  for (const [txid, nonce] of nonces) {
    noncesObject[txid] = hex.encode(nonce.pubNonce);
  }
  return noncesObject;
}
function encodeMusig2Signatures(signatures) {
  const sigObject = {};
  for (const [txid, sig] of signatures) {
    sigObject[txid] = hex.encode(sig.encode());
  }
  return sigObject;
}
function decodeMusig2Nonces(noncesObject) {
  return new Map(
    Object.entries(noncesObject).map(([txid, nonce]) => {
      if (typeof nonce !== "string") {
        throw new Error("invalid nonce");
      }
      return [txid, { pubNonce: hex.decode(nonce) }];
    })
  );
}
function isFetchTimeoutError(err2) {
  const checkError = (error) => {
    if (!(error instanceof Error)) return false;
    const isCloudflare524 = error.name === "TypeError" && error.message === "Failed to fetch";
    return isCloudflare524 || error.name === "HeadersTimeoutError" || error.name === "BodyTimeoutError" || error.code === "UND_ERR_HEADERS_TIMEOUT" || error.code === "UND_ERR_BODY_TIMEOUT";
  };
  return checkError(err2) || checkError(err2.cause);
}
function mapTxNotification(data) {
  return {
    txid: data.txid,
    tx: data.tx,
    spentVtxos: data.spentVtxos.map(mapVtxo),
    spendableVtxos: data.spendableVtxos.map(mapVtxo),
    checkpointTxs: data.checkpointTxs
  };
}
function mapVtxo(vtxo) {
  return {
    outpoint: {
      txid: vtxo.outpoint.txid,
      vout: vtxo.outpoint.vout
    },
    amount: vtxo.amount,
    script: vtxo.script,
    createdAt: vtxo.createdAt,
    expiresAt: vtxo.expiresAt,
    commitmentTxids: vtxo.commitmentTxids,
    isPreconfirmed: vtxo.isPreconfirmed,
    isSwept: vtxo.isSwept,
    isUnrolled: vtxo.isUnrolled,
    isSpent: vtxo.isSpent,
    spentBy: vtxo.spentBy,
    settledBy: vtxo.settledBy,
    arkTxid: vtxo.arkTxid
  };
}
function handleError(errorText, defaultMessage) {
  const error = new Error(errorText);
  const arkError = maybeArkError(error);
  throw arkError ?? new Error(defaultMessage);
}

// packages/ts-sdk/src/wallet/vtxo.ts
var EXPIRY_MIN_PLAUSIBLE_MS = Date.UTC(2025, 0, 1);
function parseWireExpiry(raw) {
  if (raw === null || raw === void 0 || raw === "") return {};
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return {};
  const ms = n * 1e3;
  if (ms >= EXPIRY_MIN_PLAUSIBLE_MS) return { expiresAt: new Date(ms) };
  return { expiresAtHeight: n };
}
function toBatchExpiry(c) {
  if (c.expiresAt !== void 0) return c.expiresAt.getTime();
  if (c.expiresAtHeight !== void 0) return c.expiresAtHeight * 1e3;
  return void 0;
}
function parseLegacyExpiry(batchExpiry) {
  if (batchExpiry === void 0 || batchExpiry <= 0) return {};
  if (batchExpiry >= EXPIRY_MIN_PLAUSIBLE_MS) return { expiresAt: new Date(batchExpiry) };
  return { expiresAtHeight: batchExpiry / 1e3 };
}
function toVirtualStatus(c) {
  return {
    // Precedence is load-bearing: consumers bucket on this label, so any other order silently
    // moves VTXOs between buckets.
    state: c.isSpent ? "spent" : c.isSwept ? "swept" : c.isPreconfirmed ? "preconfirmed" : "settled",
    commitmentTxIds: c.commitmentTxIds,
    batchExpiry: toBatchExpiry(c)
  };
}
function normalizeVtxo(v) {
  const state = v.virtualStatus?.state;
  const canonicalExpiry = v.expiresAt !== void 0 || v.expiresAtHeight !== void 0;
  const expiry = canonicalExpiry ? (
    // Coerce: a backend that persists through JSON hands back an ISO string, which typechecks
    // as `Date` but returns NaN from `.getTime()` — comparing false against everything.
    {
      expiresAt: v.expiresAt === void 0 ? void 0 : new Date(v.expiresAt),
      expiresAtHeight: v.expiresAtHeight
    }
  ) : parseLegacyExpiry(v.virtualStatus?.batchExpiry);
  const isSpent = v.isSpent ?? state === "spent";
  const isSwept = v.isSwept ?? state === "swept";
  const isPreconfirmed = v.isPreconfirmed ?? state === "preconfirmed";
  const commitmentTxIds = v.commitmentTxIds ?? v.virtualStatus?.commitmentTxIds ?? [];
  return {
    ...v,
    isSpent,
    isSwept,
    isPreconfirmed,
    spentBy: v.spentBy ?? "",
    commitmentTxIds,
    ...expiry,
    virtualStatus: v.virtualStatus ?? toVirtualStatus({ isSpent, isSwept, isPreconfirmed, commitmentTxIds, ...expiry })
  };
}
function convertVtxo(vtxo) {
  const expiry = parseWireExpiry(vtxo.expiresAt);
  const facts = {
    isSpent: vtxo.isSpent,
    isSwept: vtxo.isSwept,
    isPreconfirmed: vtxo.isPreconfirmed,
    commitmentTxIds: vtxo.commitmentTxids,
    ...expiry
  };
  return {
    txid: vtxo.outpoint.txid,
    vout: vtxo.outpoint.vout,
    value: Number(vtxo.amount),
    status: {
      confirmed: !vtxo.isSwept && !vtxo.isPreconfirmed,
      isLeaf: !vtxo.isPreconfirmed
    },
    ...facts,
    virtualStatus: toVirtualStatus(facts),
    spentBy: vtxo.spentBy ?? "",
    settledBy: vtxo.settledBy,
    arkTxId: vtxo.arkTxid,
    createdAt: new Date(Number(vtxo.createdAt) * 1e3),
    isUnrolled: vtxo.isUnrolled,
    script: vtxo.script,
    assets: vtxo.assets?.map((a) => ({
      assetId: a.assetId,
      amount: BigInt(a.amount)
    }))
  };
}
async function getNormalizedVtxos(provider, opts) {
  const { vtxos, page } = await provider.getVtxos(opts);
  return { vtxos: vtxos.map(normalizeVtxo), page };
}
function hasTerminalSpend(vtxo) {
  const n = normalizeVtxo(vtxo);
  return !!n.isSpent || !!n.spentBy || !!n.settledBy;
}

// packages/ts-sdk/src/utils/keys.ts
function toXOnly(key, label = "public key") {
  if (key.length === 32) return key;
  if (key.length === 33 && (key[0] === 2 || key[0] === 3)) return key.subarray(1);
  throw new Error(`${label} is not a compressed or x-only public key`);
}

// packages/ts-sdk/src/utils/anchor.ts
var ANCHOR_VALUE = 0n;
var ANCHOR_PKSCRIPT = new Uint8Array([81, 2, 78, 115]);
var P2A = {
  script: ANCHOR_PKSCRIPT,
  amount: ANCHOR_VALUE
};
var hexP2Ascript = hex.encode(P2A.script);

// packages/ts-sdk/src/extension/asset/assetRef.ts
var AssetRef = class _AssetRef {
  constructor(ref) {
    this.ref = ref;
  }
  ref;
  /** Reference type discriminator. */
  get type() {
    return this.ref.type;
  }
  /**
   * Create an asset reference that points to a specific asset id.
   *
   * @param assetId - Asset id referenced by this pointer
   * @returns Asset reference by id
   * @see fromGroupIndex
   */
  static fromId(assetId) {
    return new _AssetRef({ type: 1 /* ByID */, assetId });
  }
  /**
   * Create an asset reference that points to another asset group by index.
   *
   * @param groupIndex - Zero-based asset group index in the packet
   * @returns Asset reference by group index
   * @see fromId
   */
  static fromGroupIndex(groupIndex) {
    return new _AssetRef({ type: 2 /* ByGroup */, groupIndex });
  }
  /**
   * Decode an asset reference from its hex string form.
   *
   * @param s - Hex-encoded asset reference
   * @returns Decoded asset reference
   * @throws Error if the string is not valid hex or does not encode a valid asset reference
   * @see toString
   */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid asset ref format, must be hex");
    }
    return _AssetRef.fromBytes(buf);
  }
  /**
   * Decode an asset reference from its serialized bytes.
   *
   * @param buf - Serialized asset reference bytes
   * @returns Decoded asset reference
   * @throws Error if the buffer is empty or malformed
   */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing asset ref");
    }
    const reader = new BufferReader(buf);
    return _AssetRef.fromReader(reader);
  }
  /**
   * Serialize the asset reference to raw bytes.
   *
   * @returns Serialized asset reference bytes
   * @see fromBytes
   */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /**
   * Encode the asset reference to a hex string.
   *
   * @returns Hex-encoded asset reference
   * @see fromString
   */
  toString() {
    return hex.encode(this.serialize());
  }
  /**
   * Decode an asset reference from a binary reader.
   *
   * @param reader - Reader positioned at an asset reference
   * @returns Decoded asset reference
   * @throws Error if the type is unknown or the reader does not contain enough bytes
   */
  static fromReader(reader) {
    const type = reader.readByte();
    let ref;
    switch (type) {
      case 1 /* ByID */: {
        const assetId = AssetId.fromReader(reader);
        ref = new _AssetRef({ type: 1 /* ByID */, assetId });
        break;
      }
      case 2 /* ByGroup */: {
        if (reader.remaining() < 2) {
          throw new Error("invalid asset ref length");
        }
        const groupIndex = reader.readUint16LE();
        ref = new _AssetRef({ type: 2 /* ByGroup */, groupIndex });
        break;
      }
      case 0 /* Unspecified */:
        throw new Error("asset ref type unspecified");
      default:
        throw new Error(`asset ref type unknown ${type}`);
    }
    return ref;
  }
  /**
   * Serialize the asset reference into an existing binary writer.
   *
   * @param writer - Writer to append the asset reference to
   * @see serialize
   */
  serializeTo(writer) {
    writer.writeByte(this.ref.type);
    switch (this.ref.type) {
      case 1 /* ByID */:
        this.ref.assetId.serializeTo(writer);
        break;
      case 2 /* ByGroup */:
        writer.writeUint16LE(this.ref.groupIndex);
        break;
    }
  }
};

// packages/ts-sdk/src/extension/asset/assetInput.ts
var AssetInput = class _AssetInput {
  constructor(input) {
    this.input = input;
  }
  input;
  /** Gets the transaction input index for an asset input, e.g. 0 */
  get vin() {
    return this.input.vin;
  }
  /** Gets the amount for an input (in most cases, 330 sats) */
  get amount() {
    return this.input.amount;
  }
  /** Create a local asset input that points at a transaction input index. */
  static create(vin, amount) {
    const input = new _AssetInput({
      type: 1 /* Local */,
      vin,
      amount: typeof amount === "number" ? BigInt(amount) : amount
    });
    input.validate();
    return input;
  }
  /** Create an intent-backed asset input referencing an external intent transaction. */
  static createIntent(txid, vin, amount) {
    if (!txid || txid.length === 0) {
      throw new Error("missing input intent txid");
    }
    let buf;
    try {
      buf = hex.decode(txid);
    } catch {
      throw new Error("invalid input intent txid format, must be hex");
    }
    if (buf.length !== TX_HASH_SIZE) {
      throw new Error("invalid input intent txid length");
    }
    const input = new _AssetInput({
      type: 2 /* Intent */,
      txid: buf,
      vin,
      amount: typeof amount === "number" ? BigInt(amount) : amount
    });
    input.validate();
    return input;
  }
  /** Decode an asset input from its hex string form. */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid format, must be hex");
    }
    return _AssetInput.fromBytes(buf);
  }
  /** Decode an asset input from its serialized bytes. */
  static fromBytes(buf) {
    const reader = new BufferReader(buf);
    return _AssetInput.fromReader(reader);
  }
  /** Serialize the asset input to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Encode the asset input to a hex string. */
  toString() {
    return hex.encode(this.serialize());
  }
  /** Validate the asset input fields. */
  validate() {
    switch (this.input.type) {
      case 1 /* Local */:
        break;
      case 2 /* Intent */:
        if (isZeroBytes(this.input.txid)) {
          throw new Error("missing input intent txid");
        }
        break;
    }
  }
  /** Decode an asset input from a buffer reader. */
  static fromReader(reader) {
    const type = reader.readByte();
    let input;
    switch (type) {
      case 1 /* Local */: {
        const vin = reader.readUint16LE();
        const amount = reader.readVarUint();
        input = new _AssetInput({
          type: 1 /* Local */,
          vin,
          amount
        });
        break;
      }
      case 2 /* Intent */: {
        if (reader.remaining() < TX_HASH_SIZE) {
          throw new Error("invalid input intent txid length");
        }
        const txid = reader.readSlice(TX_HASH_SIZE);
        const vin = reader.readUint16LE();
        const amount = reader.readVarUint();
        input = new _AssetInput({
          type: 2 /* Intent */,
          txid: new Uint8Array(txid),
          vin,
          amount
        });
        break;
      }
      case 0 /* Unspecified */:
        throw new Error("asset input type unspecified");
      default:
        throw new Error(`asset input type ${type} unknown`);
    }
    input.validate();
    return input;
  }
  /** Serialize the asset input into an existing buffer writer. */
  serializeTo(writer) {
    writer.writeByte(this.input.type);
    if (this.input.type === 2 /* Intent */) {
      writer.write(this.input.txid);
    }
    writer.writeUint16LE(this.input.vin);
    writer.writeVarUint(this.input.amount);
  }
};
var AssetInputs = class _AssetInputs {
  constructor(inputs) {
    this.inputs = inputs;
  }
  inputs;
  /** Create a validated list of asset inputs. */
  static create(inputs) {
    const list = new _AssetInputs(inputs);
    list.validate();
    return list;
  }
  /** Decode an asset input list from its hex string form. */
  static fromString(s) {
    if (!s || s.length === 0) {
      throw new Error("missing asset inputs");
    }
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid asset inputs format, must be hex");
    }
    const reader = new BufferReader(buf);
    return _AssetInputs.fromReader(reader);
  }
  /** Serialize the asset input list to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Encode the asset input list to a hex string. */
  toString() {
    return hex.encode(this.serialize());
  }
  /** Validate the asset input list. */
  validate() {
    const seen = /* @__PURE__ */ new Set();
    let listType = 0 /* Unspecified */;
    for (const assetInput of this.inputs) {
      assetInput.validate();
      if (listType === 0 /* Unspecified */) {
        listType = assetInput.input.type;
      } else if (listType !== assetInput.input.type) {
        throw new Error("all inputs must be of the same type");
      }
      if (assetInput.input.type === 1 /* Local */) {
        if (seen.has(assetInput.input.vin)) {
          throw new Error(`duplicated input vin ${assetInput.input.vin}`);
        }
        seen.add(assetInput.input.vin);
        continue;
      }
    }
  }
  /** Decode an asset input list from a buffer reader. */
  static fromReader(reader) {
    const count = Number(reader.readVarUint());
    const inputs = [];
    for (let i = 0; i < count; i++) {
      inputs.push(AssetInput.fromReader(reader));
    }
    return _AssetInputs.create(inputs);
  }
  /** Serialize the asset input list into an existing buffer writer. */
  serializeTo(writer) {
    writer.writeVarUint(this.inputs.length);
    for (const input of this.inputs) {
      input.serializeTo(writer);
    }
  }
};

// packages/ts-sdk/src/extension/asset/assetOutput.ts
var AssetOutput = class _AssetOutput {
  constructor(vout, amount) {
    this.vout = vout;
    this.amount = amount;
  }
  vout;
  amount;
  // 0x01 means local output, there is only 1 local output type currently
  // however we serialize it for future upgrades
  static TYPE_LOCAL = 1;
  /** Create a local asset output referencing a transaction output index. */
  static create(vout, amount) {
    const output = new _AssetOutput(vout, typeof amount === "number" ? BigInt(amount) : amount);
    output.validate();
    return output;
  }
  /** Decode an asset output from its hex string form. */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid asset output format, must be hex");
    }
    return _AssetOutput.fromBytes(buf);
  }
  /** Decode an asset output from its serialized bytes. */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing asset output");
    }
    const reader = new BufferReader(buf);
    const output = _AssetOutput.fromReader(reader);
    output.validate();
    return output;
  }
  /** Serialize the asset output to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Encode the asset output to a hex string. */
  toString() {
    return hex.encode(this.serialize());
  }
  /** Validate the asset output fields. */
  validate() {
    if (!Number.isInteger(this.vout) || this.vout < 0 || this.vout > 65535) {
      throw new Error("asset output vout must be an integer in range [0, 65535]");
    }
    if (this.amount <= 0n) {
      throw new Error("asset output amount must be greater than 0");
    }
  }
  /** Decode an asset output from a buffer reader. */
  static fromReader(reader) {
    if (reader.remaining() < 2) {
      throw new Error("invalid asset output vout length");
    }
    const type = reader.readByte();
    if (type !== _AssetOutput.TYPE_LOCAL) {
      if (type === 0) {
        throw new Error("output type unspecified");
      }
      throw new Error("unknown asset output type");
    }
    let vout;
    try {
      vout = reader.readUint16LE();
    } catch {
      throw new Error("invalid asset output vout length");
    }
    const amount = reader.readVarUint();
    return new _AssetOutput(vout, amount);
  }
  /** Serialize the asset output into an existing buffer writer. */
  serializeTo(writer) {
    writer.writeByte(1);
    writer.writeUint16LE(this.vout);
    writer.writeVarUint(this.amount);
  }
};
var AssetOutputs = class _AssetOutputs {
  constructor(outputs) {
    this.outputs = outputs;
  }
  outputs;
  /** Create a validated list of asset outputs. */
  static create(outputs) {
    const list = new _AssetOutputs(outputs);
    list.validate();
    return list;
  }
  /** Decode an asset output list from its hex string form. */
  static fromString(s) {
    if (!s || s.length === 0) {
      throw new Error("missing asset outputs");
    }
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid asset outputs format, must be hex");
    }
    const reader = new BufferReader(buf);
    return _AssetOutputs.fromReader(reader);
  }
  /** Serialize the asset output list to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Encode the asset output list to a hex string. */
  toString() {
    return hex.encode(this.serialize());
  }
  /** Validate the asset output list. */
  validate() {
    const seen = /* @__PURE__ */ new Set();
    for (const output of this.outputs) {
      output.validate();
      if (seen.has(output.vout)) {
        throw new Error(`duplicated output vout ${output.vout}`);
      }
      seen.add(output.vout);
    }
  }
  /** Decode an asset output list from a buffer reader. */
  static fromReader(reader) {
    const count = Number(reader.readVarUint());
    if (count === 0) {
      return new _AssetOutputs([]);
    }
    const outputs = [];
    for (let i = 0; i < count; i++) {
      outputs.push(AssetOutput.fromReader(reader));
    }
    const result = new _AssetOutputs(outputs);
    result.validate();
    return result;
  }
  /** Serialize the asset output list into an existing buffer writer. */
  serializeTo(writer) {
    this.validate();
    writer.writeVarUint(this.outputs.length);
    for (const output of this.outputs) {
      output.serializeTo(writer);
    }
  }
};

// packages/ts-sdk/src/extension/asset/metadata.ts
var Metadata = class _Metadata {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
  key;
  value;
  /** Create a metadata entry from raw key and value bytes. */
  static create(key, value) {
    const md = new _Metadata(key, value);
    md.validate();
    return md;
  }
  /** Decode metadata from its hex string form. */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid metadata format, must be hex");
    }
    return _Metadata.fromBytes(buf);
  }
  /** Decode metadata from its serialized bytes. */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing metadata");
    }
    const reader = new BufferReader(buf);
    return _Metadata.fromReader(reader);
  }
  /** Serialize metadata to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Encode metadata to a hex string. */
  toString() {
    return hex.encode(this.serialize());
  }
  get keyString() {
    return new TextDecoder().decode(this.key);
  }
  get valueString() {
    return new TextDecoder().decode(this.value);
  }
  /** Validate the metadata key and value. */
  validate() {
    if (this.key.length === 0) {
      throw new Error("missing metadata key");
    }
    if (this.value.length === 0) {
      throw new Error("missing metadata value");
    }
  }
  /** Decode metadata from a buffer reader. */
  static fromReader(reader) {
    let key;
    let value;
    try {
      key = reader.readVarSlice();
    } catch {
      throw new Error("invalid metadata length");
    }
    try {
      value = reader.readVarSlice();
    } catch {
      throw new Error("invalid metadata length");
    }
    const md = new _Metadata(key, value);
    md.validate();
    return md;
  }
  /** Serialize metadata into an existing buffer writer. */
  serializeTo(writer) {
    writer.writeVarSlice(this.key);
    writer.writeVarSlice(this.value);
  }
};
var MetadataList = class _MetadataList {
  constructor(items) {
    this.items = items;
  }
  items;
  static ARK_LEAF_TAG = "ArkadeAssetLeaf";
  static ARK_BRANCH_TAG = "ArkadeAssetBranch";
  static ARK_LEAF_VERSION = 0;
  /** Create a metadata list from its hex string form. */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid metadata list format");
    }
    return _MetadataList.fromBytes(buf);
  }
  /** Decode a metadata list from its serialized bytes. */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing metadata list");
    }
    const reader = new BufferReader(buf);
    return _MetadataList.fromReader(reader);
  }
  /** Decode a metadata list from a buffer reader. */
  static fromReader(reader) {
    const count = Number(reader.readVarUint());
    const items = Array.from({ length: count }, () => Metadata.fromReader(reader));
    return new _MetadataList(items);
  }
  /** Serialize the metadata list into an existing buffer writer. */
  serializeTo(writer) {
    writer.writeVarUint(this.items.length);
    for (const item of this) {
      item.serializeTo(writer);
    }
  }
  /** Serialize the metadata list to raw bytes. */
  serialize() {
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /** Iterate through metadata entries in insertion order. */
  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
  get length() {
    return this.items.length;
  }
  /** Compute the tagged Merkle root for the metadata list. */
  hash() {
    if (this.items.length === 0) throw new Error("missing metadata list");
    const levels = buildMetadataMerkleTree(this.items);
    return levels[levels.length - 1][0];
  }
};
function computeMetadataLeafHash(md) {
  const writer = new BufferWriter();
  writer.writeByte(MetadataList.ARK_LEAF_VERSION);
  writer.writeVarSlice(md.key);
  writer.writeVarSlice(md.value);
  return schnorr.utils.taggedHash(MetadataList.ARK_LEAF_TAG, writer.toBytes());
}
function computeMetadataBranchHash(a, b) {
  const [smaller, larger] = compareBytes(a, b) === -1 ? [a, b] : [b, a];
  return schnorr.utils.taggedHash(MetadataList.ARK_BRANCH_TAG, smaller, larger);
}
function buildMetadataMerkleTree(leaves) {
  if (leaves.length === 0) return [];
  const leafHashes = leaves.map(computeMetadataLeafHash);
  const levels = [leafHashes];
  let current = leafHashes;
  while (current.length > 1) {
    const next = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        next.push(computeMetadataBranchHash(current[i], current[i + 1]));
      } else {
        next.push(current[i]);
      }
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

// packages/ts-sdk/src/extension/asset/assetGroup.ts
var AssetGroup = class _AssetGroup {
  /** @see create */
  constructor(assetId, controlAsset, inputs, outputs, metadata) {
    this.assetId = assetId;
    this.controlAsset = controlAsset;
    this.inputs = inputs;
    this.outputs = outputs;
    this.metadataList = new MetadataList(metadata);
  }
  assetId;
  controlAsset;
  inputs;
  outputs;
  metadataList;
  /**
   * Create and validate an asset group.
   *
   * @param assetId - Asset id for this group, or `null` for fresh issuance
   * @param controlAsset - Optional control asset reference for (re) issuance
   * @param inputs - Asset inputs in the group
   * @param outputs - Asset outputs in the group
   * @param metadata - Metadata entries associated with the group
   * @returns A validated asset group
   * @throws Error if the group fails validation
   * @see validate
   */
  static create(assetId, controlAsset, inputs, outputs, metadata) {
    const ag = new _AssetGroup(assetId, controlAsset, inputs, outputs, metadata);
    ag.validate();
    return ag;
  }
  /**
   * Decode an asset group from its hex string form.
   *
   * @param s - Hex-encoded asset group
   * @returns Decoded asset group
   * @throws Error if the string is not valid hex or does not encode a valid asset group
   * @see toString
   */
  static fromString(s) {
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid format, must be hex");
    }
    return _AssetGroup.fromBytes(buf);
  }
  /**
   * Decode an asset group from its serialized bytes.
   *
   * @param buf - Serialized asset group bytes
   * @returns Decoded asset group
   * @throws Error if the buffer is empty or malformed
   */
  static fromBytes(buf) {
    if (!buf || buf.length === 0) {
      throw new Error("missing asset group");
    }
    const reader = new BufferReader(buf);
    return _AssetGroup.fromReader(reader);
  }
  /**
   * Return true when the group represents an issuance.
   *
   * @returns `true` when the group has no asset id
   */
  isIssuance() {
    return this.assetId === null;
  }
  /**
   * Return true when the group represents a reissuance.
   *
   * @returns `true` when the group has an asset id and outputs exceed local inputs
   * @remarks
   * Only local inputs contribute to the comparison; intent-backed inputs contribute `0` here.
   */
  isReissuance() {
    const sumReducer = (s, { amount }) => s + amount;
    const sumOutputs = this.outputs.reduce(sumReducer, 0n);
    const sumInputs = this.inputs.map((i) => ({
      amount: i.input.type === 1 /* Local */ ? i.input.amount : 0n
    })).reduce(sumReducer, 0n);
    return !this.isIssuance() && sumInputs < sumOutputs;
  }
  /**
   * Serialize the asset group to raw bytes.
   *
   * @returns Serialized asset group bytes
   * @see fromBytes
   */
  serialize() {
    this.validate();
    const writer = new BufferWriter();
    this.serializeTo(writer);
    return writer.toBytes();
  }
  /**
   * Validate the asset group and its child structures.
   *
   * @throws Error if the group is empty or violates issuance invariants
   */
  validate() {
    if (this.inputs.length === 0 && this.outputs.length === 0) {
      throw new Error("empty asset group");
    }
    if (this.isIssuance()) {
      if (this.inputs.length !== 0) {
        throw new Error("issuance must have no inputs");
      }
    } else {
      if (this.controlAsset !== null) {
        throw new Error("only issuance can have a control asset");
      }
    }
  }
  /**
   * Convert the group into its batch-leaf representation for the given intent txid.
   *
   * @param intentTxid - Intent transaction id used to build the leaf input reference
   * @returns Batch-leaf asset group
   * @see AssetInput.createIntent
   */
  toBatchLeafAssetGroup(intentTxid) {
    const leafInput = AssetInput.createIntent(hex.encode(intentTxid), 0, 0);
    return new _AssetGroup(
      this.assetId,
      this.controlAsset,
      [leafInput],
      this.outputs,
      this.metadataList.items
    );
  }
  /**
   * Encode the asset group to a hex string.
   *
   * @returns Hex-encoded asset group
   * @see fromString
   */
  toString() {
    return hex.encode(this.serialize());
  }
  /**
   * Decode an asset group from a binary reader.
   *
   * @param reader - Reader positioned at an asset group
   * @returns Decoded asset group
   * @throws Error if the encoded group is malformed
   */
  static fromReader(reader) {
    const presence = reader.readByte();
    let assetId = null;
    let controlAsset = null;
    let metadata = [];
    if (presence & MASK_ASSET_ID) {
      assetId = AssetId.fromReader(reader);
    }
    if (presence & MASK_CONTROL_ASSET) {
      controlAsset = AssetRef.fromReader(reader);
    }
    if (presence & MASK_METADATA) {
      metadata = MetadataList.fromReader(reader).items;
    }
    const inputs = AssetInputs.fromReader(reader);
    const outputs = AssetOutputs.fromReader(reader);
    const ag = new _AssetGroup(assetId, controlAsset, inputs.inputs, outputs.outputs, metadata);
    ag.validate();
    return ag;
  }
  /**
   * Serialize the asset group into an existing binary writer.
   *
   * @param writer - Writer to append the asset group to
   */
  serializeTo(writer) {
    let presence = 0;
    if (this.assetId !== null) {
      presence |= MASK_ASSET_ID;
    }
    if (this.controlAsset !== null) {
      presence |= MASK_CONTROL_ASSET;
    }
    if (this.metadataList.length > 0) {
      presence |= MASK_METADATA;
    }
    writer.writeByte(presence);
    if (presence & MASK_ASSET_ID) {
      this.assetId.serializeTo(writer);
    }
    if (presence & MASK_CONTROL_ASSET) {
      this.controlAsset.serializeTo(writer);
    }
    if (presence & MASK_METADATA) {
      this.metadataList.serializeTo(writer);
    }
    writer.writeVarUint(this.inputs.length);
    for (const input of this.inputs) {
      input.serializeTo(writer);
    }
    writer.writeVarUint(this.outputs.length);
    for (const output of this.outputs) {
      output.serializeTo(writer);
    }
  }
};

// packages/ts-sdk/src/extension/asset/packet.ts
var Packet = class _Packet {
  constructor(groups) {
    this.groups = groups;
  }
  groups;
  /** PACKET_TYPE is the 1-byte TLV type tag used in the Extension envelope. */
  static PACKET_TYPE = 0;
  /** Create a validated asset packet from a list of asset groups. */
  static create(groups) {
    const p = new _Packet(groups);
    p.validate();
    return p;
  }
  /**
   * fromBytes parses a Packet from raw bytes.
   */
  static fromBytes(buf) {
    return _Packet.fromReader(new BufferReader(buf));
  }
  /**
   * fromString parses a Packet from a raw hex string (not an OP_RETURN script).
   */
  static fromString(s) {
    if (!s) {
      throw new Error("missing packet data");
    }
    let buf;
    try {
      buf = hex.decode(s);
    } catch {
      throw new Error("invalid packet format, must be hex");
    }
    return _Packet.fromBytes(buf);
  }
  /**
   * type returns the TLV packet type tag. Implements ExtensionPacket interface.
   */
  type() {
    return _Packet.PACKET_TYPE;
  }
  /** Convert the packet into the batch-leaf form for a specific intent transaction id. */
  leafTxPacket(intentTxid) {
    const leafGroups = this.groups.map((group) => group.toBatchLeafAssetGroup(intentTxid));
    return new _Packet(leafGroups);
  }
  /**
   * serialize encodes the packet as raw bytes (varint group count + group data).
   * Does NOT include OP_RETURN, Arkade magic bytes (`ARK`), or TLV type/length; those are
   * added by the Extension module.
   */
  serialize() {
    if (this.groups.length === 0) {
      return new Uint8Array(0);
    }
    const writer = new BufferWriter();
    writer.writeVarUint(this.groups.length);
    for (const group of this.groups) {
      group.serializeTo(writer);
    }
    return writer.toBytes();
  }
  /**
   * toString returns the hex-encoded raw packet bytes.
   */
  toString() {
    return hex.encode(this.serialize());
  }
  /** Validate packet structure and cross-group references. */
  validate() {
    if (this.groups.length === 0) {
      throw new Error("missing assets");
    }
    const seenAssetIds = /* @__PURE__ */ new Set();
    for (const group of this.groups) {
      if (group.assetId !== null) {
        const key = group.assetId.toString();
        if (seenAssetIds.has(key)) {
          throw new Error(`duplicate asset group for asset ${key}`);
        }
        seenAssetIds.add(key);
      }
      if (group.controlAsset !== null && group.controlAsset.ref.type === 2 /* ByGroup */ && group.controlAsset.ref.groupIndex >= this.groups.length) {
        throw new Error(
          `invalid control asset group index, ${group.controlAsset.ref.groupIndex} out of range [0, ${this.groups.length - 1}]`
        );
      }
    }
  }
  static fromReader(reader) {
    const count = Number(reader.readVarUint());
    const groups = [];
    for (let i = 0; i < count; i++) {
      groups.push(AssetGroup.fromReader(reader));
    }
    if (reader.remaining() > 0) {
      throw new Error(
        `invalid packet length, left ${reader.remaining()} unknown bytes to read`
      );
    }
    const packet = new _Packet(groups);
    packet.validate();
    return packet;
  }
};

// packages/ts-sdk/src/extension/packet.ts
var UnknownPacket = class {
  constructor(packetType, data) {
    this.packetType = packetType;
    this.data = data;
  }
  packetType;
  data;
  type() {
    return this.packetType;
  }
  serialize() {
    return this.data;
  }
};

// packages/ts-sdk/src/extension/emulator/packet.ts
var EmulatorPacket = class _EmulatorPacket {
  constructor(entries) {
    this.entries = entries;
  }
  entries;
  /** PACKET_TYPE is the 1-byte TLV type tag used in the Extension envelope. */
  static PACKET_TYPE = 1;
  static create(entries) {
    if (entries.length === 0) {
      throw new Error("empty emulator packet");
    }
    for (const entry of entries) {
      if (entry.script.length === 0) {
        throw new Error(`empty script for vin ${entry.vin}`);
      }
    }
    const seen = /* @__PURE__ */ new Set();
    for (const entry of entries) {
      if (seen.has(entry.vin)) {
        throw new Error(`duplicate vin ${entry.vin}`);
      }
      seen.add(entry.vin);
    }
    return new _EmulatorPacket(entries);
  }
  static fromBytes(data) {
    const reader = new BufferReader(data);
    const entryCount = reader.readCompactSize();
    const entries = [];
    for (let i = 0; i < entryCount; i++) {
      const vin = reader.readUint16LE();
      const script = reader.readCompactSlice();
      const witness = reader.readCompactSlice();
      entries.push({ vin, script, witness });
    }
    if (reader.remaining() > 0) {
      throw new Error(`unexpected ${reader.remaining()} trailing bytes`);
    }
    return _EmulatorPacket.create(entries);
  }
  type() {
    return _EmulatorPacket.PACKET_TYPE;
  }
  serialize() {
    const writer = new BufferWriter();
    writer.writeCompactSize(this.entries.length);
    for (const entry of this.entries) {
      writer.writeUint16LE(entry.vin);
      writer.writeCompactSlice(entry.script);
      writer.writeCompactSlice(entry.witness ?? new Uint8Array(0));
    }
    return writer.toBytes();
  }
};

// packages/ts-sdk/src/extension/index.ts
var ARKADE_MAGIC = new Uint8Array([65, 82, 75]);
var ExtensionNotFoundError = class extends Error {
  constructor() {
    super("no extension output found in transaction");
    this.name = "ExtensionNotFoundError";
  }
};
var Extension = class _Extension {
  constructor(packets) {
    this.packets = packets;
  }
  packets;
  static create(packets) {
    if (packets.length === 0) {
      throw new Error("missing packets");
    }
    const seen = /* @__PURE__ */ new Set();
    for (const p of packets) {
      const type = p.type();
      if (!Number.isInteger(type) || type < 0 || type > 255) {
        throw new Error(`invalid packet type ${type}: must be an integer in [0, 255]`);
      }
      if (seen.has(type)) {
        throw new Error(`duplicate packet type ${type}`);
      }
      seen.add(type);
    }
    return new _Extension(packets);
  }
  /**
   * isExtension returns true if the script is an OP_RETURN whose push data
   * begins with the ARK magic bytes.
   */
  static isExtension(script) {
    try {
      const decoded = Script.decode(script);
      if (decoded.length < 2 || decoded[0] !== "RETURN") return false;
      const data = decoded[1];
      if (!(data instanceof Uint8Array)) return false;
      return data.length >= ARKADE_MAGIC.length && equalBytes3(data.slice(0, ARKADE_MAGIC.length), ARKADE_MAGIC);
    } catch {
      return false;
    }
  }
  /**
   * fromBytes parses an Extension from a raw OP_RETURN script.
   */
  static fromBytes(script) {
    if (!script || script.length === 0) {
      throw new Error("missing OP_RETURN");
    }
    let decoded;
    try {
      decoded = Script.decode(script);
    } catch {
      throw new Error("expected OP_RETURN");
    }
    if (decoded.length === 0 || decoded[0] !== "RETURN") {
      throw new Error("expected OP_RETURN");
    }
    const dataPushes = decoded.slice(1).filter((x) => x instanceof Uint8Array);
    if (dataPushes.length === 0) {
      throw new Error("missing magic prefix: EOF");
    }
    const payload = new Uint8Array(dataPushes.reduce((acc, d) => acc + d.length, 0));
    let offset = 0;
    for (const d of dataPushes) {
      payload.set(d, offset);
      offset += d.length;
    }
    if (payload.length < ARKADE_MAGIC.length || !equalBytes3(payload.slice(0, ARKADE_MAGIC.length), ARKADE_MAGIC)) {
      throw new Error(
        `expected magic prefix ${hex.encode(ARKADE_MAGIC)}, got ${hex.encode(payload.slice(0, Math.min(payload.length, ARKADE_MAGIC.length)))}`
      );
    }
    const reader = new BufferReader(payload.slice(ARKADE_MAGIC.length));
    const packets = [];
    while (reader.remaining() > 0) {
      const packetType = reader.readByte();
      let data;
      try {
        data = reader.readVarSlice();
      } catch {
        throw new Error("missing packet data");
      }
      packets.push(parsePacket(packetType, data));
    }
    if (packets.length === 0) {
      throw new Error("missing packets");
    }
    const seen = /* @__PURE__ */ new Set();
    for (const p of packets) {
      if (seen.has(p.type())) {
        throw new Error(`duplicate packet type ${p.type()}`);
      }
      seen.add(p.type());
    }
    return new _Extension(packets);
  }
  /**
   * fromTx searches the transaction outputs for an extension blob and parses it.
   * Throws ExtensionNotFoundError if none is found.
   */
  static fromTx(tx) {
    for (let i = 0; i < tx.outputsLength; i++) {
      const output = tx.getOutput(i);
      if (!output?.script) continue;
      if (_Extension.isExtension(output.script)) {
        return _Extension.fromBytes(output.script);
      }
    }
    throw new ExtensionNotFoundError();
  }
  /**
   * serialize encodes the extension as an OP_RETURN script.
   *
   * Layout: OP_RETURN | <push> | ARK | [type | varint_len | data]...
   */
  serialize() {
    const parts = [ARKADE_MAGIC];
    for (const p of this.packets) {
      const data = p.serialize();
      const typeByte = new Uint8Array([p.type()]);
      const lengthBuf = encodeVarUint(data.length);
      parts.push(typeByte, lengthBuf, data);
    }
    const totalLen = parts.reduce((acc, p) => acc + p.length, 0);
    const payload = new Uint8Array(totalLen);
    let off = 0;
    for (const p of parts) {
      payload.set(p, off);
      off += p.length;
    }
    return buildOpReturnScript(payload);
  }
  /**
   * txOut returns the extension as a zero-value OP_RETURN transaction output.
   */
  txOut() {
    return {
      script: this.serialize(),
      amount: 0n
    };
  }
  /**
   * getAssetPacket returns the embedded Packet, or null if not present.
   */
  getAssetPacket() {
    for (const p of this.packets) {
      if (p instanceof Packet) {
        return p;
      }
    }
    return null;
  }
  /**
   * getEmulatorPacket returns the embedded EmulatorPacket, or null if not present.
   */
  getEmulatorPacket() {
    for (const p of this.packets) {
      if (p instanceof EmulatorPacket) {
        return p;
      }
    }
    return null;
  }
  /**
   * getPacketByType returns the first packet matching the given type tag, or null.
   */
  getPacketByType(packetType) {
    for (const p of this.packets) {
      if (p.type() === packetType) {
        return p;
      }
    }
    return null;
  }
  /**
   * Returns all embedded packets in insertion order. Used when callers need
   * to rebuild an Extension from an existing one (e.g. appending a new packet).
   */
  getPackets() {
    return this.packets;
  }
};
function parsePacket(packetType, data) {
  switch (packetType) {
    case Packet.PACKET_TYPE:
      return Packet.fromBytes(data);
    case EmulatorPacket.PACKET_TYPE:
      return EmulatorPacket.fromBytes(data);
    default:
      return new UnknownPacket(packetType, data);
  }
}
function encodeVarUint(value) {
  const bytes = [];
  let remaining = value;
  do {
    let byte = remaining & 127;
    remaining >>>= 7;
    if (remaining > 0) byte |= 128;
    bytes.push(byte);
  } while (remaining > 0);
  return new Uint8Array(bytes);
}
function buildOpReturnScript(data) {
  const n = data.length;
  let script;
  if (n <= 75) {
    script = new Uint8Array(2 + n);
    script[0] = 106;
    script[1] = n;
    script.set(data, 2);
  } else if (n <= 255) {
    script = new Uint8Array(3 + n);
    script[0] = 106;
    script[1] = 76;
    script[2] = n;
    script.set(data, 3);
  } else if (n <= 65535) {
    script = new Uint8Array(4 + n);
    script[0] = 106;
    script[1] = 77;
    new DataView(script.buffer).setUint16(2, n, true);
    script.set(data, 4);
  } else {
    script = new Uint8Array(6 + n);
    script[0] = 106;
    script[1] = 78;
    new DataView(script.buffer).setUint32(2, n, true);
    script.set(data, 6);
  }
  return script;
}

// packages/ts-sdk/src/utils/arkTransaction.ts
function buildOffchainTx(inputs, outputs, serverUnrollScript) {
  const MAX_OP_RETURN = 2;
  let countOpReturn = 0;
  let hasExtensionOutput = false;
  for (const [index, output] of outputs.entries()) {
    if (!output.script) throw new Error(`missing output script ${index}`);
    const isExtension = Extension.isExtension(output.script);
    const isOpReturn = isExtension || Script.decode(output.script)[0] === "RETURN";
    if (isOpReturn) {
      countOpReturn++;
    }
    if (!isExtension) continue;
    if (hasExtensionOutput) throw new Error("multiple extension outputs");
    hasExtensionOutput = true;
  }
  if (countOpReturn > MAX_OP_RETURN) {
    throw new Error(`too many OP_RETURN outputs: ${countOpReturn} > ${MAX_OP_RETURN}`);
  }
  const checkpoints = inputs.map((input) => buildCheckpointTx(input, serverUnrollScript));
  const arkTx = buildVirtualTx(
    checkpoints.map((c) => c.input),
    outputs
  );
  return {
    arkTx,
    checkpoints: checkpoints.map((c) => c.tx)
  };
}
function buildVirtualTx(inputs, outputs) {
  let lockTime = 0n;
  for (const input of inputs) {
    const tapscript = decodeTapscript(scriptFromTapLeafScript(input.tapLeafScript));
    if (CLTVMultisigTapscript.is(tapscript)) {
      if (lockTime !== 0n) {
        if (isSeconds(lockTime) !== isSeconds(tapscript.params.absoluteTimelock)) {
          throw new Error("cannot mix seconds and blocks locktime");
        }
      }
      if (tapscript.params.absoluteTimelock > lockTime) {
        lockTime = tapscript.params.absoluteTimelock;
      }
    }
  }
  const tx = new Transaction2({
    version: 3,
    lockTime: Number(lockTime)
  });
  for (const [i, input] of inputs.entries()) {
    tx.addInput({
      txid: input.txid,
      index: input.vout,
      sequence: lockTime ? DEFAULT_SEQUENCE - 1 : void 0,
      witnessUtxo: {
        script: VtxoScript.decode(input.tapTree).pkScript,
        amount: BigInt(input.value)
      },
      tapLeafScript: [input.tapLeafScript]
    });
    setArkPsbtField(tx, i, VtxoTaprootTree, input.tapTree);
  }
  for (const output of outputs) {
    tx.addOutput(output);
  }
  tx.addOutput(P2A);
  return tx;
}
function buildCheckpointTx(vtxo, serverUnrollScript) {
  const collaborativeClosure = decodeTapscript(scriptFromTapLeafScript(vtxo.tapLeafScript));
  const checkpointVtxoScript = new VtxoScript([
    serverUnrollScript.script,
    collaborativeClosure.script
  ]);
  const checkpointTx = buildVirtualTx(
    [vtxo],
    [
      {
        amount: BigInt(vtxo.value),
        script: checkpointVtxoScript.pkScript
      }
    ]
  );
  const collaborativeLeafProof = checkpointVtxoScript.findLeaf(
    hex.encode(collaborativeClosure.script)
  );
  const checkpointInput = {
    txid: checkpointTx.id,
    vout: 0,
    value: vtxo.value,
    tapLeafScript: collaborativeLeafProof,
    tapTree: checkpointVtxoScript.encode()
  };
  return {
    tx: checkpointTx,
    input: checkpointInput
  };
}
var nLocktimeMinSeconds = 500000000n;
function isSeconds(locktime) {
  return locktime >= nLocktimeMinSeconds;
}
function matchServerCheckpoints(serverCheckpointTxs, expectedCheckpoints, context) {
  if (serverCheckpointTxs.length !== expectedCheckpoints.length) {
    throw new ServerResponseMismatchError(
      `${context} returned ${serverCheckpointTxs.length} checkpoints, expected ${expectedCheckpoints.length}`
    );
  }
  const byTxid = new Map(expectedCheckpoints.map((c) => [c.id, c]));
  return serverCheckpointTxs.map((encoded, index) => {
    const server = Transaction2.fromPSBT(base64.decode(encoded));
    const local = byTxid.get(server.id);
    if (!local) {
      throw new ServerResponseMismatchError(
        `${context} checkpoint ${index} txid ${server.id} does not match any submitted checkpoint`
      );
    }
    byTxid.delete(server.id);
    return { server, local };
  });
}
function assertSubmittedArkTxid(response, signedArkTx, context) {
  if (response.arkTxid !== signedArkTx.id) {
    throw new ServerResponseMismatchError(
      `${context} returned ark txid ${response.arkTxid}, expected ${signedArkTx.id}`
    );
  }
  if (response.finalArkTx === void 0) return;
  const finalTxid = Transaction2.fromPSBT(base64.decode(response.finalArkTx)).id;
  if (finalTxid !== signedArkTx.id) {
    throw new ServerResponseMismatchError(
      `${context} returned final ark tx ${finalTxid}, expected ${signedArkTx.id}`
    );
  }
}

// packages/ts-sdk/src/utils/prevoutTx.ts
var PrevTxUnavailableError = class extends Error {
  constructor(message, txids = []) {
    super(message);
    this.txids = txids;
    this.name = "PrevTxUnavailableError";
  }
  txids;
};
async function resolvePrevTxs(txids, source, onchain) {
  const resolved = /* @__PURE__ */ new Map();
  const wanted = [...new Set(txids)];
  if (wanted.length === 0) return resolved;
  try {
    const { txs } = await source.getVirtualTxs(wanted);
    for (const psbt of txs) {
      const tx = Transaction2.fromPSBT(base64.decode(psbt));
      resolved.set(tx.id, tx.toBytes());
    }
  } catch (err2) {
    if (!onchain) throw err2;
  }
  let missing = wanted.filter((txid) => !resolved.has(txid));
  if (missing.length > 0 && onchain) {
    const raw = await Promise.all(
      missing.map(async (txid) => {
        try {
          return await onchain.getRawTransaction(txid);
        } catch {
          return void 0;
        }
      })
    );
    for (const [i, bytes] of raw.entries()) {
      if (bytes) resolved.set(missing[i], bytes);
    }
    missing = missing.filter((txid) => !resolved.has(txid));
  }
  if (missing.length > 0) {
    throw new PrevTxUnavailableError(
      `cannot resolve the previous transaction of ${missing.join(", ")}` + (onchain ? "" : " (no onchain source configured)"),
      missing
    );
  }
  return resolved;
}
async function attachPrevArkTxs(tx, txids, source, onchain) {
  const pending = [];
  for (let i = 0; i < tx.inputsLength; i++) {
    if (getArkPsbtFields(tx, i, PrevArkTxField).length === 0) pending.push(i);
  }
  if (pending.length === 0) return;
  const resolved = await resolvePrevTxs(
    pending.map((i) => txidAt(txids, i)),
    source,
    onchain
  );
  for (const i of pending) {
    setArkPsbtField(tx, i, PrevArkTxField, resolved.get(txidAt(txids, i)));
  }
}
function txidAt(txids, index) {
  const txid = txids[index];
  if (txid === void 0) {
    throw new PrevTxUnavailableError(`no source txid supplied for input ${index}`);
  }
  return txid;
}

// packages/ts-sdk/src/arkade/opcodes.ts
var ARKADE_OP = {
  // Merkle Branch Verification (0xb3 — repurposed NOP4 slot)
  MERKLEBRANCHVERIFY: 179,
  // Digest (0xc3)
  DIGEST: 195,
  // SHA256 Streaming (0xc4-0xc6)
  SHA256INITIALIZE: 196,
  SHA256UPDATE: 197,
  SHA256FINALIZE: 198,
  // Input Introspection (0xc7-0xcb)
  INSPECTINPUTOUTPOINT: 199,
  INSPECTINPUTARKADESCRIPTHASH: 200,
  INSPECTINPUTVALUE: 201,
  INSPECTINPUTSCRIPTPUBKEY: 202,
  INSPECTINPUTSEQUENCE: 203,
  // Signatures (0xcc-0xcd)
  CHECKSIGFROMSTACK: 204,
  PUSHCURRENTINPUTINDEX: 205,
  // Input Arkade Witness Introspection (0xce)
  INSPECTINPUTARKADEWITNESSHASH: 206,
  // Output Introspection (0xcf, 0xd1)
  INSPECTOUTPUTVALUE: 207,
  INSPECTOUTPUTSCRIPTPUBKEY: 209,
  // Transaction Introspection (0xd2-0xd6)
  INSPECTVERSION: 210,
  INSPECTLOCKTIME: 211,
  INSPECTNUMINPUTS: 212,
  INSPECTNUMOUTPUTS: 213,
  TXWEIGHT: 214,
  // Byte/Number Conversion & Arithmetic (0xd7-0xda)
  NUM2BIN: 215,
  BIN2NUM: 216,
  REVERSEBYTES: 217,
  MODEXP: 218,
  // VTXO Expiry & Emulator Clock (0xdb-0xdc)
  PUSHEXPIRY: 219,
  // compiler artifacts use OP_CHECKTIME.
  CHECKTIME: 220,
  // 0xdd-0xdf are unassigned (OP_UNKNOWN221-223)
  // EC Operations (0xe0-0xe2)
  ECADD: 224,
  ECMUL: 225,
  ECPAIRING: 226,
  // EC Operations (0xe3-0xe4)
  ECMULSCALARVERIFY: 227,
  TWEAKVERIFY: 228,
  // Asset Groups (0xe5-0xf2)
  INSPECTNUMASSETGROUPS: 229,
  INSPECTASSETGROUPASSETID: 230,
  INSPECTASSETGROUPCTRL: 231,
  FINDASSETGROUPBYASSETID: 232,
  INSPECTASSETGROUPMETADATAHASH: 233,
  INSPECTASSETGROUPNUM: 234,
  INSPECTASSETGROUP: 235,
  INSPECTASSETGROUPSUM: 236,
  INSPECTOUTASSETCOUNT: 237,
  INSPECTOUTASSETAT: 238,
  INSPECTOUTASSETLOOKUP: 239,
  INSPECTINASSETCOUNT: 240,
  INSPECTINASSETAT: 241,
  INSPECTINASSETLOOKUP: 242,
  // Transaction ID (0xf3)
  TXID: 243,
  // Packet Introspection (0xf4-0xf5) — added in emulator v0.0.1
  INSPECTPACKET: 244,
  INSPECTINPUTPACKET: 245,
  // Signature Hash (0xf6)
  SIGHASH: 246,
  // Continuation & Intent Introspection (0xf7-0xf8)
  TUNNEL: 247,
  INSPECTINTENTMESSAGE: 248
};
var ARKADE_OPCODES = Object.values(ARKADE_OP);
var ARKADE_OPCODE_NAMES = Object.fromEntries(
  Object.entries(ARKADE_OP).map(([name, value]) => [value, name])
);
var ARKADE_OPCODE_VALUES = Object.fromEntries(
  Object.entries(ARKADE_OPCODE_NAMES).map(([value, name]) => [name, Number(value)])
);
function buildBitcoinOpcodeNames() {
  const names = {};
  for (const [key, value] of Object.entries(OP)) {
    if (typeof value === "number") {
      const name = key.startsWith("OP_") ? key : `OP_${key}`;
      names[value] = name;
    }
  }
  names[0] = "OP_0";
  return names;
}
function buildBitcoinOpcodeValues() {
  const values = {};
  for (const [key, value] of Object.entries(OP)) {
    if (typeof value === "number") {
      const name = key.startsWith("OP_") ? key : `OP_${key}`;
      values[name] = value;
      values[key] = value;
    }
  }
  return values;
}
var BITCOIN_OPCODE_NAMES = buildBitcoinOpcodeNames();
var BITCOIN_OPCODE_VALUES = buildBitcoinOpcodeValues();
var OPCODE_NAMES = {
  ...BITCOIN_OPCODE_NAMES,
  // Add Arkade opcodes with OP_ prefix
  ...Object.fromEntries(
    Object.entries(ARKADE_OPCODE_NAMES).map(([value, name]) => [Number(value), `OP_${name}`])
  )
};
var OPCODE_VALUES = {
  ...BITCOIN_OPCODE_VALUES,
  // Add Arkade opcodes with and without OP_ prefix
  ...ARKADE_OPCODE_VALUES,
  ...Object.fromEntries(
    Object.entries(ARKADE_OPCODE_VALUES).map(([name, value]) => [`OP_${name}`, value])
  )
};

// packages/ts-sdk/src/arkade/bignum.ts
var BIGNUM_MAX_BYTES = 520;
var codec = ScriptNum(
  BIGNUM_MAX_BYTES,
  /* forceMinimal */
  true
);
function encode2(value) {
  const result = codec.encode(value);
  if (result.length > BIGNUM_MAX_BYTES) {
    throw new Error(`BigNum value exceeds 520 bytes (encoded to ${result.length} bytes)`);
  }
  return result;
}

// packages/ts-sdk/src/arkade/script.ts
var ARKADE_OPS = { ...OP, ...ARKADE_OP };
var ArkadeOPNames = {};
for (const [k, v] of Object.entries(ARKADE_OPS)) {
  if (typeof v === "number") ArkadeOPNames[v] = k;
}
var ArkadeScript = wrap({
  encodeStream: (w, value) => {
    for (let o of value) {
      if (typeof o === "string") {
        const v = ARKADE_OPS[o];
        if (v === void 0) throw new Error(`Unknown opcode=${o}`);
        w.byte(v);
        continue;
      } else if (typeof o === "number" || typeof o === "bigint") {
        const big2 = typeof o === "number" ? BigInt(o) : o;
        o = encode2(big2);
      }
      if (!(o instanceof Uint8Array)) throw new Error(`Wrong Script OP=${o} (${typeof o})`);
      const len = o.length;
      if (len === 1 && o[0] >= 1 && o[0] <= 16) {
        w.byte(OP.OP_1 - 1 + o[0]);
        continue;
      } else if (len === 1 && o[0] === 129) {
        w.byte(OP["1NEGATE"]);
        continue;
      } else if (len < OP.PUSHDATA1) w.byte(len);
      else if (len <= 255) {
        w.byte(OP.PUSHDATA1);
        w.byte(len);
      } else if (len <= 65535) {
        w.byte(OP.PUSHDATA2);
        w.bytes(U16LE.encode(len));
      } else {
        w.byte(OP.PUSHDATA4);
        w.bytes(U32LE.encode(len));
      }
      w.bytes(o);
    }
  },
  decodeStream: (r) => {
    const out = [];
    while (!r.isEnd()) {
      const cur = r.byte();
      if (OP.OP_0 < cur && cur <= OP.PUSHDATA4) {
        let len;
        if (cur < OP.PUSHDATA1) len = cur;
        else if (cur === OP.PUSHDATA1) len = U8.decodeStream(r);
        else if (cur === OP.PUSHDATA2) len = U16LE.decodeStream(r);
        else if (cur === OP.PUSHDATA4) len = U32LE.decodeStream(r);
        else throw new Error("Should be not possible");
        out.push(r.bytes(len));
      } else if (cur === 0) {
        out.push(0);
      } else if (OP.OP_1 <= cur && cur <= OP.OP_16) {
        out.push(cur - (OP.OP_1 - 1));
      } else if (cur === OP["1NEGATE"]) {
        out.push(-1);
      } else {
        const op = ArkadeOPNames[cur];
        if (op === void 0) throw new Error(`Unknown opcode=${cur.toString(16)}`);
        out.push(op);
      }
    }
    return out;
  }
});

// packages/ts-sdk/src/arkade/tweak.ts
var TAG_SCRIPT = "ArkScriptHash";
function arkadeScriptHash(script) {
  return schnorr.utils.taggedHash(TAG_SCRIPT, script);
}
function computeArkadeScriptPublicKey(pubKey, script) {
  const hash = arkadeScriptHash(script);
  const point = schnorr.utils.lift_x(bytesToNumberBE(toXOnly(pubKey, "emulator key")));
  const scalar2 = bytesToNumberBE(hash) % secp256k1.Point.CURVE().n;
  const tweak = secp256k1.Point.BASE.multiply(scalar2);
  return schnorr.utils.pointToBytes(point.add(tweak));
}

// packages/ts-sdk/src/arkade/program.ts
var MinimalScriptNum2 = ScriptNum(void 0, true);
var SUPPORTED_PROGRAM_VERSION = 0;
function inputName(ref) {
  return typeof ref === "string" ? ref : ref.name;
}
function bindValue(bind, name) {
  const v = bind[name];
  if (v === void 0) throw new Error(`unbound parameter '${name}'`);
  return v;
}
function resolveTimelockValue(value, args) {
  if (typeof value === "bigint") return value;
  if (value.startsWith("$")) {
    const v = bindValue(args, value.slice(1));
    if (typeof v === "bigint" || typeof v === "number") return BigInt(v);
    throw new Error(`timelock value '${value}' must resolve to a number`);
  }
  throw new Error(
    `invalid timelock value '${value}' \u2014 expected a bigint or a '$param' reference`
  );
}
function resolveAsm(asm, bind) {
  const tokens = asm.map((t) => {
    if (typeof t === "string" && t.startsWith("$")) {
      return bindValue(bind, t.slice(1));
    }
    if (t === "<SELF>") {
      throw new Error(
        "<SELF> is not a placeholder; use INSPECTINPUTSCRIPTPUBKEY for continuation covenants"
      );
    }
    return t;
  });
  return ArkadeScript.encode(tokens);
}
function witnessRefToBytes(ref, callArgs, programArgs) {
  if (ref instanceof Uint8Array) return ref;
  if (typeof ref === "number" || typeof ref === "bigint") {
    return MinimalScriptNum2.encode(BigInt(ref));
  }
  const v = ref.startsWith("$") ? bindValue(programArgs, ref.slice(1)) : bindValue(callArgs, ref);
  if (v instanceof Uint8Array) return v;
  return MinimalScriptNum2.encode(BigInt(v));
}
function validateTapscript(seg) {
  if (!seg.signers || seg.signers.length === 0) {
    throw new Error("tapscript: at least one signer is required");
  }
  if (seg.asm !== void 0 && seg.cltv !== void 0) {
    throw new Error(
      "tapscript: `asm` and `cltv` conflict \u2014 arkd has no condition+CLTV closure"
    );
  }
  if (seg.csv !== void 0 && seg.cltv !== void 0) {
    throw new Error("tapscript: `csv` and `cltv` conflict \u2014 use at most one timelock");
  }
  for (const t of seg.asm ?? []) {
    if (typeof t === "string" && t in ARKADE_OP) {
      throw new Error(
        `tapscript: arkade opcode '${t}' is not enforceable on-chain \u2014 move it to arkadeScript`
      );
    }
  }
}
function collectParamRefs(program2) {
  const refs = /* @__PURE__ */ new Set();
  const collect = (items) => {
    for (const t of items ?? []) {
      if (typeof t === "string" && t.startsWith("$")) refs.add(t.slice(1));
    }
  };
  for (const fn of Object.values(program2.functions)) {
    const tap = fn.tapscript;
    collect(tap.signers);
    collect(tap.asm);
    collect(tap.witness);
    collect(tap.csv ? [tap.csv.value] : void 0);
    collect(tap.cltv !== void 0 ? [tap.cltv] : void 0);
    collect(fn.arkadeScript?.asm);
    collect(fn.arkadeScript?.witness);
  }
  return refs;
}
var TYPED_BYTE_LENGTHS = { pubkey: 32, sig: 64 };
function validateParamValue(def2, value) {
  if (def2.type === "int") {
    if (typeof value !== "bigint" && typeof value !== "number") {
      throw new Error(`program parameter '${def2.name}' expects an int, got bytes`);
    }
    return;
  }
  if (!(value instanceof Uint8Array)) {
    throw new Error(
      `program parameter '${def2.name}' expects ${def2.type} bytes, got ${typeof value}`
    );
  }
  const length = TYPED_BYTE_LENGTHS[def2.type];
  if (length !== void 0 && value.length !== length) {
    throw new Error(
      `program parameter '${def2.name}' expects a ${length}-byte ${def2.type}, got ${value.length} bytes`
    );
  }
}
function validateProgram(program2, args) {
  const params = program2.params;
  if (!params || !params.some((p) => typeof p !== "string")) return;
  const declared = new Set(params.map(inputName));
  for (const name of declared) {
    if (args[name] === void 0) {
      throw new Error(`program parameter '${name}' is declared but not bound in args`);
    }
  }
  for (const ref of collectParamRefs(program2)) {
    if (!declared.has(ref)) {
      throw new Error(`'$${ref}' is referenced but not declared in program params`);
    }
  }
  for (const p of params) {
    if (typeof p !== "string") validateParamValue(p, args[p.name]);
  }
}
function resolveSigner(ref, args) {
  if (ref instanceof Uint8Array) return ref;
  if (!ref.startsWith("$")) {
    throw new Error(`unknown signer reference '${ref}' \u2014 use '$${ref}'`);
  }
  const v = bindValue(args, ref.slice(1));
  if (!(v instanceof Uint8Array)) {
    throw new Error(`signer ${ref} must be a pubkey (bytes)`);
  }
  return v;
}
function encodeTapscriptSegment(seg, pubkeys, args) {
  if (seg.csv) {
    const timelock = { type: seg.csv.type, value: resolveTimelockValue(seg.csv.value, args) };
    if (seg.asm) {
      return ConditionCSVMultisigTapscript.encode({
        conditionScript: resolveAsm(seg.asm, args),
        timelock,
        pubkeys
      });
    }
    return CSVMultisigTapscript.encode({ timelock, pubkeys });
  }
  if (seg.cltv !== void 0) {
    return CLTVMultisigTapscript.encode({
      absoluteTimelock: resolveTimelockValue(seg.cltv, args),
      pubkeys
    });
  }
  if (seg.asm) {
    return ConditionMultisigTapscript.encode({
      conditionScript: resolveAsm(seg.asm, args),
      pubkeys
    });
  }
  return MultisigTapscript.encode({ pubkeys });
}
function compileFunctions(program2, args, keys2) {
  if (program2.version !== SUPPORTED_PROGRAM_VERSION) {
    throw new Error(
      `ArkadeContract: unsupported program version ${program2.version} \u2014 this SDK supports version ${SUPPORTED_PROGRAM_VERSION}`
    );
  }
  const functions = program2.functions;
  const names = Object.keys(functions);
  if (names.length === 0) {
    throw new Error("ArkadeContract: program has no functions");
  }
  validateProgram(program2, args);
  const defs = names.map((n) => functions[n]);
  const covenant = names.find((_, i) => defs[i].arkadeScript);
  if (covenant && !keys2.emulatorKey) {
    throw new Error(
      `ArkadeContract: function '${covenant}' has an arkadeScript but no emulator is configured \u2014 pass an \`emulator\` to Arkade.connect`
    );
  }
  return defs.map((def2, i) => {
    validateTapscript(def2.tapscript);
    const pubkeys = def2.tapscript.signers.map((s) => resolveSigner(s, args));
    const arkadeScript = def2.arkadeScript ? resolveAsm(def2.arkadeScript.asm, args) : void 0;
    const leafPubkeys = arkadeScript ? [...pubkeys, computeArkadeScriptPublicKey(keys2.emulatorKey, arkadeScript)] : pubkeys;
    const leafScript = encodeTapscriptSegment(def2.tapscript, leafPubkeys, args).script;
    return { name: names[i], def: def2, leafScript, arkadeScript, signerKeys: pubkeys };
  });
}
var ArkadeProgramScript = class extends VtxoScript {
  constructor(program2, args, keys2) {
    const partial = compileFunctions(program2, args, keys2);
    super(partial.map((p) => p.leafScript));
    this.program = program2;
    this.args = args;
    this.keys = keys2;
    this.compiled = partial.map((p) => ({
      ...p,
      tapLeafScript: this.findLeaf(hex.encode(p.leafScript))
    }));
  }
  program;
  args;
  keys;
  /** Spending paths in declaration order. */
  compiled;
  /** The compiled spending path with the given function name, if any. */
  functionByName(name) {
    return this.compiled.find((f) => f.name === name);
  }
};
function parseArtifact(artifact) {
  const hexToken = (t) => typeof t === "string" && t.startsWith("0x") ? hex.decode(t.slice(2)) : t;
  const timelockValue = (v) => typeof v === "string" && v.startsWith("$") ? v : BigInt(v);
  const functions = {};
  for (const [name, fn] of Object.entries(artifact.functions)) {
    const tap = fn.tapscript ?? {};
    const tapscript = {
      signers: (tap.signers ?? []).map(hexToken),
      ...tap.asm ? { asm: tap.asm.map(hexToken) } : {},
      ...tap.witness ? { witness: tap.witness.map(hexToken) } : {},
      ...tap.csv ? { csv: { type: tap.csv.type, value: timelockValue(tap.csv.value) } } : {},
      ...tap.cltv !== void 0 ? { cltv: timelockValue(tap.cltv) } : {}
    };
    const arkadeScript = fn.arkadeScript ? {
      asm: fn.arkadeScript.asm.map(hexToken),
      ...fn.arkadeScript.witness ? { witness: fn.arkadeScript.witness.map(hexToken) } : {}
    } : void 0;
    functions[name] = {
      ...fn.inputs ? { inputs: fn.inputs } : {},
      tapscript,
      ...arkadeScript ? { arkadeScript } : {}
    };
  }
  return {
    version: artifact.version ?? SUPPORTED_PROGRAM_VERSION,
    ...artifact.name !== void 0 ? { name: artifact.name } : {},
    ...artifact.params ? { params: artifact.params } : {},
    functions
  };
}
function stringifyArtifact(program2) {
  const token = (t) => {
    if (t instanceof Uint8Array) return "0x" + hex.encode(t);
    if (typeof t === "bigint") {
      if (t >= BigInt(Number.MIN_SAFE_INTEGER) && t <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(t);
      }
      return "0x" + hex.encode(MinimalScriptNum2.encode(t));
    }
    return t;
  };
  const functions = {};
  for (const [name, fn] of Object.entries(program2.functions)) {
    const tap = fn.tapscript;
    functions[name] = {
      ...fn.inputs ? { inputs: fn.inputs } : {},
      tapscript: {
        signers: tap.signers.map(token),
        ...tap.asm ? { asm: tap.asm.map(token) } : {},
        ...tap.witness ? { witness: tap.witness.map(token) } : {},
        ...tap.csv ? { csv: { type: tap.csv.type, value: tap.csv.value.toString() } } : {},
        ...tap.cltv !== void 0 ? { cltv: tap.cltv.toString() } : {}
      },
      ...fn.arkadeScript ? {
        arkadeScript: {
          asm: fn.arkadeScript.asm.map(token),
          ...fn.arkadeScript.witness ? { witness: fn.arkadeScript.witness.map(token) } : {}
        }
      } : {}
    };
  }
  return JSON.stringify({
    version: program2.version,
    ...program2.name !== void 0 ? { name: program2.name } : {},
    ...program2.params ? { params: program2.params } : {},
    functions
  });
}
function serializeArgValue(v) {
  if (v instanceof Uint8Array) return "0x" + hex.encode(v);
  if (typeof v === "bigint") return v.toString();
  return v;
}
function parseArgValue(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    if (v.startsWith("0x")) return hex.decode(v.slice(2));
    return BigInt(v);
  }
  throw new Error(`invalid arkade arg value: ${JSON.stringify(v)}`);
}
function parseTypedArgValue(name, type, v) {
  if (type === "int") {
    if (typeof v === "number") return v;
    if (typeof v === "string") return BigInt(v);
    throw new Error(
      `arkade contract params: '${name}' expects an int, got ${JSON.stringify(v)}`
    );
  }
  if (typeof v === "string" && v.startsWith("0x")) return hex.decode(v.slice(2));
  throw new Error(
    `arkade contract params: '${name}' expects ${type} as 0x-prefixed hex, got ${JSON.stringify(v)}`
  );
}
function serializeArkadeContractParams(typed) {
  const args = {};
  for (const [k, v] of Object.entries(typed.args)) {
    args[k] = serializeArgValue(v);
  }
  return {
    program: stringifyArtifact(typed.program),
    args: JSON.stringify(args),
    serverKey: hex.encode(typed.serverKey),
    ...typed.userKey ? { userKey: hex.encode(typed.userKey) } : {},
    ...typed.emulatorKey ? { emulatorKey: hex.encode(typed.emulatorKey) } : {}
  };
}
function deserializeArkadeContractParams(params) {
  if (!params.program) {
    throw new Error("arkade contract params: missing 'program'");
  }
  if (!params.serverKey) {
    throw new Error("arkade contract params: missing 'serverKey'");
  }
  const program2 = parseArtifact(JSON.parse(params.program));
  const paramTypes = /* @__PURE__ */ new Map();
  for (const p of program2.params ?? []) {
    if (typeof p !== "string") paramTypes.set(p.name, p.type);
  }
  const args = {};
  if (params.args) {
    for (const [k, v] of Object.entries(JSON.parse(params.args))) {
      const type = paramTypes.get(k);
      args[k] = type ? parseTypedArgValue(k, type, v) : parseArgValue(v);
    }
  }
  return {
    program: program2,
    args,
    serverKey: hex.decode(params.serverKey),
    ...params.userKey ? { userKey: hex.decode(params.userKey) } : {},
    ...params.emulatorKey ? { emulatorKey: hex.decode(params.emulatorKey) } : {}
  };
}

// packages/ts-sdk/src/arkade/contract.ts
var Arkade = class _Arkade {
  arkProvider;
  /** The co-signing service, or undefined for emulator-less (pure tapscript) usage. */
  emulator;
  network;
  serverKey;
  /**
   * The co-signer key covenants are built against (33-byte compressed),
   * present only when an emulator is configured.
   *
   * Resolved from the network — or from `emulatorPubkey` — never from the
   * emulator's own report. When a claim is refused because the co-signer
   * disagrees, compare `hex.encode(arkade.emulatorKey)` against the
   * `signerPubkey` your emulator serves on `/v1/info`: if they differ, the
   * network rotated and this SDK's pin is stale.
   */
  emulatorKey;
  checkpoint;
  indexer;
  identity;
  /** The signing identity's x-only public key, resolved at connect — identifies which inputs the wallet signs. */
  userKey;
  /** The wallet's contract manager, when contract persistence is wired up. */
  contractManager;
  constructor(fields) {
    this.arkProvider = fields.arkProvider;
    this.emulator = fields.emulator;
    this.network = fields.network;
    this.serverKey = fields.serverKey;
    this.emulatorKey = fields.emulatorKey;
    this.checkpoint = fields.checkpoint;
    this.indexer = fields.indexer;
    this.identity = fields.identity;
    this.userKey = fields.userKey;
    this.contractManager = fields.contractManager;
  }
  /** Connect and resolve the server key, checkpoint closure and (if present) the co-signer key. */
  static async connect(opts) {
    const info = await opts.arkade.getInfo();
    const serverKey = toXOnly(hex.decode(info.signerPubkey), "ark signer key");
    const checkpoint = CSVMultisigTapscript.decode(hex.decode(info.checkpointTapscript));
    const network = opts.network ?? (Object.hasOwn(networks, info.network) ? getNetwork(info.network) : DEFAULT_NETWORK);
    let emulatorKey;
    if (opts.emulator) {
      emulatorKey = hex.decode(resolveEmulatorPubkey(network, opts.emulatorPubkey));
    }
    let userKey;
    if (opts.identity) {
      userKey = toXOnly(await opts.identity.xOnlyPublicKey(), "identity key");
    }
    return new _Arkade({
      arkProvider: opts.arkade,
      emulator: opts.emulator,
      network,
      serverKey,
      emulatorKey,
      checkpoint,
      indexer: opts.indexer,
      identity: opts.identity,
      userKey,
      contractManager: opts.contractManager
    });
  }
  /**
   * Instantiate a contract from a program and its constructor arguments. The
   * `program`'s literal type is preserved (`const` inference) so the resulting
   * contract's `functions` map is strongly typed — `functions.<name>(...)`
   * knows each argument's type from the function's `inputs` descriptors.
   *
   * When the program declares a `server` or `user` param and the caller does
   * not bind it, it defaults to the client's server key or the identity's
   * key respectively; explicit args always win.
   */
  contract(program2, args = {}) {
    const declared = (program2.params ?? []).map(inputName);
    if (declared.includes("server") && args.server === void 0) {
      args = { ...args, server: this.serverKey };
    }
    if (declared.includes("user") && args.user === void 0 && this.userKey) {
      args = { ...args, user: this.userKey };
    }
    return new ArkadeContract(this, program2, args);
  }
};
var ArkadeContract = class _ArkadeContract {
  constructor(client, program2, args = {}, keys2) {
    this.client = client;
    this.program = program2;
    this.args = args;
    this.keys = keys2 ?? {
      serverKey: client.serverKey,
      userKey: client.userKey,
      emulatorKey: client.emulatorKey
    };
    this.vtxoScript = new ArkadeProgramScript(program2, args, this.keys);
    this.tapTree = this.vtxoScript.encode();
    this.compiled = this.vtxoScript.compiled;
  }
  client;
  program;
  args;
  /** The compiled taproot tree of spending-path leaves. */
  vtxoScript;
  /** Encoded taproot tree (shared spend context for every path). */
  tapTree;
  /** The signer keys the program was compiled against. */
  keys;
  /** Spending paths in declaration order. */
  compiled;
  /**
   * Rebuild a callable contract from a persisted `"arkade"` contract row
   * (see {@link ArkadeContract.register}). The stored keys are used for
   * compilation — not the client's current ones — so the derived script and
   * address stay identical to the registered contract even after a server
   * signer rotation.
   */
  static fromContract(client, contract) {
    if (contract.type !== "arkade") {
      throw new Error(
        `ArkadeContract.fromContract: expected contract type 'arkade', got '${contract.type}'`
      );
    }
    const typed = deserializeArkadeContractParams(contract.params);
    return new _ArkadeContract(client, typed.program, typed.args, {
      serverKey: typed.serverKey,
      userKey: typed.userKey,
      emulatorKey: typed.emulatorKey
    });
  }
  /** Resolve the {@link TapLeafScript} for a spending path by its index. */
  leafScript(index) {
    const fn = this.compiled[index];
    if (!fn) throw new Error(`leaf index ${index} out of range`);
    return fn.tapLeafScript;
  }
  /** Arkade funding address. */
  get address() {
    return this.vtxoScript.address(this.client.network.hrp, this.keys.serverKey).encode();
  }
  /** Taproot output script. */
  get pkScript() {
    return this.vtxoScript.pkScript;
  }
  /**
   * Callable spending paths: `contract.functions.<name>(...args)`. Strongly
   * typed from the program's literal type — each function's argument types are
   * derived from its `inputs` descriptors (see {@link ContractFunctions}).
   */
  get functions() {
    const out = {};
    for (const fn of this.compiled) {
      out[fn.name] = (...callArgs) => new ArkadeTransactionBuilder(this, fn, bindInputs(fn, callArgs));
    }
    return out;
  }
  /**
   * The `createContract` payload for this contract — the serialized program,
   * args and keys plus the derived script/address. Useful when registering
   * through a manager the client does not hold.
   */
  toContractParams() {
    return {
      type: "arkade",
      params: serializeArkadeContractParams({
        program: this.program,
        args: this.args,
        serverKey: this.keys.serverKey,
        userKey: this.keys.userKey,
        emulatorKey: this.keys.emulatorKey
      }),
      script: hex.encode(this.pkScript),
      address: this.address
    };
  }
  /**
   * Persist this contract through the wallet's {@link IContractManager} so it
   * is tracked like any other contract type: stored in the contract
   * repository, watched for VTXO events, counted in repository-backed
   * balances, and re-derivable offline via the `"arkade"` contract handler.
   * Idempotent — re-registering the same script is a no-op.
   */
  async register(options) {
    const manager = this.client.contractManager;
    if (!manager) {
      throw new Error(
        "ArkadeContract.register requires a `contractManager` on the Arkade client \u2014 pass one to Arkade.connect"
      );
    }
    return manager.createContract({
      ...this.toContractParams(),
      label: options?.label,
      metadata: options?.metadata
    });
  }
  /**
   * Spendable VTXOs locked by this contract.
   *
   * When a `contractManager` is configured and this contract is registered,
   * reads the repository-backed state (offline-first, kept fresh by the
   * contract watcher). Otherwise falls back to a direct indexer query.
   *
   * Both branches refuse a spent or unilaterally exited output. They are not
   * otherwise interchangeable: the fallback asks `spendableOnly`, which also
   * drops swept coins — the manager branch keeps those.
   */
  async getUtxos() {
    const manager = this.client.contractManager;
    const scriptHex = hex.encode(this.pkScript);
    if (manager) {
      const [registered] = await manager.getContracts({ script: scriptHex });
      if (registered) {
        const [withVtxos] = await manager.getContractsWithVtxos({ script: scriptHex });
        return (withVtxos?.vtxos ?? []).filter(
          (v) => !hasTerminalSpend(v) && !v.isUnrolled
        );
      }
    }
    if (!this.client.indexer) {
      throw new Error("ArkadeContract.getUtxos: an indexer is required");
    }
    const { vtxos } = await getNormalizedVtxos(this.client.indexer, {
      scripts: [scriptHex],
      spendableOnly: true
    });
    return vtxos.filter((v) => !hasTerminalSpend(v) && !v.isUnrolled);
  }
  /** Total spendable balance (requires an indexer). */
  async getBalance() {
    const utxos = await this.getUtxos();
    return utxos.reduce((sum, u) => sum + BigInt(u.value), 0n);
  }
};
var ArkadeTransactionBuilder = class {
  /** @internal */
  constructor(contract, fn, args) {
    this.contract = contract;
    this.fn = fn;
    this.args = args;
  }
  contract;
  fn;
  args;
  outputs = [];
  fundingCoins = [];
  assetSpecs = [];
  coin;
  changeScript;
  from(coin) {
    this.coin = coin;
    return this;
  }
  /**
   * Add extra inputs the caller funds (e.g. a taker's own coins in a swap).
   * These become inputs 1..n and are signed with the client identity.
   */
  fund(coins2) {
    this.fundingCoins.push(...coins2);
    return this;
  }
  /** Transfer an asset group: which inputs supply it and which outputs receive it. */
  withAsset(spec) {
    this.assetSpecs.push(spec);
    return this;
  }
  /** Destination for any surplus (inputs − outputs). Required when the spend is not exact. */
  change(script) {
    this.changeScript = script;
    return this;
  }
  to(scriptOrOutputs, amount) {
    if (Array.isArray(scriptOrOutputs)) {
      for (const [i, out] of scriptOrOutputs.entries()) {
        if (out.amount === void 0) {
          throw new Error(`to(outputs): output ${i} is missing an amount`);
        }
      }
      this.outputs.push(...scriptOrOutputs);
    } else {
      if (amount === void 0) throw new Error("to(script, amount): amount is required");
      this.outputs.push({ script: scriptOrOutputs, amount });
    }
    return this;
  }
  /** Assemble the unsigned ark transaction and its checkpoints. */
  async build() {
    if (this.outputs.length === 0) {
      throw new Error("ArkadeTransactionBuilder: at least one output is required");
    }
    const outputsSum = this.outputs.reduce((s, o) => s + (o.amount ?? 0n), 0n);
    const coin = this.coin ?? await this.selectCoin(outputsSum);
    const def2 = this.fn.def;
    const outputs = [...this.outputs];
    const fundingSum = this.fundingCoins.reduce((s, f) => s + BigInt(f.value), 0n);
    const surplus = BigInt(coin.value) + fundingSum - outputsSum;
    if (surplus < 0n) {
      throw new Error(
        `ArkadeTransactionBuilder: insufficient inputs \u2014 outputs ${outputsSum} exceed inputs ${BigInt(coin.value) + fundingSum}`
      );
    }
    if (surplus > 0n) {
      if (!this.changeScript) {
        throw new Error(
          `ArkadeTransactionBuilder: ${surplus} sats surplus with no change output \u2014 call .change(script)`
        );
      }
      outputs.push({ script: this.changeScript, amount: surplus });
    }
    const { arkTx, checkpoints } = buildOffchainTx(
      [
        {
          txid: coin.txid,
          vout: coin.vout,
          value: coin.value,
          tapLeafScript: this.fn.tapLeafScript,
          tapTree: this.contract.tapTree
        },
        ...this.fundingCoins
      ],
      outputs,
      this.contract.client.checkpoint
    );
    if (coin.sourceTx) {
      setArkPsbtField(arkTx, 0, PrevArkTxField, coin.sourceTx);
    }
    if (this.fn.arkadeScript) {
      const indexer = this.contract.client.indexer;
      if (!indexer) {
        throw new PrevTxUnavailableError(
          "covenant spends require an `indexer` on the Arkade client to resolve the previous ark tx of each input"
        );
      }
      await attachPrevArkTxs(
        arkTx,
        [coin.txid, ...this.fundingCoins.map((c) => c.txid)],
        indexer
      );
    }
    const condition = (def2.tapscript.witness ?? []).map((w) => this.witnessBytes(w));
    if (condition.length > 0) {
      setArkPsbtField(arkTx, 0, ConditionWitness, condition);
      setArkPsbtField(checkpoints[0], 0, ConditionWitness, condition);
    }
    const packets = [];
    if (this.assetSpecs.length > 0) {
      packets.push(this.buildAssetPacket());
    }
    const arkadeScript = this.fn.arkadeScript;
    if (arkadeScript) {
      const stack = (def2.arkadeScript?.witness ?? []).map((w) => this.witnessBytes(w));
      packets.push(
        EmulatorPacket.create([
          { vin: 0, script: arkadeScript, witness: RawWitness.encode(stack) }
        ])
      );
    }
    if (packets.length > 0) {
      attachExtension(arkTx, packets);
    }
    return { arkTx, checkpoints };
  }
  /** Build, submit and return the finalized transaction. */
  async send() {
    const { arkTx, checkpoints } = await this.build();
    const client = this.contract.client;
    const userInputs = this.userInputIndexes();
    if (this.fn.arkadeScript) {
      if (!client.emulator) {
        throw new Error("covenant spends require an `emulator` on the Arkade client");
      }
      const signedArk2 = await this.signArk(arkTx, userInputs);
      const signedCps = userInputs.length > 0 ? await Promise.all(
        checkpoints.map(
          (c, i) => userInputs.includes(i) ? client.identity.sign(c, [0]) : c
        )
      ) : checkpoints;
      const res2 = await client.emulator.submitTx(
        base64.encode(signedArk2.toPSBT()),
        signedCps.map((c) => base64.encode(c.toPSBT()))
      );
      const txid = Transaction2.fromPSBT(base64.decode(res2.signedArkTx)).id;
      return {
        txid,
        signedArkTx: res2.signedArkTx,
        signedCheckpointTxs: res2.signedCheckpointTxs
      };
    }
    if (!client.identity) {
      throw new Error("a signing identity is required for non-covenant spends");
    }
    const signedArk = await this.signArk(arkTx, userInputs);
    const res = await client.arkProvider.submitTx(
      base64.encode(signedArk.toPSBT()),
      checkpoints.map((c) => base64.encode(c.toPSBT()))
    );
    assertSubmittedArkTxid(res, signedArk, "submitTx");
    const matched = matchServerCheckpoints(res.signedCheckpointTxs, checkpoints, "submitTx");
    const finalCps = await Promise.all(
      matched.map(
        async ({ server }) => base64.encode((await client.identity.sign(server, [0])).toPSBT())
      )
    );
    await client.arkProvider.finalizeTx(res.arkTxid, finalCps);
    return {
      txid: res.arkTxid,
      signedArkTx: res.finalArkTx,
      signedCheckpointTxs: res.signedCheckpointTxs
    };
  }
  /** Sign the client-owned inputs of the ark tx (no-op when there are none). */
  async signArk(arkTx, userInputs) {
    if (userInputs.length === 0) return arkTx;
    const { identity } = this.contract.client;
    if (!identity) {
      throw new Error("this spend requires an `identity` to sign its user/funding inputs");
    }
    return identity.sign(arkTx, userInputs);
  }
  /** Indexes of inputs the client owns and must sign (contract input + funded inputs). */
  userInputIndexes() {
    const idxs = [];
    const userKey = this.contract.keys.userKey;
    if (userKey && this.fn.signerKeys.some((k) => equalBytes3(k, userKey))) {
      idxs.push(0);
    }
    for (let i = 0; i < this.fundingCoins.length; i++) {
      idxs.push(i + 1);
    }
    return idxs;
  }
  async selectCoin(amount) {
    const utxos = await this.contract.getUtxos();
    if (utxos.length === 0) throw new Error("no spendable coins for this contract");
    const covering = utxos.filter((u) => BigInt(u.value) >= amount).sort((a, b) => a.value - b.value);
    if (covering.length > 0) return covering[0];
    return [...utxos].sort((a, b) => b.value - a.value)[0];
  }
  buildAssetPacket() {
    const groups = this.assetSpecs.map((s) => {
      const id = typeof s.assetId === "string" ? AssetId.fromString(s.assetId) : AssetId.fromBytes(s.assetId);
      return AssetGroup.create(
        id,
        null,
        s.inputs.map((i) => AssetInput.create(i.vin, i.amount)),
        s.outputs.map((o) => AssetOutput.create(o.vout, o.amount)),
        (s.metadata ?? []).map((m) => Metadata.create(m.key, m.value))
      );
    });
    return Packet.create(groups);
  }
  witnessBytes(ref) {
    return witnessRefToBytes(ref, this.args, this.contract.args);
  }
};
function bindInputs(fn, callArgs) {
  const names = (fn.def.inputs ?? []).map(inputName);
  if (callArgs.length !== names.length) {
    throw new Error(`${fn.name}: expected ${names.length} argument(s), got ${callArgs.length}`);
  }
  const bound = {};
  names.forEach((n, i) => bound[n] = callArgs[i]);
  return bound;
}
function attachExtension(tx, newPackets) {
  for (let i = 0; i < tx.outputsLength; i++) {
    const out = tx.getOutput(i);
    if (!out?.script || !Extension.isExtension(out.script)) continue;
    const existing = Extension.fromBytes(out.script);
    const merged = Extension.create([...existing.getPackets(), ...newPackets]);
    tx.updateOutput(i, { script: merged.serialize(), amount: 0n });
    return;
  }
  const ext = Extension.create(newPackets);
  const newOut = ext.txOut();
  const lastIdx = tx.outputsLength - 1;
  const lastOut = tx.getOutput(lastIdx);
  if (lastOut?.script && lastOut.script.length === ANCHOR_PKSCRIPT.length && lastOut.script.every((b, j) => b === ANCHOR_PKSCRIPT[j])) {
    tx.updateOutput(lastIdx, { script: newOut.script, amount: newOut.amount });
    tx.addOutput({ script: lastOut.script, amount: lastOut.amount ?? 0n });
    return;
  }
  tx.addOutput({ script: newOut.script, amount: newOut.amount });
}

// node_modules/@scure/btc-signer/musig2.js
var InvalidContributionErr = class extends Error {
  idx;
  // Indice of participant
  constructor(idx, m) {
    super(m);
    this.idx = idx;
  }
};
var { taggedHash: taggedHash2, pointToBytes: pointToBytes2 } = schnorr.utils;
var Point2 = secp256k1.Point;
var Fn2 = Point2.Fn;
var PUBKEY_LEN = secp256k1.lengths.publicKey;
var ZERO = new Uint8Array(PUBKEY_LEN);
var compressed = apply(createBytes(33), {
  decode: (p) => isZero(p) ? ZERO : p.toBytes(true),
  encode: (b) => equalBytes(b, ZERO) ? Point2.ZERO : Point2.fromBytes(b)
});
var scalar = validate(U256BE, (n) => {
  aInRange("n", n, 1n, Fn2.ORDER);
  return n;
});
var PubNonce = struct({ R1: compressed, R2: compressed });
var SecretNonce = struct({ k1: scalar, k2: scalar, publicKey: createBytes(PUBKEY_LEN) });
function abytesOptional(b, ...lengths2) {
  if (b !== void 0)
    abytes2(b, ...lengths2);
}
function abytesArray(lst, ...lengths2) {
  if (!Array.isArray(lst))
    throw new Error("expected array");
  lst.forEach((i) => abytes2(i, ...lengths2));
}
function aXonly(lst) {
  if (!Array.isArray(lst))
    throw new Error("expected array");
  lst.forEach((i, j) => {
    if (typeof i !== "boolean")
      throw new Error("expected boolean in xOnly array, got" + i + "(" + j + ")");
  });
}
var taggedInt = (tag, ...messages) => Fn2.create(Fn2.fromBytes(taggedHash2(tag, ...messages), true));
var evenScalar = (p, n) => hasEven2(p.y) ? n : Fn2.neg(n);
function mulBase(n) {
  return Point2.BASE.multiply(n);
}
function isZero(point) {
  return point.equals(Point2.ZERO);
}
function sortKeys(publicKeys) {
  abytesArray(publicKeys, PUBKEY_LEN);
  return publicKeys.sort(compareBytes);
}
function getSecondKey(publicKeys) {
  abytesArray(publicKeys, PUBKEY_LEN);
  for (let j = 1; j < publicKeys.length; j++)
    if (!equalBytes(publicKeys[j], publicKeys[0]))
      return publicKeys[j];
  return ZERO;
}
function keyAggL(publicKeys) {
  abytesArray(publicKeys, PUBKEY_LEN);
  return taggedHash2("KeyAgg list", ...publicKeys);
}
function keyAggCoeffInternal(publicKey1, publicKey2, L3) {
  abytes2(publicKey1, PUBKEY_LEN);
  abytes2(publicKey2, PUBKEY_LEN);
  if (equalBytes(publicKey1, publicKey2))
    return 1n;
  return taggedInt("KeyAgg coefficient", L3, publicKey1);
}
function keyAggregate(publicKeys, tweaks = [], isXonly = []) {
  abytesArray(publicKeys, PUBKEY_LEN);
  abytesArray(tweaks, 32);
  if (tweaks.length !== isXonly.length)
    throw new Error("The tweaks and isXonly arrays must have the same length");
  const pk2 = getSecondKey(publicKeys);
  const L3 = keyAggL(publicKeys);
  let aggPublicKey = Point2.ZERO;
  for (let i = 0; i < publicKeys.length; i++) {
    let Pi;
    try {
      Pi = Point2.fromBytes(publicKeys[i]);
    } catch (error) {
      throw new InvalidContributionErr(i, "pubkey");
    }
    aggPublicKey = aggPublicKey.add(Pi.multiply(keyAggCoeffInternal(publicKeys[i], pk2, L3)));
  }
  let gAcc = Fn2.ONE;
  let tweakAcc = Fn2.ZERO;
  for (let i = 0; i < tweaks.length; i++) {
    const g = isXonly[i] && !hasEven2(aggPublicKey.y) ? Fn2.neg(Fn2.ONE) : Fn2.ONE;
    const t = Fn2.fromBytes(tweaks[i]);
    aggPublicKey = aggPublicKey.multiply(g).add(mulBase(t));
    if (isZero(aggPublicKey))
      throw new Error("The result of tweaking cannot be infinity");
    gAcc = Fn2.mul(g, gAcc);
    tweakAcc = Fn2.add(t, Fn2.mul(g, tweakAcc));
  }
  return { aggPublicKey, gAcc, tweakAcc };
}
function aux(secret, rand) {
  const rand2 = taggedHash2("MuSig/aux", rand);
  if (secret.length !== rand2.length)
    throw new Error("Cannot XOR arrays of different lengths");
  const res = new Uint8Array(secret.length);
  for (let i = 0; i < secret.length; i++)
    res[i] = secret[i] ^ rand2[i];
  return res;
}
var nonceHash = (rand, publicKey, aggPublicKey, i, msgPrefixed, extraIn) => taggedInt("MuSig/nonce", rand, new Uint8Array([publicKey.length]), publicKey, new Uint8Array([aggPublicKey.length]), aggPublicKey, msgPrefixed, numberToBytesBE(extraIn.length, 4), extraIn, new Uint8Array([i]));
function nonceGen(publicKey, secretKey, aggPublicKey = new Uint8Array(0), msg, extraIn = new Uint8Array(0), rand = randomBytes(32)) {
  abytes2(publicKey, PUBKEY_LEN);
  abytesOptional(secretKey, 32);
  abytes2(aggPublicKey);
  if (![0, 32].includes(aggPublicKey.length))
    throw new Error("wrong aggPublicKey");
  abytesOptional(msg);
  abytes2(extraIn);
  abytes2(rand, 32);
  if (secretKey !== void 0)
    rand = aux(secretKey, rand);
  const msgPrefixed = msg !== void 0 ? concatBytes(Uint8Array.of(1), numberToBytesBE(msg.length, 8), msg) : Uint8Array.of(0);
  const k1 = nonceHash(rand, publicKey, aggPublicKey, 0, msgPrefixed, extraIn);
  const k2 = nonceHash(rand, publicKey, aggPublicKey, 1, msgPrefixed, extraIn);
  return {
    secret: SecretNonce.encode({ k1, k2, publicKey }),
    public: PubNonce.encode({ R1: mulBase(k1), R2: mulBase(k2) })
  };
}
function nonceAggregate(pubNonces) {
  abytesArray(pubNonces, 66);
  let R1 = Point2.ZERO;
  let R2 = Point2.ZERO;
  for (let i = 0; i < pubNonces.length; i++) {
    const pn = pubNonces[i];
    try {
      const { R1: R1n, R2: R2n } = PubNonce.decode(pn);
      if (isZero(R1n) || isZero(R2n))
        throw new Error("infinity point");
      R1 = R1.add(R1n);
      R2 = R2.add(R2n);
    } catch (error) {
      throw new InvalidContributionErr(i, "pubnonce");
    }
  }
  return PubNonce.encode({ R1, R2 });
}
var Session = class {
  publicKeys;
  Q;
  gAcc;
  tweakAcc;
  b;
  R;
  e;
  tweaks;
  isXonly;
  L;
  secondKey;
  /**
   * Constructor for the Session class.
   * It precomputes and stores values derived from the aggregate nonce, public keys,
   * message, and optional tweaks, optimizing the signing process.
   * @param aggNonce The aggregate nonce (Uint8Array) from all participants combined, must be 66 bytes.
   * @param publicKeys An array of public keys (Uint8Array) from each participant, must be 33 bytes.
   * @param msg The message (Uint8Array) to be signed.
   * @param tweaks Optional array of tweaks (Uint8Array) to be applied to the aggregate public key, each must be 32 bytes. Defaults to [].
   * @param isXonly Optional array of booleans indicating whether each tweak is an X-only tweak. Defaults to [].
   * @throws {Error} If the input is invalid, such as wrong array sizes or lengths.
   */
  constructor(aggNonce, publicKeys, msg, tweaks = [], isXonly = []) {
    abytesArray(publicKeys, 33);
    abytesArray(tweaks, 32);
    aXonly(isXonly);
    abytes2(msg);
    if (tweaks.length !== isXonly.length)
      throw new Error("The tweaks and isXonly arrays must have the same length");
    const { aggPublicKey, gAcc, tweakAcc } = keyAggregate(publicKeys, tweaks, isXonly);
    const { R1, R2 } = PubNonce.decode(aggNonce);
    this.publicKeys = publicKeys;
    this.Q = aggPublicKey;
    this.gAcc = gAcc;
    this.tweakAcc = tweakAcc;
    this.b = taggedInt("MuSig/noncecoef", aggNonce, pointToBytes2(aggPublicKey), msg);
    const R = R1.add(R2.multiply(this.b));
    this.R = isZero(R) ? Point2.BASE : R;
    this.e = taggedInt("BIP0340/challenge", pointToBytes2(this.R), pointToBytes2(aggPublicKey), msg);
    this.tweaks = tweaks;
    this.isXonly = isXonly;
    this.L = keyAggL(publicKeys);
    this.secondKey = getSecondKey(publicKeys);
  }
  /**
   * Calculates the key aggregation coefficient for a given point.
   * @private
   * @param P The point to calculate the coefficient for.
   * @returns The key aggregation coefficient as a bigint.
   * @throws {Error} If the provided public key is not included in the list of pubkeys.
   */
  getSessionKeyAggCoeff(P2) {
    const { publicKeys } = this;
    const pk = P2.toBytes(true);
    const found = publicKeys.some((p) => equalBytes(p, pk));
    if (!found)
      throw new Error("The signer's pubkey must be included in the list of pubkeys");
    return keyAggCoeffInternal(pk, this.secondKey, this.L);
  }
  partialSigVerifyInternal(partialSig, publicNonce, publicKey) {
    const { Q, gAcc, b, R, e } = this;
    const s = Fn2.fromBytes(partialSig, true);
    if (!Fn2.isValid(s))
      return false;
    const { R1, R2 } = PubNonce.decode(publicNonce);
    const Re_s_ = R1.add(R2.multiply(b));
    const Re_s = hasEven2(R.y) ? Re_s_ : Re_s_.negate();
    const P2 = Point2.fromBytes(publicKey);
    const a = this.getSessionKeyAggCoeff(P2);
    const g = Fn2.mul(evenScalar(Q, 1n), gAcc);
    const left = mulBase(s);
    const right = Re_s.add(P2.multiply(Fn2.mul(e, Fn2.mul(a, g))));
    return left.equals(right);
  }
  /**
   * Generates a partial signature for a given message, secret nonce, secret key, and session context.
   * @param secretNonce The secret nonce for this signing session (Uint8Array). MUST be securely erased after use.
   * @param secret The secret key of the signer (Uint8Array).
   * @param sessionCtx The session context containing all necessary information for signing.
   * @param fastSign if set to true, the signature is created without checking validity.
   * @returns The partial signature (Uint8Array).
   * @throws {Error} If the input is invalid, such as wrong array sizes, invalid nonce or secret key.
   */
  sign(secretNonce, secret, fastSign = false) {
    abytes2(secret, 32);
    if (typeof fastSign !== "boolean")
      throw new Error("expected boolean");
    const { Q, gAcc, b, R, e } = this;
    const { k1: k1_, k2: k2_, publicKey: originalPk } = SecretNonce.decode(secretNonce);
    secretNonce.fill(0, 0, 64);
    if (!Fn2.isValid(k1_))
      throw new Error("wrong k1");
    if (!Fn2.isValid(k2_))
      throw new Error("wrong k1");
    const k1 = evenScalar(R, k1_);
    const k2 = evenScalar(R, k2_);
    const d_ = Fn2.fromBytes(secret);
    if (Fn2.is0(d_))
      throw new Error("wrong d_");
    const P2 = mulBase(d_);
    const pk = P2.toBytes(true);
    if (!equalBytes(pk, originalPk))
      throw new Error("Public key does not match nonceGen argument");
    const a = this.getSessionKeyAggCoeff(P2);
    const g = evenScalar(Q, 1n);
    const d = Fn2.mul(g, Fn2.mul(gAcc, d_));
    const s = Fn2.add(k1, Fn2.add(Fn2.mul(b, k2), Fn2.mul(e, Fn2.mul(a, d))));
    const partialSig = Fn2.toBytes(s);
    if (!fastSign) {
      const publicNonce = PubNonce.encode({
        R1: mulBase(k1_),
        R2: mulBase(k2_)
      });
      if (!this.partialSigVerifyInternal(partialSig, publicNonce, pk))
        throw new Error("Partial signature verification failed");
    }
    return partialSig;
  }
  /**
   * Verifies a partial signature against the aggregate public key and other session parameters.
   * @param partialSig The partial signature to verify (Uint8Array).
   * @param pubNonces An array of public nonces from each signer (Uint8Array).
   * @param pubKeys An array of public keys from each signer (Uint8Array).
   * @param tweaks An array of tweaks applied to the aggregate public key.
   * @param isXonly An array of booleans indicating whether each tweak is an X-only tweak.
   * @param msg The message that was signed (Uint8Array).
   * @param i The index of the signer whose partial signature is being verified.
   * @returns True if the partial signature is valid, false otherwise.
   * @throws {Error} If the input is invalid, such as non array partialSig, pubNonces, pubKeys, tweaks.
   */
  partialSigVerify(partialSig, pubNonces, i) {
    const { publicKeys, tweaks, isXonly } = this;
    abytes2(partialSig, 32);
    abytesArray(pubNonces, 66);
    abytesArray(publicKeys, PUBKEY_LEN);
    abytesArray(tweaks, 32);
    aXonly(isXonly);
    anumber2(i);
    if (pubNonces.length !== publicKeys.length)
      throw new Error("The pubNonces and publicKeys arrays must have the same length");
    if (tweaks.length !== isXonly.length)
      throw new Error("The tweaks and isXonly arrays must have the same length");
    if (i >= pubNonces.length)
      throw new Error("index outside of pubKeys/pubNonces");
    return this.partialSigVerifyInternal(partialSig, pubNonces[i], publicKeys[i]);
  }
  /**
   * Aggregates partial signatures from multiple signers into a single final signature.
   * @param partialSigs An array of partial signatures from each signer (Uint8Array).
   * @param sessionCtx The session context containing all necessary information for signing.
   * @returns The final aggregate signature (Uint8Array).
   * @throws {Error} If the input is invalid, such as wrong array sizes, invalid signature.
   */
  partialSigAgg(partialSigs) {
    abytesArray(partialSigs, 32);
    const { Q, tweakAcc, R, e } = this;
    let s = 0n;
    for (let i = 0; i < partialSigs.length; i++) {
      const si = Fn2.fromBytes(partialSigs[i], true);
      if (!Fn2.isValid(si))
        throw new InvalidContributionErr(i, "psig");
      s = Fn2.add(s, si);
    }
    const g = evenScalar(Q, 1n);
    s = Fn2.add(s, Fn2.mul(e, Fn2.mul(g, tweakAcc)));
    return concatBytes(pointToBytes2(R), Fn2.toBytes(s));
  }
};

// packages/ts-sdk/src/musig2/nonces.ts
function generateNonces(publicKey) {
  const nonces = nonceGen(publicKey);
  return { secNonce: nonces.secret, pubNonce: nonces.public };
}
function aggregateNonces(pubNonces) {
  return nonceAggregate(pubNonces);
}

// node_modules/@noble/secp256k1/index.js
var secp256k1_CURVE2 = {
  p: 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
  n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
  h: 1n,
  a: 0n,
  b: 7n,
  Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
};
var { p: P, n: N, Gx, Gy, b: _b } = secp256k1_CURVE2;
var L = 32;
var L2 = 64;
var lengths = {
  publicKey: L + 1,
  publicKeyUncompressed: L2 + 1,
  signature: L2,
  seed: L + L / 2
};
var captureTrace = (...args) => {
  if ("captureStackTrace" in Error && typeof Error.captureStackTrace === "function") {
    Error.captureStackTrace(...args);
  }
};
var err = (message = "") => {
  const e = new Error(message);
  captureTrace(e, err);
  throw e;
};
var isBig = (n) => typeof n === "bigint";
var isStr = (s) => typeof s === "string";
var isBytes5 = (a) => a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
var abytes3 = (value, length, title = "") => {
  const bytes = isBytes5(value);
  const len = value?.length;
  const needsLen = length !== void 0;
  if (!bytes || needsLen && len !== length) {
    const prefix2 = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    err(prefix2 + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
};
var u8n = (len) => new Uint8Array(len);
var padh = (n, pad) => n.toString(16).padStart(pad, "0");
var bytesToHex2 = (b) => Array.from(abytes3(b)).map((e) => padh(e, 2)).join("");
var C = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
var _ch = (ch) => {
  if (ch >= C._0 && ch <= C._9)
    return ch - C._0;
  if (ch >= C.A && ch <= C.F)
    return ch - (C.A - 10);
  if (ch >= C.a && ch <= C.f)
    return ch - (C.a - 10);
  return;
};
var hexToBytes2 = (hex2) => {
  const e = "hex invalid";
  if (!isStr(hex2))
    return err(e);
  const hl = hex2.length;
  const al = hl / 2;
  if (hl % 2)
    return err(e);
  const array2 = u8n(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = _ch(hex2.charCodeAt(hi));
    const n2 = _ch(hex2.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0)
      return err(e);
    array2[ai] = n1 * 16 + n2;
  }
  return array2;
};
var cr = () => globalThis?.crypto;
var subtle = () => cr()?.subtle ?? err("crypto.subtle must be defined, consider polyfill");
var concatBytes4 = (...arrs) => {
  const r = u8n(arrs.reduce((sum, a) => sum + abytes3(a).length, 0));
  let pad = 0;
  arrs.forEach((a) => {
    r.set(a, pad);
    pad += a.length;
  });
  return r;
};
var randomBytes2 = (len = L) => {
  const c = cr();
  return c.getRandomValues(u8n(len));
};
var big = BigInt;
var arange = (n, min, max, msg = "bad number: out of range") => isBig(n) && min <= n && n < max ? n : err(msg);
var M = (a, b = P) => {
  const r = a % b;
  return r >= 0n ? r : b + r;
};
var modN = (a) => M(a, N);
var invert2 = (num2, md) => {
  if (num2 === 0n || md <= 0n)
    err("no inverse n=" + num2 + " mod=" + md);
  let a = M(num2, md), b = md, x = 0n, y = 1n, u = 1n, v = 0n;
  while (a !== 0n) {
    const q = b / a, r = b % a;
    const m = x - u * q, n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  return b === 1n ? M(x, md) : err("no inverse");
};
var callHash = (name) => {
  const fn = hashes[name];
  if (typeof fn !== "function")
    err("hashes." + name + " not set");
  return fn;
};
var apoint = (p) => p instanceof Point3 ? p : err("Point expected");
var koblitz = (x) => M(M(x * x) * x + _b);
var FpIsValid = (n) => arange(n, 0n, P);
var FpIsValidNot0 = (n) => arange(n, 1n, P);
var FnIsValidNot0 = (n) => arange(n, 1n, N);
var isEven = (y) => (y & 1n) === 0n;
var u8of = (n) => Uint8Array.of(n);
var getPrefix = (y) => u8of(isEven(y) ? 2 : 3);
var lift_x2 = (x) => {
  const c = koblitz(FpIsValidNot0(x));
  let r = 1n;
  for (let num2 = c, e = (P + 1n) / 4n; e > 0n; e >>= 1n) {
    if (e & 1n)
      r = r * num2 % P;
    num2 = num2 * num2 % P;
  }
  return M(r * r) === c ? r : err("sqrt invalid");
};
var Point3 = class _Point {
  static BASE;
  static ZERO;
  X;
  Y;
  Z;
  constructor(X, Y, Z) {
    this.X = FpIsValid(X);
    this.Y = FpIsValidNot0(Y);
    this.Z = FpIsValid(Z);
    Object.freeze(this);
  }
  static CURVE() {
    return secp256k1_CURVE2;
  }
  /** Create 3d xyz point from 2d xy. (0, 0) => (0, 1, 0), not (0, 0, 1) */
  static fromAffine(ap) {
    const { x, y } = ap;
    return x === 0n && y === 0n ? I : new _Point(x, y, 1n);
  }
  /** Convert Uint8Array or hex string to Point. */
  static fromBytes(bytes) {
    abytes3(bytes);
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    let p = void 0;
    const length = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    const x = sliceBytesNumBE(tail, 0, L);
    if (length === comp && (head === 2 || head === 3)) {
      let y = lift_x2(x);
      const evenY = isEven(y);
      const evenH = isEven(big(head));
      if (evenH !== evenY)
        y = M(-y);
      p = new _Point(x, y, 1n);
    }
    if (length === uncomp && head === 4)
      p = new _Point(x, sliceBytesNumBE(tail, L, L2), 1n);
    return p ? p.assertValidity() : err("bad point: not on curve");
  }
  static fromHex(hex2) {
    return _Point.fromBytes(hexToBytes2(hex2));
  }
  get x() {
    return this.toAffine().x;
  }
  get y() {
    return this.toAffine().y;
  }
  /** Equality check: compare points P&Q. */
  equals(other) {
    const { X: X1, Y: Y1, Z: Z1 } = this;
    const { X: X2, Y: Y2, Z: Z2 } = apoint(other);
    const X1Z2 = M(X1 * Z2);
    const X2Z1 = M(X2 * Z1);
    const Y1Z2 = M(Y1 * Z2);
    const Y2Z1 = M(Y2 * Z1);
    return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
  }
  is0() {
    return this.equals(I);
  }
  /** Flip point over y coordinate. */
  negate() {
    return new _Point(this.X, M(-this.Y), this.Z);
  }
  /** Point doubling: P+P, complete formula. */
  double() {
    return this.add(this);
  }
  /**
   * Point addition: P+Q, complete, exception-free formula
   * (Renes-Costello-Batina, algo 1 of [2015/1060](https://eprint.iacr.org/2015/1060)).
   * Cost: `12M + 0S + 3*a + 3*b3 + 23add`.
   */
  // prettier-ignore
  add(other) {
    const { X: X1, Y: Y1, Z: Z1 } = this;
    const { X: X2, Y: Y2, Z: Z2 } = apoint(other);
    const a = 0n;
    const b = _b;
    let X3 = 0n, Y3 = 0n, Z3 = 0n;
    const b3 = M(b * 3n);
    let t0 = M(X1 * X2), t1 = M(Y1 * Y2), t2 = M(Z1 * Z2), t3 = M(X1 + Y1);
    let t4 = M(X2 + Y2);
    t3 = M(t3 * t4);
    t4 = M(t0 + t1);
    t3 = M(t3 - t4);
    t4 = M(X1 + Z1);
    let t5 = M(X2 + Z2);
    t4 = M(t4 * t5);
    t5 = M(t0 + t2);
    t4 = M(t4 - t5);
    t5 = M(Y1 + Z1);
    X3 = M(Y2 + Z2);
    t5 = M(t5 * X3);
    X3 = M(t1 + t2);
    t5 = M(t5 - X3);
    Z3 = M(a * t4);
    X3 = M(b3 * t2);
    Z3 = M(X3 + Z3);
    X3 = M(t1 - Z3);
    Z3 = M(t1 + Z3);
    Y3 = M(X3 * Z3);
    t1 = M(t0 + t0);
    t1 = M(t1 + t0);
    t2 = M(a * t2);
    t4 = M(b3 * t4);
    t1 = M(t1 + t2);
    t2 = M(t0 - t2);
    t2 = M(a * t2);
    t4 = M(t4 + t2);
    t0 = M(t1 * t4);
    Y3 = M(Y3 + t0);
    t0 = M(t5 * t4);
    X3 = M(t3 * X3);
    X3 = M(X3 - t0);
    t0 = M(t3 * t1);
    Z3 = M(t5 * Z3);
    Z3 = M(Z3 + t0);
    return new _Point(X3, Y3, Z3);
  }
  subtract(other) {
    return this.add(apoint(other).negate());
  }
  /**
   * Point-by-scalar multiplication. Scalar must be in range 1 <= n < CURVE.n.
   * Uses {@link wNAF} for base point.
   * Uses fake point to mitigate side-channel leakage.
   * @param n scalar by which point is multiplied
   * @param safe safe mode guards against timing attacks; unsafe mode is faster
   */
  multiply(n, safe = true) {
    if (!safe && n === 0n)
      return I;
    FnIsValidNot0(n);
    if (n === 1n)
      return this;
    if (this.equals(G))
      return wNAF2(n).p;
    let p = I;
    let f = G;
    for (let d = this; n > 0n; d = d.double(), n >>= 1n) {
      if (n & 1n)
        p = p.add(d);
      else if (safe)
        f = f.add(d);
    }
    return p;
  }
  multiplyUnsafe(scalar2) {
    return this.multiply(scalar2, false);
  }
  /** Convert point to 2d xy affine point. (X, Y, Z) ∋ (x=X/Z, y=Y/Z) */
  toAffine() {
    const { X: x, Y: y, Z: z } = this;
    if (this.equals(I))
      return { x: 0n, y: 0n };
    if (z === 1n)
      return { x, y };
    const iz = invert2(z, P);
    if (M(z * iz) !== 1n)
      err("inverse invalid");
    return { x: M(x * iz), y: M(y * iz) };
  }
  /** Checks if the point is valid and on-curve. */
  assertValidity() {
    const { x, y } = this.toAffine();
    FpIsValidNot0(x);
    FpIsValidNot0(y);
    return M(y * y) === koblitz(x) ? this : err("bad point: not on curve");
  }
  /** Converts point to 33/65-byte Uint8Array. */
  toBytes(isCompressed = true) {
    const { x, y } = this.assertValidity().toAffine();
    const x32b = numTo32b(x);
    if (isCompressed)
      return concatBytes4(getPrefix(y), x32b);
    return concatBytes4(u8of(4), x32b, numTo32b(y));
  }
  toHex(isCompressed) {
    return bytesToHex2(this.toBytes(isCompressed));
  }
};
var G = new Point3(Gx, Gy, 1n);
var I = new Point3(0n, 1n, 0n);
Point3.BASE = G;
Point3.ZERO = I;
var doubleScalarMulUns = (R, u1, u2) => {
  return G.multiply(u1, false).add(R.multiply(u2, false)).assertValidity();
};
var bytesToNumBE = (b) => big("0x" + (bytesToHex2(b) || "0"));
var sliceBytesNumBE = (b, from, to) => bytesToNumBE(b.subarray(from, to));
var B256 = 2n ** 256n;
var numTo32b = (num2) => hexToBytes2(padh(arange(num2, 0n, B256), L2));
var secretKeyToScalar = (secretKey) => {
  const num2 = bytesToNumBE(abytes3(secretKey, L, "secret key"));
  return arange(num2, 1n, N, "invalid secret key: outside of range");
};
var highS = (n) => n > N >> 1n;
var getPublicKey = (privKey, isCompressed = true) => {
  return G.multiply(secretKeyToScalar(privKey)).toBytes(isCompressed);
};
var assertRecoveryBit = (recovery) => {
  if (![0, 1, 2, 3].includes(recovery))
    err("recovery id must be valid and present");
};
var assertSigFormat = (format) => {
  if (format != null && !ALL_SIG.includes(format))
    err(`Signature format must be one of: ${ALL_SIG.join(", ")}`);
  if (format === SIG_DER)
    err('Signature format "der" is not supported: switch to noble-curves');
};
var assertSigLength = (sig, format = SIG_COMPACT) => {
  assertSigFormat(format);
  const SL = lengths.signature;
  const RL = SL + 1;
  let msg = `Signature format "${format}" expects Uint8Array with length `;
  if (format === SIG_COMPACT && sig.length !== SL)
    err(msg + SL);
  if (format === SIG_RECOVERED && sig.length !== RL)
    err(msg + RL);
};
var Signature = class _Signature {
  r;
  s;
  recovery;
  constructor(r, s, recovery) {
    this.r = FnIsValidNot0(r);
    this.s = FnIsValidNot0(s);
    if (recovery != null)
      this.recovery = recovery;
    Object.freeze(this);
  }
  static fromBytes(b, format = SIG_COMPACT) {
    assertSigLength(b, format);
    let rec;
    if (format === SIG_RECOVERED) {
      rec = b[0];
      b = b.subarray(1);
    }
    const r = sliceBytesNumBE(b, 0, L);
    const s = sliceBytesNumBE(b, L, L2);
    return new _Signature(r, s, rec);
  }
  addRecoveryBit(bit) {
    return new _Signature(this.r, this.s, bit);
  }
  hasHighS() {
    return highS(this.s);
  }
  toBytes(format = SIG_COMPACT) {
    const { r, s, recovery } = this;
    const res = concatBytes4(numTo32b(r), numTo32b(s));
    if (format === SIG_RECOVERED) {
      assertRecoveryBit(recovery);
      return concatBytes4(Uint8Array.of(recovery), res);
    }
    return res;
  }
};
var bits2int = (bytes) => {
  const delta = bytes.length * 8 - 256;
  if (delta > 1024)
    err("msg invalid");
  const num2 = bytesToNumBE(bytes);
  return delta > 0 ? num2 >> big(delta) : num2;
};
var bits2int_modN = (bytes) => modN(bits2int(abytes3(bytes)));
var SIG_COMPACT = "compact";
var SIG_RECOVERED = "recovered";
var SIG_DER = "der";
var ALL_SIG = [SIG_COMPACT, SIG_RECOVERED, SIG_DER];
var defaultSignOpts = {
  lowS: true,
  prehash: true,
  format: SIG_COMPACT,
  extraEntropy: false
};
var _sha = "SHA-256";
var hashes = {
  hmacSha256Async: async (key, message) => {
    const s = subtle();
    const name = "HMAC";
    const k = await s.importKey("raw", key, { name, hash: { name: _sha } }, false, ["sign"]);
    return u8n(await s.sign(name, k, message));
  },
  hmacSha256: void 0,
  sha256Async: async (msg) => u8n(await subtle().digest(_sha, msg)),
  sha256: void 0
};
var prepMsg = (msg, opts, async_) => {
  abytes3(msg, void 0, "message");
  if (!opts.prehash)
    return msg;
  return async_ ? hashes.sha256Async(msg) : callHash("sha256")(msg);
};
var NULL2 = u8n(0);
var byte0 = u8of(0);
var byte1 = u8of(1);
var _maxDrbgIters = 1e3;
var _drbgErr = "drbg: tried max amount of iterations";
var hmacDrbgAsync = async (seed, pred) => {
  let v = u8n(L);
  let k = u8n(L);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
  };
  const h = (...b) => hashes.hmacSha256Async(k, concatBytes4(v, ...b));
  const reseed = async (seed2 = NULL2) => {
    k = await h(byte0, seed2);
    v = await h();
    if (seed2.length === 0)
      return;
    k = await h(byte1, seed2);
    v = await h();
  };
  const gen = async () => {
    if (i++ >= _maxDrbgIters)
      err(_drbgErr);
    v = await h();
    return v;
  };
  reset();
  await reseed(seed);
  let res = void 0;
  while (!(res = pred(await gen())))
    await reseed();
  reset();
  return res;
};
var _sign = (messageHash, secretKey, opts, hmacDrbg) => {
  let { lowS, extraEntropy } = opts;
  const int2octets = numTo32b;
  const h1i = bits2int_modN(messageHash);
  const h1o = int2octets(h1i);
  const d = secretKeyToScalar(secretKey);
  const seedArgs = [int2octets(d), h1o];
  if (extraEntropy != null && extraEntropy !== false) {
    const e = extraEntropy === true ? randomBytes2(L) : extraEntropy;
    seedArgs.push(abytes3(e, void 0, "extraEntropy"));
  }
  const seed = concatBytes4(...seedArgs);
  const m = h1i;
  const k2sig = (kBytes) => {
    const k = bits2int(kBytes);
    if (!(1n <= k && k < N))
      return;
    const ik = invert2(k, N);
    const q = G.multiply(k).toAffine();
    const r = modN(q.x);
    if (r === 0n)
      return;
    const s = modN(ik * modN(m + r * d));
    if (s === 0n)
      return;
    let recovery = (q.x === r ? 0 : 2) | Number(q.y & 1n);
    let normS = s;
    if (lowS && highS(s)) {
      normS = modN(-s);
      recovery ^= 1;
    }
    const sig = new Signature(r, normS, recovery);
    return sig.toBytes(opts.format);
  };
  return hmacDrbg(seed, k2sig);
};
var setDefaults = (opts) => {
  const res = {};
  Object.keys(defaultSignOpts).forEach((k) => {
    res[k] = opts[k] ?? defaultSignOpts[k];
  });
  return res;
};
var signAsync = async (message, secretKey, opts = {}) => {
  opts = setDefaults(opts);
  message = await prepMsg(message, opts, true);
  return _sign(message, secretKey, opts, hmacDrbgAsync);
};
var randomSecretKey = (seed = randomBytes2(lengths.seed)) => {
  abytes3(seed);
  if (seed.length < lengths.seed || seed.length > 1024)
    err("expected 40-1024b");
  const num2 = M(bytesToNumBE(seed), N - 1n);
  return numTo32b(num2 + 1n);
};
var createKeygen2 = (getPublicKey2) => (seed) => {
  const secretKey = randomSecretKey(seed);
  return { secretKey, publicKey: getPublicKey2(secretKey) };
};
var keygen = createKeygen2(getPublicKey);
var getTag = (tag) => Uint8Array.from("BIP0340/" + tag, (c) => c.charCodeAt(0));
var T_AUX = "aux";
var T_NONCE = "nonce";
var T_CHALLENGE = "challenge";
var taggedHash3 = (tag, ...messages) => {
  const fn = callHash("sha256");
  const tagH = fn(getTag(tag));
  return fn(concatBytes4(tagH, tagH, ...messages));
};
var taggedHashAsync = async (tag, ...messages) => {
  const fn = hashes.sha256Async;
  const tagH = await fn(getTag(tag));
  return await fn(concatBytes4(tagH, tagH, ...messages));
};
var extpubSchnorr = (priv) => {
  const d_ = secretKeyToScalar(priv);
  const p = G.multiply(d_);
  const { x, y } = p.assertValidity().toAffine();
  const d = isEven(y) ? d_ : modN(-d_);
  const px = numTo32b(x);
  return { d, px };
};
var bytesModN = (bytes) => modN(bytesToNumBE(bytes));
var challenge2 = (...args) => bytesModN(taggedHash3(T_CHALLENGE, ...args));
var challengeAsync = async (...args) => bytesModN(await taggedHashAsync(T_CHALLENGE, ...args));
var pubSchnorr2 = (secretKey) => {
  return extpubSchnorr(secretKey).px;
};
var keygenSchnorr = createKeygen2(pubSchnorr2);
var prepSigSchnorr = (message, secretKey, auxRand) => {
  const { px, d } = extpubSchnorr(secretKey);
  return { m: abytes3(message), px, d, a: abytes3(auxRand, L) };
};
var extractK = (rand) => {
  const k_ = bytesModN(rand);
  if (k_ === 0n)
    err("sign failed: k is zero");
  const { px, d } = extpubSchnorr(numTo32b(k_));
  return { rx: px, k: d };
};
var createSigSchnorr = (k, px, e, d) => {
  return concatBytes4(px, numTo32b(modN(k + e * d)));
};
var E_INVSIG = "invalid signature produced";
var signSchnorr2 = (message, secretKey, auxRand = randomBytes2(L)) => {
  const { m, px, d, a } = prepSigSchnorr(message, secretKey, auxRand);
  const aux2 = taggedHash3(T_AUX, a);
  const t = numTo32b(d ^ bytesToNumBE(aux2));
  const rand = taggedHash3(T_NONCE, t, px, m);
  const { rx, k } = extractK(rand);
  const e = challenge2(rx, px, m);
  const sig = createSigSchnorr(k, rx, e, d);
  if (!verifySchnorr(sig, m, px))
    err(E_INVSIG);
  return sig;
};
var signSchnorrAsync = async (message, secretKey, auxRand = randomBytes2(L)) => {
  const { m, px, d, a } = prepSigSchnorr(message, secretKey, auxRand);
  const aux2 = await taggedHashAsync(T_AUX, a);
  const t = numTo32b(d ^ bytesToNumBE(aux2));
  const rand = await taggedHashAsync(T_NONCE, t, px, m);
  const { rx, k } = extractK(rand);
  const e = await challengeAsync(rx, px, m);
  const sig = createSigSchnorr(k, rx, e, d);
  if (!await verifySchnorrAsync(sig, m, px))
    err(E_INVSIG);
  return sig;
};
var callSyncAsyncFn = (res, later) => {
  return res instanceof Promise ? res.then(later) : later(res);
};
var _verifSchnorr = (signature, message, publicKey, challengeFn) => {
  const sig = abytes3(signature, L2, "signature");
  const msg = abytes3(message, void 0, "message");
  const pub = abytes3(publicKey, L, "publicKey");
  try {
    const x = bytesToNumBE(pub);
    const y = lift_x2(x);
    const y_ = isEven(y) ? y : M(-y);
    const P_ = new Point3(x, y_, 1n).assertValidity();
    const px = numTo32b(P_.toAffine().x);
    const r = sliceBytesNumBE(sig, 0, L);
    arange(r, 1n, P);
    const s = sliceBytesNumBE(sig, L, L2);
    arange(s, 1n, N);
    const i = concatBytes4(numTo32b(r), px, msg);
    return callSyncAsyncFn(challengeFn(i), (e) => {
      const { x: x2, y: y2 } = doubleScalarMulUns(P_, s, modN(-e)).toAffine();
      if (!isEven(y2) || x2 !== r)
        return false;
      return true;
    });
  } catch (error) {
    return false;
  }
};
var verifySchnorr = (s, m, p) => _verifSchnorr(s, m, p, challenge2);
var verifySchnorrAsync = async (s, m, p) => _verifSchnorr(s, m, p, challengeAsync);
var schnorr2 = {
  keygen: keygenSchnorr,
  getPublicKey: pubSchnorr2,
  sign: signSchnorr2,
  verify: verifySchnorr,
  signAsync: signSchnorrAsync,
  verifyAsync: verifySchnorrAsync
};
var W = 8;
var scalarBits = 256;
var pwindows = Math.ceil(scalarBits / W) + 1;
var pwindowSize = 2 ** (W - 1);
var precompute = () => {
  const points = [];
  let p = G;
  let b = p;
  for (let w = 0; w < pwindows; w++) {
    b = p;
    points.push(b);
    for (let i = 1; i < pwindowSize; i++) {
      b = b.add(p);
      points.push(b);
    }
    p = b.double();
  }
  return points;
};
var Gpows = void 0;
var ctneg = (cnd, p) => {
  const n = p.negate();
  return cnd ? n : p;
};
var wNAF2 = (n) => {
  const comp = Gpows || (Gpows = precompute());
  let p = I;
  let f = G;
  const pow_2_w = 2 ** W;
  const maxNum = pow_2_w;
  const mask = big(pow_2_w - 1);
  const shiftBy = big(W);
  for (let w = 0; w < pwindows; w++) {
    let wbits = Number(n & mask);
    n >>= shiftBy;
    if (wbits > pwindowSize) {
      wbits -= maxNum;
      n += 1n;
    }
    const off = w * pwindowSize;
    const offF = off;
    const offP = off + Math.abs(wbits) - 1;
    const isEven2 = w % 2 !== 0;
    const isNeg = wbits < 0;
    if (wbits === 0) {
      f = f.add(ctneg(isEven2, comp[offF]));
    } else {
      p = p.add(ctneg(isNeg, comp[offP]));
    }
  }
  if (n !== 0n)
    err("invalid wnaf");
  return { p, f };
};

// packages/ts-sdk/src/musig2/keys.ts
function aggregateKeys(publicKeys, sort, options = {}) {
  if (sort) {
    publicKeys = sortKeys([...publicKeys]);
  }
  const { aggPublicKey: preTweakedKey } = keyAggregate(publicKeys);
  if (!options.taprootTweak) {
    return {
      preTweakedKey: preTweakedKey.toBytes(true),
      finalKey: preTweakedKey.toBytes(true)
    };
  }
  const tweakBytes = schnorr.utils.taggedHash(
    "TapTweak",
    preTweakedKey.toBytes(true).subarray(1),
    options.taprootTweak ?? new Uint8Array(0)
  );
  const { aggPublicKey: finalKey } = keyAggregate(publicKeys, [tweakBytes], [true]);
  return {
    preTweakedKey: preTweakedKey.toBytes(true),
    finalKey: finalKey.toBytes(true)
  };
}

// packages/ts-sdk/src/musig2/sign.ts
var PartialSignatureError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PartialSignatureError";
  }
};
var PartialSig = class _PartialSig {
  constructor(s, R) {
    this.s = s;
    this.R = R;
    if (s.length !== 32) {
      throw new PartialSignatureError("Invalid s length");
    }
    if (R.length !== 33) {
      throw new PartialSignatureError("Invalid R length");
    }
  }
  s;
  R;
  /**
   * Encodes the partial signature into bytes
   * Returns a 32-byte array containing just the s value
   */
  encode() {
    return new Uint8Array(this.s);
  }
  /**
   * Decodes a partial signature from bytes
   * @param bytes - 32-byte array containing s value
   */
  static decode(bytes) {
    if (bytes.length !== 32) {
      throw new PartialSignatureError("Invalid partial signature length");
    }
    const s = bytesToNumberBE(bytes);
    if (s >= Point3.CURVE().n) {
      throw new PartialSignatureError("s value overflows curve order");
    }
    const R = new Uint8Array(33);
    return new _PartialSig(bytes, R);
  }
};
function createSession(combinedNonce, publicKeys, message, options) {
  const keys2 = options?.sortKeys ? sortKeys([...publicKeys]) : publicKeys;
  let tweakBytes;
  if (options?.taprootTweak !== void 0) {
    const { preTweakedKey } = aggregateKeys(keys2, false);
    tweakBytes = schnorr.utils.taggedHash(
      "TapTweak",
      preTweakedKey.subarray(1),
      options.taprootTweak
    );
  }
  return new Session(
    combinedNonce,
    keys2,
    message,
    tweakBytes ? [tweakBytes] : void 0,
    tweakBytes ? [true] : void 0
  );
}
function sign(secNonce, privateKey, combinedNonce, publicKeys, message, options) {
  const session = createSession(combinedNonce, publicKeys, message, options);
  const partialSig = session.sign(secNonce, privateKey);
  return PartialSig.decode(partialSig);
}

// packages/ts-sdk/src/tree/signingSession.ts
var ErrMissingVtxoGraph = new Error("missing vtxo graph");
var ErrMissingAggregateKey = new Error("missing aggregate key");
var TreeSignerSession = class _TreeSignerSession {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }
  secretKey;
  static NOT_INITIALIZED = new Error("session not initialized, call init method");
  myNonces = null;
  aggregateNonces = null;
  graph = null;
  scriptRoot = null;
  rootSharedOutputAmount = null;
  static random() {
    const secretKey = randomPrivateKeyBytes();
    return new _TreeSignerSession(secretKey);
  }
  async init(tree, scriptRoot, rootInputAmount) {
    this.graph = tree;
    this.scriptRoot = scriptRoot;
    this.rootSharedOutputAmount = rootInputAmount;
  }
  async getPublicKey() {
    return secp256k1.getPublicKey(this.secretKey);
  }
  async getNonces() {
    if (!this.graph) throw ErrMissingVtxoGraph;
    if (!this.myNonces) {
      this.myNonces = this.generateNonces();
    }
    const publicNonces = /* @__PURE__ */ new Map();
    for (const [txid, nonces] of this.myNonces) {
      publicNonces.set(txid, { pubNonce: nonces.pubNonce });
    }
    return publicNonces;
  }
  async aggregatedNonces(txid, noncesByPubkey) {
    if (!this.graph) throw ErrMissingVtxoGraph;
    if (!this.aggregateNonces) {
      this.aggregateNonces = /* @__PURE__ */ new Map();
    }
    if (!this.myNonces) {
      await this.getNonces();
    }
    if (this.aggregateNonces.has(txid)) {
      return {
        hasAllNonces: this.aggregateNonces.size === this.myNonces?.size
      };
    }
    const myNonce = this.myNonces.get(txid);
    if (!myNonce) throw new Error(`missing nonce for txid ${txid}`);
    const myPublicKey = await this.getPublicKey();
    noncesByPubkey.set(hex.encode(myPublicKey.subarray(1)), myNonce);
    const tx = this.graph.find(txid);
    if (!tx) throw new Error(`missing tx for txid ${txid}`);
    const cosigners = getArkPsbtFields(tx.root, 0, CosignerPublicKey).map(
      (c) => hex.encode(c.key.subarray(1))
      // xonly pubkey
    );
    const pubNonces = [];
    for (const cosigner of cosigners) {
      const nonce = noncesByPubkey.get(cosigner);
      if (!nonce) {
        throw new Error(`missing nonce for cosigner ${cosigner}`);
      }
      pubNonces.push(nonce.pubNonce);
    }
    const aggregateNonce = aggregateNonces(pubNonces);
    this.aggregateNonces.set(txid, { pubNonce: aggregateNonce });
    return {
      hasAllNonces: this.aggregateNonces.size === this.myNonces?.size
    };
  }
  async sign() {
    if (!this.graph) throw ErrMissingVtxoGraph;
    if (!this.aggregateNonces) throw new Error("nonces not set");
    if (!this.myNonces) throw new Error("nonces not generated");
    const sigs = /* @__PURE__ */ new Map();
    for (const g of this.graph.iterator()) {
      const sig = this.signPartial(g);
      sigs.set(g.txid, sig);
    }
    return sigs;
  }
  generateNonces() {
    if (!this.graph) throw ErrMissingVtxoGraph;
    const myNonces = /* @__PURE__ */ new Map();
    const publicKey = secp256k1.getPublicKey(this.secretKey);
    for (const g of this.graph.iterator()) {
      const nonces = generateNonces(publicKey);
      myNonces.set(g.txid, nonces);
    }
    return myNonces;
  }
  signPartial(g) {
    if (!this.graph || !this.scriptRoot || !this.rootSharedOutputAmount) {
      throw _TreeSignerSession.NOT_INITIALIZED;
    }
    if (!this.myNonces || !this.aggregateNonces) {
      throw new Error("session not properly initialized");
    }
    const myNonce = this.myNonces.get(g.txid);
    if (!myNonce) throw new Error("missing private nonce");
    const aggNonce = this.aggregateNonces.get(g.txid);
    if (!aggNonce) throw new Error("missing aggregate nonce");
    const prevoutAmounts = [];
    const prevoutScripts = [];
    const cosigners = getArkPsbtFields(g.root, 0, CosignerPublicKey).map((c) => c.key);
    const { finalKey } = aggregateKeys(cosigners, true, {
      taprootTweak: this.scriptRoot
    });
    for (let inputIndex = 0; inputIndex < g.root.inputsLength; inputIndex++) {
      const prevout = getPrevOutput(
        finalKey,
        this.graph,
        this.rootSharedOutputAmount,
        g.root
      );
      prevoutAmounts.push(prevout.amount);
      prevoutScripts.push(prevout.script);
    }
    const message = g.root.preimageWitnessV1(
      0,
      // always first input
      prevoutScripts,
      SigHash.DEFAULT,
      prevoutAmounts
    );
    return sign(
      myNonce.secNonce,
      this.secretKey,
      aggNonce.pubNonce,
      cosigners,
      message,
      {
        taprootTweak: this.scriptRoot,
        sortKeys: true
      }
    );
  }
};
function getPrevOutput(finalKey, graph, sharedOutputAmount, tx) {
  const pkScript = Script.encode(["OP_1", finalKey.slice(1)]);
  if (tx.id === graph.txid) {
    return {
      amount: sharedOutputAmount,
      script: pkScript
    };
  }
  const parentInput = tx.getInput(0);
  if (!parentInput.txid) throw new Error("missing parent input txid");
  const parentTxid = hex.encode(parentInput.txid);
  const parent = graph.find(parentTxid);
  if (!parent) throw new Error("parent  tx not found");
  if (parentInput.index === void 0) throw new Error("missing input index");
  const parentOutput = parent.root.getOutput(parentInput.index);
  if (!parentOutput) throw new Error("parent output not found");
  if (!parentOutput.amount) throw new Error("parent output amount not found");
  return {
    amount: parentOutput.amount,
    script: pkScript
  };
}

// packages/ts-sdk/src/identity/singleKey.ts
var ALLOWED_SIGHASH = [SigHash.DEFAULT, SigHash.ALL, SigHash.ALL_ANYONECANPAY];
var SingleKey = class _SingleKey {
  key;
  constructor(key) {
    this.key = key || randomPrivateKeyBytes();
  }
  /** Create a signing identity from raw private key bytes. */
  static fromPrivateKey(privateKey) {
    return new _SingleKey(privateKey);
  }
  /** Create a signing identity from a hex-encoded private key. */
  static fromHex(privateKeyHex) {
    return new _SingleKey(hex.decode(privateKeyHex));
  }
  /** Create a signing identity with a freshly generated random private key. */
  static fromRandomBytes() {
    return new _SingleKey(randomPrivateKeyBytes());
  }
  /**
   * Export the private key as a hex string.
   *
   * @returns The private key as a hex string
   */
  toHex() {
    return hex.encode(this.key);
  }
  async sign(tx, inputIndexes) {
    const txCpy = tx.clone();
    if (!inputIndexes) {
      assertAllowedSighashTypes(txCpy, ALLOWED_SIGHASH);
      try {
        if (!txCpy.sign(this.key, ALLOWED_SIGHASH)) {
          throw new Error("Failed to sign transaction");
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("No inputs signed")) {
        } else {
          throw e;
        }
      }
      return txCpy;
    }
    for (const inputIndex of inputIndexes) {
      if (!txCpy.signIdx(this.key, inputIndex, ALLOWED_SIGHASH)) {
        throw new Error(`Failed to sign input #${inputIndex}`);
      }
    }
    return txCpy;
  }
  compressedPublicKey() {
    return Promise.resolve(pubECDSA(this.key, true));
  }
  xOnlyPublicKey() {
    return Promise.resolve(pubSchnorr(this.key));
  }
  signerSession() {
    return TreeSignerSession.random();
  }
  async signMessage(message, signatureType = "schnorr") {
    if (signatureType === "ecdsa") return signAsync(message, this.key, { prehash: false });
    return schnorr2.signAsync(message, this.key);
  }
  /**
   * BIP-340 sign `messageHash` with aux_rand = 0, so the signature — and
   * anything derived from it — is reproducible from the key alone.
   *
   * What lets a static wallet derive a swap preimage instead of storing one
   * (see `wallet/contractSecrets.ts`). Deliberately NOT `signMessage`, whose
   * schnorr branch draws a random aux_rand: a preimage derived from that is
   * unrecoverable, and the loss would only surface at claim time.
   */
  async signSchnorrDeterministic(messageHash) {
    return schnorr2.signAsync(messageHash, this.key, new Uint8Array(32));
  }
  async toReadonly() {
    return new ReadonlySingleKey(await this.compressedPublicKey());
  }
};
var ReadonlySingleKey = class _ReadonlySingleKey {
  /** Create a readonly identity from a compressed public key. */
  constructor(publicKey) {
    this.publicKey = publicKey;
    if (publicKey.length !== 33) {
      throw new Error("Invalid public key length");
    }
  }
  publicKey;
  /**
   * Create a ReadonlySingleKey from a compressed public key.
   *
   * @param publicKey - 33-byte compressed public key (02/03 prefix + 32-byte x coordinate)
   * @returns A new ReadonlySingleKey instance
   * @example
   * ```typescript
   * const pubkey = new Uint8Array(33); // your compressed public key
   * const readonlyKey = ReadonlySingleKey.fromPublicKey(pubkey);
   * ```
   */
  static fromPublicKey(publicKey) {
    return new _ReadonlySingleKey(publicKey);
  }
  xOnlyPublicKey() {
    return Promise.resolve(this.publicKey.slice(1));
  }
  compressedPublicKey() {
    return Promise.resolve(this.publicKey);
  }
};

// packages/ts-sdk/src/providers/emulator.ts
var RestEmulatorProvider = class {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
  }
  serverUrl;
  async getInfo() {
    const url = `${this.serverUrl}/v1/info`;
    const response = await baseFetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get emulator info: ${errorText}`);
    }
    const data = await response.json();
    const signerPubkey = data.signerPubkey;
    if (typeof signerPubkey !== "string" || !signerPubkey) {
      throw new Error("Invalid emulator info response: missing signerPubkey");
    }
    return { signerPubkey };
  }
  async submitTx(arkTx, checkpointTxs) {
    const url = `${this.serverUrl}/v1/tx`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arkTx,
        checkpointTxs
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit tx to emulator: ${errorText}`);
    }
    const data = await response.json();
    if (typeof data.signedArkTx !== "string" || !data.signedArkTx) {
      throw new Error("Invalid emulator submitTx response: missing signedArkTx");
    }
    if (!Array.isArray(data.signedCheckpointTxs) || !data.signedCheckpointTxs.every((item) => typeof item === "string")) {
      throw new Error(
        "Invalid emulator submitTx response: signedCheckpointTxs must be an array of strings"
      );
    }
    return {
      signedArkTx: data.signedArkTx,
      signedCheckpointTxs: data.signedCheckpointTxs
    };
  }
  async submitIntent(intent) {
    const url = `${this.serverUrl}/v1/intent`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: {
          proof: intent.proof,
          message: JSON.stringify(intent.message)
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit intent to emulator: ${errorText}`);
    }
    const data = await response.json();
    if (typeof data.signedProof !== "string" || !data.signedProof) {
      throw new Error("Invalid emulator submitIntent response: missing signedProof");
    }
    return data.signedProof;
  }
  async submitFinalization(intent, forfeits, connectorTree, commitmentTx) {
    const url = `${this.serverUrl}/v1/finalization`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Uses "signedIntent" (not "intent") because the proof was already
      // co-signed by the emulator via submitIntent in a prior step.
      body: JSON.stringify({
        signedIntent: {
          proof: intent.proof,
          message: JSON.stringify(intent.message)
        },
        forfeits,
        connectorTree,
        commitmentTx
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit finalization to emulator: ${errorText}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.signedForfeits) || !data.signedForfeits.every((item) => typeof item === "string")) {
      throw new Error(
        "Invalid emulator submitFinalization response: signedForfeits must be an array of strings"
      );
    }
    if ("signedCommitmentTx" in data && typeof data.signedCommitmentTx !== "string") {
      throw new Error(
        "Invalid emulator submitFinalization response: invalid signedCommitmentTx"
      );
    }
    return {
      signedForfeits: data.signedForfeits,
      signedCommitmentTx: data.signedCommitmentTx
    };
  }
  async submitOnchainTx(tx) {
    const url = `${this.serverUrl}/v1/onchain-tx`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit onchain tx to emulator: ${errorText}`);
    }
    const data = await response.json();
    if (typeof data.signedTx !== "string" || !data.signedTx) {
      throw new Error("Invalid emulator submitOnchainTx response: missing signedTx");
    }
    return { signedTx: data.signedTx };
  }
};

// packages/ts-sdk/src/providers/indexer.ts
var INDEXER_MAX_ATTEMPTS = 3;
var INDEXER_RETRY_BASE_MS = 250;
async function indexerFetch(input, init) {
  const method = (init?.method ?? "GET").toUpperCase();
  const maxAttempts = method === "GET" || method === "HEAD" ? INDEXER_MAX_ATTEMPTS : 1;
  for (let attempt = 1; ; attempt++) {
    const lastAttempt = attempt >= maxAttempts;
    let res;
    try {
      res = await rateGate.runHttp(input, () => baseFetch(input, init));
    } catch (err2) {
      const mapped = toProviderUnavailable(err2, "indexer");
      if (lastAttempt || !(mapped instanceof ProviderUnavailableError)) throw mapped;
      await sleep2(retryDelayMs(attempt));
      continue;
    }
    if (res.ok) return res;
    let body;
    try {
      body = await res.clone().text();
    } catch {
      body = void 0;
    }
    try {
      throwIfHttpUnavailable(res, "indexer", body);
    } catch (err2) {
      if (lastAttempt) throw err2;
      await sleep2(retryDelayMs(attempt));
      continue;
    }
    return res;
  }
}
function retryDelayMs(attempt) {
  return INDEXER_RETRY_BASE_MS * 2 ** (attempt - 1);
}
var sleep2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var DEFAULT_VTXO_PAGE_SIZE = 500;
var IndexerTxType = /* @__PURE__ */ ((IndexerTxType2) => {
  IndexerTxType2[IndexerTxType2["INDEXER_TX_TYPE_UNSPECIFIED"] = 0] = "INDEXER_TX_TYPE_UNSPECIFIED";
  IndexerTxType2[IndexerTxType2["INDEXER_TX_TYPE_RECEIVED"] = 1] = "INDEXER_TX_TYPE_RECEIVED";
  IndexerTxType2[IndexerTxType2["INDEXER_TX_TYPE_SENT"] = 2] = "INDEXER_TX_TYPE_SENT";
  return IndexerTxType2;
})(IndexerTxType || {});
var ChainTxType = /* @__PURE__ */ ((ChainTxType2) => {
  ChainTxType2["UNSPECIFIED"] = "INDEXER_CHAINED_TX_TYPE_UNSPECIFIED";
  ChainTxType2["COMMITMENT"] = "INDEXER_CHAINED_TX_TYPE_COMMITMENT";
  ChainTxType2["ARK"] = "INDEXER_CHAINED_TX_TYPE_ARK";
  ChainTxType2["TREE"] = "INDEXER_CHAINED_TX_TYPE_TREE";
  ChainTxType2["CHECKPOINT"] = "INDEXER_CHAINED_TX_TYPE_CHECKPOINT";
  return ChainTxType2;
})(ChainTxType || {});
var RestIndexerProvider = class {
  constructor(serverUrl = DEFAULT_ARKADE_SERVER_URL, options = {}) {
    this.serverUrl = serverUrl;
    this.eventSource = options.eventSource;
  }
  serverUrl;
  /** Overrides {@link configureEventSource} for this provider's subscription. */
  eventSource;
  /** @see fetchVtxosJson */
  inFlightVtxoReads = /* @__PURE__ */ new Map();
  async getVtxoTree(batchOutpoint, opts) {
    let url = `${this.serverUrl}/v1/indexer/batch/${batchOutpoint.txid}/${batchOutpoint.vout}/tree`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch vtxo tree: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isVtxoTreeResponse(data)) {
      throw new Error("Invalid vtxo tree data received");
    }
    data.vtxoTree.forEach((tx) => {
      tx.children = Object.fromEntries(
        Object.entries(tx.children).map(([key, value]) => [Number(key), value])
      );
    });
    return data;
  }
  async getVtxoTreeLeaves(batchOutpoint, opts) {
    let url = `${this.serverUrl}/v1/indexer/batch/${batchOutpoint.txid}/${batchOutpoint.vout}/tree/leaves`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch vtxo tree leaves: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isVtxoTreeLeavesResponse(data)) {
      throw new Error("Invalid vtxos tree leaves data received");
    }
    return data;
  }
  async getBatchSweepTransactions(batchOutpoint) {
    const url = `${this.serverUrl}/v1/indexer/batch/${batchOutpoint.txid}/${batchOutpoint.vout}/sweepTxs`;
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch batch sweep transactions: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isBatchSweepTransactionsResponse(data)) {
      throw new Error("Invalid batch sweep transactions data received");
    }
    return data;
  }
  async getCommitmentTx(txid) {
    const url = `${this.serverUrl}/v1/indexer/commitmentTx/${txid}`;
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch commitment tx: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isCommitmentTx(data)) {
      throw new Error("Invalid commitment tx data received");
    }
    return data;
  }
  async getCommitmentTxConnectors(txid, opts) {
    let url = `${this.serverUrl}/v1/indexer/commitmentTx/${txid}/connectors`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch commitment tx connectors: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isConnectorsResponse(data)) {
      throw new Error("Invalid commitment tx connectors data received");
    }
    data.connectors.forEach((tx) => {
      tx.children = Object.fromEntries(
        Object.entries(tx.children).map(([key, value]) => [Number(key), value])
      );
    });
    return data;
  }
  async getCommitmentTxForfeitTxs(txid, opts) {
    let url = `${this.serverUrl}/v1/indexer/commitmentTx/${txid}/forfeitTxs`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch commitment tx forfeitTxs: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isForfeitTxsResponse(data)) {
      throw new Error("Invalid commitment tx forfeitTxs data received");
    }
    return data;
  }
  getSubscription(subscriptionId, abortSignal) {
    const url = `${this.serverUrl}/v1/indexer/script/subscription/${subscriptionId}`;
    const override = this.eventSource;
    let iterator = null;
    const closeIterator = () => iterator?.close();
    const gen = (async function* () {
      const abortHandler = closeIterator;
      abortSignal?.addEventListener("abort", abortHandler);
      try {
        while (!abortSignal?.aborted) {
          try {
            const currentIterator = eventSourceIterator(
              resolveEventSource(override)(url)
            );
            iterator = currentIterator;
            for await (const event of currentIterator) {
              if (abortSignal?.aborted) break;
              try {
                const data = JSON.parse(event.data);
                if (data.event) {
                  yield {
                    txid: data.event.txid,
                    scripts: data.event.scripts || [],
                    newVtxos: (data.event.newVtxos || []).map(convertVtxo),
                    spentVtxos: (data.event.spentVtxos || []).map(convertVtxo),
                    sweptVtxos: (data.event.sweptVtxos || []).map(convertVtxo),
                    tx: data.event.tx,
                    checkpointTxs: data.event.checkpointTxs
                  };
                }
              } catch (err2) {
                console.error("Failed to parse subscription event:", err2);
                throw err2;
              }
            }
          } catch (error) {
            if (abortSignal?.aborted || error instanceof Error && error.name === "AbortError") {
              break;
            }
            if (isFetchTimeoutError(error)) {
              console.debug("Timeout error ignored");
              continue;
            }
            if (isEventSourceError(error)) {
              throw error;
            }
            if (isEventSourceUnavailableError(error)) throw error;
            console.error("Subscription error:", error);
            throw error;
          } finally {
            closeIterator();
            iterator = null;
          }
        }
      } finally {
        abortSignal?.removeEventListener("abort", abortHandler);
        closeIterator();
      }
    })();
    const origReturn = gen.return.bind(gen);
    gen.return = (value) => {
      closeIterator();
      return origReturn(value);
    };
    return gen;
  }
  async getVirtualTxs(txids, opts) {
    let url = `${this.serverUrl}/v1/indexer/virtualTx/${txids.join(",")}`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch virtual txs: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isVirtualTxsResponse(data)) {
      throw new Error("Invalid virtual txs data received");
    }
    return data;
  }
  async getVtxoChain(vtxoOutpoint, opts) {
    let url = `${this.serverUrl}/v1/indexer/vtxo/${vtxoOutpoint.txid}/${vtxoOutpoint.vout}/chain`;
    const params = new URLSearchParams();
    if (opts) {
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch vtxo chain: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isVtxoChainResponse(data)) {
      throw new Error("Invalid vtxo chain data received");
    }
    return data;
  }
  async getVtxos(opts) {
    const hasScripts = (opts?.scripts?.length ?? 0) > 0;
    const hasOutpoints = (opts?.outpoints?.length ?? 0) > 0;
    if (hasScripts && hasOutpoints) {
      throw new Error("scripts and outpoints are mutually exclusive options");
    }
    if (!hasScripts && !hasOutpoints) {
      throw new Error("Either scripts or outpoints must be provided");
    }
    const filterCount = [
      opts?.spendableOnly,
      opts?.spentOnly,
      opts?.recoverableOnly,
      opts?.pendingOnly,
      opts?.renewableOnly
    ].filter(Boolean).length;
    if (filterCount > 1) {
      throw new Error(
        "spendableOnly, spentOnly, recoverableOnly, pendingOnly, and renewableOnly are mutually exclusive options"
      );
    }
    if (opts?.after !== void 0 && opts?.before !== void 0 && opts.after !== 0 && opts.before !== 0 && opts.before <= opts.after) {
      throw new Error("before must be greater than after");
    }
    if (opts?.pageIndex === void 0 && opts?.pageSize === void 0) {
      const all = [];
      let pageIndex = 0;
      for (; ; ) {
        const { vtxos, page } = await this.fetchVtxosPage({
          ...opts,
          pageIndex,
          pageSize: DEFAULT_VTXO_PAGE_SIZE
        });
        all.push(...vtxos);
        if (!page || page.current >= page.total || vtxos.length < DEFAULT_VTXO_PAGE_SIZE) {
          break;
        }
        pageIndex = page.next;
      }
      return { vtxos: all };
    }
    return this.fetchVtxosPage(opts);
  }
  /**
   * Fetch a single page of vtxos. Callers paging to exhaustion get no
   * deliberate inter-page backoff here: `indexerFetch` already enforces
   * politeness through the rate gate, so don't add a redundant sleep.
   */
  async fetchVtxosPage(opts) {
    let url = `${this.serverUrl}/v1/indexer/vtxos`;
    const params = new URLSearchParams();
    if (opts?.scripts?.length) {
      opts.scripts.forEach((script) => {
        params.append("scripts", script);
      });
    }
    if (opts?.outpoints?.length) {
      opts.outpoints.forEach((outpoint) => {
        params.append("outpoints", `${outpoint.txid}:${outpoint.vout}`);
      });
    }
    if (opts) {
      if (opts.spendableOnly !== void 0)
        params.append("spendableOnly", opts.spendableOnly.toString());
      if (opts.spentOnly !== void 0) params.append("spentOnly", opts.spentOnly.toString());
      if (opts.recoverableOnly !== void 0)
        params.append("recoverableOnly", opts.recoverableOnly.toString());
      if (opts.pendingOnly !== void 0)
        params.append("pendingOnly", opts.pendingOnly.toString());
      if (opts.renewableOnly !== void 0)
        params.append("renewableOnly", opts.renewableOnly.toString());
      if (opts.after !== void 0) params.append("after", opts.after.toString());
      if (opts.before !== void 0) params.append("before", opts.before.toString());
      if (opts.pageIndex !== void 0)
        params.append("page.index", opts.pageIndex.toString());
      if (opts.pageSize !== void 0) params.append("page.size", opts.pageSize.toString());
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    const data = await this.fetchVtxosJson(url);
    return {
      vtxos: data.vtxos.map(convertVtxo),
      page: data.page
    };
  }
  /**
   * The wire read behind {@link fetchVtxosPage}, with an identical read
   * already in flight served from that one request instead of repeated.
   *
   * Two callers can want the same page at the same instant without either
   * being redundant, so there is no single call site to remove: a send that
   * leaves change makes the indexer emit `vtxo_spent` and `vtxo_received` for
   * the wallet's own contract milliseconds apart, and `handleContractEvent`
   * delta-syncs that contract on both arms.
   */
  async fetchVtxosJson(url) {
    const joined = this.inFlightVtxoReads.get(url);
    if (joined) return joined;
    const shared = (async () => {
      const res = await indexerFetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch vtxos: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Response.isVtxosResponse(data)) {
        throw new Error("Invalid vtxos data received");
      }
      return data;
    })();
    this.inFlightVtxoReads.set(url, shared);
    try {
      return await shared;
    } finally {
      if (this.inFlightVtxoReads.get(url) === shared) this.inFlightVtxoReads.delete(url);
    }
  }
  async getAssetDetails(assetId) {
    const url = `${this.serverUrl}/v1/indexer/asset/${encodeURIComponent(assetId)}`;
    const res = await indexerFetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch asset details: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Response.isGetAssetResponse(data)) {
      throw new Error("Invalid get asset response");
    }
    const metadata = data.metadata?.length ? parseAssetMetadata(data.metadata) : void 0;
    return {
      assetId: data.assetId ?? assetId,
      supply: BigInt(data.supply ?? 0),
      metadata,
      controlAssetId: data.controlAsset || void 0
    };
  }
  async subscribeForScripts(scripts, subscriptionId) {
    const url = `${this.serverUrl}/v1/indexer/script/subscribe`;
    const res = await indexerFetch(url, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ scripts, subscriptionId })
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to subscribe to scripts: ${errorText}`);
    }
    const data = await res.json();
    if (!data.subscriptionId) throw new Error(`Subscription ID not found`);
    return data.subscriptionId;
  }
  async unsubscribeForScripts(subscriptionId, scripts) {
    const url = `${this.serverUrl}/v1/indexer/script/unsubscribe`;
    const res = await indexerFetch(url, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({ subscriptionId, scripts })
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Failed to unsubscribe to scripts: ${errorText}`);
    }
  }
};
function parseAssetMetadata(metadata) {
  const metadataList = MetadataList.fromString(metadata);
  const out = {};
  const decoder = new TextDecoder();
  for (const { key, value } of metadataList.items) {
    const keyString = decoder.decode(key);
    switch (keyString) {
      case "decimals":
        const n = Number(decoder.decode(value));
        out[keyString] = Number.isFinite(n) ? n : hex.encode(value);
        break;
      case "name":
      case "ticker":
      case "icon":
        out[keyString] = decoder.decode(value);
        break;
      default:
        out[keyString] = hex.encode(value);
        break;
    }
  }
  return out;
}
var Response;
((Response2) => {
  function isBatchInfo(data) {
    return typeof data === "object" && typeof data.totalOutputAmount === "string" && typeof data.totalOutputVtxos === "number" && typeof data.expiresAt === "string" && typeof data.swept === "boolean";
  }
  function isChain(data) {
    return typeof data === "object" && typeof data.txid === "string" && typeof data.expiresAt === "string" && Object.values(ChainTxType).includes(data.type) && Array.isArray(data.spends) && data.spends.every((spend) => typeof spend === "string");
  }
  function isCommitmentTx(data) {
    return typeof data === "object" && typeof data.startedAt === "string" && typeof data.endedAt === "string" && typeof data.totalInputAmount === "string" && typeof data.totalInputVtxos === "number" && typeof data.totalOutputAmount === "string" && typeof data.totalOutputVtxos === "number" && typeof data.batches === "object" && Object.values(data.batches).every(isBatchInfo);
  }
  Response2.isCommitmentTx = isCommitmentTx;
  function isOutpoint(data) {
    return typeof data === "object" && typeof data.txid === "string" && typeof data.vout === "number";
  }
  Response2.isOutpoint = isOutpoint;
  function isOutpointArray(data) {
    return Array.isArray(data) && data.every(isOutpoint);
  }
  Response2.isOutpointArray = isOutpointArray;
  function isTx(data) {
    return typeof data === "object" && typeof data.txid === "string" && typeof data.children === "object" && Object.values(data.children).every(isTxid) && Object.keys(data.children).every((k) => Number.isInteger(Number(k)));
  }
  function isTxsArray(data) {
    return Array.isArray(data) && data.every(isTx);
  }
  Response2.isTxsArray = isTxsArray;
  function isTxHistoryRecord(data) {
    return typeof data === "object" && typeof data.amount === "string" && typeof data.createdAt === "string" && typeof data.isSettled === "boolean" && typeof data.settledBy === "string" && Object.values(IndexerTxType).includes(data.type) && (!data.commitmentTxid && typeof data.virtualTxid === "string" || typeof data.commitmentTxid === "string" && !data.virtualTxid);
  }
  function isTxHistoryRecordArray(data) {
    return Array.isArray(data) && data.every(isTxHistoryRecord);
  }
  Response2.isTxHistoryRecordArray = isTxHistoryRecordArray;
  function isTxid(data) {
    return typeof data === "string" && data.length === 64;
  }
  function isTxidArray(data) {
    return Array.isArray(data) && data.every(isTxid);
  }
  Response2.isTxidArray = isTxidArray;
  function isVtxoAsset(data) {
    return typeof data === "object" && data !== null && typeof data.assetId === "string" && typeof data.amount === "string";
  }
  function isVtxo(data) {
    return typeof data === "object" && isOutpoint(data.outpoint) && typeof data.createdAt === "string" && (data.expiresAt === null || typeof data.expiresAt === "string") && typeof data.amount === "string" && typeof data.script === "string" && typeof data.isPreconfirmed === "boolean" && typeof data.isSwept === "boolean" && typeof data.isUnrolled === "boolean" && typeof data.isSpent === "boolean" && (!data.spentBy || typeof data.spentBy === "string") && (!data.settledBy || typeof data.settledBy === "string") && (!data.arkTxid || typeof data.arkTxid === "string") && Array.isArray(data.commitmentTxids) && data.commitmentTxids.every(isTxid) && (data.assets === void 0 || Array.isArray(data.assets) && data.assets.every(isVtxoAsset));
  }
  function isPageResponse(data) {
    return typeof data === "object" && typeof data.current === "number" && typeof data.next === "number" && typeof data.total === "number";
  }
  function isVtxoTreeResponse(data) {
    return typeof data === "object" && Array.isArray(data.vtxoTree) && data.vtxoTree.every(isTx) && (!data.page || isPageResponse(data.page));
  }
  Response2.isVtxoTreeResponse = isVtxoTreeResponse;
  function isVtxoTreeLeavesResponse(data) {
    return typeof data === "object" && Array.isArray(data.leaves) && data.leaves.every(isOutpoint) && (!data.page || isPageResponse(data.page));
  }
  Response2.isVtxoTreeLeavesResponse = isVtxoTreeLeavesResponse;
  function isConnectorsResponse(data) {
    return typeof data === "object" && Array.isArray(data.connectors) && data.connectors.every(isTx) && (!data.page || isPageResponse(data.page));
  }
  Response2.isConnectorsResponse = isConnectorsResponse;
  function isForfeitTxsResponse(data) {
    return typeof data === "object" && Array.isArray(data.txids) && data.txids.every(isTxid) && (!data.page || isPageResponse(data.page));
  }
  Response2.isForfeitTxsResponse = isForfeitTxsResponse;
  function isSweptCommitmentTxResponse(data) {
    return typeof data === "object" && Array.isArray(data.sweptBy) && data.sweptBy.every(isTxid);
  }
  Response2.isSweptCommitmentTxResponse = isSweptCommitmentTxResponse;
  function isBatchSweepTransactionsResponse(data) {
    return typeof data === "object" && Array.isArray(data.sweptBy) && data.sweptBy.every(isTxid);
  }
  Response2.isBatchSweepTransactionsResponse = isBatchSweepTransactionsResponse;
  function isVirtualTxsResponse(data) {
    return typeof data === "object" && Array.isArray(data.txs) && data.txs.every((tx) => typeof tx === "string") && (!data.page || isPageResponse(data.page));
  }
  Response2.isVirtualTxsResponse = isVirtualTxsResponse;
  function isVtxoChainResponse(data) {
    return typeof data === "object" && Array.isArray(data.chain) && data.chain.every(isChain) && (!data.page || isPageResponse(data.page));
  }
  Response2.isVtxoChainResponse = isVtxoChainResponse;
  function isVtxosResponse(data) {
    return typeof data === "object" && Array.isArray(data.vtxos) && data.vtxos.every(isVtxo) && (!data.page || isPageResponse(data.page));
  }
  Response2.isVtxosResponse = isVtxosResponse;
  function isGetAssetResponse(data) {
    return typeof data === "object" && data !== null && typeof data.assetId === "string" && typeof data.supply === "string" && (data.controlAsset === void 0 || typeof data.controlAsset === "string") && (data.metadata === void 0 || typeof data.metadata === "string");
  }
  Response2.isGetAssetResponse = isGetAssetResponse;
})(Response || (Response = {}));

// examples/escrow/escrow.program.json
var escrow_program_default = {
  version: 0,
  name: "Escrow",
  params: [
    {
      name: "partyAPk",
      type: "pubkey"
    },
    {
      name: "partyBPk",
      type: "pubkey"
    },
    {
      name: "oraclePk",
      type: "pubkey"
    },
    {
      name: "oracleMessageHash",
      type: "hash"
    },
    {
      name: "partyAScript",
      type: "hash"
    },
    {
      name: "partyBScript",
      type: "hash"
    },
    {
      name: "amount",
      type: "int"
    },
    {
      name: "timeoutAt",
      type: "int"
    },
    {
      name: "exit",
      type: "int"
    },
    {
      name: "server",
      type: "pubkey"
    }
  ],
  functions: {
    complete: {
      inputs: [
        {
          name: "oracleMsg",
          type: "hash"
        },
        {
          name: "oracleSig",
          type: "sig"
        }
      ],
      tapscript: {
        signers: ["$server"],
        emulator: "complete"
      },
      arkadeScript: {
        asm: [
          "$amount",
          "$partyBScript",
          "$partyAScript",
          "$oracleMessageHash",
          "$oraclePk",
          "INSPECTNUMINPUTS",
          1,
          "EQUAL",
          "VERIFY",
          "OP_5",
          "PICK",
          "SHA256",
          "OP_2",
          "ROLL",
          "EQUAL",
          "VERIFY",
          "OP_5",
          "ROLL",
          "OP_5",
          "ROLL",
          "OP_2",
          "ROLL",
          "CHECKSIGFROMSTACK",
          "VERIFY",
          "PUSHCURRENTINPUTINDEX",
          "INSPECTINPUTVALUE",
          "OP_0",
          "PICK",
          "OP_4",
          "PICK",
          "GREATERTHANOREQUAL",
          "VERIFY",
          "OP_0",
          "ROLL",
          "OP_3",
          "PICK",
          "SUB",
          0,
          "INSPECTOUTPUTVALUE",
          "OP_4",
          "ROLL",
          "GREATERTHANOREQUAL",
          "VERIFY",
          0,
          "INSPECTOUTPUTSCRIPTPUBKEY",
          "DROP",
          "OP_3",
          "ROLL",
          "EQUAL",
          "VERIFY",
          "OP_0",
          "PICK",
          330,
          "GREATERTHAN",
          "IF",
          1,
          "INSPECTOUTPUTVALUE",
          "OP_1",
          "PICK",
          "GREATERTHANOREQUAL",
          "VERIFY",
          1,
          "INSPECTOUTPUTSCRIPTPUBKEY",
          "DROP",
          "OP_2",
          "PICK",
          "EQUAL",
          "VERIFY",
          "ENDIF",
          "OP_1",
          "NIP",
          "NIP"
        ],
        witness: ["oracleSig", "oracleMsg"]
      }
    },
    cancel: {
      tapscript: {
        signers: ["$server"],
        emulator: "cancel"
      },
      arkadeScript: {
        asm: [
          "$timeoutAt",
          "$partyAScript",
          "INSPECTNUMINPUTS",
          1,
          "EQUAL",
          "VERIFY",
          "OP_1",
          "ROLL",
          "CHECKTIME",
          "VERIFY",
          0,
          "INSPECTOUTPUTVALUE",
          "PUSHCURRENTINPUTINDEX",
          "INSPECTINPUTVALUE",
          "GREATERTHANOREQUAL",
          "VERIFY",
          0,
          "INSPECTOUTPUTSCRIPTPUBKEY",
          "DROP",
          "OP_1",
          "ROLL",
          "EQUAL",
          "VERIFY",
          "OP_1"
        ],
        witness: []
      }
    },
    unilateral: {
      tapscript: {
        signers: ["$partyAPk", "$partyBPk"],
        csv: {
          type: "seconds",
          value: "$exit"
        }
      }
    }
  }
};

// examples/escrow/src/outputs.ts
var DUST = 330n;
function completeOutputs(coinValue, amount, sellerScript, buyerScript) {
  if (coinValue < amount) {
    throw new Error(`this coin has ${coinValue} sats; complete pays ${amount}`);
  }
  const surplus = coinValue - amount;
  if (surplus > DUST) {
    return [
      { script: sellerScript, amount },
      { script: buyerScript, amount: surplus }
    ];
  }
  return [{ script: sellerScript, amount: coinValue }];
}
function cancelOutputs(coinValue, buyerScript) {
  return [{ script: buyerScript, amount: coinValue }];
}
function unilateralOutputs(coinValue, sellerScript) {
  return [{ script: sellerScript, amount: coinValue }];
}

// examples/escrow/src/spend.ts
var program = escrow_program_default;
var RELEASE_LABEL = "release-to-seller";
var DEMO_NETWORKS = [
  {
    name: "mutinynet",
    label: "Mutinynet",
    network: networks.mutinynet,
    arkUrl: "https://mutinynet.arkade.sh",
    emulatorUrl: "https://emulator.mutinynet.arkade.sh",
    walletUrl: "https://mutinynet.arkade.money"
  },
  {
    name: "bitcoin",
    label: "Bitcoin",
    network: networks.bitcoin,
    arkUrl: "https://arkade.computer",
    emulatorUrl: "https://emulator.arkade.computer",
    walletUrl: "https://bitcoin.arkade.money"
  }
];
var KEY_STORAGE = "arkade-escrow-demo-keys";
function loadKeys() {
  const saved = localStorage.getItem(KEY_STORAGE);
  if (saved) {
    const parsed = JSON.parse(saved);
    return {
      buyer: SingleKey.fromHex(parsed.buyer),
      seller: SingleKey.fromHex(parsed.seller),
      oracle: SingleKey.fromHex(parsed.oracle)
    };
  }
  const keys2 = {
    buyer: SingleKey.fromRandomBytes(),
    seller: SingleKey.fromRandomBytes(),
    oracle: SingleKey.fromRandomBytes()
  };
  localStorage.setItem(
    KEY_STORAGE,
    JSON.stringify({
      buyer: keys2.buyer.toHex(),
      seller: keys2.seller.toHex(),
      oracle: keys2.oracle.toHex()
    })
  );
  return keys2;
}
async function sha2562(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}
async function releaseMessage() {
  return sha2562(new TextEncoder().encode(RELEASE_LABEL));
}
function payoutFromAddress(address, hrp, serverKey) {
  let decoded;
  try {
    decoded = ArkAddress.decode(address.trim());
  } catch {
    throw new Error("that is not an Arkade address");
  }
  if (decoded.hrp !== hrp) {
    throw new Error(`that address is for ${decoded.hrp}, this operator uses ${hrp}`);
  }
  if (!equalBytes4(decoded.serverPubKey, serverKey)) {
    throw new Error("that address belongs to a different Arkade operator");
  }
  return { program: decoded.vtxoTaprootKey, pkScript: decoded.pkScript };
}
async function minimumExitDelay(demo) {
  return (await new RestArkProvider(demo.arkUrl).getInfo()).unilateralExitDelay;
}
async function prepareEscrow(input) {
  const ark = new RestArkProvider(input.demo.arkUrl);
  const indexer = new RestIndexerProvider(input.demo.arkUrl);
  const emulator = new RestEmulatorProvider(input.demo.emulatorUrl);
  const [client, emulatorInfo, message, info] = await Promise.all([
    Arkade.connect({
      arkade: ark,
      indexer,
      emulator,
      identity: input.keys.buyer,
      network: input.demo.network
    }),
    fetch(`${input.demo.emulatorUrl}/v1/info`).then(async (response) => {
      if (!response.ok) throw new Error(`emulator info failed: ${response.status}`);
      return response.json();
    }),
    releaseMessage(),
    ark.getInfo()
  ]);
  if (input.exit % 512n !== 0n) {
    throw new Error("unilateral delay must be a multiple of 512 seconds");
  }
  if (input.exit < info.unilateralExitDelay) {
    throw new Error(
      `unilateral delay must be at least ${info.unilateralExitDelay} seconds on this operator`
    );
  }
  const buyer = payoutFromAddress(input.buyerAddress, input.demo.network.hrp, client.serverKey);
  const seller = payoutFromAddress(input.sellerAddress, input.demo.network.hrp, client.serverKey);
  const [buyerPk, sellerPk, oraclePk, messageHash] = await Promise.all([
    input.keys.buyer.xOnlyPublicKey(),
    input.keys.seller.xOnlyPublicKey(),
    input.keys.oracle.xOnlyPublicKey(),
    sha2562(message)
  ]);
  const contract = client.contract(program, {
    partyAPk: buyerPk,
    partyBPk: sellerPk,
    oraclePk,
    oracleMessageHash: messageHash,
    partyAScript: buyer.program,
    partyBScript: seller.program,
    amount: input.amount,
    timeoutAt: input.timeoutAt,
    exit: input.exit
  });
  return {
    demo: input.demo,
    contract,
    ark,
    emulatorVersion: emulatorInfo.version ?? "",
    message,
    oracle: input.keys.oracle,
    buyer: input.keys.buyer,
    seller: input.keys.seller,
    exit: input.exit
  };
}
async function spendComplete(prepared2, coin, sellerScript, buyerScript, amount) {
  const signature = await prepared2.oracle.signMessage(prepared2.message, "schnorr");
  const outputs = completeOutputs(BigInt(coin.value), amount, sellerScript, buyerScript);
  const result = await prepared2.contract.functions.complete(prepared2.message, signature).from(coin).to(outputs).send();
  return result.txid;
}
async function spendCancel(prepared2, coin, buyerScript) {
  const outputs = cancelOutputs(BigInt(coin.value), buyerScript);
  const result = await prepared2.contract.functions.cancel().from(coin).to(outputs).send();
  return result.txid;
}
async function spendUnilateral(prepared2, coin, sellerScript) {
  const outputs = unilateralOutputs(BigInt(coin.value), sellerScript);
  const sequence = timelockToSequence({ type: "seconds", value: prepared2.exit });
  const built = await prepared2.contract.functions.unilateral().from(coin).to(outputs).build();
  setSequence(built.arkTx, sequence);
  for (const checkpoint of built.checkpoints) setSequence(checkpoint, sequence);
  let arkTx = built.arkTx;
  for (const key of [prepared2.buyer, prepared2.seller]) {
    arkTx = await key.sign(arkTx, [0]);
  }
  const submitted = built.checkpoints.map((checkpoint) => base64.encode(checkpoint.toPSBT()));
  const response = await prepared2.ark.submitTx(base64.encode(arkTx.toPSBT()), submitted);
  assertSubmittedArkTxid(response, arkTx, "submitTx");
  const matched = matchServerCheckpoints(
    response.signedCheckpointTxs,
    built.checkpoints,
    "submitTx"
  );
  const finalCheckpoints = [];
  for (const { server } of matched) {
    setSequence(server, sequence);
    let signed = server;
    for (const key of [prepared2.buyer, prepared2.seller]) {
      signed = await key.sign(signed, [0]);
    }
    finalCheckpoints.push(base64.encode(signed.toPSBT()));
  }
  await prepared2.ark.finalizeTx(response.arkTxid, finalCheckpoints);
  return response.arkTxid;
}
function setSequence(tx, sequence) {
  tx.updateInput(0, { sequence });
}
function equalBytes4(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
  return true;
}
function shortHex(bytes) {
  const encoded = hex.encode(bytes);
  return `${encoded.slice(0, 8)}\u2026${encoded.slice(-8)}`;
}

// examples/escrow/src/main.ts
var form = document.querySelector("form");
var networkSelect = required("#network");
var walletLink = required("#wallet");
var buyerInput = required("#buyer");
var sellerInput = required("#seller");
var amountInput = required("#amount");
var timeoutInput = required("#timeout");
var exitInput = required("#exit");
var prepareButton = required("#prepare");
var contractSection = required("#contract");
var addressCode = required("#address");
var copyButton = required("#copy");
var balanceLine = required("#balance");
var coinSelect = required("#coin");
var completeButton = required("#complete");
var cancelButton = required("#cancel");
var unilateralButton = required("#unilateral");
var oracleLine = required("#oracle");
var keysLine = required("#keys");
var log = required("#log");
var keys = loadKeys();
var prepared;
var coins = [];
var fingerprint = "";
var busy = false;
networkSelect.replaceChildren(
  ...DEMO_NETWORKS.map((demo) => {
    const option = document.createElement("option");
    option.value = demo.name;
    option.textContent = demo.label;
    return option;
  })
);
buyerInput.value = localStorage.getItem("arkade-escrow-buyer") ?? "";
sellerInput.value = localStorage.getItem("arkade-escrow-seller") ?? "";
amountInput.value = localStorage.getItem("arkade-escrow-amount") ?? "10000";
var storedExit = localStorage.getItem("arkade-escrow-exit");
exitInput.value = !storedExit || storedExit === "0" ? "2048" : storedExit;
timeoutInput.value = localStorage.getItem("arkade-escrow-timeout") ?? localInput(nowSeconds() - 60);
networkSelect.value = localStorage.getItem("arkade-escrow-network") ?? "mutinynet";
updateWalletLink();
void showKeys();
networkSelect.addEventListener("change", () => {
  updateWalletLink();
  markStale();
  void raiseExitToOperator();
});
void raiseExitToOperator();
for (const input of [buyerInput, sellerInput, amountInput, timeoutInput, exitInput]) {
  input.addEventListener("input", markStale);
}
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  void run("create", createEscrow);
});
copyButton.addEventListener("click", () => {
  void navigator.clipboard.writeText(addressCode.textContent ?? "");
  note("copied the funding address");
});
completeButton.addEventListener("click", () => void run("unlock", unlock));
cancelButton.addEventListener("click", () => void run("refund", refund));
unilateralButton.addEventListener("click", () => void run("exit", exit));
window.setInterval(() => {
  if (prepared && fingerprint === currentFingerprint()) void refreshCoins(false);
}, 4e3);
async function createEscrow() {
  const demo = selectedNetwork();
  const amount = readAmount();
  const timeoutAt = readTimeout();
  const exitDelay = readExit();
  remember();
  prepared = await prepareEscrow({
    demo,
    buyerAddress: buyerInput.value,
    sellerAddress: sellerInput.value,
    amount,
    timeoutAt,
    exit: exitDelay,
    keys
  });
  fingerprint = currentFingerprint();
  addressCode.textContent = prepared.contract.address;
  contractSection.hidden = false;
  note(
    `escrow ${prepared.contract.address} \xB7 emulator ${prepared.emulatorVersion || "unknown"} \xB7 oracle signs "${RELEASE_LABEL}"`
  );
  if (prepared.emulatorVersion.startsWith("v0.0.7")) {
    note("this emulator is older than v0.0.8, so refund (CHECKTIME) will be rejected");
  }
  await refreshCoins(true);
}
async function unlock() {
  const current = requirePrepared();
  const coin = selectedCoin();
  const { seller, buyer } = payouts(current);
  const txid = await spendComplete(current, coin, seller, buyer, readAmount());
  note(`unlocked to the seller: ${txid}`);
  await refreshCoins(true);
}
async function refund() {
  const current = requirePrepared();
  const coin = selectedCoin();
  const { buyer } = payouts(current);
  const txid = await spendCancel(current, coin, buyer);
  note(`refunded the buyer: ${txid}`);
  await refreshCoins(true);
}
async function exit() {
  const current = requirePrepared();
  const coin = selectedCoin();
  const { seller } = payouts(current);
  const txid = await spendUnilateral(current, coin, seller);
  note(`unilateral exit to the seller: ${txid}`);
  await refreshCoins(true);
}
function payouts(current) {
  const buyer = payoutFromAddress(
    buyerInput.value,
    current.demo.network.hrp,
    current.contract.client.serverKey
  );
  const seller = payoutFromAddress(
    sellerInput.value,
    current.demo.network.hrp,
    current.contract.client.serverKey
  );
  return { buyer: buyer.pkScript, seller: seller.pkScript };
}
async function refreshCoins(announce) {
  if (!prepared) return;
  coins = await prepared.contract.getUtxos();
  const previous = coinSelect.value;
  coinSelect.replaceChildren(
    ...coins.map((coin) => {
      const option = document.createElement("option");
      option.value = `${coin.txid}:${coin.vout}`;
      option.textContent = `${coin.value} sats \xB7 ${coin.txid.slice(0, 10)}:${coin.vout}`;
      return option;
    })
  );
  if (coins.some((coin) => `${coin.txid}:${coin.vout}` === previous)) coinSelect.value = previous;
  const total = coins.reduce((sum, coin) => sum + coin.value, 0);
  balanceLine.textContent = describeCoins();
  syncButtons();
  if (announce && coins.length > 0) note(`found ${total} sats`);
}
function selectedCoin() {
  const coin = coins.find((item) => `${item.txid}:${item.vout}` === coinSelect.value) ?? coins[0];
  if (!coin) throw new Error("fund the escrow first");
  return coin;
}
function requirePrepared() {
  if (!prepared || fingerprint !== currentFingerprint()) {
    throw new Error("the form changed; create the escrow again");
  }
  return prepared;
}
function markStale() {
  if (!prepared) return;
  balanceLine.textContent = fingerprint === currentFingerprint() ? describeCoins() : "The form changed. Create the escrow again before spending.";
  syncButtons();
}
function describeCoins() {
  if (coins.length === 0)
    return "No coins yet. Send sats to the address above from Arkade.Money.";
  const total = coins.reduce((sum, coin) => sum + coin.value, 0);
  return `${coins.length} coin${coins.length === 1 ? "" : "s"}, ${total} sats.`;
}
async function showKeys() {
  const [buyer, seller, oracle, message] = await Promise.all([
    keys.buyer.xOnlyPublicKey(),
    keys.seller.xOnlyPublicKey(),
    keys.oracle.xOnlyPublicKey(),
    releaseMessage()
  ]);
  keysLine.textContent = `buyer ${shortHex(buyer)} \xB7 seller ${shortHex(seller)}`;
  oracleLine.textContent = `oracle ${shortHex(oracle)} \xB7 message ${hex.encode(message)}`;
}
function selectedNetwork() {
  const demo = DEMO_NETWORKS.find((item) => item.name === networkSelect.value);
  if (!demo) throw new Error("unknown network");
  return demo;
}
function updateWalletLink() {
  const demo = selectedNetwork();
  walletLink.href = demo.walletUrl;
  walletLink.textContent = demo.walletUrl.replace("https://", "");
}
function readAmount() {
  const amount = BigInt(amountInput.value);
  if (amount <= 0n) throw new Error("amount must be positive");
  return amount;
}
async function raiseExitToOperator() {
  try {
    const minimum = await minimumExitDelay(selectedNetwork());
    if (BigInt(exitInput.value || "0") < minimum) exitInput.value = minimum.toString();
  } catch {
  }
  markStale();
}
function readExit() {
  const exit2 = BigInt(exitInput.value);
  if (exit2 < 0n) throw new Error("unilateral delay cannot be negative");
  return exit2;
}
function readTimeout() {
  const parsed = Date.parse(timeoutInput.value);
  if (Number.isNaN(parsed)) throw new Error("refund time is not a date");
  return BigInt(Math.floor(parsed / 1e3));
}
function currentFingerprint() {
  return [
    networkSelect.value,
    buyerInput.value.trim(),
    sellerInput.value.trim(),
    amountInput.value,
    timeoutInput.value,
    exitInput.value
  ].join("|");
}
function remember() {
  localStorage.setItem("arkade-escrow-buyer", buyerInput.value.trim());
  localStorage.setItem("arkade-escrow-seller", sellerInput.value.trim());
  localStorage.setItem("arkade-escrow-amount", amountInput.value);
  localStorage.setItem("arkade-escrow-timeout", timeoutInput.value);
  localStorage.setItem("arkade-escrow-exit", exitInput.value);
  localStorage.setItem("arkade-escrow-network", networkSelect.value);
}
async function run(label, action) {
  busy = true;
  prepareButton.disabled = true;
  completeButton.disabled = true;
  cancelButton.disabled = true;
  unilateralButton.disabled = true;
  try {
    await action();
  } catch (error) {
    note(`${label} failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    busy = false;
    prepareButton.disabled = false;
    syncButtons();
  }
}
function syncButtons() {
  const ready = !busy && coins.length > 0 && !!prepared && fingerprint === currentFingerprint();
  completeButton.disabled = !ready;
  cancelButton.disabled = !ready;
  unilateralButton.disabled = !ready;
}
function note(message) {
  const line = document.createElement("div");
  const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  line.textContent = `${time}  ${message}`;
  log.prepend(line);
}
function nowSeconds() {
  return Math.floor(Date.now() / 1e3);
}
function localInput(unix) {
  const date = new Date(unix * 1e3);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function required(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`missing ${selector}`);
  return element;
}
/*! Bundled license information:

@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/utils.js:
@noble/curves/abstract/modular.js:
@noble/curves/abstract/curve.js:
@noble/curves/abstract/weierstrass.js:
@noble/curves/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@scure/btc-signer/index.js:
  (*! scure-btc-signer - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/secp256k1/index.js:
  (*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) *)
*/
