const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function assertValidSlug(label: string, value: string): void {
  if (!SLUG_RE.test(value)) {
    throw new SlugError(
      `${label} chỉ gồm chữ thường, số, gạch ngang; 3–32 ký tự, không bắt đầu/kết thúc bằng gạch.`
    );
  }
}

export class SlugError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugError";
  }
}
