import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { useEEItemsManager } from '../hooks/useEEItemsManager';
import type { EEItemEntry } from '../../../models';

interface EEItemsManagerProps {
  formId: string;
  items: EEItemEntry[];
  onChange: (items: EEItemEntry[]) => void;
}

export function EEItemsManager({ formId, items, onChange }: EEItemsManagerProps) {
  const {
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
    setSelectedEEItemId,
    setBidPrice,
    setQty,
    setEditBidPrice,
    setEditQty,
    handleAddItem,
    handleDeleteItem,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
  } = useEEItemsManager({ items, onChange });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engineer's Estimate Items</CardTitle>
          <CardDescription>Loading available items...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center gap-2">
          <span>Engineer's Estimate Items</span>
          <Badge variant="secondary">{items.length} items</Badge>
        </CardTitle>
        <CardDescription>
          Add items from the Engineer's Estimate with bid prices and quantities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Add Item Form */}
        <div className="border-2 border-dashed border-green-200 rounded-lg p-4 bg-green-50/50">
          <h3 className="mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="ee-item-select">EE Item</Label>
              <Select value={selectedEEItemId} onValueChange={setSelectedEEItemId}>
                <SelectTrigger id="ee-item-select">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <div key={category}>
                      <div className="px-2 py-1.5 font-semibold text-xs text-gray-500 uppercase">
                        {category}
                      </div>
                      {availableItems
                        .filter(item => item.category === category)
                        .map(item => (
                          <SelectItem key={item.ee_item_id} value={item.ee_item_id}>
                            {item.ee_item_id} - {item.description} ({item.unit})
                          </SelectItem>
                        ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bid-price">Bid Price ($)</Label>
              <Input
                id="bid-price"
                type="number"
                step="0.01"
                min="0"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                step="0.01"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button 
              onClick={handleAddItem}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="w-[100px]">Item ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]">Unit</TableHead>
                  <TableHead className="w-[120px] text-right">Bid Price</TableHead>
                  <TableHead className="w-[100px] text-right">Qty</TableHead>
                  <TableHead className="w-[120px] text-right">Total</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.ee_item_id}</TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{item.unit}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editBidPrice}
                          onChange={(e) => setEditBidPrice(e.target.value)}
                          className="w-full text-right"
                        />
                      ) : (
                        `$${item.bid_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-full text-right"
                        />
                      ) : (
                        item.qty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${(editingId === item.id 
                        ? (parseFloat(editBidPrice) || 0) * (parseFloat(editQty) || 0)
                        : item.total
                      ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {editingId === item.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(item)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(item)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-50 font-semibold">
                  <TableCell colSpan={5} className="text-right">
                    Total Amount:
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No items added yet. Use the form above to add EE items.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
