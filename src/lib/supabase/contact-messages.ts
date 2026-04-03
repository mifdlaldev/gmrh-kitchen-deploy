const missingContactMessagesTablePatterns = [
  "could not find the table 'public.contact_messages' in the schema cache",
  'relation "public.contact_messages" does not exist',
  'relation "contact_messages" does not exist',
];

export function mapContactMessagesErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  const isMissingTable = missingContactMessagesTablePatterns.some((pattern) =>
    normalizedMessage.includes(pattern)
  );

  if (isMissingTable) {
    return "Tabel pesan kontak belum tersedia di database. Jalankan migration `supabase/migrations/20260331_create_contact_messages.sql` di Supabase SQL Editor lalu coba lagi.";
  }

  return message;
}
