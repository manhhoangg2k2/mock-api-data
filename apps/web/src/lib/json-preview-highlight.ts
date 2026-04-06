/** Parse path kiểu body[0].email, [1].name, email */
export function parseJsonPath(path: string): (string | number)[] {
  const segments: (string | number)[] = [];
  let i = 0;
  const s = path.trim();
  while (i < s.length) {
    if (s[i] === "." || s[i] === " ") {
      i++;
      continue;
    }
    if (s[i] === "[") {
      const j = s.indexOf("]", i);
      if (j < 0) break;
      segments.push(Number(s.slice(i + 1, j)));
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < s.length && s[j] !== "." && s[j] !== "[" && s[j] !== " ") j++;
    if (j > i) segments.push(s.slice(i, j));
    i = j;
  }
  return segments;
}

function getAtPath(obj: unknown, segments: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const seg of segments) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof seg === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[seg];
      continue;
    }
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

function skipWs(s: string, i: number): number {
  while (i < s.length && /\s/.test(s[i]!)) i++;
  return i;
}

function readJsonStringKey(s: string, pos: number): { key: string; next: number } | null {
  if (s[pos] !== '"') return null;
  let j = pos + 1;
  let out = "";
  while (j < s.length) {
    const c = s[j]!;
    if (c === '"') return { key: out, next: j + 1 };
    if (c === "\\" && j + 1 < s.length) {
      const e = s[j + 1]!;
      if (e === '"' || e === "\\" || e === "/") {
        out += e;
        j += 2;
        continue;
      }
      if (e === "b") {
        out += "\b";
        j += 2;
        continue;
      }
      if (e === "f") {
        out += "\f";
        j += 2;
        continue;
      }
      if (e === "n") {
        out += "\n";
        j += 2;
        continue;
      }
      if (e === "r") {
        out += "\r";
        j += 2;
        continue;
      }
      if (e === "t") {
        out += "\t";
        j += 2;
        continue;
      }
      if (e === "u" && j + 5 < s.length) {
        const hex = s.slice(j + 2, j + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          j += 6;
          continue;
        }
      }
      return null;
    }
    out += c;
    j++;
  }
  return null;
}

function skipString(s: string, i: number): number {
  let j = i + 1;
  while (j < s.length) {
    const c = s[j]!;
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (c === '"') return j + 1;
    j++;
  }
  return -1;
}

function skipValue(s: string, start: number): number {
  let i = skipWs(s, start);
  if (i >= s.length) return -1;
  const c = s[i]!;
  if (c === '"') return skipString(s, i);
  if (c === "{") return skipObject(s, i);
  if (c === "[") return skipArray(s, i);
  if (c === "t" && s.slice(i, i + 4) === "true") return i + 4;
  if (c === "f" && s.slice(i, i + 5) === "false") return i + 5;
  if (c === "n" && s.slice(i, i + 4) === "null") return i + 4;
  if (c === "-" || (c >= "0" && c <= "9")) {
    let k = i + 1;
    while (k < s.length && /[0-9.eE+-]/.test(s[k]!)) k++;
    return k;
  }
  return -1;
}

function skipObject(s: string, i: number): number {
  i = skipWs(s, i + 1);
  if (s[i] === "}") return i + 1;
  while (true) {
    i = skipWs(s, i);
    if (s[i] === "}") return i + 1;
    const k = skipString(s, i);
    if (k < 0) return -1;
    i = skipWs(s, k);
    if (s[i] !== ":") return -1;
    i = skipValue(s, skipWs(s, i + 1));
    if (i < 0) return -1;
    i = skipWs(s, i);
    if (s[i] === "}") return i + 1;
    if (s[i] === ",") {
      i = skipWs(s, i + 1);
      continue;
    }
    return -1;
  }
}

function skipArray(s: string, i: number): number {
  i = skipWs(s, i + 1);
  if (s[i] === "]") return i + 1;
  while (true) {
    i = skipValue(s, i);
    if (i < 0) return -1;
    i = skipWs(s, i);
    if (s[i] === "]") return i + 1;
    if (s[i] === ",") {
      i = skipWs(s, i + 1);
      continue;
    }
    return -1;
  }
}

/** Vị trí bắt đầu (offset ký tự) của phần tử thứ n trong mảng; bracketPos trỏ tới `[`. */
function arrayNthItemStart(s: string, bracketPos: number, n: number): number | null {
  let i = skipWs(s, bracketPos + 1);
  if (s[i] === "]") return null;
  let cur = 0;
  while (cur < n) {
    const end = skipValue(s, i);
    if (end < 0) return null;
    i = skipWs(s, end);
    if (s[i] === "]") return null;
    if (s[i] !== ",") return null;
    i = skipWs(s, i + 1);
    cur++;
  }
  return i;
}

/**
 * Điều hướng path trong chuỗi JSON đã pretty-print, trả về offset bắt đầu giá trị tại path.
 */
function getValueStartOffset(s: string, segs: (string | number)[]): number | null {
  let pos = skipWs(s, 0);
  for (let d = 0; d < segs.length; d++) {
    const seg = segs[d]!;
    pos = skipWs(s, pos);
    if (typeof seg === "string") {
      if (s[pos] !== "{") return null;
      pos = skipWs(s, pos + 1);
      let found = false;
      while (true) {
        pos = skipWs(s, pos);
        if (s[pos] === "}") return null;
        const kr = readJsonStringKey(s, pos);
        if (!kr) return null;
        pos = skipWs(s, kr.next);
        if (s[pos] !== ":") return null;
        const valStart = skipWs(s, pos + 1);
        if (kr.key === seg) {
          pos = valStart;
          found = true;
          break;
        }
        const valEnd = skipValue(s, valStart);
        if (valEnd < 0) return null;
        pos = skipWs(s, valEnd);
        if (s[pos] === ",") {
          pos = skipWs(s, pos + 1);
          continue;
        }
        if (s[pos] === "}") return null;
        return null;
      }
      if (!found) return null;
    } else {
      if (s[pos] !== "[") return null;
      const itemStart = arrayNthItemStart(s, pos, seg);
      if (itemStart === null) return null;
      pos = itemStart;
    }
  }
  return pos;
}

function valueEndOffset(s: string, start: number): number {
  const pos = skipWs(s, start);
  const c = s[pos];
  if (c === "{") return skipObject(s, pos);
  if (c === "[") return skipArray(s, pos);
  return skipValue(s, start);
}

/** Offset (trong slice `objectJson`) của dấu `"` mở đầu key ở cấp một của object. */
function topLevelKeyOffsetInObject(objectJson: string, key: string): number | null {
  let pos = skipWs(objectJson, 0);
  if (objectJson[pos] !== "{") return null;
  pos = skipWs(objectJson, pos + 1);
  while (true) {
    pos = skipWs(objectJson, pos);
    if (objectJson[pos] === "}") return null;
    const keyOff = pos;
    const kr = readJsonStringKey(objectJson, pos);
    if (!kr) return null;
    pos = skipWs(objectJson, kr.next);
    if (objectJson[pos] !== ":") return null;
    const valStart = skipWs(objectJson, pos + 1);
    if (kr.key === key) return keyOff;
    const valEnd = skipValue(objectJson, valStart);
    if (valEnd < 0) return null;
    pos = skipWs(objectJson, valEnd);
    if (objectJson[pos] === ",") {
      pos = skipWs(objectJson, pos + 1);
      continue;
    }
    if (objectJson[pos] === "}") return null;
    return null;
  }
}

/**
 * Dòng chứa `"key":` đúng theo path (một phần tử mảng / object được định vị bằng parser, không dùng indexOf cả object).
 */
export function findKeyLineIndex(body: unknown, jsonPretty: string, pathStr: string): number | null {
  const segs = parseJsonPath(pathStr);
  if (segs.length === 0) return null;
  const last = segs[segs.length - 1];
  if (typeof last !== "string") return null;

  const parentSegs = segs.slice(0, -1);
  const parent =
    parentSegs.length === 0 ? body : getAtPath(body, parentSegs as (string | number)[]);
  if (parent === undefined || parent === null || typeof parent !== "object") return null;

  const parentStart = getValueStartOffset(jsonPretty, parentSegs);
  if (parentStart === null) return null;
  const parentEnd = valueEndOffset(jsonPretty, parentStart);
  if (parentEnd < 0) return null;
  const window = jsonPretty.slice(parentStart, parentEnd);

  const off = topLevelKeyOffsetInObject(window, last);
  if (off === null) return null;
  const globalOff = parentStart + off;
  return jsonPretty.slice(0, globalOff).split("\n").length - 1;
}

/**
 * Các dòng cần tô — chỉ theo path chính xác (không fallback theo tên key trùng).
 */
export function highlightLineIndicesFromChaos(
  body: unknown,
  jsonPretty: string,
  chaos: { path: string }[]
): Set<number> {
  const out = new Set<number>();
  for (const c of chaos) {
    const li = findKeyLineIndex(body, jsonPretty, c.path);
    if (li !== null) out.add(li);
  }
  return out;
}
