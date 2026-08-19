import { randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "echo15_dev_session";
const LOGIN_PATH = "/__echo15-dev-login";
const LOGOUT_PATH = "/__echo15-dev-logout";
const MAX_BODY_BYTES = 4096;

function safeEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function requestPath(request) {
  return new URL(request.url ?? "/", "http://localhost").pathname;
}

function hasSession(request, sessionToken) {
  const cookieHeader = request.headers.cookie ?? "";

  return cookieHeader
    .split(/;\s*/)
    .some((cookie) => cookie === `${COOKIE_NAME}=${sessionToken}`);
}

function setPrivateHeaders(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
}

function sendHtml(response, statusCode, html) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  setPrivateHeaders(response);
  response.end(html);
}

function sendLogin(response, { invalid = false } = {}) {
  const error = invalid
    ? '<p class="error" role="alert">密码不正确，请重试。</p>'
    : "";

  sendHtml(
    response,
    401,
    `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Echo 1.5 · Dev Access</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #050505; color: #f5f5f5; }
      main { width: min(100%, 390px); padding: 36px; border: 1px solid #292929; border-radius: 18px; background: #101010; box-shadow: 0 24px 80px rgb(0 0 0 / 55%); }
      .eyebrow { margin: 0 0 12px; color: #9a9a9a; font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
      h1 { margin: 0; font-size: clamp(28px, 7vw, 38px); line-height: 1; letter-spacing: -.04em; }
      .description { margin: 16px 0 26px; color: #aaa; line-height: 1.6; }
      label { display: block; margin-bottom: 9px; font-size: 13px; font-weight: 650; }
      input { width: 100%; height: 48px; padding: 0 14px; border: 1px solid #353535; border-radius: 10px; outline: none; background: #080808; color: #fff; font: inherit; }
      input:focus { border-color: #888; box-shadow: 0 0 0 3px rgb(255 255 255 / 8%); }
      button { width: 100%; height: 48px; margin-top: 12px; border: 0; border-radius: 10px; background: #f4f4f4; color: #090909; font: inherit; font-weight: 750; cursor: pointer; }
      button:hover { background: #fff; }
      .error { margin: 0 0 14px; color: #ff8d8d; font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Protected development preview</p>
      <h1>Echo 1.5</h1>
      <p class="description">请输入访问密码以继续查看开发中的页面。</p>
      ${error}
      <form method="post" action="${LOGIN_PATH}">
        <label for="password">访问密码</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
        <button type="submit">进入预览</button>
      </form>
    </main>
  </body>
</html>`,
  );
}

function readRequestBody(request) {
  return new Promise((resolve) => {
    let body = "";
    let size = 0;
    let tooLarge = false;

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      body += chunk;
    });
    request.on("end", () => resolve(tooLarge ? null : body));
    request.on("error", () => resolve(null));
  });
}

export function devPasswordGate({ password }) {
  if (!password) {
    throw new Error("A development preview password is required.");
  }

  const sessionToken = randomBytes(32).toString("base64url");

  return {
    name: "echo15-dev-password-gate",
    apply: "serve",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = requestPath(request);

        if (path === LOGOUT_PATH) {
          response.statusCode = 303;
          response.setHeader("Location", LOGIN_PATH);
          response.setHeader(
            "Set-Cookie",
            `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
          );
          setPrivateHeaders(response);
          response.end();
          return;
        }

        if (path === LOGIN_PATH && request.method === "POST") {
          const body = await readRequestBody(request);
          const submittedPassword = body
            ? new URLSearchParams(body).get("password") ?? ""
            : "";

          if (safeEqual(submittedPassword, password)) {
            response.statusCode = 303;
            response.setHeader("Location", "/");
            response.setHeader(
              "Set-Cookie",
              `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`,
            );
            setPrivateHeaders(response);
            response.end();
            return;
          }

          sendLogin(response, { invalid: true });
          return;
        }

        if (hasSession(request, sessionToken)) {
          next();
          return;
        }

        const acceptsHtml = (request.headers.accept ?? "").includes("text/html");
        if (path === LOGIN_PATH || acceptsHtml || path === "/") {
          sendLogin(response);
          return;
        }

        response.statusCode = 401;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        setPrivateHeaders(response);
        response.end("Authentication required");
      });
    },
  };
}
