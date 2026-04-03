"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ArrowLeft, RefreshCw, Save, QrCode, Download, Printer, ImageIcon, X } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isAvailable: boolean
  categoryId: string
  category?: { id: string; name: string }
}

interface Category {
  id: string
  name: string
}

const FIXED_CATEGORY_NAMES = ["Food", "Drinks", "Juice", "Desserts", "Specials"]

import { useAuth } from "@/lib/auth-context"
import { api, authFetch } from "@/lib/api"

export default function AdminMenuPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)

  // Form state
  // ... (keep form states)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formAvailable, setFormAvailable] = useState(true)
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMenuData = async () => {
    setLoading(true)
    try {
      const resp = await api.get("/api/menu")
      const data = await resp.json()
      setItems(data)

      const catResp = await api.get("/api/categories")
      const catData = await catResp.json()
      setCategories(catData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenuData()
  }, [])

  // ... (keep resetForm, handleImageSelect, removeImage)
  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormPrice("")
    setFormCategoryId("")
    setFormAvailable(true)
    setFormImageFile(null)
    setFormImagePreview(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setFormImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormImageFile(null)
    setFormImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = async () => {
    if (!formName || !formPrice || !formCategoryId) {
      alert("Please fill in all required fields (Name, Price, and Category)")
      return
    }

    try {
      const url = selectedItem ? `/api/menu/${selectedItem.id}` : "/api/menu"
      const method = selectedItem ? "PATCH" : "POST"

      const formDataObj = new FormData()
      formDataObj.append("name", formName)
      formDataObj.append("description", formDescription)
      formDataObj.append("price", formPrice)
      formDataObj.append("categoryId", formCategoryId)
      formDataObj.append("isAvailable", String(formAvailable))
      if (formImageFile) {
        formDataObj.append("image", formImageFile)
      }

      // Special handling for FormData with authFetch
      const response = await authFetch(url, {
        method,
        body: formDataObj,
        headers: {
            // Let the browser set Content-Type with boundary for FormData
        },
      } as any)

      if (response.ok) {
        setShowAddDialog(false)
        setShowEditDialog(false)
        resetForm()
        fetchMenuData()
      } else {
        const errData = await response.json()
        alert(`Error: ${errData.error || "Failed to save item"}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await api.delete(`/api/menu/${id}`)
      fetchMenuData()
    } catch (err) {
      console.error(err)
    }
  }


  const openEdit = (item: MenuItem) => {
    setSelectedItem(item)
    setFormName(item.name)
    setFormDescription(item.description)
    setFormPrice(item.price.toString())
    setFormCategoryId(item.categoryId)
    setFormAvailable(item.isAvailable)
    setFormImageFile(null)
    setFormImagePreview(item.image ? `http://localhost:4000${item.image}` : null)
    setShowEditDialog(true)
  }

  const openAdd = () => {
    setSelectedItem(null)
    resetForm()
    setShowAddDialog(true)
  }

  const getImageSrc = (img?: string) => {
    if (!img) return null
    if (img.startsWith("http")) return img
    return `http://localhost:4000${img}`
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
              {user?.role === "ADMIN" && (
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dish
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setShowQRDialog(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Menu QR
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
            {items.map((item) => {
              const imgSrc = getImageSrc(item.image)
              return (
                <Card key={item.id} className={!item.isAvailable ? "opacity-60" : ""}>
                  {imgSrc && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-xl border-b">
                      <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
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
                    {user?.role === "ADMIN" && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog || showEditDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setShowEditDialog(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dish Name</Label>
              <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => FIXED_CATEGORY_NAMES.includes(c.name))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (ETB)</Label>
              <Input
                id="price"
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Dish Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {formImagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={formImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-28 border-dashed flex flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={formAvailable}
                onChange={(e) => setFormAvailable(e.target.checked)}
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

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Digital Menu QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6 py-6 text-center">
            <div className="bg-white p-4 rounded-xl shadow-inner border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin + "/menu" : "")}`}
                alt="Menu QR Code"
                className="w-48 h-48"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Point customers to:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">/menu</code>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(window.location.origin + "/menu")}`
                  window.open(url, "_blank")
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic">
              * Display this QR code on dining tables for customers to access the menu.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
