export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -------------------
    // 处理 CORS 预检请求
    // -------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // -------------------
    // 1. 获取随机题目
    // -------------------
    if (url.pathname === "/get-question") {
      const questions = [
        { q: "提问" },
        { q: "提问" },
        { q: "提问" },
        { q: "提问" },
        { q: "提问" },
        { q: "提问" }
      ];
      const index = Math.floor(Math.random() * questions.length);
      return new Response(JSON.stringify({ question: questions[index].q, index }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        }
      });
    }

    // -------------------
    // 2. 生成 token
    // -------------------
    if (url.pathname === "/generate-token" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "请求格式错误" }), { status: 400 });
      }

      const { answer, questionIndex } = body;

      // 完整题库答案
      const answers = ["答案", "答案", "答案", "答案", "答案", "答案"];

      // 检查索引
      if (questionIndex < 0 || questionIndex >= answers.length) {
        return new Response(JSON.stringify({ error: "题目索引错误" }), { status: 400 });
      }

      // 检查答案
      if (answer !== answers[questionIndex]) {
        return new Response(JSON.stringify({ error: "答案错误" }), { status: 400 });
      }

      // 答案正确 → 生成 token
      const token = crypto.randomUUID();
      const expireSeconds = 300; // 5分钟有效
      await env.TOKEN_KV.put(token, "valid", { expirationTtl: expireSeconds });

      return new Response(JSON.stringify({ token }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        }
      });
    }

    // -------------------
    // 3. protected 跳转
    // -------------------
    if (url.pathname === "/protected") {
      const token = url.searchParams.get("token");
      if (!token) return new Response("无效访问", { status: 403 });

      const valid = await env.TOKEN_KV.get(token);
      if (!valid) return new Response("Token 已过期或无效", { status: 403 });

      // Token 有效 → 跳转主站
      return Response.redirect("https://主站.com", 302);
    }

    // -------------------
    // 默认返回
    // -------------------
    return new Response("Not found", { status: 404 });
  }
};
