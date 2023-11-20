import { createSignal, Show } from 'solid-js';
import toast from 'solid-toast';
import styles, { stylesheet } from './ProgressToast.module.css';
GM_addStyle(stylesheet);

export default function progressToast(initialText: string) {
  const [life, setLife] = createSignal(0);
  const [text, setText] = createSignal(initialText);
  const toastId = toast.custom(
    () => {
      return (
        <>
          <Show when={life() < 100}>
            <div class={styles.toastContainer}>
              <div
                style={{ width: `${life()}%` }}
                class={styles.toastProgress}
              ></div>
              <span
                style={{
                  position: 'relative',
                }}
              >
                {text()}
              </span>
            </div>
          </Show>
          <Show when={life() == 100}>
            <div class={styles.toastComplete}>
              <div style={{ width: `0%` }} class={styles.toastProgress}></div>
              <span
                style={{
                  position: 'relative',
                }}
              >
                {text()}
              </span>
            </div>
          </Show>
        </>
      );
    },
    {
      duration: 999999,
    },
  );
  return {
    setProgress: setLife,
    dismiss: () => toast.dismiss(toastId),
    setText,
    toastId,
  };
}
