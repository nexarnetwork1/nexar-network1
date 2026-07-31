import type {
  MerchantAssistantProvider,
  MerchantAssistantRequest,
  MerchantAssistantResponse,
  MerchantAssistantTask,
} from "./types";

function buildDemoResponse(task: MerchantAssistantTask, input: string): string {
  const topic = input.trim() || "your product";

  switch (task) {
    case "title":
      return [
        `${topic} — Pro Edition`,
        `Nexar Select · ${topic}`,
        `Premium ${topic} | Verified Merchant`,
      ].join("\n");
    case "description":
      return `Discover ${topic} crafted for discerning buyers on Nexar Commerce. Highlight premium materials, verified fulfillment, and seamless checkout with global crypto and card payments.\n\n• Enterprise-grade quality\n• Fast, tracked delivery\n• Buyer protection included`;
    case "seo":
      return `Meta title: ${topic} | Buy on Nexar Commerce\nMeta description: Shop ${topic} from verified merchants with secure checkout, global delivery, and premium buyer protection.\nSlug: ${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product"}`;
    case "keywords":
      return `${topic}, buy online, verified merchant, nexar commerce, secure checkout, global shipping, premium marketplace`;
    case "tags":
      return `Premium, Trending, Verified, New Arrival, ${topic.split(/\s+/).slice(0, 2).join(", ")}`;
    case "marketing":
      return `Headline: Elevate every moment with ${topic}\n\nSubcopy: Limited-time spotlight for verified Nexar merchants. Pair with a featured collection, bundle offer, and email capture to lift conversion.\n\nCTA: Shop now · Free returns · Pay with NXR or USDT`;
    case "translation":
      return `[English]\n${topic} — premium quality, trusted seller, fast delivery.\n\n[Arabic demo]\n${topic} — جودة فاخرة، بائع موثوق، توصيل سريع.\n\n(Full multilingual publishing will activate when AI provider is connected.)`;
    case "sales":
      return `Insights (demo):\n• Add social proof badges to ${topic} listings\n• Enable flash pricing for 48 hours\n• Cross-sell complementary accessories\n• Promote in Trending tab with refreshed hero imagery`;
    case "optimization":
      return `Store optimization checklist:\n✓ Refresh hero banner with seasonal offer\n✓ Complete brand verification\n✓ Add 3+ product reviews\n✓ Enable crypto checkout badges\n✓ Publish ${topic} in two featured categories`;
    default:
      return `Suggestions ready for ${topic}.`;
  }
}

export class DemoMerchantAssistantProvider implements MerchantAssistantProvider {
  async generate(request: MerchantAssistantRequest): Promise<MerchantAssistantResponse> {
    return {
      content: buildDemoResponse(request.task, request.input),
      mode: "demo",
    };
  }
}

export const demoMerchantAssistantProvider = new DemoMerchantAssistantProvider();
