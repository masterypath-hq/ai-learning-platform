"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useSignIn } from "@/hooks/use-sign-in";
import { getOAuthStartUrl, type OAuthProvider } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Full-page navigation to the backend's OAuth redirect endpoint. Not an XHR call
// because OAuth bounces the browser across google.com / github.com and back.
function startOAuth(provider: OAuthProvider) {
  window.location.href = getOAuthStartUrl(provider);
}

const schema = z.object({
  email:      z.string().email("Enter a valid email"),
  password:   z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function SignInForm() {
  const { mutate: signIn, isPending } = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormData) {
    signIn({ email: data.email, password: data.password });
  }

  return (
    <div data-theme="auth" className="flex flex-col gap-5">
      {/* OAuth buttons */}
      <div className="flex gap-7.5">
        <button
          type="button"
          onClick={() => startOAuth("google")}
          className="flex flex-1 items-center justify-center gap-2 h-12.25 rounded-md border border-[#E2DDD4] bg-white text-sm font-normal text-black hover:bg-[#F5F3EF] transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => startOAuth("github")}
          className="flex flex-1 items-center justify-center gap-2 h-12.25 rounded-md border border-[#E2DDD4] bg-white text-sm font-normal text-black hover:bg-[#F5F3EF] transition-colors"
        >
          <GithubIcon />
          Continue with Github
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[#E2DDD4]" />
        <span className="text-sm font-normal text-stone tracking-[0.04em]">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-[#E2DDD4]" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="enter your password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        {/* Remember me + forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-[#E2DDD4] accent-[#1B3829]"
              {...register("rememberMe")}
            />
            <span className="text-sm text-[#111111]">Keep me signed in</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-teal-dark underline underline-offset-2 transition-colors hover:text-teal"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="lg"
          isLoading={isPending}
          className="w-full h-12.25 bg-[#1B3829] text-white hover:bg-[#142d1f] mt-1"
        >
          Log in
        </Button>
      </form>

      {/* Footer note */}
      <p className="text-center text-xs text-[#6B7280]">
        Free tier: 5 AI messages/day · No credit card needed
      </p>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.573C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57C21.36 18.1 22.56 15.42 22.56 12.25z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
