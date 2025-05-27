// Test script to verify product deletion and image cleanup
const { deleteProduct } = require('./lib/supabase/adminDb');

// Replace with an actual product ID from your database
const productIdToDelete = 'your-product-id-here';

async function testDeleteProduct() {
  console.log(`Testing deletion of product with ID: ${productIdToDelete}`);
  
  try {
    const result = await deleteProduct(productIdToDelete);
    
    if (result.error) {
      console.error('Error deleting product:', result.error);
    } else {
      console.log('Product deleted successfully!');
      console.log('Check the logs above to verify that images were deleted from storage');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testDeleteProduct();