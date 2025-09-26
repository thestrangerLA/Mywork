
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Package, Calculator, Truck, Users, Landmark, BarChart, ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"


export default function AgricultureDashboard() {

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
          <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">ກັບໄປໜ້າຫຼັກ</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight font-headline">ແດຊ໌ບອດທຸລະກິດກະສິກຳ</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl">
          <Link href="/stock">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ຈັດການສະຕັອກສິນຄ້າ</CardTitle>
                <Package className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຈັດການສະຕັອກສິນຄ້າກະເສດທັງໝົດ, ຕິດຕາມລະດັບສະຕັອກ ແລະ ຈັດການລາຄາ
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/agriculture/accountancy">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ຈັດການບັນຊີ</CardTitle>
                <Landmark className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຕິດຕາມລາຍຮັບ-ລາຍຈ່າຍ, ຈັດການທຸລະກຳ, ແລະ ເບິ່ງສະຫຼຸບພາບລວມການເງິນ
                </p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/transport">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ບັນຊີຂົນສົ່ງ</CardTitle>
                <Truck className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ບັນທຶກ ແລະ ຕິດຕາມຄ່າໃຊ້ຈ່າຍໃນການຂົນສົ່ງສິນຄ້າແຕ່ລະປະເພດ
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/debtors">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ລູກໜີ້/ເຈົ້າໜີ້ທົ່ວໄປ</CardTitle>
                <Users className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຈັດການ ແລະ ຕິດຕາມລາຍການລູກໜີ້ ແລະ ເຈົ້າໜີ້ທົ່ວໄປ
                </p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/drug-creditors">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ລູກໜີ້ຄ່າຢາ</CardTitle>
                <Users className="h-8 w-8 text-rose-500" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຈັດການ ແລະ ຕິດຕາມລາຍການລູກໜີ້ຄ່າຢາໂດຍສະເພາະ
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/tax">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ຄິດໄລ່ພາສີ</CardTitle>
                <Calculator className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ຄິດໄລ່ພາສີເງິນໄດ້ບຸກຄົນທຳມະດາຕາມອັດຕາກ້າວໜ້າ
                </p>
              </CardContent>
            </Card>
          </Link>
           <Link href="/reports">
            <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold font-headline">ສະຫຼຸບຍອດລາຍປີ/ລາຍເດືອນ</CardTitle>
                <BarChart className="h-8 w-8 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  ເບິ່ງສະຫຼຸບລາຍຮັບ-ລາຍຈ່າຍ ແລະ ກຳໄລສຸດທິແບບລາຍເດືອນ ແລະ ລາຍປີ
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
