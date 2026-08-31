import { describe, it, expect, vi } from "vitest";
import { checkinChildHandler, checkoutChildHandler } from "./kids.server";

// Mock do supabaseAdmin
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: { id: "mock-id" }, error: null })),
  },
}));

describe("Módulo Kids - Lógica de Servidor", () => {
  it("deve realizar check-in de uma criança corretamente", async () => {
    const mockData = {
      childId: "550e8400-e29b-41d4-a716-446655440000",
      sessionId: "550e8400-e29b-41d4-a716-446655440001",
      securityCode: "A1B2",
    };

    const result = await checkinChildHandler(mockData);
    expect(result).toBeDefined();
    expect(result.id).toBe("mock-id");
  });

  it("deve realizar check-out de uma criança corretamente", async () => {
    const mockData = {
      checkinId: "550e8400-e29b-41d4-a716-446655440000",
      pickedUpByName: "Maria Silva",
    };

    const result = await checkoutChildHandler(mockData);
    expect(result).toBeDefined();
    expect(result.id).toBe("mock-id");
  });
});
