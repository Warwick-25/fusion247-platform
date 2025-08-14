import NextAuth from "next-auth";
import { authOptions } from "@/auth";

export const dynamic = "force-dynamic";

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;
