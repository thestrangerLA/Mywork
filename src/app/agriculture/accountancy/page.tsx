
"use client"

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Landmark, Wallet, PlusCircle, Calendar as CalendarIcon, ChevronDown, ChevronUp, TrendingUp, ArrowUpCircle, ArrowDownCircle, Minus, Equal, FileText, MoreHorizontal, Pencil, Banknote, Trash2, Users, Truck, PiggyBank, Briefcase, Combine, MinusCircle, UserMinus } from "lucide-react"
import Link from 'next/link'
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { format, isSameDay, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths, getMonth, getYear, setMonth, startOfDay, eachDayOfInterval, getDate } from "date-fns"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { listenToTransactions, addTransaction, listenToAccountSummary, updateAccountSummary, deleteTransaction, updateTransaction } from '@/services/accountancyService';
import type { Transaction, AccountSummary, CashCalculatorState, DebtorCreditorEntry, TransportEntry, DrugCreditorEntry } from '@/lib/types';
import { listenToCalculatorState, updateCalculatorState } from '@/services/cashCalculatorService';
import { listenToDebtorCreditorEntries } from '@/services/debtorCreditorService';
import { listenToTransportEntries } from '@/services/transportService';
import { listenToAllDrugCreditorEntries } from '@/services/drugCreditorService';

const businessType = 'agriculture';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('lo-LA', { minimumFractionDigits: 0 }).format(value);
}

const SummaryCard = ({ title, value, icon, onClick, className }: { title: string, value: string, icon: React.ReactNode, onClick?: () => void, className?: string }) => (
    <Card className={`${onClick ? 'cursor-pointer hover:bg-muted/80' : ''} ${className || ''}`} onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
               <CardTitle className="text-sm font-medium">{title}</CardTitle>
               {onClick && <Pencil className="h-3 w-3 text-muted-foreground" />}
            </div>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const CashCalculatorCard = ({ onTotalChange }: { onTotalChange: (total: number) => void }) => {
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
    const initialCounts: Record<string, number> = { baht: 0, rate: 0, usd: 0, usd_rate: 0, ...denominations.reduce((acc, d) => ({...acc, [d]: 0}), {}) };
    
    const [calculatorState, setCalculatorState] = useState<CashCalculatorState>({ id: 'latest', counts: initialCounts });
    const [isCalculatorVisible, setCalculatorVisible] = useState(true);

    useEffect(() => {
        const unsubscribe = listenToCalculatorState(setCalculatorState);
        return () => unsubscribe();
    }, []);

    const totalKip = useMemo(() => {
        const kipFromNotes = denominations.reduce((sum, d) => sum + (d * (calculatorState.counts[d] || 0)), 0);
        const kipFromBaht = (calculatorState.counts.baht || 0) * (calculatorState.counts.rate || 0);
        const kipFromUsd = (calculatorState.counts.usd || 0) * (calculatorState.counts.usd_rate || 0);
        return kipFromNotes + kipFromBaht + kipFromUsd;
    }, [calculatorState.counts, denominations]);

    useEffect(() => {
        onTotalChange(totalKip);
    }, [totalKip, onTotalChange]);

    const handleCountChange = async (key: string, value: string) => {
        const newCounts = { ...calculatorState.counts, [key]: Number(value) || 0 };
        await updateCalculatorState({ counts: newCounts }); 
    };

    const handleReset = async () => {
        await updateCalculatorState({ counts: initialCounts });
    };

    return (
        <Card>
            <CardHeader className="cursor-pointer" onClick={() => setCalculatorVisible(!isCalculatorVisible)}>
                <div className="flex justify-between items-center">
                    <CardTitle>ເຄື່ອງຄິດໄລ່ເງິນສົດ</CardTitle>
                    <Button variant="ghost" size="icon">
                        {isCalculatorVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        <span className="sr-only">Toggle Calculator</span>
                    </Button>
                </div>
            </CardHeader>
            {isCalculatorVisible && (
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ທະນະບັດ (KIP)</TableHead>
                                <TableHead>ຈຳນວນ (ໃບ)</TableHead>
                                <TableHead className="text-right">ລວມ (KIP)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {denominations.map(d => (
                                <TableRow key={d}>
                                    <TableCell className="font-medium">{d.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Input type="number" value={calculatorState.counts[d] || ''} onChange={e => handleCountChange(String(d), e.target.value)} className="w-24 h-8" />
                                    </TableCell>
                                    <TableCell className="text-right">{(d * (calculatorState.counts[d] || 0)).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                             <TableRow>
                                <TableCell className="font-medium">BAHT</TableCell>
                                <TableCell><Input type="number" value={calculatorState.counts.baht || ''} onChange={e => handleCountChange('baht', e.target.value)} className="w-24 h-8" /></TableCell>
                                <TableCell rowSpan={2} className="text-right align-bottom">{(calculatorState.counts.baht * calculatorState.counts.rate).toLocaleString()}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Rate</TableCell>
                                <TableCell><Input type="number" value={calculatorState.counts.rate || ''} onChange={e => handleCountChange('rate', e.target.value)} className="w-24 h-8" /></TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">USD</TableCell>
                                <TableCell><Input type="number" value={calculatorState.counts.usd || ''} onChange={e => handleCountChange('usd', e.target.value)} className="w-24 h-8" /></TableCell>
                                <TableCell rowSpan={2} className="text-right align-bottom">{(calculatorState.counts.usd * calculatorState.counts.usd_rate).toLocaleString()}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-medium">Rate</TableCell>
                                <TableCell><Input type="number" value={calculatorState.counts.usd_rate || ''} onChange={e => handleCountChange('usd_rate', e.target.value)} className="w-24 h-8" /></TableCell>
                            </TableRow>
                             <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={2}>ລວມທັງໝົດ (KIP)</TableCell>
                                <TableCell className="text-right text-lg">{totalKip.toLocaleString()}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                    <Button onClick={handleReset} variant="outline" className="mt-4 w-full">ຣີເຊັດ</Button>
                </CardContent>
            )}
        </Card>
    );
};


export default function AgricultureAccountancyPage() {
    const { toast } = useToast();
    const [accountSummary, setAccountSummary] = useState<AccountSummary>({ id: 'latest', cash: 0, transfer: 0, capital: 0, workingCapital: 0 });
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'date'>>({
        type: 'expense',
        amount: 0,
        description: '',
    });
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isTransactionFormVisible, setTransactionFormVisible] = useState(true);
    const [isHistoryVisible, setHistoryVisible] = useState(true);
    
    const [historyDisplayMonth, setHistoryDisplayMonth] = useState<Date>(new Date());
    const [editingSummaryField, setEditingSummaryField] = useState<'transfer' | 'capital' | 'workingCapital' | null>(null);
    const [editingSummaryValue, setEditingSummaryValue] = useState(0);

    const [debtorEntries, setDebtorEntries] = useState<DebtorCreditorEntry[]>([]);
    const [transportEntries, setTransportEntries] = useState<TransportEntry[]>([]);
    const [drugCreditorEntries, setDrugCreditorEntries] = useState<DrugCreditorEntry[]>([]);

    const workingCapital = useMemo(() => accountSummary.workingCapital || 0, [accountSummary]);

    useEffect(() => {
        const unsubscribeTransactions = listenToTransactions(businessType, setAllTransactions);
        const unsubscribeSummary = listenToAccountSummary(businessType, (summary) => {
            if (summary) {
                setAccountSummary(summary);
            } else {
                 const initialSummary: AccountSummary = { id: 'latest', cash: 0, transfer: 0, capital: 0, workingCapital: 0 };
                updateAccountSummary(businessType, initialSummary).then(() => setAccountSummary(initialSummary));
            }
        });
        const unsubscribeDebtors = listenToDebtorCreditorEntries(setDebtorEntries);
        const unsubscribeTransport = listenToTransportEntries(setTransportEntries);
        const unsubscribeDrugCreditors = listenToAllDrugCreditorEntries(setDrugCreditorEntries);
        
        return () => {
            unsubscribeTransactions();
            unsubscribeSummary();
            unsubscribeDebtors();
            unsubscribeTransport();
            unsubscribeDrugCreditors();
        };
    }, []);
    
    const handleCalculatorTotalChange = async (totalKip: number) => {
        if (totalKip !== accountSummary.cash) {
            await updateAccountSummary(businessType, { cash: totalKip });
        }
    };

    const totalDebtors = useMemo(() => {
        return debtorEntries
            .filter(e => e.type === 'debtor' && !e.isPaid)
            .reduce((sum, entry) => sum + entry.amount, 0);
    }, [debtorEntries]);

    const transportRemaining = useMemo(() => {
        return transportEntries.reduce((total, row) => {
            let remaining = 0;
            if (!row.finished) remaining += (row.amount || 0);
            return total + remaining;
        }, 0);
    }, [transportEntries]);
    
    const drugCreditorsPayable = useMemo(() => {
        return drugCreditorEntries
            .filter(e => !e.isPaid)
            .reduce((sum, entry) => {
                const profit = (entry.sellingPrice || 0) - (entry.cost || 0);
                const share40 = profit * 0.4;
                return sum + (entry.cost || 0) + share40;
            }, 0);
    }, [drugCreditorEntries]);


    const totalMoney = useMemo(() => accountSummary.cash + accountSummary.transfer, [accountSummary]);
    
    const grandTotalMoney = useMemo(() => {
        return totalMoney + totalDebtors + transportRemaining + drugCreditorsPayable;
    }, [totalMoney, totalDebtors, transportRemaining, drugCreditorsPayable]);

    const performanceData = useMemo(() => {
        const startOfSelectedMonth = startOfMonth(historyDisplayMonth);
        const endOfSelectedMonth = endOfMonth(historyDisplayMonth);
    
        const previousTransactions = allTransactions.filter(tx => tx.date < startOfSelectedMonth);
        const broughtForward = previousTransactions.reduce((acc, tx) => {
            return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
        }, 0);
    
        const monthlyTransactions = allTransactions.filter(tx => isWithinInterval(tx.date, { start: startOfSelectedMonth, end: endOfSelectedMonth }));
        
        const income = monthlyTransactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);
            
        const expense = monthlyTransactions
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);
    
        const netProfitMonthly = income - expense;
        const endingBalance = broughtForward + netProfitMonthly;
        
        const totalWithWorkingCapital = workingCapital + income;
        const remainingWithWorkingCapital = totalWithWorkingCapital - expense;
    
        return { 
            broughtForward, 
            income, 
            expense, 
            netProfitMonthly,
            endingBalance,
            totalWithWorkingCapital,
            remainingWithWorkingCapital,
        };
    }, [allTransactions, historyDisplayMonth, workingCapital]);

    const differenceAmount = useMemo(() => {
        return totalMoney - performanceData.remainingWithWorkingCapital;
    }, [totalMoney, performanceData.remainingWithWorkingCapital]);

    const dailySummariesForMonth = useMemo(() => {
        const start = startOfMonth(historyDisplayMonth);
        const end = endOfMonth(historyDisplayMonth);
        const daysInMonth = eachDayOfInterval({ start, end });

        const monthlyTransactions = allTransactions.filter(tx => isWithinInterval(tx.date, { start, end }));

        return daysInMonth.map(day => {
            const transactionsForDay = monthlyTransactions.filter(tx => isSameDay(tx.date, day));
            const income = transactionsForDay.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const expense = transactionsForDay.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
            return {
                date: day,
                income,
                expense,
                transactions: transactionsForDay
            };
        }).filter(summary => summary.transactions.length > 0)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [allTransactions, historyDisplayMonth]);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !newTransaction.amount) {
            toast({
                title: "ຂໍ້ຜິດພາດ",
                description: "ກະລຸນາປ້ອນວັນທີ ແລະ ຈຳນວນເງິນ",
                variant: "destructive",
            });
            return;
        }
        
        const newTxData = { date: startOfDay(date), ...newTransaction };

        try {
            await addTransaction(businessType, newTxData);
            
            toast({
                title: "ເພີ່ມທຸລະກຳໃໝ່ສຳເລັດ",
                description: `ເພີ່ມລາຍການໃໝ່ຈຳນວນ ${formatCurrency(newTransaction.amount)}`,
            });
    
            setNewTransaction({ type: 'expense', amount: 0, description: '' });
            setDate(new Date());

        } catch (error) {
             console.error("Error adding transaction: ", error);
             toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດເພີ່ມທຸລະກຳໄດ້",
                variant: "destructive",
            });
        }
    }
    
    const handleDeleteTransaction = async (txToDelete: Transaction) => {
        if (!window.confirm(`ເຈົ້າແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການ "${txToDelete.description || 'ບໍ່ມີຊື່'}"?`)) return;

        try {
            await deleteTransaction(businessType, txToDelete.id);
            toast({
                title: "ລຶບທຸລະກຳສຳເລັດ",
            });
        } catch (error) {
            console.error("Error deleting transaction: ", error);
            toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດລຶບທຸລະກຳໄດ້",
                variant: "destructive",
            });
        }
    };
    
    const handleUpdateTransaction = async () => {
        if (!editingTransaction) return;

        try {
            await updateTransaction(businessType, editingTransaction.id, {
                ...editingTransaction,
                date: startOfDay(editingTransaction.date),
            });

            toast({
                title: "ອັບເດດທຸລະກຳສຳເລັດ",
            });
            setEditingTransaction(null);
        } catch (error) {
            console.error("Error updating transaction: ", error);
            toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດອັບເດດທຸລະກຳໄດ້",
                variant: "destructive",
            });
        }
    };


    const openEditDialog = (tx: Transaction) => {
        setEditingTransaction({ ...tx });
    };

     const openEditSummaryDialog = (field: 'transfer' | 'capital' | 'workingCapital') => {
        setEditingSummaryField(field);
        if (field === 'workingCapital') {
            setEditingSummaryValue(workingCapital);
        } else {
            setEditingSummaryValue(accountSummary[field]);
        }
    };

    const handleUpdateSummaryField = async () => {
        if (!editingSummaryField) return;

        try {
            await updateAccountSummary(businessType, { [editingSummaryField]: editingSummaryValue });

            toast({
                title: "ອັບເດດຍອດເງິນສຳເລັດ",
            });
            setEditingSummaryField(null);
        } catch (error) {
            console.error("Error updating summary: ", error);
            toast({
                title: "ເກີດຂໍ້ຜິດພາດ",
                description: "ບໍ່ສາມາດອັບເດດຍອດເງິນໄດ້",
                variant: "destructive",
            });
        }
    };

    const MonthYearSelector = () => {
        const years = Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 2 + i);
        years.push(2025);
        const uniqueYears = [...new Set(years)].sort();
        
        const months = Array.from({ length: 12 }, (_, i) => setMonth(new Date(), i));

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                        {format(historyDisplayMonth, "LLLL yyyy")}
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
                                            {format(month, "LLLL")}
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
    
    const getDialogTitle = () => {
        switch(editingSummaryField) {
            case 'transfer': return 'ແກ້ໄຂຍອດເງິນໂອນ';
            case 'capital': return 'ແກ້ໄຂຍອດເງິນທຶນ';
            case 'workingCapital': return 'ແກ້ໄຂເງິນໝູນວຽນ';
            default: return 'ແກ້ໄຂ';
        }
    }


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                    <Link href="/agriculture">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight">ຈັດການບັນຊີ (ຮ້ານຄ້າກະສິກຳ)</h1>
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4 xl:grid-cols-9">
                     <SummaryCard title="ເງິນທຶນ" value={formatCurrency(accountSummary.capital)} icon={<Briefcase className="h-5 w-5 text-primary" />} onClick={() => openEditSummaryDialog('capital')} />
                     <SummaryCard title="ເງິນສົດ" value={formatCurrency(accountSummary.cash)} icon={<Wallet className="h-5 w-5 text-primary" />} />
                     <SummaryCard title="ເງິນໂອນ" value={formatCurrency(accountSummary.transfer)} icon={<Landmark className="h-5 w-5 text-primary" />} onClick={() => openEditSummaryDialog('transfer')} />
                     <SummaryCard title="ລວມເງິນ" value={formatCurrency(totalMoney)} icon={<Combine className="h-5 w-5 text-green-600" />} />
                     <SummaryCard title="ລູກໜີ້ທົ່ວໄປ" value={formatCurrency(totalDebtors)} icon={<Users className="h-5 w-5 text-yellow-600" />} />
                     <SummaryCard title="ຄ່າຂົນສົ່ງຄົງເຫຼືອ" value={formatCurrency(transportRemaining)} icon={<Truck className="h-5 w-5 text-red-600" />} />
                     <SummaryCard title="ລູກໜີ້ຄ່າຢາ" value={formatCurrency(drugCreditorsPayable)} icon={<UserMinus className="h-5 w-5 text-rose-500" />} />
                     <SummaryCard title="ລວມເງິນທັງໝົດ" value={formatCurrency(grandTotalMoney)} icon={<PiggyBank className="h-5 w-5 text-blue-600" />} />
                     <SummaryCard title="ສ່ວນຕ່າງ" value={formatCurrency(differenceAmount)} icon={<MinusCircle className="h-5 w-5 text-indigo-500" />} />
                </div>

                 <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle>ສະຫຼຸບຜົນປະກອບການ</CardTitle>
                            <CardDescription>ສຳລັບເດືອນທີ່ເລືອກ</CardDescription>
                        </div>
                        <MonthYearSelector />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                        <SummaryCard title="ເງິນໝູນວຽນ" value={formatCurrency(workingCapital)} icon={<Combine className="h-5 w-5 text-purple-500" />} onClick={() => openEditSummaryDialog('workingCapital')} />
                        <SummaryCard title="ຍອດຍົກມາ" value={formatCurrency(performanceData.broughtForward)} icon={<FileText className="h-5 w-5 text-primary" />} />
                        <SummaryCard title="ລາຍຮັບ" value={formatCurrency(performanceData.income)} icon={<ArrowUpCircle className="h-5 w-5 text-green-500" />} />
                        <SummaryCard title="ລວມ" value={formatCurrency(performanceData.totalWithWorkingCapital)} icon={<PlusCircle className="h-5 w-5 text-orange-500" />} />
                        <SummaryCard title="ລາຍຈ່າຍ" value={formatCurrency(performanceData.expense)} icon={<ArrowDownCircle className="h-5 w-5 text-red-500" />} />
                        <SummaryCard title="ຄົງເຫຼືອ" value={formatCurrency(performanceData.remainingWithWorkingCapital)} icon={<Wallet className="h-5 w-5 text-teal-500" />} />
                        <SummaryCard title="ກຳໄລ (ເດືອນ)" value={formatCurrency(performanceData.netProfitMonthly)} icon={performanceData.netProfitMonthly >= 0 ? <Equal className="h-5 w-5 text-indigo-500" /> : <Minus className="h-5 w-5 text-red-500" />} />
                        <SummaryCard title="ຍອດທ້າຍເດືອນ" value={formatCurrency(performanceData.endingBalance)} icon={<Banknote className="h-5 w-5 text-blue-500" />} />
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setTransactionFormVisible(!isTransactionFormVisible)}>
                                    <div>
                                        <CardTitle>ເພີ່ມທຸລະກຳ</CardTitle>
                                        <CardDescription>ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍໃໝ່ຂອງທ່ານ</CardDescription>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        {isTransactionFormVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                        <span className="sr-only">Toggle form</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            {isTransactionFormVisible && (
                            <CardContent>
                                <form onSubmit={handleAddTransaction}>
                                    <div className="grid gap-6">
                                        <div className="grid gap-3">
                                            <Label>ປະເພດທຸລະກຳ</Label>
                                            <RadioGroup
                                                value={newTransaction.type}
                                                onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as 'income' | 'expense' })}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="income" id="r-income" />
                                                    <Label htmlFor="r-income">ລາຍຮັບ</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="expense" id="r-expense" />
                                                    <Label htmlFor="r-expense">ລາຍຈ່າຍ</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="date">ວັນທີ</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {date ? format(date, "PPP") : <span>ເລືອກວັນທີ</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        onSelect={setDate}
                                                        initialFocus
                                                        
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        
                                        <div className="grid gap-3">
                                            <Label htmlFor="amount">ຈຳນວນເງິນ</Label>
                                            <Input id="amount" type="number" placeholder="0" value={newTransaction.amount || ''} onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value)})} required />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="description">ຄຳອະທິບາຍ</Label>
                                            <Textarea id="description" placeholder="ອະທິບາຍລາຍການ" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value})} />
                                        </div>

                                        <Button type="submit" className="w-full">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            ເພີ່ມທຸລະກຳ
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                            )}
                        </Card>
                        <CashCalculatorCard onTotalChange={handleCalculatorTotalChange} />
                    </div>

                    <Card className="lg:col-span-2">
                         <CardHeader>
                             <div className="flex justify-between items-center cursor-pointer" onClick={() => setHistoryVisible(!isHistoryVisible)}>
                                <div>
                                    <CardTitle>ປະຫວັດທຸລະກຳ</CardTitle>
                                    <CardDescription>
                                       ສະຫຼຸບທຸລະກຳລາຍວັນສຳລັບເດືອນ {format(historyDisplayMonth, "LLLL yyyy")}
                                    </CardDescription>
                                </div>
                                 <Button variant="ghost" size="icon">
                                    {isHistoryVisible ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    <span className="sr-only">Toggle History</span>
                                </Button>
                            </div>
                        </CardHeader>
                        {isHistoryVisible && (
                        <CardContent>
                            {dailySummariesForMonth.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {dailySummariesForMonth.map((summary, index) => (
                                        <AccordionItem value={`item-${index}`} key={index}>
                                            <AccordionTrigger>
                                                <div className="flex justify-between w-full pr-4">
                                                    <div className="font-semibold">{format(summary.date, "d")}</div>
                                                    <div className="flex gap-4">
                                                        <span className="text-green-600">ຮັບ: {formatCurrency(summary.income)}</span>
                                                        <span className="text-red-600">ຈ່າຍ: {formatCurrency(summary.expense)}</span>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>ຄຳອະທິບາຍ</TableHead>
                                                            <TableHead className="text-right">ຈຳນວນເງິນ</TableHead>
                                                            <TableHead><span className="sr-only">Actions</span></TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                    {summary.transactions.map((tx) => (
                                                        <TableRow key={tx.id} className={tx.type === 'income' ? 'bg-green-50/50' : 'bg-red-50/50'}>
                                                            <TableCell>
                                                                <div className="font-medium">{tx.description || "-"}</div>
                                                            </TableCell>
                                                            <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                                                             <TableCell className="text-right">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                                            <span className="sr-only">Open menu</span>
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuLabel>ການດຳເນີນການ</DropdownMenuLabel>
                                                                        <DropdownMenuItem onClick={() => openEditDialog(tx)}>
                                                                            ແກ້ໄຂ
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            className="text-red-600"
                                                                            onClick={() => handleDeleteTransaction(tx)}
                                                                        >
                                                                            ລົບ
                                                                        </DropdownMenuItem>
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
                                <div className="text-center text-muted-foreground py-8">
                                    ບໍ່ມີທຸລະກຳໃນເດືອນທີ່ເລືອກ
                                </div>
                            )}
                        </CardContent>
                        )}
                    </Card>
                </div>
            </main>

            {editingTransaction && (
                 <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ແກ້ໄຂທຸລະກຳ</DialogTitle>
                            <DialogDescription>
                                ອັບເດດລາຍລະອຽດທຸລະກຳຂອງທ່ານຂ້າງລຸ່ມນີ້
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-3">
                                <Label>ປະເພດທຸລະກຳ</Label>
                                <RadioGroup
                                    value={editingTransaction.type}
                                    onValueChange={(value) => setEditingTransaction({ ...editingTransaction, type: value as 'income' | 'expense' })}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="income" id="edit-r-income" />
                                        <Label htmlFor="edit-r-income">ລາຍຮັບ</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="expense" id="edit-r-expense" />
                                        <Label htmlFor="edit-r-expense">ລາຍຈ່າຍ</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="edit-date">ວັນທີ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editingTransaction.date ? format(editingTransaction.date, "PPP") : <span>ເລືອກວັນທີ</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={editingTransaction.date}
                                            onSelect={(d) => setEditingTransaction({ ...editingTransaction, date: d || new Date() })}
                                            initialFocus
                                            
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="edit-amount">ຈຳນວນເງິນ</Label>
                                <Input id="edit-amount" type="number" value={editingTransaction.amount || ''} onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value)})} required />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="edit-description">ຄຳອະທິບາຍ</Label>
                                <Textarea id="edit-description" value={editingTransaction.description} onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingTransaction(null)}>ຍົກເລີກ</Button>
                            <Button onClick={handleUpdateTransaction}>ບັນທຶກການປ່ຽນແປງ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {editingSummaryField && (
                 <Dialog open={!!editingSummaryField} onOpenChange={(isOpen) => !isOpen && setEditingSummaryField(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{getDialogTitle()}</DialogTitle>
                             <DialogDescription>
                                ປ້ອນຍອດເງິນປັດຈຸບັນ
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-3">
                                 <Label htmlFor="edit-summary-amount">ຈຳນວນເງິນ</Label>
                                <Input 
                                    id="edit-summary-amount" 
                                    type="number" 
                                    value={editingSummaryValue || ''} 
                                    onChange={(e) => setEditingSummaryValue(Number(e.target.value))} 
                                    required 
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingSummaryField(null)}>ຍົກເລີກ</Button>
                            <Button onClick={handleUpdateSummaryField}>ບັນທຶກ</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

    
    