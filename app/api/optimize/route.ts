import { optimizeScenario } from "@/lib/optimize";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Request body must be JSON.",
        fieldErrors: {},
      },
      { status: 400 },
    );
  }

  const result = optimizeScenario(body);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
