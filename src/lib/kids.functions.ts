import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getChildrenHandler, checkinChildHandler, checkoutChildHandler } from "./kids.server";

export const getChildren = createServerFn({ method: "GET" })
  .validator((data: { search?: string }) =>
    z.object({ search: z.string().optional() }).optional().parse(data),
  )
  .handler(async ({ data }) => {
    return getChildrenHandler(data || {});
  });

export const checkinChild = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        childId: z.string().uuid(),
        sessionId: z.string().uuid(),
        droppedByName: z.string().optional(),
        securityCode: z.string(),
        dayNotes: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return checkinChildHandler(data);
  });

export const checkoutChild = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        checkinId: z.string().uuid(),
        pickedUpByName: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return checkoutChildHandler(data);
  });
