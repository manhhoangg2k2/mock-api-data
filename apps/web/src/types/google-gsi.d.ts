export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: string | number;
              type?: string;
              text?: string;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}
