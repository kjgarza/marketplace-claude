import { z } from 'zod';

// Define your data schema
const RecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  createdAt: z.coerce.date(),
});

type Record = z.infer<typeof RecordSchema>;

// Extract: Fetch data from source
async function extract(): Promise<unknown[]> {
  console.log('Extracting data...');
  // Replace with actual data source (API, database, file, etc.)
  return [
    { id: '1', name: 'Item 1', value: 100, createdAt: '2024-01-01' },
    { id: '2', name: 'Item 2', value: 200, createdAt: '2024-01-02' },
  ];
}

// Transform: Validate and transform data
async function transform(raw: unknown[]): Promise<Record[]> {
  console.log('Transforming data...');
  const results: Record[] = [];
  const errors: { index: number; error: z.ZodError }[] = [];

  for (let i = 0; i < raw.length; i++) {
    const result = RecordSchema.safeParse(raw[i]);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push({ index: i, error: result.error });
    }
  }

  if (errors.length > 0) {
    console.warn(`Validation errors: ${errors.length} records failed`);
  }

  return results;
}

// Load: Write data to destination
async function load(records: Record[]): Promise<void> {
  console.log('Loading data...');
  // Replace with actual destination (database, file, API, etc.)
  for (const record of records) {
    console.log(`  Loaded: ${record.id} - ${record.name}`);
  }
}

// Main pipeline
async function main() {
  const startTime = Date.now();
  console.log('Starting ETL pipeline...');
  console.log('---');

  try {
    const raw = await extract();
    const transformed = await transform(raw);
    await load(transformed);

    const duration = Date.now() - startTime;
    console.log('---');
    console.log(`Pipeline completed in ${duration}ms`);
    console.log(`Processed ${transformed.length} records`);
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

main();
