
"use client"

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Landmark, Wallet, PlusCircle, Calendar as CalendarIcon, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2, Briefcase, Combine, ArrowUpCircle, ArrowDownCircle, Scale, FileText, Banknote, Minus, Equal } from "lucide-react"
import Link from 'next/link'
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval, startOfDay, eachDayOfInterval, getYear, setMonth, getMonth } from "date-fns"
import { th } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { listenToTourAccountSummary, updateTourAccountSummary, listenToTourTransactions, addTourTransaction, updateTourTransaction, deleteTourTransaction } from '@/services/tourAccountancyService';
import type { TourAccountSummary, Transaction, CurrencyValues } from '@/lib/types';

const currencies: (keyof CurrencyValues)[] = ['kip', 'baht', 'usd', 'cny'];
const initialCurrencyValues: CurrencyValues = { kip: 0, baht: 0, usd: 0, cny: 0 };


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(value);
}

const SummaryCard = ({ title, values, icon, onClick, className }: { title: string, values: CurrencyValues, icon: React.ReactNode, onClick?: () => void, className?: string }) => (
    <Card className={`${onClick ? 'cursor-pointer hover:bg-muted/80' : ''} ${className}`} onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <CardTitle className="text-sm font-medium">{title}</CardTitle>
               {onClick && <Pencil className="h-3 w-3 text-muted-foreground" />}
            </div>
            {icon}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1">
            {currencies.map(c => (
                <div key={c} className="text-sm">
                    <span className="font-semibold uppercase">{c}: </span>
                    <span className={values[c] < 0 ? 'text-red-600' : ''}>{formatCurrency(values[c] || 0)}</span>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default function TourAccountancyPage() {
    const { toast } = useToast();
    const [summary, setSummary] = useState<TourAccountSummary | null>(null);
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({ type: 'expense', description: '', kip: 0, baht: 0, usd: 0, cny: 0 });
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isFormVisible, setFormVisible] = useState(true);
    const [historyDisplayMonth, setHistoryDisplayMonth] = useState<Date>(new Date());


    const [editingField, setEditingField] = useState<'capital' | 'cash' | 'transfer' | null>(null);
    const [editingValues, setEditingValues] = useState<CurrencyValues | null>(null);

    useEffect(() => {
        const unsubscribeSummary = listenToTourAccountSummary(setSummary);
        const unsubscribeTransactions = listenToTourTransactions(setTransactions);
        return () => {
            unsubscribeSummary();
            unsubscribeTransactions();
        };
    }, []);

    const totalBalance = useMemo(() => {
        if (!summary) return { ...initialCurrencyValues };
        return currencies.reduce((acc, curr) => {
            acc[curr] = (summary.cash[curr] || 0) + (summary.transfer[curr] || 0);
            return acc;
        }, { ...initialCurrencyValues });
    }, [summary]);

    const performanceData = useMemo(() => {
        const startOfSelectedMonth = startOfMonth(historyDisplayMonth);
        const endOfSelectedMonth = endOfMonth(historyDisplayMonth);
    
        const previousTransactions = transactions.filter(tx => tx.date < startOfSelectedMonth);

        const broughtForward = currencies.reduce((acc, curr) => {
            acc[curr] = previousTransactions.reduce((sum, tx) => {
                 const amount = tx[curr] || 0;
                 return tx.type === 'income' ? sum + amount : sum - amount;
            }, 0);
            return acc;
        }, { ...initialCurrencyValues });
    
        const monthlyTransactions = transactions.filter(tx => isWithinInterval(tx.date, { start: startOfSelectedMonth, end: endOfSelectedMonth }));
        
        const income = currencies.reduce((acc, curr) => {
            acc[curr] = monthlyTransactions
                .filter(tx => tx.type === 'income')
                .reduce((sum, tx) => sum + (tx[curr] || 0), 0);
            return acc;
        }, { ...initialCurrencyValues });
            
        const expense = currencies.reduce((acc, curr) => {
            acc[curr] = monthlyTransactions
                .filter(tx => tx.type === 'expense')
                .reduce((sum, tx) => sum + (tx[curr] || 0), 0);
            return acc;
        }, { ...initialCurrencyValues });
    
        const netProfit = currencies.reduce((acc, curr) => {
            acc[curr] = income[curr] - expense[curr];
            return acc;
        }, { ...initialCurrencyValues });

        const endingBalance = currencies.reduce((acc, curr) => {
            acc[curr] = broughtForward[curr] + netProfit[curr];
            return acc;
        }, { ...initialCurrencyValues });
        
        return { broughtForward, income, expense, netProfit, endingBalance };
    }, [transactions, historyDisplayMonth]);


     const dailySummaries = useMemo(() => {
        const start = startOfMonth(historyDisplayMonth);
        const end = endOfMonth(historyDisplayMonth);
        
        const monthlyTransactions = transactions.filter(tx => isWithinInterval(tx.date, { start, end }));

        const grouped = monthlyTransactions.reduce((acc, tx) => {
            const dayKey = format(tx.date, 'yyyy-MM-dd');
            if (!acc[dayKey]) {
                acc[dayKey] = {
                    date: tx.date,
                    transactions: [],
                    income: { ...initialCurrencyValues },
                    expense: { ...initialCurrencyValues }
                };
            }
            acc[dayKey].transactions.push(tx);
            currencies.forEach(c => {
                if (tx.type === 'income') {
                    acc[dayKey].income[c] += tx[c] || 0;
                } else {
                    acc[dayKey].expense[c] += tx[c] || 0;
                }
            });
            return acc;
        }, {} as Record<string, { date: Date, transactions: Transaction[], income: CurrencyValues, expense: CurrencyValues }>);

        return Object.values(grouped).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [transactions, historyDisplayMonth]);


    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !newTransaction.description) {
            toast({ title: "ຂໍ້ມູນບໍ່ຄົບ", description: "ກະລຸນາໃສ່ວັນທີ ແລະ ຄຳອະທິບາຍ", variant: "destructive" });
            return;
        }
        try {
            await addTourTransaction({
                date: startOfDay(date),
                type: newTransaction.type || 'expense',
                description: newTransaction.description || '',
                amount: 0,
                kip: Number(newTransaction.kip || 0),
                baht: Number(newTransaction.baht || 0),
                usd: Number(newTransaction.usd || 0),
                cny: Number(newTransaction.cny || 0),
            });
            toast({ title: "ເພີ່ມທຸລະກຳສຳເລັດ" });
            setNewTransaction({ type: 'expense', description: '', kip: 0, baht: 0, usd: 0, cny: 0 });
            setDate(new Date());
        } catch (error) {
            console.error("Error adding transaction: ", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };
    
    const handleUpdateTransaction = async () => {
        if (!editingTransaction) return;
        try {
            await updateTourTransaction(editingTransaction.id, {
                ...editingTransaction,
                date: startOfDay(editingTransaction.date),
            });
            toast({ title: "ອັບເດດທຸລະກຳສຳເລັດ" });
            setEditingTransaction(null);
        } catch (error) {
            console.error("Error updating transaction: ", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm("ເຈົ້າແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້?")) return;
        try {
            await deleteTourTransaction(id);
            toast({ title: "ລຶບທຸລະກຳສຳເລັດ" });
        } catch (error) {
            console.error("Error deleting transaction: ", error);
            toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };
    
    const openEditDialog = (field: 'capital' | 'cash' | 'transfer') => {
        if (!summary) return;
        setEditingField(field);
        setEditingValues(summary[field]);
    };

    const handleSaveSummary = async () => {
        if (!editingField || !editingValues) return;
        try {
            await updateTourAccountSummary({ [editingField]: editingValues });
            toast({ title: "ບັນທຶກຍອດເງິນສຳເລັດ" });
            setEditingField(null);
            setEditingValues(null);
        } catch (error) {
             console.error("Error saving summary: ", error);
             toast({ title: "ເກີດຂໍ້ຜິດພາດ", variant: "destructive" });
        }
    };

    const MonthYearSelector = () => {
        const currentYear = getYear(new Date());
        const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
        years.push(2025);
        const uniqueYears = [...new Set(years)].sort();

        const months = Array.from({ length: 12 }, (_, i) => setMonth(new Date(), i));

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        {format(historyDisplayMonth, "LLLL yyyy", { locale: th })}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {uniqueYears.map(year => (
                         <DropdownMenuSub key={year}>
                            <DropdownMenuSubTrigger>
                                <span>{year + 543}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    {months.map(month => (
                                        <DropdownMenuItem 
                                            key={getMonth(month)} 
                                            onClick={() => {
                                                const newDate = new Date(year, getMonth(month), 1);
                                                setHistoryDisplayMonth(newDate);
                                            }}
                                        >
                                            {format(month, "LLLL", { locale: th })}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                        </DropdownMenuSub>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    };

    if (!summary) {
        return <div className="flex items-center justify-center h-screen">ກຳລັງໂຫລດຂໍ້ມູນ...</div>;
    }
    
    const getDialogTitle = () => {
        switch(editingField) {
            case 'capital': return 'ແກ້ໄຂເງິນທຶນ';
            case 'cash': return 'ແກ້ໄຂເງິນສົດ';
            case 'transfer': return 'ແກ້ໄຂເງິນໂອນ';
            default: return 'ແກ້ໄຂ';
        }
    }


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/tour"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-xl font-bold tracking-tight">ຈັດການບັນຊີ (ທຸລະກິດທ່ອງທ່ຽວ)</h1>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                     <SummaryCard title="ເງິນທຶນ" values={summary.capital} icon={<Briefcase className="h-5 w-5 text-primary" />} onClick={() => openEditDialog('capital')} />
                     <SummaryCard title="ເງິນສົດ" values={summary.cash} icon={<Wallet className="h-5 w-5 text-primary" />} onClick={() => openEditDialog('cash')} />
                     <SummaryCard title="ເງິນໂອນ" values={summary.transfer} icon={<Landmark className="h-5 w-5 text-primary" />} onClick={() => openEditDialog('transfer')} />
                     <SummaryCard title="ລວມເງິນຄົງເຫຼືອ" values={totalBalance} icon={<Combine className="h-5 w-5 text-green-600" />} />
                </div>
                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>ສະຫຼຸບຜົນປະກອບການ</CardTitle>
                            <CardDescription>ສຳລັບເດືອນທີ່ເລືອກ</CardDescription>
                        </div>
                        <MonthYearSelector />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SummaryCard title="ຍອດຍົກມາ" values={performanceData.broughtForward} icon={<FileText className="h-5 w-5 text-primary" />} />
                        <SummaryCard title="ລາຍຮັບ (ເດືອນ)" values={performanceData.income} icon={<ArrowUpCircle className="h-5 w-5 text-green-500" />} />
                        <SummaryCard title="ລາຍຈ່າຍ (ເດືອນ)" values={performanceData.expense} icon={<ArrowDownCircle className="h-5 w-5 text-red-500" />} />
                        <SummaryCard title="ກຳໄລ/ຂາດທຶນ (ເດືອນ)" values={performanceData.netProfit} icon={<Scale className="h-5 w-5 text-blue-500" />} />
                        <SummaryCard title="ຍອດທ້າຍເດືອນ" values={performanceData.endingBalance} icon={<Banknote className="h-5 w-5 text-indigo-500" />} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setFormVisible(!isFormVisible)}>
                                <div>
                                    <CardTitle>ເພີ່ມທຸລະກຳ</CardTitle>
                                    <CardDescription>ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍໃໝ່</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon">
                                    {isFormVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </Button>
                            </CardHeader>
                           {isFormVisible && (
                            <CardContent>
                                <form onSubmit={handleAddTransaction} className="grid gap-4">
                                     <div className="grid gap-2">
                                        <Label>ປະເພດ</Label>
                                        <RadioGroup value={newTransaction.type} onValueChange={(v) => setNewTransaction(p => ({ ...p, type: v as 'income' | 'expense' }))} className="flex gap-4">
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="income" id="r-income" /><Label htmlFor="r-income">ລາຍຮັບ</Label></div>
                                            <div className="flex items-center space-x-2"><RadioGroupItem value="expense" id="r-expense" /><Label htmlFor="r-expense">ລາຍຈ່າຍ</Label></div>
                                        </RadioGroup>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="date">ວັນທີ</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {date ? format(date, "PPP", { locale: th }) : <span>ເລືອກວັນທີ</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={th} /></PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">ຄຳອະທິບາຍ</Label>
                                        <Textarea id="description" value={newTransaction.description || ''} onChange={(e) => setNewTransaction(p => ({ ...p, description: e.target.value }))} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {currencies.map(c => (
                                            <div key={c} className="grid gap-2">
                                                <Label htmlFor={`new-${c}`} className="uppercase">{c}</Label>
                                                <Input id={`new-${c}`} type="number" value={newTransaction[c] || ''} onChange={(e) => setNewTransaction(p => ({ ...p, [c]: e.target.value }))} placeholder="0" />
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" />ເພີ່ມທຸລະກຳ</Button>
                                </form>
                            </CardContent>
                           )}
                        </Card>
                    </div>

                     <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                             <div>
                                <CardTitle>ປະຫວັດທຸລະກຳ</CardTitle>
                                <CardDescription>ສະແດງລາຍການສຳລັບເດືອນທີ່ເລືອກ</CardDescription>
                            </div>
                            <MonthYearSelector />
                        </CardHeader>
                        <CardContent>
                             {dailySummaries.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                {dailySummaries.map((summary, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4">
                                            <div className="font-semibold">{`ວັນທີ ${format(summary.date, "d MMMM yyyy", { locale: th })}`}</div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                <span className="text-green-600">ຮັບ: {currencies.map(c => `${formatCurrency(summary.income[c])} ${c.toUpperCase()}`).join(' / ')}</span>
                                                <span className="text-red-600">ຈ່າຍ: {currencies.map(c => `${formatCurrency(summary.expense[c])} ${c.toUpperCase()}`).join(' / ')}</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ຄຳອະທິບາຍ</TableHead>
                                                    {currencies.map(c => <TableHead key={c} className="text-right uppercase">{c}</TableHead>)}
                                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {summary.transactions.map(tx => (
                                                    <TableRow key={tx.id} className={tx.type === 'income' ? 'bg-green-50/50' : 'bg-red-50/50'}>
                                                        <TableCell className="font-medium">{tx.description}</TableCell>
                                                        {currencies.map(c => (
                                                            <TableCell key={c} className="text-right font-mono">{(tx[c] || 0) > 0 ? formatCurrency(tx[c]!) : '-'}</TableCell>
                                                        ))}
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => setEditingTransaction(tx)}>ແກ້ໄຂ</DropdownMenuItem>
                                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTransaction(tx.id)}>ລຶບ</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                                ))}
                                </Accordion>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">ບໍ່ມີທຸລະກຳໃນເດືອນນີ້</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {editingTransaction && (
                 <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>ແກ້ໄຂທຸລະກຳ</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                           <RadioGroup value={editingTransaction.type} onValueChange={(v) => setEditingTransaction(p => p ? { ...p, type: v as 'income' | 'expense' } : null)} className="flex gap-4">
                               <div className="flex items-center space-x-2"><RadioGroupItem value="income" id="edit-income" /><Label htmlFor="edit-income">ລາຍຮັບ</Label></div>
                               <div className="flex items-center space-x-2"><RadioGroupItem value="expense" id="edit-expense" /><Label htmlFor="edit-expense">ລາຍຈ່າຍ</Label></div>
                           </RadioGroup>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"}><CalendarIcon className="mr-2 h-4 w-4" />{format(editingTransaction.date, "PPP", { locale: th })}</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={editingTransaction.date} onSelect={(d) => setEditingTransaction(p => p ? { ...p, date: d || new Date() } : null)} initialFocus locale={th} />
                                </PopoverContent>
                            </Popover>
                            <Textarea value={editingTransaction.description} onChange={(e) => setEditingTransaction(p => p ? { ...p, description: e.target.value } : null)} />
                            <div className="grid grid-cols-2 gap-4">
                                {currencies.map(c => (
                                    <div key={c} className="grid gap-2">
                                        <Label htmlFor={`edit-${c}`} className="uppercase">{c}</Label>
                                        <Input id={`edit-${c}`} type="number" value={editingTransaction[c] || ''} onChange={(e) => setEditingTransaction(p => p ? { ...p, [c]: Number(e.target.value) } : null)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingTransaction(null)}>ຍົກເລີກ</Button>
                            <Button onClick={handleUpdateTransaction}>ບັນທຶກ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {editingField && editingValues && (
                 <Dialog open={!!editingField} onOpenChange={(isOpen) => !isOpen && setEditingField(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>{getDialogTitle()}</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                             {currencies.map(c => (
                                <div key={c} className="grid gap-2">
                                    <Label htmlFor={`summary-${c}`} className="uppercase">{c}</Label>
                                    <Input id={`summary-${c}`} type="number" value={editingValues[c] || ''} onChange={(e) => setEditingValues(p => p ? { ...p, [c]: Number(e.target.value) } : null)} />
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingField(null)}>ຍົກເລີກ</Button>
                            <Button onClick={handleSaveSummary}>ບັນທຶກ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
