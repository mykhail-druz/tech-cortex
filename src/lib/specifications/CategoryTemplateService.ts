import { SimpleSpecificationService } from "./SimpleSpecificationService";
import { getTemplatesForCategorySlug, hasTemplatesForCategory, getAvailableCategorySlugs } from "./categoryTemplates";
import { supabase } from "@/lib/supabaseClient";

/**
 * Service for managing hardcoded template application to categories
 */
export class CategoryTemplateService {
  
  /**
   * Apply hardcoded templates to a category
   * Called when creating or editing a category
   */
  static async applyTemplatesForCategory(categoryId: string, categorySlug: string): Promise<{
    success: boolean;
    templatesApplied: number;
    errors?: string[];
  }> {
    try {
      console.log(`Applying templates for category: ${categorySlug} (ID: ${categoryId})`);
      
      // Check if there are templates for this category
      if (!hasTemplatesForCategory(categorySlug)) {
        console.log(`No predefined templates found for category: ${categorySlug}`);
        return {
          success: true,
          templatesApplied: 0
        };
      }
      
      // Get templates for the category
      const templates = getTemplatesForCategorySlug(categorySlug);
      if (!templates || templates.length === 0) {
        return {
          success: true,
          templatesApplied: 0
        };
      }
      
      console.log(`Found ${templates.length} templates for category ${categorySlug}`);
      
      // Check if there are already templates for this category
      const existingTemplatesResult = await SimpleSpecificationService.getTemplatesForCategory(categoryId);
      if (existingTemplatesResult.success && existingTemplatesResult.data && existingTemplatesResult.data.length > 0) {
        console.log(`Category ${categorySlug} already has ${existingTemplatesResult.data.length} templates. Skipping.`);
        return {
          success: true,
          templatesApplied: 0
        };
      }
      
      // Apply templates to the category
      const result = await SimpleSpecificationService.createTemplatesForCategory(categoryId, templates);
      
      if (result.success) {
        console.log(`Successfully applied ${templates.length} templates to category ${categorySlug}`);
        return {
          success: true,
          templatesApplied: templates.length
        };
      } else {
        console.error(`Failed to apply templates to category ${categorySlug}:`, result.errors);
        return {
          success: false,
          templatesApplied: 0,
          errors: result.errors
        };
      }
      
    } catch (error) {
      console.error(`Error applying templates for category ${categorySlug}:`, error);
      return {
        success: false,
        templatesApplied: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    }
  }
  
  /**
   * Update category templates (remove old ones and create new ones)
   * Used when changing category slug
   */
  static async updateTemplatesForCategory(categoryId: string, newCategorySlug: string): Promise<{
    success: boolean;
    templatesUpdated: number;
    errors?: string[];
  }> {
    try {
      console.log(`Updating templates for category: ${newCategorySlug} (ID: ${categoryId})`);
      
      // Remove existing templates
      const existingTemplatesResult = await SimpleSpecificationService.getTemplatesForCategory(categoryId);
      if (existingTemplatesResult.success && existingTemplatesResult.data) {
        for (const template of existingTemplatesResult.data) {
          await SimpleSpecificationService.deleteTemplate(template.id);
        }
        console.log(`Removed ${existingTemplatesResult.data.length} existing templates`);
      }
      
      // Apply new templates
      const applyResult = await this.applyTemplatesForCategory(categoryId, newCategorySlug);
      
      return {
        success: applyResult.success,
        templatesUpdated: applyResult.templatesApplied,
        errors: applyResult.errors
      };
      
    } catch (error) {
      console.error(`Error updating templates for category ${newCategorySlug}:`, error);
      return {
        success: false,
        templatesUpdated: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    }
  }
  
  /**
   * Get information about category templates
   */
  static async getCategoryTemplateInfo(categoryId: string, categorySlug: string): Promise<{
    hasHardcodedTemplates: boolean;
    hardcodedTemplatesCount: number;
    appliedTemplatesCount: number;
    needsTemplateApplication: boolean;
  }> {
    try {
      // Check for hardcoded templates
      const hardcodedTemplates = getTemplatesForCategorySlug(categorySlug);
      const hasHardcodedTemplates = hardcodedTemplates !== null;
      const hardcodedTemplatesCount = hardcodedTemplates?.length || 0;
      
      // Check applied templates
      const appliedTemplatesResult = await SimpleSpecificationService.getTemplatesForCategory(categoryId);
      const appliedTemplatesCount = appliedTemplatesResult.success && appliedTemplatesResult.data 
        ? appliedTemplatesResult.data.length 
        : 0;
      
      // Determine if templates need to be applied
      const needsTemplateApplication = hasHardcodedTemplates && appliedTemplatesCount === 0;
      
      return {
        hasHardcodedTemplates,
        hardcodedTemplatesCount,
        appliedTemplatesCount,
        needsTemplateApplication
      };
      
    } catch (error) {
      console.error(`Error getting template info for category ${categorySlug}:`, error);
      return {
        hasHardcodedTemplates: false,
        hardcodedTemplatesCount: 0,
        appliedTemplatesCount: 0,
        needsTemplateApplication: false
      };
    }
  }
  
  /**
   * Get list of all categories that have hardcoded templates
   */
  static getAvailableTemplateCategories(): string[] {
    return getAvailableCategorySlugs();
  }
  
  /**
   * Initialize templates for all existing categories
   * Useful for initial system setup
   */
  static async initializeAllCategoryTemplates(): Promise<{
    success: boolean;
    processedCategories: number;
    appliedTemplates: number;
    errors?: string[];
  }> {
    try {
      console.log("Initializing templates for all categories...");
      
      // Get all categories from database
      const { data: categories, error } = await supabase
        .from("categories")
        .select("id, slug, name");
        
      if (error) {
        throw error;
      }
      
      if (!categories || categories.length === 0) {
        return {
          success: true,
          processedCategories: 0,
          appliedTemplates: 0
        };
      }
      
      let processedCategories = 0;
      let totalAppliedTemplates = 0;
      const errors: string[] = [];
      
      // Process each category
      for (const category of categories) {
        if (!category.slug) continue;
        
        try {
          const result = await this.applyTemplatesForCategory(category.id, category.slug);
          processedCategories++;
          totalAppliedTemplates += result.templatesApplied;
          
          if (!result.success && result.errors) {
            errors.push(...result.errors);
          }
          
        } catch (error) {
          errors.push(`Error processing category ${category.name}: ${error}`);
        }
      }
      
      console.log(`Processed ${processedCategories} categories, applied ${totalAppliedTemplates} templates`);
      
      return {
        success: errors.length === 0,
        processedCategories,
        appliedTemplates: totalAppliedTemplates,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      console.error("Error initializing category templates:", error);
      return {
        success: false,
        processedCategories: 0,
        appliedTemplates: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"]
      };
    }
  }
}