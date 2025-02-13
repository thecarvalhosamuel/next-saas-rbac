export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form (NFD)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single one
}
