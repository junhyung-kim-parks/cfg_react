import { useState, useEffect } from 'react';
import { getEEItems } from '../../../services/api/eeItems';
import type { EEItem } from '../../../services/embedded_dataset/eeItems';
import type { EEItemEntry } from '../../../models';
import { toast } from 'sonner@2.0.3';

interface UseEEItemsManagerProps {
  items: EEItemEntry[];
  onChange: (items: EEItemEntry[]) => void;
}

export function useEEItemsManager({ items, onChange }: UseEEItemsManagerProps) {
  const [availableItems, setAvailableItems] = useState<EEItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEEItemId, setSelectedEEItemId] = useState<string>('');
  const [bidPrice, setBidPrice] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBidPrice, setEditBidPrice] = useState<string>('');
  const [editQty, setEditQty] = useState<string>('');

  useEffect(() => {
    loadEEItems();
  }, []);

  const loadEEItems = async () => {
    try {
      setLoading(true);
      const data = await getEEItems();
      setAvailableItems(data);
      console.log('✅ EE Items loaded:', data.length);
    } catch (error) {
      console.error('❌ Failed to load EE items:', error);
      toast.error('Failed to load EE items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedEEItemId) {
      toast.error('Please select an item');
      return;
    }

    const priceNum = parseFloat(bidPrice);
    const qtyNum = parseFloat(qty);

    if (!bidPrice || isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid bid price');
      return;
    }

    if (!qty || isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const selectedItem = availableItems.find(item => item.ee_item_id === selectedEEItemId);
    if (!selectedItem) {
      toast.error('Selected item not found');
      return;
    }

    const total = priceNum * qtyNum;

    const newEntry: EEItemEntry = {
      id: `ee-entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ee_item_id: selectedItem.ee_item_id,
      description: selectedItem.description,
      unit: selectedItem.unit,
      bid_price: priceNum,
      qty: qtyNum,
      total: total
    };

    onChange([...items, newEntry]);

    // Reset form
    setSelectedEEItemId('');
    setBidPrice('');
    setQty('');

    toast.success('Item added successfully');
  };

  const handleDeleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    toast.success('Item removed');
  };

  const handleStartEdit = (item: EEItemEntry) => {
    setEditingId(item.id);
    setEditBidPrice(item.bid_price.toString());
    setEditQty(item.qty.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBidPrice('');
    setEditQty('');
  };

  const handleSaveEdit = (item: EEItemEntry) => {
    const priceNum = parseFloat(editBidPrice);
    const qtyNum = parseFloat(editQty);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid bid price');
      return;
    }

    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const updatedItems = items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          bid_price: priceNum,
          qty: qtyNum,
          total: priceNum * qtyNum
        };
      }
      return i;
    });

    onChange(updatedItems);
    setEditingId(null);
    setEditBidPrice('');
    setEditQty('');
    toast.success('Item updated');
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const categories = Array.from(new Set(availableItems.map(item => item.category)));

  return {
    // State
    availableItems,
    loading,
    selectedEEItemId,
    bidPrice,
    qty,
    editingId,
    editBidPrice,
    editQty,
    totalAmount,
    categories,
    
    // Setters
    setSelectedEEItemId,
    setBidPrice,
    setQty,
    setEditBidPrice,
    setEditQty,
    
    // Actions
    handleAddItem,
    handleDeleteItem,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  };
}
