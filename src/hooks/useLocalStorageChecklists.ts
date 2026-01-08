import { useState, useEffect, useCallback } from 'react';
import type { CustomChecklist, CustomChecklistItem } from '../types';

const CHECKLISTS_KEY = 'custom_checklists';
const ITEMS_KEY = 'custom_checklist_items';

interface ChecklistWithItems {
  checklist: CustomChecklist;
  items: CustomChecklistItem[];
}

export function useLocalStorageChecklists() {
  const [checklists, setChecklists] = useState<CustomChecklist[]>([]);
  const [checklistItems, setChecklistItems] = useState<Record<string, CustomChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const checklistsData = localStorage.getItem(CHECKLISTS_KEY);
      const itemsData = localStorage.getItem(ITEMS_KEY);

      if (checklistsData) {
        setChecklists(JSON.parse(checklistsData));
      }

      if (itemsData) {
        setChecklistItems(JSON.parse(itemsData));
      }
    } catch (error) {
      console.error('Error loading checklists from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveToStorage = useCallback((
    updatedChecklists: CustomChecklist[],
    updatedItems: Record<string, CustomChecklistItem[]>
  ) => {
    try {
      localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(updatedChecklists));
      localStorage.setItem(ITEMS_KEY, JSON.stringify(updatedItems));
      setChecklists(updatedChecklists);
      setChecklistItems(updatedItems);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw error;
    }
  }, []);

  const createChecklist = useCallback((
    title: string,
    description?: string,
    items: Omit<CustomChecklistItem, 'id' | 'checklist_id'>[] = []
  ): string => {
    const checklistId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newChecklist: CustomChecklist = {
      id: checklistId,
      title,
      description,
      created_at: now,
      updated_at: now,
    };

    const newItems: CustomChecklistItem[] = items.map((item, index) => ({
      ...item,
      id: crypto.randomUUID(),
      checklist_id: checklistId,
      order_index: item.order_index ?? index,
    }));

    const updatedChecklists = [...checklists, newChecklist];
    const updatedItems = {
      ...checklistItems,
      [checklistId]: newItems,
    };

    saveToStorage(updatedChecklists, updatedItems);
    return checklistId;
  }, [checklists, checklistItems, saveToStorage]);

  const updateChecklist = useCallback((
    checklistId: string,
    updates: Partial<Omit<CustomChecklist, 'id' | 'created_at'>>,
    items?: CustomChecklistItem[]
  ) => {
    const updatedChecklists = checklists.map((checklist) =>
      checklist.id === checklistId
        ? { ...checklist, ...updates, updated_at: new Date().toISOString() }
        : checklist
    );

    let updatedItems = { ...checklistItems };
    if (items) {
      updatedItems = {
        ...checklistItems,
        [checklistId]: items,
      };
    }

    saveToStorage(updatedChecklists, updatedItems);
  }, [checklists, checklistItems, saveToStorage]);

  const deleteChecklist = useCallback((checklistId: string) => {
    const updatedChecklists = checklists.filter((c) => c.id !== checklistId);
    const updatedItems = { ...checklistItems };
    delete updatedItems[checklistId];

    saveToStorage(updatedChecklists, updatedItems);
  }, [checklists, checklistItems, saveToStorage]);

  const getChecklist = useCallback((checklistId: string): ChecklistWithItems | null => {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (!checklist) return null;

    return {
      checklist,
      items: checklistItems[checklistId] || [],
    };
  }, [checklists, checklistItems]);

  const updateItem = useCallback((
    checklistId: string,
    itemId: string,
    updates: Partial<Omit<CustomChecklistItem, 'id' | 'checklist_id'>>
  ) => {
    const items = checklistItems[checklistId] || [];
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    const allUpdatedItems = {
      ...checklistItems,
      [checklistId]: updatedItems,
    };

    const updatedChecklists = checklists.map((checklist) =>
      checklist.id === checklistId
        ? { ...checklist, updated_at: new Date().toISOString() }
        : checklist
    );

    saveToStorage(updatedChecklists, allUpdatedItems);
  }, [checklists, checklistItems, saveToStorage]);

  const toggleItemComplete = useCallback((checklistId: string, itemId: string) => {
    const items = checklistItems[checklistId] || [];
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    updateItem(checklistId, itemId, { completed: !item.completed });
  }, [checklistItems, updateItem]);

  const addItem = useCallback((
    checklistId: string,
    item: Omit<CustomChecklistItem, 'id' | 'checklist_id' | 'order_index'>
  ) => {
    const items = checklistItems[checklistId] || [];
    const newItem: CustomChecklistItem = {
      ...item,
      id: crypto.randomUUID(),
      checklist_id: checklistId,
      order_index: items.length,
    };

    const updatedItems = {
      ...checklistItems,
      [checklistId]: [...items, newItem],
    };

    const updatedChecklists = checklists.map((checklist) =>
      checklist.id === checklistId
        ? { ...checklist, updated_at: new Date().toISOString() }
        : checklist
    );

    saveToStorage(updatedChecklists, updatedItems);
  }, [checklists, checklistItems, saveToStorage]);

  const deleteItem = useCallback((checklistId: string, itemId: string) => {
    const items = checklistItems[checklistId] || [];
    const updatedItems = {
      ...checklistItems,
      [checklistId]: items.filter((item) => item.id !== itemId),
    };

    const updatedChecklists = checklists.map((checklist) =>
      checklist.id === checklistId
        ? { ...checklist, updated_at: new Date().toISOString() }
        : checklist
    );

    saveToStorage(updatedChecklists, updatedItems);
  }, [checklists, checklistItems, saveToStorage]);

  const resetAllData = useCallback(() => {
    localStorage.removeItem(CHECKLISTS_KEY);
    localStorage.removeItem(ITEMS_KEY);
    setChecklists([]);
    setChecklistItems({});
  }, []);

  const getChecklistStats = useCallback((checklistId: string) => {
    const items = checklistItems[checklistId] || [];
    const completedCount = items.filter((item) => item.completed).length;
    const totalCount = items.length;
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      completedCount,
      completionPercentage,
    };
  }, [checklistItems]);

  return {
    checklists,
    checklistItems,
    loading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    getChecklist,
    updateItem,
    toggleItemComplete,
    addItem,
    deleteItem,
    resetAllData,
    getChecklistStats,
  };
}
