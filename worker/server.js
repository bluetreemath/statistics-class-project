import { adminEntry, adminPage, entryPage, materials, receiptPage, studentPage } from "./views.js";
import { assets } from "./assets.js";

const maxFileBytes = 15 * 1024 * 1024;
const maxFormBytes = maxFileBytes + 16 * 1024;
const sessionAge = 8 * 60 * 60;
const prefix = "submissions/";
const sessionName = "__Host-math-admin";
const encoder = new TextEncoder();
const requestHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...requestHeaders, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function redirect(location, cookie) {
  const headers = { ...requestHeaders, Location: location, "Cache-Control": "no-store" };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

function sessionCookie(value, age) {
  return sessionName + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=" + age;
}

function identityState(request, env) {
  const email = request.headers.get("oai-authenticated-user-email");
  if (!request.headers.get("oai-authenticated-user-id") || !email) return "signin";
  return env.OWNER_EMAIL && email.toLowerCase() === env.OWNER_EMAIL.toLowerCase() ? "owner" : "forbidden";
}

async function secretKey(env) {
  return crypto.subtle.importKey("raw", encoder.encode(env.SESSION_SECRET), {
    name: "HMAC", hash: "SHA-256",
  }, false, ["sign", "verify"]);
}

function sessionMessage(request, expires) {
  return "statistics-admin:" + expires + ":" + request.headers.get("oai-authenticated-user-id");
}

async function newSession(request, env) {
  const expires = Math.floor(Date.now() / 1000) + sessionAge;
  const signature = await crypto.subtle.sign("HMAC", await secretKey(env), encoder.encode(sessionMessage(request, expires)));
  const token = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return expires + "." + token;
}

async function hasSession(request, env) {
  const cookie = (request.headers.get("Cookie") ?? "").split(/;\s*/).find(part => part.startsWith(sessionName + "="));
  const match = cookie?.slice(sessionName.length + 1).match(/^(\d{10,12})\.([A-Za-z0-9_-]{43})$/);
  if (!match || !env.SESSION_SECRET || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
  const token = match[2].replace(/-/g, "+").replace(/_/g, "/");
  const signature = Uint8Array.from(atob(token), char => char.charCodeAt(0));
  return crypto.subtle.verify("HMAC", await secretKey(env), signature, encoder.encode(sessionMessage(request, match[1])));
}

function contentDisposition(action, filename) {
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, char => "%" + char.charCodeAt(0).toString(16).toUpperCase());
  return action + "; filename*=UTF-8''" + encoded;
}

function staticFile(body, type, disposition) {
  const headers = { ...requestHeaders, "Content-Type": type, "Cache-Control": "public, max-age=600" };
  if (disposition) headers["Content-Disposition"] = disposition;
  return new Response(body, { headers });
}

async function readForm(request, limit) {
  if (Number(request.headers.get("Content-Length")) > limit) {
    await request.body?.cancel();
    return { tooLarge: true };
  }
  const parts = [];
  let bytes = 0;
  const reader = request.body?.getReader();
  if (!reader) return {};
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      return { tooLarge: true };
    }
    parts.push(value);
  }
  try {
    const blob = new Blob(parts);
    return { form: await new Response(blob, { headers: { "Content-Type": request.headers.get("Content-Type") ?? "" } }).formData() };
  } catch {
    return {};
  }
}

const hasPrefix = (bytes, signature) => signature.every((byte, index) => bytes[index] === byte);

function hasHwpxContents(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  for (let end = bytes.length - 22; end >= Math.max(0, bytes.length - 65557); end--) {
    if (view.getUint32(end, true) !== 0x06054b50 || end + 22 + view.getUint16(end + 20, true) !== bytes.length) continue;
    const entryCount = view.getUint16(end + 10, true);
    let cursor = view.getUint32(end + 16, true);
    for (let entry = 0; entry < entryCount && cursor + 46 <= end; entry++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) break;
      const nameEnd = cursor + 46 + view.getUint16(cursor + 28, true);
      if (nameEnd > end) break;
      if (decoder.decode(bytes.subarray(cursor + 46, nameEnd)) === "Contents/content.hpf") return true;
      cursor = nameEnd + view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    }
    return false;
  }
  return false;
}

const pagesOrigin = "https://bluetreemath.github.io";

function isPagesSubmission(request) {
  return request.method === "POST" && new URL(request.url).pathname === "/submit" &&
    request.headers.get("Origin") === pagesOrigin;
}

function submissionResult(request, message, status) {
  if (request.headers.get("Accept")?.includes("application/json")) {
    const headers = { ...requestHeaders, "Cache-Control": "no-store", Vary: "Origin" };
    if (isPagesSubmission(request)) headers["Access-Control-Allow-Origin"] = pagesOrigin;
    return Response.json({ message }, { status, headers });
  }
  return html(receiptPage(message, status === 201), status);
}

async function submit(request, env) {
  const result = (message, status) => submissionResult(request, message, status);
  const { form, tooLarge } = await readForm(request, maxFormBytes);
  if (tooLarge) return result("15MB 이하의 한글 파일을 첨부해 주세요.", 413);
  if (!form) return result("첨부 파일을 확인하고 다시 시도해 주세요.", 400);

  const studentId = String(form.get("studentId") ?? "").trim();
  const studentName = String(form.get("studentName") ?? "").trim().normalize("NFC");
  const file = form.get("file");
  if (!/^\d{1,12}$/.test(studentId) || !studentName || studentName.length > 40 || /[\u0000-\u001f\u007f]/.test(studentName)) {
    return result("학번은 숫자로 입력하고 이름을 확인해 주세요.", 400);
  }
  if (!(file instanceof File) || !file.size) return result("작성한 한글 파일을 선택해 주세요.", 400);
  if (file.size > maxFileBytes) return result("15MB 이하의 한글 파일을 첨부해 주세요.", 413);

  const filename = file.name.split(/[\\/]/).pop().normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, "");
  const extension = filename.match(/\.(hwp|hwpx)$/i)?.[1].toLowerCase();
  if (!extension || filename.length > 200) return result("파일 이름이 200자 이하인 HWPX 또는 HWP 파일을 선택해 주세요.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validFile = extension === "hwp"
    ? hasPrefix(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    : hasPrefix(bytes, [0x50, 0x4b, 0x03, 0x04]) && hasHwpxContents(bytes);
  if (!validFile) return result("한글에서 열 수 있는 HWPX 또는 HWP 파일을 선택해 주세요.", 400);

  const key = prefix + String(9_999_999_999_999 - Date.now()).padStart(13, "0") + "-" + crypto.randomUUID();
  await env.BUCKET.put(key, bytes, { customMetadata: { studentId, studentName, filename } });
  return result(studentId + " " + studentName + " 학생의 활동지를 제출했어요.", 201);
}

async function admin(request, env, url) {
  const state = identityState(request, env);
  if (state !== "owner") return html(adminEntry(state), state === "signin" ? 401 : 403);
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return html(adminEntry("password", "관리자 설정을 불러올 수 없어요."), 503);
  if (request.method === "POST" && url.pathname === "/admin/login") {
    const { form } = await readForm(request, 1024);
    const password = form?.get("password");
    if (typeof password !== "string" || password !== env.ADMIN_PASSWORD) {
      return html(adminEntry("password", "비밀번호를 다시 확인해 주세요."), 401);
    }
    return redirect("/admin", sessionCookie(await newSession(request, env), sessionAge));
  }
  if (request.method === "POST" && url.pathname === "/admin/logout") {
    return redirect("/admin", sessionCookie("", 0));
  }
  if (!await hasSession(request, env)) return html(adminEntry("password"), 401);

  if (url.pathname === "/admin") {
    const cursor = url.searchParams.get("cursor") || undefined;
    if (cursor && (cursor.length > 4096 || !/^[\x20-\x7e]+$/.test(cursor))) return redirect("/admin");
    const page = await env.BUCKET.list({ prefix, limit: 50, cursor, include: ["customMetadata"] });
    return html(adminPage(page.objects, page.truncated ? page.cursor : null, Boolean(cursor)));
  }

  const id = url.pathname.slice("/admin/file/".length);
  if (!/^\d{13}-[a-f0-9-]{36}$/.test(id)) return new Response("파일을 찾을 수 없어요.", { status: 404 });
  const object = await env.BUCKET.get(prefix + id);
  if (!object) return new Response("파일을 찾을 수 없어요.", { status: 404 });
  return new Response(object.body, { headers: {
    ...requestHeaders, "Content-Type": "application/octet-stream", "Cache-Control": "private, no-store",
    "Content-Disposition": contentDisposition("attachment", object.customMetadata.filename),
    "Content-Length": String(object.size),
  } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const { method } = request;
    if (method === "POST" && !isPagesSubmission(request)) {
      const origin = request.headers.get("Origin");
      if ((origin && origin !== url.origin) || request.headers.get("Sec-Fetch-Site") === "cross-site") {
        return new Response("올바르지 않은 요청이에요.", { status: 403, headers: requestHeaders });
      }
    }

    try {
      if (method === "GET") {
        if (pathname === "/") return html(entryPage());
        if (pathname === "/project") return html(studentPage());
        if (pathname === "/app.css") return staticFile(assets.css, "text/css; charset=utf-8");
        if (pathname === "/app.js") return staticFile(assets.js, "application/javascript; charset=utf-8");
        if (pathname === "/pdf-download.js") return staticFile(assets.pdfDownload, "application/javascript; charset=utf-8");
        if (pathname === "/pdf-worker.js") {
          const response = staticFile(assets.pdfWorker, "application/javascript; charset=utf-8");
          response.headers.set("Content-Security-Policy", "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src https://bluetreemath.github.io");
          return response;
        }
        if (pathname.startsWith("/materials/")) {
          const id = pathname.slice("/materials/".length);
          if (Object.hasOwn(materials, id)) {
            const material = materials[id];
            return staticFile(Uint8Array.from(atob(assets[material.file]), char => char.charCodeAt(0)), material.type,
              contentDisposition(id === "worksheet" ? "attachment" : "inline", material.name));
          }
        }
        if (pathname === "/admin" || pathname.startsWith("/admin/file/")) return await admin(request, env, url);
      }
      if (method === "POST") {
        if (pathname === "/submit") return await submit(request, env);
        if (pathname === "/admin/login" || pathname === "/admin/logout") return await admin(request, env, url);
      }
      return html(receiptPage("요청한 페이지를 찾을 수 없어요.", false), 404);
    } catch (error) {
      console.error("Unable to complete request", pathname === "/submit" ? "submission" : method, error?.name);
      return submissionResult(request, "잠시 후 다시 시도해 주세요.", 503);
    }
  },
};
