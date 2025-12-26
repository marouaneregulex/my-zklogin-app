import { throwExpression } from "../shared/utils";

export const TANZANITE_PACKAGE_ID =
  process.env.NEXT_PUBLIC_TANZANITE_PACKAGE_ID ??
  throwExpression(new Error("NEXT_PUBLIC_TANZANITE_PACKAGE_ID not configured"));
