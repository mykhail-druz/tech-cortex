'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import * as adminDbService from '@/lib/supabase/adminDb';
import { Category } from '@/lib/supabase/types/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable category item component
const SortableCategoryItem = ({ 
  category, 
  depth = 0, 
  isOverlay = false,
  parentName = null
}: { 
  category: Category & { is_container?: boolean }; 
  depth?: number; 
  isOverlay?: boolean;
  parentName?: string | null;
}) => {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging
  } = useSortable({ 
    id: category.id,
    disabled: isOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: `${depth * 1.5}rem`,
    zIndex: isDragging ? 999 : 'auto'
  };

  const isSubcategory = category.is_subcategory || depth > 0;
  const isContainer = category.is_container === true;

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md p-4 mb-3 
        ${isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''}
        ${isOverlay ? 'shadow-xl ring-2 ring-blue-500' : ''}
        ${isSubcategory ? 'border-l-4 border-blue-400' : ''}
        ${isContainer ? 'border-l-4 border-yellow-400 bg-yellow-50' : ''}
        transition-all duration-200
        hover:bg-blue-50 hover:shadow-lg
        cursor-move flex items-center justify-between
        relative
      `}
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? { 
        marginLeft: `${depth * 1.5}rem`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      } : style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
    >
      {/* Drag indicator */}
      <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 bg-blue-500 h-6 w-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center">
        <div className="mr-3 text-gray-400 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
        <div className="flex-grow">
          <div className="flex items-center">
            <p className="font-medium">{category.name}</p>
            {isContainer && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Container
              </span>
            )}
            {isSubcategory && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                Subcategory
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap items-center">
            {isContainer ? (
              'Contains PC component subcategories'
            ) : (
              <>
                {isSubcategory && parentName && (
                  <span className="mr-2 text-blue-600 font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Parent: {parentName}
                  </span>
                )}
                <span>{category.pc_component_type || 'No component type'}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500 flex-shrink-0 ml-2 flex flex-col items-end">
        <span className="px-2 py-1 bg-gray-100 rounded mb-1">
          Order: {category.pc_display_order || 0}
        </span>
        {isSubcategory && (
          <span className="text-xs text-gray-500">
            Drag to reorder or change parent
          </span>
        )}
      </div>
    </div>
  );
};

export default function PCConfiguratorCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [flattenedCategories, setFlattenedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch PC Configurator categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Direct query for all PC component categories, similar to usePCCategories hook
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_pc_component', true)
          .order('pc_display_order');
        
        if (error) {
          throw error;
        }

        if (!data) {
          setCategories([]);
          setFlattenedCategories([]);
          return;
        }

        // All categories are already PC components due to the direct query
        // Keep them in a flat list, just like in PC Builder
        const allPcCategories = data;
        
        // Create a map of parent IDs to parent names for displaying parent info
        const parentNameMap: Record<string, string> = {};
        allPcCategories.forEach(category => {
          parentNameMap[category.id] = category.name;
        });
        
        // Enhance subcategories with parent name for display
        const enhancedCategories = allPcCategories.map(category => {
          if (category.is_subcategory && category.parent_id && parentNameMap[category.parent_id]) {
            return {
              ...category,
              parentName: parentNameMap[category.parent_id]
            };
          }
          return category;
        });
        
        // Sort all categories by pc_display_order
        enhancedCategories.sort((a, b) => (a.pc_display_order || 0) - (b.pc_display_order || 0));
        
        setCategories(enhancedCategories);
        setFlattenedCategories(enhancedCategories);
      } catch (error) {
        console.error('Error fetching PC Configurator categories:', error);
        toast.error('Failed to load PC Configurator categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);


  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    
    const draggedCategory = flattenedCategories.find(cat => cat.id === active.id);
    if (draggedCategory) {
      setActiveCategory(draggedCategory);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    try {
      if (!over || active.id === over.id) {
        setActiveCategory(null);
        return;
      }
      
      // Find the categories being dragged and dropped on
      const activeCategory = flattenedCategories.find(cat => cat.id === active.id);
      const overCategory = flattenedCategories.find(cat => cat.id === over.id);
      
      if (!activeCategory || !overCategory) {
        setActiveCategory(null);
        return;
      }
      
      // Show feedback to the user
      toast.info(`Reordering ${activeCategory.name}`);
      
      // Simple reordering in the flat list
      setCategories(prevCategories => {
        const oldIndex = prevCategories.findIndex(cat => cat.id === activeCategory.id);
        const newIndex = prevCategories.findIndex(cat => cat.id === overCategory.id);
        
        if (oldIndex === -1 || newIndex === -1) return prevCategories;
        
        // Move the item in the array
        const newCategories = arrayMove(prevCategories, oldIndex, newIndex);
        
        // Update display order for all categories
        const updatedCategories = newCategories.map((cat, idx) => ({
          ...cat,
          pc_display_order: idx + 1
        }));
        
        // Update flattened list (which is the same as categories now)
        setFlattenedCategories(updatedCategories);
        setHasChanges(true);
        
        return updatedCategories;
      });
      
      setActiveCategory(null);
    } catch (error) {
      console.error('Error during drag operation:', error);
      toast.error('An error occurred while reordering. Please try again.');
      setActiveCategory(null);
    }
  };

  // Save the new order to the database
  const saveOrder = async () => {
    try {
      setSaving(true);
      
      // Create an array of all update promises
      const updatePromises: Promise<{ data: Category | null; error: Error | null }>[] = [];
      
      // Update all categories with their new display order
      categories.forEach((category, index) => {
        updatePromises.push(
          adminDbService.updateCategory(category.id, {
            pc_display_order: index + 1
          })
        );
      });
      
      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors saving category order:', errors);
        toast.error(`Failed to save order for ${errors.length} categories`);
        return;
      }
      
      toast.success('Category order saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving category order:', error);
      toast.error('Failed to save category order');
    } finally {
      setSaving(false);
    }
  };

  // Render a single category item
  const renderCategoryItem = (category: Category & { parentName?: string }) => {
    return (
      <SortableCategoryItem 
        key={category.id} 
        category={category} 
        depth={0}
        parentName={category.parentName}
      />
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PC Configurator Categories Order</h1>
        <div className="flex space-x-4">
          <Link 
            href="/admin/pc-configurator"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={saveOrder}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded ${
              !hasChanges
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600">No PC Configurator categories found.</p>
          <p className="mt-2 text-gray-500">
            You can mark categories as PC components in the{' '}
            <Link href="/admin/categories" className="text-blue-500 hover:underline">
              Categories
            </Link>{' '}
            section.
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Instructions</h2>
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">How to use:</p>
                <ol className="list-decimal pl-5 space-y-1 text-gray-600">
                  <li>Grab any category or subcategory by the drag handle (the lines icon)</li>
                  <li>Drag it to a new position in the list</li>
                  <li>Release to drop it in the new position</li>
                  <li>Click &quot;Save Order&quot; when you&apos;re satisfied with the arrangement</li>
                </ol>
              </div>
            </div>
            
            <div className="flex items-start mb-4">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Flat List Structure:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li><span className="font-medium">All categories in one list:</span> Both main categories and subcategories are displayed in a single flat list</li>
                  <li><span className="font-medium">Subcategories are marked:</span> Subcategories show a blue border and display their parent category name</li>
                  <li><span className="font-medium">Reorder freely:</span> You can place subcategories anywhere in the list, even before their parent categories</li>
                  <li>This matches how categories are displayed in the PC Builder interface</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-yellow-100 text-yellow-800 p-2 rounded-full mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">Important notes:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>The order you set here will be the order in which categories appear to users in the PC Configurator</li>
                  <li>All categories and subcategories can be freely reordered in the list</li>
                  <li>The parent-child relationships between categories remain unchanged</li>
                  <li>Changes won&apos;t be saved until you click the &quot;Save Order&quot; button</li>
                  <li>This flat list approach matches exactly how categories are displayed in the PC Builder</li>
                </ul>
              </div>
            </div>
          </div>

          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={flattenedCategories.map(cat => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="mb-3">
                    {renderCategoryItem(category)}
                  </div>
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeCategory ? (
                <SortableCategoryItem 
                  category={activeCategory} 
                  isOverlay={true}
                  depth={activeCategory.is_subcategory ? 1 : 0}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  );
}