import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SendIcon } from '@/components/icons';
import { Alert, Button } from '@/components/ui';
import { useErrorMessage } from '@/lib/errorMessage';
import { useSendMessage, useTypingSignal } from '../hooks';
import { MESSAGE_MAX_LENGTH } from '../types';

/** The counter appears when the message gets close to the limit. */
const SHOW_COUNTER_FROM = MESSAGE_MAX_LENGTH - 100;

/** The message box. Enter sends, Shift+Enter starts a new line. */
export function Composer({ peer }: { peer: { id: string; displayName: string } }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const send = useSendMessage(peer.id);
  const signalTyping = useTypingSignal(peer.id);
  const [text, setText] = useState('');
  const id = useId();
  const body = text.trim();

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!body || send.isPending) return;
    // The text is only cleared once the server has it: nothing is lost on an error.
    send.mutate({ body }, { onSuccess: () => setText('') });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter also confirms a word in Chinese or Japanese input.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border p-3">
      {send.error && <Alert tone="danger">{errorMessage(send.error)}</Alert>}
      <div className="flex items-end gap-2">
        <label htmlFor={id} className="sr-only">
          {t('chat.messageLabel', { name: peer.displayName })}
        </label>
        <textarea
          id={id}
          rows={1}
          value={text}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder={t('chat.placeholder')}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setText(event.target.value);
            if (event.target.value.trim()) signalTyping();
          }}
          onKeyDown={onKeyDown}
          className="max-h-40 min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-fg [field-sizing:content] placeholder:text-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
        <Button type="submit" className="size-11 flex-none p-0" loading={send.isPending} disabled={!body}>
          {!send.isPending && <SendIcon className="text-lg" />}
          <span className="sr-only">{t('chat.send')}</span>
        </Button>
      </div>
      <p id={`${id}-hint`} className="flex justify-between gap-4 px-1 text-xs text-muted">
        <span>{t('chat.enterHint')}</span>
        {text.length >= SHOW_COUNTER_FROM && (
          <span className="tabular-nums">
            {text.length}/{MESSAGE_MAX_LENGTH}
          </span>
        )}
      </p>
    </form>
  );
}
