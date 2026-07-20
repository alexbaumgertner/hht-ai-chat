import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Conversation } from "@/models/Conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Generate an assistant reply. When an OpenAI-compatible key is configured we
 * use the Vercel AI SDK; otherwise we fall back to a deterministic local reply
 * so the app is fully functional without any external credentials.
 */
async function generateReply(history: ChatMessage[], userMessage: string): Promise<string> {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);

  if (hasKey) {
    try {
      const [{ generateText }, { openai }] = await Promise.all([
        import("ai"),
        import("@ai-sdk/openai"),
      ]);

      const { text } = await generateText({
        model: openai(process.env.OPENAI_MODEL ?? "gpt-4o-mini"),
        system:
          "You are HHT AI Chat, a concise and friendly assistant. Answer clearly and helpfully.",
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content: userMessage },
        ],
      });

      return text.trim();
    } catch (error) {
      console.error("AI provider error, falling back to local reply:", error);
    }
  }

  const trimmed = userMessage.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  return [
    `Hi! I'm HHT AI Chat running in local (mock) mode.`,
    `You said: "${trimmed}" (${wordCount} word${wordCount === 1 ? "" : "s"}).`,
    `Set an OPENAI_API_KEY environment variable to get real AI-generated responses.`,
  ].join(" ");
}

export async function POST(request: Request) {
  let body: { message?: unknown; conversationId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId : undefined;

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const conversation = conversationId
      ? await Conversation.findById(conversationId)
      : null;

    const activeConversation =
      conversation ??
      new Conversation({
        title: message.slice(0, 60),
        messages: [],
      });

    const history: ChatMessage[] = activeConversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    activeConversation.messages.push({ role: "user", content: message });
    const reply = await generateReply(history, message);
    activeConversation.messages.push({ role: "assistant", content: reply });

    await activeConversation.save();

    return NextResponse.json({
      conversationId: activeConversation._id.toString(),
      reply,
      messages: activeConversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 },
    );
  }
}
