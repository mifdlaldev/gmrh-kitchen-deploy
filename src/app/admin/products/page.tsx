"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { createClient } from "@/lib/supabase/client";
import { ProductForm } from "@/components/admin/product-form";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";

export default function ProductsPage(){
  const isSupabaseReady = hasSupabaseEnv();

  const [products,setProducts] = useState<Product[]>([]);
  const [editing,setEditing] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    const supabase = createClient();

    if (!supabase) {
      setProducts([]);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*");

    if(error){
      console.error(error);
      return;
    }

    setProducts(data || []);
  };

  useEffect(() => {

  const loadProducts = async () => {
    await fetchProducts();
  };

  loadProducts();

}, []);

  const deleteProduct = async (id:string)=>{
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    setIsDeleting(true);

    await supabase
      .from("products")
      .delete()
      .eq("id",id);

    await fetchProducts();
    setDeletingProduct(null);
    setIsDeleting(false);
  };

  const openCreateModal = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditing(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setIsModalOpen(false);
  };

  const openDeleteModal = (product: Product) => {
    setDeletingProduct(product);
  };

  const closeDeleteModal = () => {
    setDeletingProduct(null);
  };

  const handleFormSuccess = async () => {
    await fetchProducts();
    closeModal();
  };

  return(

    <div className="space-y-8 text-gray-900">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
            Catalog management
          </p>
          <h1 className="font-display mt-2 text-4xl font-bold text-gray-900">
            Products Manager
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
            Kelola daftar produk tanpa memenuhi halaman dengan form panjang, sambil tetap menjaga tampilan dashboard tetap rapi.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={!isSupabaseReady}
          className="kitchen-primary-btn px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          Tambah Produk
        </button>
      </div>

      {!isSupabaseReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingSupabaseEnvMessage}
        </div>
      )}

      <div className="surface-panel overflow-hidden rounded-[2rem] text-gray-900">

        <table className="w-full text-gray-900">

          <thead className="bg-[#f7efe4]">
            <tr className="text-left">
              <th className="p-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Nama</th>
              <th className="p-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Harga</th>
              <th className="p-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Stok</th>
              <th className="p-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Aksi</th>
            </tr>
          </thead>

          <tbody>

            {products.map((product)=>(
              <tr key={product.id} className="border-t border-[#efe2d2]">

                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                        No Img
                      </div>
                    )}

                    <span className="font-semibold text-slate-900">{product.name}</span>
                  </div>
                </td>

                <td className="p-4 font-medium text-slate-700">
                  Rp {product.price.toLocaleString("id-ID")}
                </td>

                <td className="p-4 text-slate-700">
                  {product.stock}
                </td>

                <td className="space-x-2 p-4">

                  <button
                    onClick={()=>openEditModal(product)}
                    disabled={!isSupabaseReady}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={()=>openDeleteModal(product)}
                    disabled={!isSupabaseReady}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-[#fffaf4] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#e9d9c9] bg-[#fffaf4] px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-700">
                  Product editor
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {editing ? "Edit Produk" : "Tambah Produk"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editing
                    ? "Perbarui detail produk dan simpan perubahan."
                    : "Lengkapi data produk baru lalu simpan ke katalog."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>

            <div className="p-6">
              <ProductForm
                key={editing?.id || "new-product"}
                product={editing || undefined}
                onSuccess={handleFormSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {deletingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
                Konfirmasi Hapus
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Hapus produk ini?
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Produk <span className="font-semibold text-gray-900">{deletingProduct.name}</span> akan dihapus dari daftar. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => deleteProduct(deletingProduct.id)}
                disabled={isDeleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
