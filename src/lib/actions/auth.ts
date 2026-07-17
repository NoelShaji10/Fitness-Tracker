"use server";

import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = authSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already registered." };
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("SignUp error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = authSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    // Check if error is next redirect (which is a standard next.js routing behaviour when redirecting on success)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    return { error: "Authentication failed. Please verify your credentials." };
  }
}
