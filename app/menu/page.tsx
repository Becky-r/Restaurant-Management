"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChefHat, Clock, Info } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
}

interface Category {
  id: string
  name: string
  items: MenuItem[]
}

export default function PublicMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/public/menu")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Failed to fetch menu:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Hero Header */}
      <header className="bg-primary text-primary-foreground py-12 px-4 shadow-lg">
        <div className="container mx-auto text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">Our Digital Menu</h1>
          <p className="text-primary-foreground/80 max-w-md mx-auto">
            Experience the finest local flavors, prepared with love and fresh ingredients.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 mt-8">
        {categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold">Menu is currently unavailable</h2>
            <p className="text-muted-foreground">Please check back later or ask our staff.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <section key={category.id}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">{category.name}</h2>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                      {item.image && (
                        <div className="aspect-video w-full bg-slate-200 relative overflow-hidden">
                           <img 
                             src={item.image.startsWith("http") ? item.image : `http://localhost:4000${item.image}`}
                             alt={item.name}
                             className="w-full h-full object-cover"
                           />
                        </div>
                      )}
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                          <span className="font-bold text-primary whitespace-nowrap">
                            {item.price} ETB
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium">
                             <Clock className="h-3 w-3 mr-1" />
                             ~20 mins
                           </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-16 border-t py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Restaurant Name. All rights reserved.</p>
        <p className="mt-1">Prices are subject to 15% VAT.</p>
      </footer>
    </div>
  )
}
