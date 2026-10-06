export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const TIPOS_ARQUIVO = ['pgr', 'ltcat', 'ficha_epi', 'outro'] as const;

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Confere a assinatura (magic bytes) do arquivo contra o tipo declarado pela extensão. */
export function detectMime(ext: string, head: Uint8Array): string | null {
  const mime = EXT_MIME[ext];
  if (!mime) return null;
  const starts = (...b: number[]) => b.every((v, i) => head[i] === v);
  switch (mime) {
    case 'application/pdf':    return starts(0x25, 0x50, 0x44, 0x46) ? mime : null;
    case 'image/jpeg':         return starts(0xff, 0xd8, 0xff) ? mime : null;
    case 'image/png':          return starts(0x89, 0x50, 0x4e, 0x47) ? mime : null;
    case 'image/webp':         return starts(0x52, 0x49, 0x46, 0x46) && head[8] === 0x57 ? mime : null;
    case 'application/msword': return starts(0xd0, 0xcf, 0x11, 0xe0) ? mime : null;
    default:                   return starts(0x50, 0x4b) ? mime : null; // docx = zip
  }
}
