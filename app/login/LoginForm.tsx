"use client";

import { useActionState } from "react";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { FormAlert } from "@/components/molecules/FormField";
import { login, type LoginState } from "./actions";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {
    ok: false,
  });

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.error ? <FormAlert tone="danger">{state.error}</FormAlert> : null}

      <div>
        <label htmlFor="password" className="mb-1.5 block font-semibold">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          aria-invalid={state.error ? true : undefined}
          className="w-full rounded-card border-2 border-line bg-background px-4 py-3 text-base transition-colors focus:border-brand"
        />
      </div>

      <Button type="submit" size="lg" loading={pending} className="w-full">
        <Icon name="check" size={20} />
        دخول
      </Button>

      <p className="text-center text-sm text-muted">
        هذه المنطقة مخصّصة لصاحب المحل فقط.
      </p>
    </form>
  );
}
