import { useCallback, useEffect, useMemo, useState } from 'react';
import { FORM_LOADED_AT_FIELD, HONEYPOT_FIELD, TURNSTILE_FIELD } from '../../shared/botProtection';
import { api } from '../api/client';

export interface BotFormPayload {
  [HONEYPOT_FIELD]?: string;
  [FORM_LOADED_AT_FIELD]: number;
  [TURNSTILE_FIELD]?: string;
}

interface TurnstileConfig {
  enabled: boolean;
  siteKey: string | null;
}

export function useFormLoadedAt() {
  return useMemo(() => Date.now(), []);
}

export function useBotFormFields() {
  const formLoadedAt = useFormLoadedAt();
  const [website, setWebsite] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [turnstileConfig, setTurnstileConfig] = useState<TurnstileConfig>({
    enabled: false,
    siteKey: null,
  });

  useEffect(() => {
    void api<TurnstileConfig & { turnstileEnabled: boolean; turnstileSiteKey: string | null }>(
      '/auth/config',
    )
      .then((data) => {
        setTurnstileConfig({
          enabled: data.turnstileEnabled,
          siteKey: data.turnstileSiteKey,
        });
      })
      .catch(() => undefined);
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken('');
    setTurnstileKey((k) => k + 1);
  }, []);

  const botFields = useMemo<BotFormPayload>(
    () => ({
      [HONEYPOT_FIELD]: website,
      [FORM_LOADED_AT_FIELD]: formLoadedAt,
      ...(turnstileConfig.enabled && turnstileToken
        ? { [TURNSTILE_FIELD]: turnstileToken }
        : {}),
    }),
    [website, formLoadedAt, turnstileConfig.enabled, turnstileToken],
  );

  return {
    website,
    setWebsite,
    formLoadedAt,
    turnstileToken,
    setTurnstileToken,
    turnstileConfig,
    turnstileKey,
    resetTurnstile,
    botFields,
  };
}
