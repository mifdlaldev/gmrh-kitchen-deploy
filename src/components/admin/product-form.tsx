"use client";

import { useState } from "react";
import { Product } from "@/types/product"
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";


type Props = {
  product?: Product
  onSuccess: () => void
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  const publicPathPrefix = "/storage/v1/object/public/products/"
  const publicPathIndex = imageUrl.indexOf(publicPathPrefix)

  if (publicPathIndex === -1) {
    return null
  }

  return decodeURIComponent(
    imageUrl.slice(publicPathIndex + publicPathPrefix.length)
  )
}

export function ProductForm({ product, onSuccess }: Props){
  const isSupabaseReady = hasSupabaseEnv();

const [stock,setStock] = useState(product?.stock || 0)
  const [name,setName] = useState(product?.name || "")
  const [description,setDescription] = useState(product?.description || "")
  const [price,setPrice] = useState(product?.price || 0)
  const [image,setImage] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    product?.image || null
  )
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false)

  const handleSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()
    setErrorMessage("")

    const supabase = createClient()

    if (!supabase) {
      setErrorMessage(missingSupabaseEnvMessage)
      return
    }

    setSubmitting(true)

    const existingImagePath = product?.image
      ? getStoragePathFromPublicUrl(product.image)
      : null

    let imageUrl: string | null = shouldDeleteImage ? null : product?.image || null

    if(image){

      const fileExt = image.name.split(".").pop()
      const fileName = `${Date.now()}-${image.name.replace(/\s+/g, "-")}`
      const filePath = fileExt ? fileName : `${fileName}.jpg`

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: true,
        })

      if(uploadError){
        setErrorMessage(
          uploadError.message ||
            "Upload gambar gagal. Pastikan bucket Storage `products` sudah dibuat."
        )
        setSubmitting(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath)

      imageUrl = publicUrlData.publicUrl
    }

    if(product){

      const { error } = await supabase
        .from("products")
        .update({
          name,
          description,
          price,
          stock,
          image: imageUrl
        })
        .eq("id", product.id)

      if (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }

      if (existingImagePath && (shouldDeleteImage || image)) {
        const { error: removeImageError } = await supabase.storage
          .from("products")
          .remove([existingImagePath])

        if (removeImageError) {
          console.error(removeImageError)
        }
      }

    }else{

      const { error } = await supabase
        .from("products")
        .insert({
          name,
          description,
          price,
          stock,
          image: imageUrl
        })

      if (error) {
        setErrorMessage(error.message)
        setSubmitting(false)
        return
      }
    }

    setName("")
    setDescription("")
    setPrice(0)
    setStock(0)
    setImage(null)
    setImagePreviewUrl(null)
    setShouldDeleteImage(false)
    setSubmitting(false)

    onSuccess()
  }

  return(

    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[1.8rem] bg-white/70 p-6 text-gray-900"
    >
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {!isSupabaseReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingSupabaseEnvMessage}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700">
          Nama Produk
        </label>

        <input
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="kitchen-input mt-1"
          placeholder="Contoh: Ayam Goreng"
          required
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">
          Deskripsi Produk
        </label>

        <textarea
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
          className="kitchen-input mt-1 min-h-28 resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">
          Harga Produk
        </label>

        <input
          type="number"
          value={price}
          onChange={(e)=>setPrice(Number(e.target.value))}
          className="kitchen-input mt-1"
          required
        />
      </div>

      <div>
              <label className="text-sm font-semibold text-gray-700">
              Stok Produk
              </label>

              <input
              type="number"
              value={stock}
              onChange={(e)=>setStock(Number(e.target.value))}
              className="kitchen-input mt-1"
              placeholder="Contoh: 10"
              />

          </div>

      <div>

        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Foto Produk
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.6rem] border-2 border-dashed border-[#dfccb7] bg-[#fffaf4] p-4 hover:border-orange-500">
          {imagePreviewUrl ? (
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[1.3rem] bg-gray-100">
              <img
                src={imagePreviewUrl}
                alt="Preview foto produk"
                className="aspect-[4/3] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-[1.3rem] bg-gray-100 px-4 text-center text-sm text-gray-500">
              Belum ada gambar dipilih
            </div>
          )}

          <span className="max-w-full break-all text-center text-sm text-gray-500">
            {image ? image.name : "Klik untuk upload gambar"}
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={(e)=>{
              if(e.target.files?.[0]){
                const selectedImage = e.target.files[0]
                setImage(selectedImage)
                setImagePreviewUrl(URL.createObjectURL(selectedImage))
                setShouldDeleteImage(false)
              }
            }}
            className="hidden"
          />

        </label>

        {(imagePreviewUrl || image) && (
          <button
            type="button"
            onClick={() => {
              setImage(null)
              setImagePreviewUrl(null)
              setShouldDeleteImage(Boolean(product?.image))
            }}
            className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Hapus Foto
          </button>
        )}

      </div>

      <button
        type="submit"
        disabled={!isSupabaseReady || submitting}
        className="kitchen-primary-btn px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting
          ? "Menyimpan..."
          : product
            ? "Update Produk"
            : "Tambah Produk"}
        
      </button>

    </form>
  )
}
