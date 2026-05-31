"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product]);
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const checkout = async () => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, total }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      setCart([]);
      alert("Payment successful");
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Payment Processing (POS)
      </h1>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          
          {/* Products */}
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Products</h2>
            {products.map((p) => (
              <div
                key={p.id}
                className="flex justify-between mb-2"
              >
                <span>{p.name} - ${p.price}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="bg-green-500 text-white px-2 rounded"
                >
                  Add
                </button>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="border rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Cart</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500">Cart is empty</p>
            ) : (
              cart.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </div>
              ))
            )}

            <div className="mt-4 font-bold">
              Total: ${total}
            </div>

            <button
              onClick={checkout}
              className="mt-4 bg-purple-600 text-white w-full p-2 rounded"
            >
              Checkout
            </button>
          </div>

        </div>
      )}
    </div>
  );
}