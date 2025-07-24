import { SpecificationUpdater } from '../src/lib/supabase/utils/updateSpecifications.js';

async function main() {
  console.log('🚀 Starting specification update...');
  
  try {
    const result = await SpecificationUpdater.updateAllTemplates();
    
    if (result.success) {
      console.log('🎉 Update completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Update failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();