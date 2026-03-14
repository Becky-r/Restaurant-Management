"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ArrowLeft, RefreshCw, ChefHat, Save } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isAvailable: boolean
  categoryId: string
  category?: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isAvailable: true,
  })

  // In a real app, you'd handle auth tokens here
  const API_BASE = "http://localhost:4000/api/admin"

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/menu`)
      const data = await resp.json()
      setItems(data)
      
      // Also fetch categories (using the helper I added)
      const catResp = await fetch(`http://localhost:4000/api/public/menu`)
      const catData = await catResp.json()
      setCategories(catData.map((c: any) => ({ id: c.id, name: c.name })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [])

  const handleSave = async () => {
    // Basic validation
    if (!formData.name || !formData.price || !formData.categoryId) {
      alert("Please fill in all required fields (Name, Price, and Category)")
      return
    }

    try {
      const url = selectedItem ? `${API_BASE}/menu/${selectedItem.id}` : `${API_BASE}/menu`
      const method = selectedItem ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": "your-secret-api-key"
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        }),
      })
      
      if (response.ok) {
        setShowAddDialog(false)
        setShowEditDialog(false)
        fetchMenuData()
        setFormData({ name: "", description: "", price: "", categoryId: "", isAvailable: true })
      } else {
        const errData = await response.json()
        alert(`Error: ${errData.error || 'Failed to save item'}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await fetch(`${API_BASE}/menu/${id}`, { method: "DELETE" })
      fetchMenuData()
    } catch (err) {
      console.error(err)
    }
  }

  const openEdit = (item: MenuItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId,
      isAvailable: item.isAvailable,
    })
    setShowEditDialog(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold">Menu Management</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchMenuData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => {
                setSelectedItem(null)
                setFormData({ name: "", description: "", price: "", categoryId: "", isAvailable: true })
                setShowAddDialog(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">Loading menu items...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className={!item.isAvailable ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{item.name}</CardTitle>
                      <Badge variant="outline">{item.category?.name}</Badge>
                    </div>
                    <Badge variant={item.isAvailable ? "default" : "secondary"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-lg font-bold text-primary mb-4">{item.price} ETB</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false)
          setShowEditDialog(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dish Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (ETB)</Label>
              <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex items-center gap-2">
               <input 
                 type="checkbox" 
                 id="available" 
                 checked={formData.isAvailable} 
                 onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
               />
               <Label htmlFor="available">Available for customers</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
