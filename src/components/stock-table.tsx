
"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { File, MoreHorizontal, PlusCircle, ChevronDown, ChevronRight, Search } from "lucide-react"
import type { StockItem } from "@/lib/types"
import { AddItemDialog } from "./add-item-dialog"
import { Input } from "./ui/input"
import { cn } from "@/lib/utils"

function formatCurrency(amount: number, currency: 'Kip' | 'Baht') {
    const currencySymbol = currency === 'Kip' ? ' ກີບ' : ' ບາດ';
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(amount) + currencySymbol;
}

const categoryColors: Record<string, string> = {
    'ຝຸ່ນ': 'bg-green-100',
    'ແນວພັນ': 'bg-yellow-100',
    'ຢາພືດ': 'bg-red-100',
    'ຢາສັດ': 'bg-rose-100',
    'ອຸປະກອນ': 'bg-blue-100',
    'ເຂົ້າ': 'bg-amber-100',
    'ຫົວອາຫານ': 'bg-orange-100',
    'ວິຕາມິນ': 'bg-purple-100',
};

const getCategoryColor = (category: string) => categoryColors[category] || 'bg-gray-100';

type StockTableProps = {
    data: StockItem[];
    categories: string[];
    onAddItem: (item: Omit<StockItem, 'id'>) => Promise<void>;
    onUpdateItem: (id: string, updatedFields: Partial<StockItem>) => Promise<void>;
    onDeleteItem: (id: string) => Promise<void>;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
}

export function StockTable({ data, categories, onAddItem, onUpdateItem, onDeleteItem, searchQuery, onSearchQueryChange }: StockTableProps) {
    const [isAddItemOpen, setAddItemOpen] = React.useState(false)
    const [collapsedCategories, setCollapsedCategories] = React.useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const handleFieldChange = (id: string, field: keyof StockItem, value: string | number) => {
        onUpdateItem(id, { [field]: value });
    };

    const groupedData = data.reduce((acc, item) => {
        const category = item.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(item);
        return acc;
    }, {} as Record<string, StockItem[]>);


  return (
    <>
    <Card>
        <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <CardTitle>ສິນຄ້າໃນຄັງ</CardTitle>
                    <CardDescription>
                    ຈັດການສິນຄ້າ ແລະ ເບິ່ງລະດັບສະຕັອກຂອງທ່ານ
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:grow-0 w-full sm:w-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="ຄົ້ນຫາສິນຄ້າ..."
                          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                          value={searchQuery}
                          onChange={(e) => onSearchQueryChange(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-9 gap-1 shrink-0">
                            <File className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            ສົ່ງອອກ
                            </span>
                        </Button>
                        <Button size="sm" className="h-9 gap-1 shrink-0" onClick={() => setAddItemOpen(true)}>
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            ເພີ່ມສິນຄ້າ
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="w-[250px] text-blue-600">ຊື່ສິນຄ້າ</TableHead>
                <TableHead className="text-right text-red-600">ລາຄາຕົ້ນທຶນ (ກີບ)</TableHead>
                <TableHead className="text-right text-red-600">ລາຄາຕົ້ນທຶນ (ບາດ)</TableHead>
                <TableHead className="text-right text-green-600">ລາຄາຂາຍສົ່ງ</TableHead>
                <TableHead className="text-right text-purple-600">ລາຄາຂາຍຍ່ອຍ</TableHead>
                <TableHead className="text-right w-[120px] text-cyan-600">ສະຕັອກປັດຈຸບັນ</TableHead>
                <TableHead className="text-right text-fuchsia-600">ມູນຄ່າ (ກີບ)</TableHead>
                <TableHead>
                    <span className="sr-only">ການດຳເນີນການ</span>
                </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b)).map(([category, items]) => {
                    const isCollapsed = collapsedCategories[category];
                    return (
                    <React.Fragment key={category}>
                        <TableRow className={cn("cursor-pointer", getCategoryColor(category))} onClick={() => toggleCategory(category)}>
                            <TableCell colSpan={8} className="p-2">
                                <div className="flex items-center gap-2">
                                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    <span className="font-semibold">{category}</span>
                                </div>
                            </TableCell>
                        </TableRow>
                        {!isCollapsed && items.map((item) => {
                            const value = item.costPrice * item.currentStock;
                            return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium p-2">
                                    <Input
                                        defaultValue={item.name}
                                        onBlur={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                                        className="h-8 border-none"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.costPrice}
                                        onBlur={(e) => handleFieldChange(item.id, 'costPrice', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.costPriceBaht}
                                        onBlur={(e) => handleFieldChange(item.id, 'costPriceBaht', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.wholesalePrice}
                                        onBlur={(e) => handleFieldChange(item.id, 'wholesalePrice', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        defaultValue={item.sellingPrice}
                                        onBlur={(e) => handleFieldChange(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">
                                    <Input
                                        type="number"
                                        defaultValue={item.currentStock}
                                        onBlur={(e) => handleFieldChange(item.id, 'currentStock', parseInt(e.target.value, 10) || 0)}
                                        className="h-8 w-24 text-right"
                                    />
                                </TableCell>
                                <TableCell className="text-right p-2">{formatCurrency(value, 'Kip')}</TableCell>
                                <TableCell className="p-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button
                                            aria-haspopup="true"
                                            size="icon"
                                            variant="ghost"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onDeleteItem(item.id)}>ລົບ</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )}
                        )}
                    </React.Fragment>
                )})}
            </TableBody>
            </Table>
        </div>
      </CardContent>
      <CardFooter className="px-4 py-2 md:px-6 md:py-3">
        <div className="text-xs text-muted-foreground">
          ສະແດງ <strong>{data.length}</strong> ຈາກ <strong>{data.length}</strong> ສິນຄ້າ
        </div>
      </CardFooter>
    </Card>
    <AddItemDialog open={isAddItemOpen} onOpenChange={setAddItemOpen} onAddItem={onAddItem} categories={categories} />
    </>
  )
}
